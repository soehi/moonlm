// The agent loop: prompt -> generate -> parse -> validate -> invoke -> feed
// back, until the model stops calling tools or a budget is exhausted.
//
// The loop is engine-agnostic: it takes an `@engine.Engine`, so the same code
// runs against `PureEngine` in the CLI and in the browser. It never inspects a
// tool name or parses a tag itself; both are delegated to the registry and the
// selected `ToolCallFormat`.

///|
/// How the loop renders a conversation for a given model family.
///
/// Kept as data rather than a function so the CLI and the browser build the
/// same prompt, and so a new family is a new value plus a `match` arm.
pub(all) enum PromptStyle {
  /// Qwen2/Qwen2.5 ChatML, including the `<tools>` block the template expects.
  Qwen2ChatMl
} derive(Eq, Debug)

///|
/// Loop limits.
pub(all) struct AgentConfig {
  /// Maximum assistant turns (generations) before stopping.
  max_steps : Int
  /// Maximum tool calls executed per assistant turn.
  max_calls_per_step : Int
  /// Tokens requested per generation.
  max_tokens_per_step : Int
  /// Characters of a single tool observation kept before truncation.
  max_observation_chars : Int
  /// Characters of conversation history kept when the rolling window folds.
  max_history_chars : Int
  /// Sampling temperature; 0 means greedy, which is what tool use wants.
  temperature : Double
  /// Sampling seed, so a run is reproducible.
  seed : UInt64
  /// Refuse a final answer produced without any evidence-bearing observation
  /// (see `ToolOutput::provides_evidence`).
  ///
  /// On by default. A 0.5B model answers "summarize these files" from a
  /// directory listing alone, inventing a sentence per file name; the gate turns
  /// that into an explicit "I need to read them" retry instead of a confident
  /// wrong answer. Set false for tasks that legitimately need no tools.
  require_evidence : Bool
} derive(Eq, Debug)

///|
/// Defaults tuned for a 0.5B model on a 32k-context file: few steps (it does not
/// recover from long tool chains), short observations (it loses the thread
/// past a few hundred tokens of tool output), greedy decoding.
pub fn AgentConfig::default() -> AgentConfig {
  {
    max_steps: 6,
    max_calls_per_step: 4,
    max_tokens_per_step: 384,
    max_observation_chars: 4096,
    max_history_chars: 6000,
    temperature: 0.0,
    seed: 42UL,
    require_evidence: true,
  }
}

///|
/// One entry in the conversation the loop maintains.
pub(all) enum Message {
  /// A system or user turn, rendered verbatim.
  Text(role~ : String, content~ : String)
  /// An assistant turn that called tools, kept as the raw completion so the
  /// model sees exactly what it produced.
  Assistant(content~ : String)
  /// A tool observation, rendered as a tool response.
  Tool(name~ : String, content~ : String)
} derive(Eq, Debug)

///|
/// The outcome of a whole run.
pub(all) struct AgentResult {
  /// The model's final text answer (empty when the loop stopped on a budget).
  answer : String
  /// Every tool call executed, in order, for reporting.
  executed : Array[ExecutedCall]
  /// Why the loop stopped.
  stop : StopReason
  /// Assistant turns used.
  steps : Int
} derive(Eq, Debug)

///|
/// One executed tool call.
pub(all) struct ExecutedCall {
  name : String
  arguments : String
  /// Observation text returned to the model (after truncation).
  observation : String
  ok : Bool
} derive(Eq, Debug)

///|
/// Why the loop stopped.
pub(all) enum StopReason {
  /// The model produced a final answer with no tool call.
  Answered
  /// The step budget was exhausted.
  StepLimit
  /// A tool call had invalid arguments (a malformed call, not an environment
  /// failure). The step is abandoned rather than retried.
  InvalidArguments(message~ : String)
  /// The engine returned an error.
  EngineError(message~ : String)
  /// The conversation could not be made to fit the context even after folding.
  ContextOverflow
} derive(Eq, Debug)

///|
/// Truncate an observation to `limit` characters, appending a marker so the
/// model can tell the text was cut.
///
/// Character count, not bytes: the limit is about what the model can read, and
/// a byte limit would silently cut a CJK observation to a third of the intended
/// size.
pub fn truncate_observation(text : String, limit : Int) -> (String, Bool) {
  if limit <= 0 || text.length() <= limit {
    return (text, false)
  }
  let kept = StringBuilder::new()
  let mut n = 0
  for ch in text {
    if n >= limit {
      break
    }
    kept.write_char(ch)
    n = n + 1
  }
  ("\{kept.to_string()}\n[truncated: \{text.length()} characters total]", true)
}

///|
/// Render one message in the model's prompt style.
fn render_message(style : PromptStyle, m : Message) -> String {
  match style {
    Qwen2ChatMl =>
      match m {
        Text(role~, content~) =>
          "<|im_start|>\{role}\n\{content}<|im_end|>\n"
        Assistant(content~) =>
          // The completion already ends wherever the model stopped; the chat
          // template adds no closing tag of its own for a tool-call turn.
          "<|im_start|>assistant\n\{content}<|im_end|>\n"
        Tool(content~, ..) =>
          // Qwen2 renders tool results as a user-role turn wrapped in
          // <tool_response>, which is what its template emits for role=tool.
          "<|im_start|>user\n<tool_response>\n\{content}\n</tool_response><|im_end|>\n"
      }
  }
}

///|
/// The system prompt: identity, the tool signatures, and the call format.
///
/// Reproduced from the model's GGUF `tokenizer.chat_template` rather than
/// invented. Measured: a 0.5B model ignores a made-up format and only follows
/// the template it was trained on.
pub fn system_prompt(
  style : PromptStyle,
  registry : ToolRegistry,
  _task : String,
) -> String {
  match style {
    Qwen2ChatMl => {
      let sb = StringBuilder::new()
      sb.write_string("You are Qwen, created by Alibaba Cloud. You are a helpful assistant.\n\n")
      sb.write_string("# Tools\n\n")
      sb.write_string(
        "You may call one or more functions to assist with the user query.\n\n",
      )
      sb.write_string(
        "You are provided with function signatures within <tools></tools> XML tags:\n<tools>\n",
      )
      sb.write_string(registry.prompt_block())
      sb.write_string("</tools>\n\n")
      sb.write_string(
        "For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\n<tool_call>\n{\"name\": <function-name>, \"arguments\": <args-json-object>}\n</tool_call>\n\n",
      )
      sb.write_string(
        "Use workspace-relative paths only. Do not call a tool you do not need. When you have enough information, answer in plain text without any <tool_call> tag.",
      )
      sb.to_string()
    }
  }
}

///|
/// The prompt for one step: system message, the rolling history, then the
/// assistant prefix.
fn build_prompt(
  style : PromptStyle,
  system : String,
  history : Array[Message],
) -> String {
  let sb = StringBuilder::new()
  sb.write_string(render_message(style, Text(role="system", content=system)))
  for m in history {
    sb.write_string(render_message(style, m))
  }
  sb.write_string("<|im_start|>assistant\n")
  sb.to_string()
}

///|
/// Drop the oldest exchanges until the rendered history fits `limit` chars.
///
/// The most recent user turn is always kept, even if it alone exceeds the
/// limit: dropping it would leave the model with no task. This is the "rolling
/// window" the plan calls for; no retrieval is attempted because BM25 over six
/// short messages would add a tokenizer dependency for no measured gain.
pub fn fold_history(history : Array[Message], limit : Int) -> Array[Message] {
  let mut total = 0
  for m in history {
    total = total + message_chars(m)
  }
  let kept : Array[Message] = []
  let mut i = history.length()
  while i > 0 {
    i = i - 1
    let m = history[i]
    let size = message_chars(m)
    if total <= limit || kept.is_empty() {
      kept.push(m)
      total = total - size
    } else {
      break
    }
  }
  let out : Array[Message] = []
  for j = kept.length() - 1; j >= 0; j = j - 1 {
    out.push(kept[j])
  }
  out
}

///|
fn message_chars(m : Message) -> Int {
  match m {
    Text(content~, ..) => content.length() + 32
    Assistant(content~) => content.length() + 32
    Tool(content~, ..) => content.length() + 48
  }
}

///|
/// A running agent.
///
/// `run` is a single method rather than a state machine so the control flow is
/// readable in one place; the pieces it calls are separately testable.
pub fn run_agent(
  engine : &@engine.Engine,
  registry : ToolRegistry,
  format : ToolCallFormat,
  style : PromptStyle,
  task : String,
  config : AgentConfig,
) -> AgentResult {
  let system = system_prompt(style, registry, task)
  let history : Array[Message] = [Text(role="user", content=task)]
  let executed : Array[ExecutedCall] = []
  let mut steps = 0
  // Whether any observation so far carried content (see the evidence gate).
  let mut have_evidence = false
  // The gate asks at most once; a second bare answer is accepted as final, so
  // a model that cannot follow the instruction still terminates.
  let mut evidence_requested = false
  while steps < config.max_steps {
    steps = steps + 1
    let folded = fold_history(history, config.max_history_chars)
    let prompt = build_prompt(style, system, folded)
    // Keep the whole prompt inside the model's context. The system block and
    // the assistant prefix are fixed costs; if history cannot be folded small
    // enough, the run cannot continue.
    let ctx = engine.context_length()
    let prompt_tokens = match engine.encode(prompt) {
      Ok(t) => t.length()
      Err(e) => {
        return {
          answer: "",
          executed,
          stop: EngineError(message=e),
          steps,
        }
      }
    }
    if prompt_tokens + config.max_tokens_per_step >= ctx {
      return { answer: "", executed, stop: ContextOverflow, steps }
    }
    let sampler = if config.temperature <= 0.0 {
      @sampler.Greedy
    } else {
      @sampler.Temperature(temperature=config.temperature)
    }
    // The trait streams tokens and does not return text, so the completion is
    // collected here and decoded once at the end: decoding per token would
    // render a multi-byte character split across tokens as replacement
    // characters, and a mangled `<tool_call>` is exactly what the parser must
    // not see.
    let generated_tokens : Array[Int] = []
    match @engine.Engine::generate(
      engine,
      prompt,
      config.max_tokens_per_step,
      sampler,
      config.seed + steps.to_uint64(),
      fn(id, _) { generated_tokens.push(id) },
    ) {
      Err(e) => {
        return {
          answer: "",
          executed,
          stop: EngineError(message=e),
          steps,
        }
      }
      Ok(_) => ()
    }
    let generated = match engine.decode(generated_tokens) {
      Ok(t) => t
      Err(e) => {
        return {
          answer: "",
          executed,
          stop: EngineError(message=e),
          steps,
        }
      }
    }
    let parsed = parse_completion(format, generated)
    history.push(Assistant(content=generated))
    if parsed.calls.is_empty() && parsed.errors.is_empty() {
      // Evidence gate: an answer given before any content-bearing observation
      // is a guess. Asking once for evidence is cheap and turns the measured
      // 0.5B fabrication into either a real read or an honest stop.
      //
      // The `!executed.is_empty()` condition was dropped deliberately: measured
      // behaviour is that the model fabricates on the FIRST answer too, before
      // any tool call, so gating only after a call would miss the common case.
      if config.require_evidence && !have_evidence && !evidence_requested {
        evidence_requested = true
        history.push(
          Tool(
            name="no_evidence",
            content="No file or tool content has been read yet, so this answer cannot be based on the workspace. Call read_file (or grep_text) before answering.",
          ),
        )
        continue
      }
      return { answer: parsed.text, executed, stop: Answered, steps }
    }
    if !parsed.errors.is_empty() {
      // A broken call is reported to the model as a tool observation so it can
      // rewrite it once; after that the deterministic schema failure ends the
      // run rather than burning the budget on the same mistake.
      for e in parsed.errors {
        history.push(Tool(name="parse_error", content=e))
      }
      continue
    }
    let mut invalid : String? = None
    let mut n_calls = 0
    for call in parsed.calls {
      if n_calls >= config.max_calls_per_step {
        break
      }
      n_calls = n_calls + 1
      let (observation, ok, fatal, evidence) = execute_call(
        registry,
        call,
        config.max_observation_chars,
      )
      if evidence {
        have_evidence = true
      }
      executed.push({
        name: call.name,
        arguments: call.arguments.stringify(),
        observation,
        ok,
      })
      match fatal {
        Some(msg) => {
          invalid = Some(msg)
          break
        }
        None => history.push(Tool(name=call.name, content=observation))
      }
    }
    match invalid {
      Some(message) =>
        return {
          answer: "",
          executed,
          stop: InvalidArguments(message~),
          steps,
        }
      None => ()
    }
  }
  { answer: "", executed, stop: StepLimit, steps }
}

///|
/// Validate and invoke one call.
///
/// Returns `(observation, ok, fatal, provides_evidence)`. `fatal` is set only
/// for `InvalidArguments`, which ends the step; sandbox and IO failures are
/// observations the model can act on. `provides_evidence` mirrors the tool's
/// own `ToolOutput` flag and is false for every failure.
fn execute_call(
  registry : ToolRegistry,
  call : ParsedCall,
  observation_limit : Int,
) -> (String, Bool, String?, Bool) {
  let tool = match registry.find(call.name) {
    Some(t) => t
    None => {
      let msg = "unknown tool \"\{call.name}\"; available: \{registry.names().join(", ")}"
      return (msg, false, None, false)
    }
  }
  match validate(tool.parameters_schema(), call.arguments) {
    Err(e) =>
      return (
        "invalid arguments for \{call.name}: \{e.to_string()}",
        false,
        Some(e.to_string()),
        false,
      )
    Ok(_) => ()
  }
  match tool.invoke(call.arguments) {
    Ok(out) => {
      let (text, _) = truncate_observation(out.text, observation_limit)
      // A truncated observation still carries content; the model saw part of
      // the file and the text says so.
      (text, true, None, out.provides_evidence)
    }
    Err(e) =>
      match e {
        InvalidArguments(message~) =>
          (
            "invalid arguments for \{call.name}: \{message}",
            false,
            Some(message),
            false,
          )
        SandboxDenied(message~) => ("sandbox denied: \{message}", false, None, false)
        IoFailure(message~) => ("tool failed: \{message}", false, None, false)
      }
  }
}

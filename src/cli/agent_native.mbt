// `moonlm agent --task "..." --workspace <dir> [--model <gguf>]`.
//
// The command wires the production pieces together and nothing else: the model
// is the same `PureEngine` as `chat`, the sandbox is the same `Sandbox` the
// tests exercise, and the loop is `run_agent`. What is CLI-specific here is only
// argv parsing and printing.

///|
/// Options for one agent run.
struct AgentCliOptions {
  task : String
  workspace : String
  model : String
  max_steps : Int
  max_tokens : Int
  max_observation_chars : Int
  verbose : Bool
}

///|
/// The default model path, so a demonstration run needs only `--task`.
///
/// Checked in the order listed and the first that exists wins; an explicit
/// `--model` always overrides, and a missing default is an error naming the
/// flag rather than a guess.
fn default_model_candidates() -> Array[String] {
  [
    "D:/llmdata/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    "D:/llmdata/qwen2.5-0.5b-q4_0.gguf",
  ]
}

///|
/// Parse `moonlm agent` arguments.
///
/// Hand-rolled like the other subcommands so the error text points at the flag
/// that was wrong; there is no hidden default for `--task` or `--workspace`
/// because both change what the run does.
fn parse_agent_args(args : Array[String]) -> Result[AgentCliOptions, String] {
  let mut task : String? = None
  let mut workspace : String? = None
  let mut model : String? = None
  let mut max_steps = 6
  let mut max_tokens = 384
  let mut max_obs = 4096
  let mut verbose = false
  let mut i = 2
  while i < args.length() {
    let flag = args[i]
    if flag == "--task" {
      if i + 1 >= args.length() {
        return Err("--task needs a value")
      }
      task = Some(args[i + 1])
      i = i + 2
    } else if flag == "--workspace" {
      if i + 1 >= args.length() {
        return Err("--workspace needs a value")
      }
      workspace = Some(args[i + 1])
      i = i + 2
    } else if flag == "--model" {
      if i + 1 >= args.length() {
        return Err("--model needs a value")
      }
      model = Some(args[i + 1])
      i = i + 2
    } else if flag == "--max-steps" {
      if i + 1 >= args.length() {
        return Err("--max-steps needs a value")
      }
      match parse_int_arg(args[i + 1]) {
        Ok(v) => max_steps = v
        Err(e) => return Err("--max-steps: \{e}")
      }
      i = i + 2
    } else if flag == "--max-tokens" {
      if i + 1 >= args.length() {
        return Err("--max-tokens needs a value")
      }
      match parse_int_arg(args[i + 1]) {
        Ok(v) => max_tokens = v
        Err(e) => return Err("--max-tokens: \{e}")
      }
      i = i + 2
    } else if flag == "--max-observation" {
      if i + 1 >= args.length() {
        return Err("--max-observation needs a value")
      }
      match parse_int_arg(args[i + 1]) {
        Ok(v) => max_obs = v
        Err(e) => return Err("--max-observation: \{e}")
      }
      i = i + 2
    } else if flag == "--verbose" {
      verbose = true
      i = i + 1
    } else {
      return Err("unknown agent option \"\{flag}\"")
    }
  }
  let task = match task {
    Some(t) =>
      if t == "" {
        return Err("--task must not be empty")
      } else {
        t
      }
    None => return Err("agent needs --task \"...\"")
  }
  let workspace = match workspace {
    Some(w) => w
    None => return Err("agent needs --workspace <dir>")
  }
  let model = match model {
    Some(m) => m
    None => {
      let mut picked = ""
      for candidate in default_model_candidates() {
        if picked == "" && fs_ok(candidate) {
          picked = candidate
        }
      }
      if picked == "" {
        return Err(
          "agent needs --model <model.gguf> (no default model was found)",
        )
      }
      picked
    }
  }
  Ok({
    task,
    workspace,
    model,
    max_steps,
    max_tokens,
    max_observation_chars: max_obs,
    verbose,
  })
}

///|
/// Whether a path exists, without pulling the tools package into argv parsing.
#borrow(path)
extern "C" fn ml_path_exists(path : Bytes) -> Int = "ml_path_exists"

///|
fn fs_ok(path : String) -> Bool {
  ml_path_exists(@utf8.encode(path) + b"\x00") != 0
}

///|
/// Run the agent end to end and print a transcript.
fn run_agent_cli(args : Array[String]) -> Int {
  let opts = match parse_agent_args(args) {
    Ok(o) => o
    Err(e) => {
      println("error: \{e}\n")
      println(agent_usage())
      return 2
    }
  }
  let sandbox = match @tools.Sandbox::open(opts.workspace) {
    Ok(s) => s
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let engine = match load_engine(opts.model) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  // The model has to speak the format the parser expects. Read it from the
  // tokenizer's `pre` value rather than assuming: a file that is not Qwen2
  // would otherwise fail with an empty loop rather than a clear message.
  let format = match engine.tokenizer.pre {
    Qwen2 => @agent.Qwen2Xml
    Smollm =>
      return {
        println(
          "error: the agent loop implements the Qwen2 tool-call format; this model uses the \"smollm\" pre-tokenizer",
        )
        2
      }
  }
  let registry = @agent.ToolRegistry::new()
  match @tools.register_fs_tools(registry, sandbox) {
    Ok(_) => ()
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  registry.add(@tools.CalcTool::{}) |> ignore
  let config : @agent.AgentConfig = {
    max_steps: opts.max_steps,
    max_calls_per_step: 4,
    max_tokens_per_step: opts.max_tokens,
    max_observation_chars: opts.max_observation_chars,
    max_history_chars: 6000,
    temperature: 0.0,
    seed: 42UL,
    require_evidence: true,
  }
  println("task:      \{opts.task}")
  println("workspace: \{sandbox.root}")
  println("model:     \{opts.model}")
  println("tools:     \{registry.names().join(", ")}")
  println("")
  let result = @agent.run_agent(
    engine,
    registry,
    format,
    @agent.Qwen2ChatMl,
    opts.task,
    config,
  )
  for call in result.executed {
    let status = if call.ok { "ok" } else { "error" }
    println("[\{status}] \{call.name}(\{call.arguments})")
    if opts.verbose {
      println("  -> \{call.observation}")
    }
  }
  println("")
  match result.stop {
    Answered => {
      println("answer:")
      println(result.answer)
      0
    }
    StepLimit => {
      println("(stopped after \{result.steps} steps without a final answer)")
      if result.executed.length() > 0 {
        println("last observation:")
        println(result.executed[result.executed.length() - 1].observation)
      }
      1
    }
    InvalidArguments(message~) => {
      println("(model produced an invalid tool call after \{result.steps} steps)")
      println("  \{message}")
      1
    }
    EngineError(message~) => {
      println("error: \{message}")
      1
    }
    ContextOverflow => {
      println("error: the prompt does not fit the model's context even after folding the history")
      1
    }
  }
}

///|
fn agent_usage() -> String {
  [
    "Usage: moonlm agent --task \"...\" --workspace <dir> [options]",
    "",
    "Runs the agent loop with the read-only local tools (list_dir, read_file,",
    "grep_text, calc), sandboxed to --workspace.",
    "",
    "Options:",
    "  --task TEXT          What to do (required)",
    "  --workspace DIR      Sandbox root for every file tool (required)",
    "  --model PATH         GGUF model; a Qwen2 file is required",
    "  --max-steps N        Assistant turns before stopping (default 6)",
    "  --max-tokens N       Tokens per generation (default 384)",
    "  --max-observation N  Characters of a tool result kept (default 4096)",
    "  --verbose            Print each tool observation",
    "",
    "Example:",
    "  moonlm agent --task \"总结 docs/ 下的关键结论\" --workspace . --verbose",
  ].join("\n")
}

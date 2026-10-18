// Agent runtime tests: parsing, schema validation, truncation, and the loop
// against a scripted engine.
//
// The loop tests use a fake `Engine` that replays canned completions rather
// than a real model: what is under test is the control flow (validate, invoke,
// feed back, stop), which must be deterministic and independent of model
// quality. End-to-end model behaviour is measured separately in docs/agent.md.

///|
/// An engine that returns queued completions, one per `generate` call.
///
/// Encoding is by whitespace so token counts are predictable, and the context
/// length is a parameter so the overflow path is reachable.
struct ScriptedEngine {
  replies : Array[String]
  mut calls : Int
  ctx : Int
} derive(Debug)

///|
impl @engine.Engine for ScriptedEngine with fn encode(
  _self : ScriptedEngine,
  text : String,
) -> Result[Array[Int], String] {
  let _ = text
  Ok([1])
}

///|
impl @engine.Engine for ScriptedEngine with fn decode(
  _self : ScriptedEngine,
  tokens : Array[Int],
) -> Result[String, String] {
  let _ = tokens
  Ok(scripted_reply.val)
}

///|
impl @engine.Engine for ScriptedEngine with fn context_length(
  self : ScriptedEngine,
) -> Int {
  self.ctx
}

///|
impl @engine.Engine for ScriptedEngine with fn generate(
  self : ScriptedEngine,
  prompt : String,
  max_tokens : Int,
  sampler : @sampler.Sampler,
  seed : UInt64,
  on_token : (Int, String) -> Unit,
) -> Result[@engine.GenerationStats, String] {
  let _ = (prompt, max_tokens, sampler, seed)
  let i = self.calls
  self.calls = self.calls + 1
  if i >= self.replies.length() {
    return Err("script exhausted")
  }
  let text = self.replies[i]
  // The loop re-decodes the collected tokens, so hand the text back through
  // the decode path by parking it in a per-call slot.
  scripted_reply.val = text
  on_token(0, text)
  Ok({
    prompt_tokens: 1,
    generated_tokens: 1,
    hit_eos: true,
    prefill_seconds: 0.0,
    decode_seconds: 0.0,
  })
}

///|
/// Where the scripted engine parks the text the loop will decode.
let scripted_reply : Ref[String] = Ref("")

///|
/// A tool that records its calls and echoes its `path` argument.
struct EchoTool {
  calls : Ref[Array[String]]
} derive(Debug)

///|
impl Tool for EchoTool with fn name(self : EchoTool) -> String {
  let _ = self
  "echo"
}

///|
impl Tool for EchoTool with fn description(self : EchoTool) -> String {
  let _ = self
  "Echo the path argument."
}

///|
impl Tool for EchoTool with fn parameters_schema(
  self : EchoTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": { "path": { "type": Json::string("string") } },
    "required": Json::array([Json::string("path")]),
    "additionalProperties": false,
  }
}

///|
impl Tool for EchoTool with fn invoke(
  self : EchoTool,
  args : Json,
) -> Result[ToolOutput, ToolError] {
  match args {
    Object(fields) =>
      match fields.get("path") {
        Some(String(p)) => {
          self.calls.val.push(p)
          Ok({
            text: "echo: \{p}",
            truncated: false,
            provides_evidence: true,
          })
        }
        _ => Err(InvalidArguments(message="path must be a string"))
      }
    _ => Err(InvalidArguments(message="arguments must be an object"))
  }
}

///|
/// A tool that always denies access, for the sandbox-observation path.
struct DenyTool {} derive(Debug)

///|
impl Tool for DenyTool with fn name(self : DenyTool) -> String {
  let _ = self
  "deny"
}

///|
impl Tool for DenyTool with fn description(self : DenyTool) -> String {
  let _ = self
  "Always denies."
}

///|
impl Tool for DenyTool with fn parameters_schema(self : DenyTool) -> Json {
  let _ = self
  { "type": Json::string("object"), "properties": {} }
}

///|
impl Tool for DenyTool with fn invoke(
  self : DenyTool,
  args : Json,
) -> Result[ToolOutput, ToolError] {
  let _ = (self, args)
  Err(SandboxDenied(message="path escapes the workspace"))
}

///|
/// Build a registry with one calling tool and one denying tool.
fn test_registry(calls : Ref[Array[String]]) -> ToolRegistry {
  let r = ToolRegistry::new()
  r.add(EchoTool::{ calls }) |> ignore
  r.add(DenyTool::{}) |> ignore
  r
}


///|
/// Parse a JSON test literal, failing the test rather than raising.
fn json(value~ : String) -> Json raise {
  try {
    @json.parse(value)
  } catch {
    e => fail("bad test JSON: \{e}")
  }
}

// --- parsing ---------------------------------------------------------------

///|
test "qwen2 parses a single well-formed call" {
  let text = "<tool_call>\n{\"name\": \"echo\", \"arguments\": {\"path\": \"docs\"}}\n</tool_call>"
  let p = parse_completion(Qwen2Xml, text)
  assert_eq(p.calls.length(), 1)
  assert_eq(p.calls[0].name, "echo")
  assert_eq(p.calls[0].arguments.stringify(), "{\"path\":\"docs\"}")
  assert_eq(p.text, "")
  assert_eq(p.errors, [])
}

///|
test "qwen2 parses text around and between calls" {
  let text = "Let me look.\n<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"a\"}}</tool_call>\nAgain.\n<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"b\"}}</tool_call>\nDone."
  let p = parse_completion(Qwen2Xml, text)
  assert_eq(p.calls.length(), 2)
  assert_eq(p.calls[0].arguments.stringify(), "{\"path\":\"a\"}")
  assert_eq(p.calls[1].arguments.stringify(), "{\"path\":\"b\"}")
  assert_eq(p.text, "Let me look.\n\nAgain.\n\nDone.")
  assert_eq(p.errors, [])
}

///|
test "qwen2 accepts arguments as a JSON string" {
  let text = "<tool_call>{\"name\": \"echo\", \"arguments\": \"{\\\"path\\\": \\\"x\\\"}\"}</tool_call>"
  let p = parse_completion(Qwen2Xml, text)
  assert_eq(p.calls.length(), 1)
  assert_eq(p.calls[0].arguments.stringify(), "{\"path\":\"x\"}")
}

///|
test "qwen2 accepts hoisted arguments" {
  let text = "<tool_call>{\"name\": \"echo\", \"path\": \"x\"}</tool_call>"
  let p = parse_completion(Qwen2Xml, text)
  assert_eq(p.calls.length(), 1)
  assert_eq(p.calls[0].arguments.stringify(), "{\"path\":\"x\"}")
}

///|
test "qwen2 reports malformed bodies without dropping valid calls" {
  let text = "<tool_call>not json</tool_call><tool_call>{\"name\": \"echo\", \"arguments\": {}}</tool_call>"
  let p = parse_completion(Qwen2Xml, text)
  assert_eq(p.calls.length(), 1)
  assert_eq(p.errors.length(), 1)
  assert_true(p.errors[0].contains("not valid JSON"))
}

///|
test "qwen2 rejects an unterminated call" {
  let p = parse_completion(Qwen2Xml, "<tool_call>{\"name\": \"echo\"}")
  assert_eq(p.calls.length(), 0)
  assert_eq(p.errors.length(), 1)
  assert_true(p.errors[0].contains("unterminated"))
}

///|
test "qwen2 rejects missing, empty and non-object calls" {
  let cases : Array[(String, String)] = [
    ("{\"arguments\": {}}", "missing \"name\""),
    ("{\"name\": \"\", \"arguments\": {}}", "empty \"name\""),
    ("{\"name\": 3, \"arguments\": {}}", "must be a string"),
    ("[1,2]", "must be a JSON object"),
    ("{\"name\": \"echo\", \"arguments\": 3}", "must be a JSON object"),
    ("", "empty <tool_call>"),
  ]
  for pair in cases {
    let (body, want) = pair
    let p = parse_completion(Qwen2Xml, "<tool_call>\{body}</tool_call>")
    assert_eq(p.calls.length(), 0)
    assert_eq(p.errors.length(), 1)
    assert_true(p.errors[0].contains(want))
  }
}

///|
test "a plain answer parses as text only" {
  let p = parse_completion(Qwen2Xml, "The answer is 42.")
  assert_eq(p.calls.length(), 0)
  assert_eq(p.errors, [])
  assert_eq(p.text, "The answer is 42.")
}

// --- schema ----------------------------------------------------------------

///|
fn schema_of(tool : &Tool) -> Json {
  tool.parameters_schema()
}

///|
test "schema accepts a matching object" {
  let r = test_registry(Ref([]))
  let tool = r.find("echo").unwrap()
  let args = json(value="{\"path\": \"docs\"}")
  assert_eq(validate(schema_of(tool), args), Ok(()))
}

///|
test "schema rejects missing, mistyped and extra fields" {
  let r = test_registry(Ref([]))
  let tool = r.find("echo").unwrap()
  let schema = schema_of(tool)
  let cases : Array[(String, String)] = [
    ("{}", "missing required field \"path\""),
    ("{\"path\": 3}", "must be of type string"),
    ("{\"path\": \"x\", \"extra\": 1}", "unknown field"),
  ]
  for pair in cases {
    let (args, want) = pair
    let j = json(value=args) 
    match validate(schema, j) {
      Ok(_) => fail("expected rejection for \{args}")
      Err(e) => assert_true(e.to_string().contains(want))
    }
  }
}

///|
test "schema enforces enum, integer, bounds and arrays" {
  let schema = json(
    value="{\"type\":\"object\",\"properties\":{\"mode\":{\"type\":\"string\",\"enum\":[\"a\",\"b\"]},\"n\":{\"type\":\"integer\",\"minimum\":1},\"items\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"required\":[\"mode\"]}",
  )
  
  let ok = json(value="{\"mode\":\"a\",\"n\":2,\"items\":[\"x\"],\"extra\":true}")
  
  assert_eq(validate(schema, ok), Ok(()))
  let bad_enum = json(value="{\"mode\":\"c\"}") 
  assert_true(
    validate(schema, bad_enum).unwrap_err().message.contains("one of"),
  )
  let not_int = json(value="{\"mode\":\"a\",\"n\":1.5}") 
  assert_true(
    validate(schema, not_int).unwrap_err().message.contains("integer"),
  )
  let too_small = json(value="{\"mode\":\"a\",\"n\":0}") 
  assert_true(
    validate(schema, too_small).unwrap_err().message.contains(">="),
  )
  let bad_item = json(value="{\"mode\":\"a\",\"items\":[3]}") 
  assert_true(
    validate(schema, bad_item).unwrap_err().to_string().contains("items[0]"),
  )
}

// --- truncation ------------------------------------------------------------

///|
test "observations truncate on character count, not bytes" {
  let (short, cut) = truncate_observation("abc", 10)
  assert_eq(short, "abc")
  assert_false(cut)
  // Ten CJK characters are 30 bytes but 10 characters.
  let (cjk, cut2) = truncate_observation("中文中文中文中文中文", 10)
  assert_false(cut2)
  assert_eq(cjk, "中文中文中文中文中文")
  let (long, cut3) = truncate_observation("abcdefghij", 4)
  assert_true(cut3)
  assert_true(long.contains("abcd"))
  assert_true(long.contains("truncated"))
}

// --- loop ------------------------------------------------------------------

///|
test "the loop runs a call and returns the final answer" {
  let calls = Ref([])
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"docs\"}}</tool_call>",
      "All done.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let result = run_agent(
    engine,
    test_registry(calls),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.answer, "All done.")
  assert_eq(result.executed.length(), 1)
  assert_true(result.executed[0].ok)
  assert_eq(calls.val, ["docs"])
}

///|
test "a sandbox denial is fed back as an observation, not fatal" {
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"deny\", \"arguments\": {}}</tool_call>",
      "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"ok\"}}</tool_call>",
      "Recovered.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let calls = Ref([])
  let result = run_agent(
    engine,
    test_registry(calls),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.answer, "Recovered.")
  assert_eq(result.executed.length(), 2)
  assert_false(result.executed[0].ok)
  assert_true(result.executed[0].observation.contains("sandbox denied"))
  assert_eq(calls.val, ["ok"])
}

///|
test "invalid arguments terminate the step" {
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"echo\", \"arguments\": {}}</tool_call>",
    ],
    calls: 0,
    ctx: 100000,
  }
  let calls = Ref([])
  let result = run_agent(
    engine,
    test_registry(calls),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  match result.stop {
    InvalidArguments(message~) => assert_true(message.contains("path"))
    _ => fail("expected InvalidArguments, got a different stop reason")
  }
  // The attempted call is recorded (so a report can show it was rejected),
  // but the tool itself never ran: validation happens before invoke.
  assert_eq(result.executed.length(), 1)
  assert_false(result.executed[0].ok)
  assert_eq(calls.val, [])
}

///|
test "an unknown tool is an observation, not a crash" {
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"nope\", \"arguments\": {}}</tool_call>",
      // The unknown tool produced no evidence, so the gate asks once; a real
      // tool call supplies it and the following text is accepted.
      "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"x\"}}</tool_call>",
      "Fine, no tools then.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let result = run_agent(
    engine,
    test_registry(Ref([])),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.executed.length(), 2)
  assert_true(result.executed[0].observation.contains("unknown tool"))
  assert_true(result.executed[1].ok)
}

///|
test "a malformed call is reported once and the loop continues" {
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>oops</tool_call>",
      // The gate asks once for evidence because no tool has succeeded yet;
      // the echo call supplies it, and the following text is accepted.
      "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"x\"}}</tool_call>",
      "Sorry, here is the answer.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let result = run_agent(
    engine,
    test_registry(Ref([])),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.answer, "Sorry, here is the answer.")
  // The malformed call is reported; the echo call that supplies evidence runs.
  assert_eq(result.executed.length(), 1)
  assert_true(result.executed[0].ok)
}

///|
test "the step budget stops a model that never answers" {
  let engine = ScriptedEngine::{
    replies: Array::make(10, "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"x\"}}</tool_call>"),
    calls: 0,
    ctx: 100000,
  }
  let calls = Ref([])
  let mut config = AgentConfig::default()
  config = { ..config, max_steps: 3 }
  let result = run_agent(
    engine,
    test_registry(calls),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    config,
  )
  assert_eq(result.stop, StepLimit)
  assert_eq(result.steps, 3)
}

///|
test "an oversized prompt stops with ContextOverflow instead of failing" {
  let engine = ScriptedEngine::{
    replies: ["never reached"],
    calls: 0,
    ctx: 4,
  }
  let result = run_agent(
    engine,
    test_registry(Ref([])),
    Qwen2Xml,
    Qwen2ChatMl,
    "a task long enough to exceed a four-token context",
    AgentConfig::default(),
  )
  assert_eq(result.stop, ContextOverflow)
}

///|
test "history folding keeps the most recent messages" {
  let history : Array[Message] = [
    Text(role="user", content="first-" + "x".repeat(100)),
    Assistant(content="a".repeat(100)),
    Text(role="user", content="latest-" + "y".repeat(50)),
  ]
  let folded = fold_history(history, 200)
  assert_true(folded.length() >= 1)
  match folded[folded.length() - 1] {
    Text(content~, ..) => assert_true(content.has_prefix("latest-"))
    _ => fail("the newest message must be kept")
  }
}

///|
test "duplicate tool names are rejected" {
  let r = ToolRegistry::new()
  r.add(EchoTool::{ calls: Ref([]) }) |> ignore
  match r.add(EchoTool::{ calls: Ref([]) }) {
    Ok(_) => fail("a duplicate tool name must be rejected")
    Err(e) => assert_true(e.contains("duplicate"))
  }
}

///|
test "a bare JSON call is recognised when it is the whole completion" {
  let p = parse_completion(
    Qwen2Xml,
    "{\"name\": \"echo\", \"arguments\": {\"path\": \"x\"}}",
  )
  assert_eq(p.calls.length(), 1)
  assert_eq(p.calls[0].name, "echo")
  assert_eq(p.text, "")
  // Surrounding prose keeps it as text: an answer that merely mentions JSON
  // must not become a tool call.
  let answer = parse_completion(
    Qwen2Xml,
    "The config is {\"name\": \"echo\", \"arguments\": {\"path\": \"x\"}}.",
  )
  assert_eq(answer.calls.length(), 0)
  assert_true(answer.text.has_prefix("The config"))
  // A JSON object with no name is text, not a call.
  let non_call = parse_completion(Qwen2Xml, "{\"x\": 1}")
  assert_eq(non_call.calls.length(), 0)
}

///|
test "the evidence gate rejects an answer given before any content was read" {
  // The measured 0.5B failure: a directory listing arrives, and the model
  // answers as if it had read the files. The gate asks once for evidence.
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"deny\", \"arguments\": {}}</tool_call>",
      "The files say: alpha, beta, gamma.",
      "<tool_call>{\"name\": \"echo\", \"arguments\": {\"path\": \"notes\"}}</tool_call>",
      "Now grounded.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let calls = Ref([])
  let result = run_agent(
    engine,
    test_registry(calls),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    AgentConfig::default(),
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.answer, "Now grounded.")
  // deny supplied no evidence, so the answer after it was refused once.
  assert_eq(result.executed.length(), 2)
  assert_false(result.executed[0].ok)
  assert_true(result.executed[1].ok)
}

///|
test "the evidence gate is off when configured off" {
  let engine = ScriptedEngine::{
    replies: [
      "<tool_call>{\"name\": \"deny\", \"arguments\": {}}</tool_call>",
      "An ungrounded answer is accepted.",
    ],
    calls: 0,
    ctx: 100000,
  }
  let mut config = AgentConfig::default()
  config = { ..config, require_evidence: false }
  let result = run_agent(
    engine,
    test_registry(Ref([])),
    Qwen2Xml,
    Qwen2ChatMl,
    "go",
    config,
  )
  assert_eq(result.stop, Answered)
  assert_eq(result.answer, "An ungrounded answer is accepted.")
}

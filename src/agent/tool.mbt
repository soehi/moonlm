// The Tool trait and its error taxonomy.
//
// A tool is a named capability with a JSON-object parameter schema. The loop
// never inspects a tool's name to decide what to do: it looks the tool up by
// name in the registry, validates the arguments against `parameters_schema`,
// and calls `invoke`. Adding a capability means adding a value, not editing the
// loop.

///|
/// Why a tool call failed.
///
/// The split matters to the loop, not just to the message:
///
/// - `InvalidArguments` means the MODEL got the call wrong (missing field, wrong
///   type, unknown enum value). It terminates that step: feeding it back as an
///   observation invites the model to "fix" the call by inventing a field, and
///   the failure is deterministic, so retrying it changes nothing.
/// - `SandboxDenied` and `IoFailure` are ENVIRONMENT failures. They are returned
///   as observations so the model can choose a different path or tool — a
///   denied `../` is information ("you may not go there"), not a malformed call.
pub(all) enum ToolError {
  /// Arguments did not match the tool's schema, or were not a JSON object.
  InvalidArguments(message~ : String)
  /// The sandbox refused the path: escape attempt, absolute path, unknown root.
  SandboxDenied(message~ : String)
  /// The operation failed in the environment (missing file, permissions, ...).
  IoFailure(message~ : String)
} derive(Eq, Debug)

///|
pub fn ToolError::message(self : ToolError) -> String {
  match self {
    InvalidArguments(message~) => message
    SandboxDenied(message~) => message
    IoFailure(message~) => message
  }
}

///|
/// Whether the loop should stop after this failure or feed it back.
pub fn ToolError::is_fatal(self : ToolError) -> Bool {
  match self {
    InvalidArguments(_) => true
    SandboxDenied(_) => false
    IoFailure(_) => false
  }
}

///|
/// What a successful tool call produced.
pub(all) struct ToolOutput {
  /// Text handed back to the model as the observation.
  text : String
  /// True when the text was cut to fit the observation budget.
  truncated : Bool
  /// Whether this observation carries CONTENT the model could not have known
  /// without the call (a file body, a search hit, a computed value), as opposed
  /// to a name listing that only says what exists.
  ///
  /// The loop uses this for its evidence gate: a run configured with
  /// `require_evidence` refuses to accept a final answer that was produced
  /// without any such observation, and asks the model to gather evidence
  /// instead of guessing from file names. This is how the measured 0.5B failure
  /// ("reads the directory listing, invents what each file says") is turned
  /// into an honest non-answer rather than a confident fabrication.
  provides_evidence : Bool
} derive(Eq, Debug)

///|
/// A capability the model can call.
///
/// `parameters_schema` must be a JSON Schema object with `type: "object"`,
/// `properties`, and `required`. The loop validates against it before invoking,
/// so `invoke` may assume the shape but should still return
/// `InvalidArguments` for semantic checks the schema cannot express.
pub(open) trait Tool {
  fn name(self : Self) -> String
  fn description(self : Self) -> String
  fn parameters_schema(self : Self) -> Json
  fn invoke(self : Self, args : Json) -> Result[ToolOutput, ToolError]
}

///|
/// The tool registry.
///
/// A flat array rather than a map: there are a handful of tools, lookup is by
/// exact string, and insertion order is what the prompt advertises, so ordering
/// stays stable across runs.
pub(all) struct ToolRegistry {
  tools : Array[&Tool]
}

///|
pub fn ToolRegistry::new() -> ToolRegistry {
  { tools: [] }
}

///|
/// Register a tool. A duplicate name is rejected rather than shadowing: two
/// tools with one name would make the model's call ambiguous.
pub fn ToolRegistry::add(
  self : ToolRegistry,
  tool : &Tool,
) -> Result[Unit, String] {
  let name = tool.name()
  for t in self.tools {
    if t.name() == name {
      return Err("duplicate tool name \"\{name}\"")
    }
  }
  self.tools.push(tool)
  Ok(())
}

///|
/// Look up by exact name.
pub fn ToolRegistry::find(self : ToolRegistry, name : String) -> &Tool? {
  for t in self.tools {
    if t.name() == name {
      return Some(t)
    }
  }
  None
}

///|
/// Tool names in registration order.
pub fn ToolRegistry::names(self : ToolRegistry) -> Array[String] {
  self.tools.map(fn(t) { t.name() })
}

///|
/// The `<tools>` block the prompt advertises: one JSON object per line, the
/// shape Qwen2's chat template expects.
pub fn ToolRegistry::prompt_block(self : ToolRegistry) -> String {
  let sb = StringBuilder::new()
  for t in self.tools {
    let entry : Json = {
      "type": Json::string("function"),
      "function": {
        "name": Json::string(t.name()),
        "description": Json::string(t.description()),
        "parameters": t.parameters_schema(),
      },
    }
    sb.write_string(entry.stringify())
    sb.write_string("\n")
  }
  sb.to_string()
}

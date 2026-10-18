// `calc` as an agent tool. Backend-agnostic: `evaluate` is pure arithmetic, so
// this is the one built-in tool the browser build can register.

///|
/// `calc`: evaluate an arithmetic expression.
pub(all) struct CalcTool {} derive(Debug)

///|
pub impl @agent.Tool for CalcTool with fn name(self : CalcTool) -> String {
  let _ = self
  "calc"
}

///|
pub impl @agent.Tool for CalcTool with fn description(self : CalcTool) -> String {
  let _ = self
  "Evaluate an arithmetic expression using + - * / and parentheses. Numbers may have a decimal point."
}

///|
pub impl @agent.Tool for CalcTool with fn parameters_schema(
  self : CalcTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": {
      "expression": {
        "type": Json::string("string"),
        "description": Json::string("Arithmetic expression, e.g. \"(3+4)*2/7\"."),
        "minLength": 1,
      },
    },
    "required": Json::array([Json::string("expression")]),
    "additionalProperties": false,
  }
}

///|
pub impl @agent.Tool for CalcTool with fn invoke(
  self : CalcTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let _ = self
  let expression = match args {
    Object(fields) =>
      match fields.get("expression") {
        Some(String(s)) => s
        Some(_) =>
          return Err(InvalidArguments(message="\"expression\" must be a string"))
        None => return Err(InvalidArguments(message="missing field \"expression\""))
      }
    _ => return Err(InvalidArguments(message="arguments must be a JSON object"))
  }
  match evaluate(expression) {
    Ok(v) =>
      Ok({ text: format_number(v), truncated: false, provides_evidence: true })
    Err(e) => Err(InvalidArguments(message=e))
  }
}

///|
/// Render a result without a spurious `.0` for whole numbers.
///
/// `Double::to_string` is the shortest round-tripping form; stripping the
/// trailing `.0` keeps `2+2 = 4` readable in an observation.
fn format_number(v : Double) -> String {
  let s = v.to_string()
  if s.has_suffix(".0") {
    s[:s.length() - 2].to_owned()
  } else {
    s
  }
}

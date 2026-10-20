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
  calc_schema().to_json()
}

///|
/// The one definition of `calc`'s arguments. The model-facing schema and the
/// decoder are both derived from this value.
pub fn calc_schema() -> @agent.Schema {
  @agent.Schema::object().req(
    @agent.string(
      name="expression",
      description="Arithmetic expression, e.g. \"(3+4)*2/7\".",
      min_len=1,
    ),
  )
}

///|
pub impl @agent.Tool for CalcTool with fn invoke(
  self : CalcTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let _ = self
  let expression = match calc_schema().decode(args) {
    Ok(a) => a.get("expression")
    Err(e) => return Err(InvalidArguments(message=e.to_string()))
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

// Tool-call formats: how a model spells "call this tool with these arguments".
//
// The loop never looks for a tag itself. It asks the selected `ToolCallFormat`
// to parse a completion into zero or more calls plus the text around them, so
// adding a model family means adding a format value and a parser function, not
// editing the loop.
//
// The parser here is intentionally structural: it finds the delimiters, then
// hands the payload to the JSON parser. It does not attempt to repair malformed
// JSON beyond trying the two shapes models actually emit (`arguments` as an
// object, and the older bare-object form).

///|
/// Which tool-call dialect a model speaks.
pub(all) enum ToolCallFormat {
  /// Qwen2/Qwen2.5: `<tool_call>{"name": ..., "arguments": {...}}</tool_call>`.
  /// The chat template states this shape verbatim inside the system prompt.
  Qwen2Xml
} derive(Eq, Debug)

///|
/// One parsed call, before schema validation.
pub(all) struct ParsedCall {
  /// Tool name exactly as the model wrote it.
  name : String
  /// The `arguments` value; an object on success.
  arguments : Json
} derive(Eq, Debug)

///|
/// A completion split into text and calls.
pub(all) struct ParsedCompletion {
  /// Text outside the delimiters, trimmed of surrounding whitespace.
  text : String
  /// Calls in the order they appeared.
  calls : Array[ParsedCall]
  /// Parse failures, already phrased for the model. A completion can contain a
  /// valid call and a broken one; the valid one still runs and the broken one
  /// is reported.
  errors : Array[String]
} derive(Eq, Debug)

///|
/// Whether a completion contains anything actionable.
pub fn ParsedCompletion::is_empty(self : ParsedCompletion) -> Bool {
  self.calls.is_empty() && self.errors.is_empty() && self.text == ""
}

///|
/// Parse a completion with the selected format.
pub fn parse_completion(
  format : ToolCallFormat,
  text : String,
) -> ParsedCompletion {
  match format {
    Qwen2Xml => parse_qwen2_xml(text)
  }
}

///|
/// The Qwen2 dialect.
///
/// Shape, as declared by the model's own chat template:
///
/// ```text
/// <tool_call>
/// {"name": "list_dir", "arguments": {"path": "."}}
/// </tool_call>
/// ```
///
/// The tags may be separated from the payload by newlines, and a model may emit
/// several calls in one completion, so the scanner loops rather than assuming a
/// single call. A missing closing tag is an error rather than an implicit
/// end-of-text match: accepting it would silently swallow the rest of the
/// completion as JSON.
fn parse_qwen2_xml(text : String) -> ParsedCompletion {
  let open_tag = "<tool_call>"
  let close_tag = "</tool_call>"
  let calls : Array[ParsedCall] = []
  let errors : Array[String] = []
  let plain = StringBuilder::new()
  let mut rest = text
  let mut iterations = 0
  while true {
    iterations = iterations + 1
    if iterations > 64 {
      errors.push("too many tool calls in one completion (limit 64)")
      break
    }
    match find_substring(rest, open_tag) {
      None => {
        plain.write_string(rest)
        break
      }
      Some(start) => {
        plain.write_string(rest[:start].to_owned())
        let after_open = rest[start + open_tag.length():].to_owned()
        match find_substring(after_open, close_tag) {
          None => {
            errors.push(
              "unterminated <tool_call>: every call must end with </tool_call>",
            )
            break
          }
          Some(end) => {
            let body = after_open[:end].to_owned()
            match parse_qwen2_call(body) {
              Ok(c) => calls.push(c)
              Err(e) => errors.push(e)
            }
            rest = after_open[end + close_tag.length():].to_owned()
          }
        }
      }
    }
  }
  let plain_text = plain.to_string().trim().to_owned()
  // A small model sometimes drops the tags and emits the payload alone. If the
  // ENTIRE completion is one JSON object naming a tool, treat it as a call.
  //
  // This is deliberately narrow: only a completion with no surrounding prose,
  // no other tags, and an object with a string `name` qualifies, so an answer
  // that merely contains JSON (e.g. "the config is {"x": 1}") is still text.
  // Measured on Qwen2.5-0.5B: without this, a bare-JSON completion became the
  // final answer and the run ended without calling anything.
  if calls.is_empty() && errors.is_empty() {
    match parse_bare_json_call(plain_text) {
      Some(call) => {
        return { text: "", calls: [call], errors: [] }
      }
      None => ()
    }
  }
  { text: plain_text, calls, errors }
}

///|
/// Recognise a whole completion that is one bare tool-call JSON object.
///
/// See the note in `parse_qwen2_xml`: this only accepts the exact shape
/// `{"name": "...", "arguments": {...}}` with nothing else in the completion.
fn parse_bare_json_call(text : String) -> ParsedCall? {
  if !text.has_prefix("{") || !text.has_suffix("}") {
    return None
  }
  match parse_qwen2_call(text) {
    Ok(call) => Some(call)
    Err(_) => None
  }
}

///|
/// Parse one `<tool_call>` body into a named call.
///
/// Accepted forms, in order:
///   1. `{"name": "...", "arguments": {...}}` — what the template specifies.
///   2. `{"name": "...", "parameters": {...}}` — a common near-miss.
///   3. `{"name": "...", <arg>}` — arguments hoisted to the top level.
fn parse_qwen2_call(body : String) -> Result[ParsedCall, String] {
  let trimmed = body.trim().to_owned()
  if trimmed == "" {
    return Err("empty <tool_call>")
  }
  let json = match parse_json_text(trimmed) {
    Ok(j) => j
    Err(e) => return Err("tool call is not valid JSON: \{e}")
  }
  let fields = match json {
    Object(m) => m
    _ => return Err("tool call must be a JSON object")
  }
  let name = match fields.get("name") {
    Some(String(s)) =>
      if s == "" {
        return Err("tool call has an empty \"name\"")
      } else {
        s
      }
    Some(_) => return Err("tool call \"name\" must be a string")
    None => return Err("tool call is missing \"name\"")
  }
  let arguments = match fields.get("arguments") {
    Some(v) => v
    None =>
      match fields.get("parameters") {
        Some(v) => v
        None => {
          // Hoisted form: everything except the reserved keys is an argument.
          let args : Map[String, Json] = Map([])
          for k, v in fields {
            if k != "name" && k != "type" && k != "id" {
              args[k] = v
            }
          }
          Json::object(args)
        }
      }
  }
  // `arguments` as a JSON STRING is what OpenAI's API returns and what some
  // templates tell the model to produce. Accept it by parsing the inner text.
  let arguments = match arguments {
    String(s) =>
      match parse_json_text(s.trim().to_owned()) {
        Ok(j) => j
        Err(e) => return Err("tool call \"arguments\" is a string that is not JSON: \{e}")
      }
    v => v
  }
  match arguments {
    Object(_) => Ok({ name, arguments })
    _ => Err("tool call \"arguments\" must be a JSON object")
  }
}

///|
/// Parse JSON, turning the parser's exception into an `Err`.
///
/// `@json.parse` raises `ParseError` rather than returning a `Result`, and this
/// package handles model output, so the exception must not escape.
fn parse_json_text(text : String) -> Result[Json, String] {
  try {
    Ok(@json.parse(text))
  } catch {
    e => Err(e.to_string())
  }
}

///|
/// First index of `needle` in `haystack`, or `None`.
///
/// A plain scan: this sees model output, so a real string search is the right
/// tool; a regex engine would be a dependency for a single literal.
pub fn find_substring(haystack : String, needle : String) -> Int? {
  if needle == "" {
    return Some(0)
  }
  let h = haystack.length()
  let n = needle.length()
  if n > h {
    return None
  }
  for i = 0; i <= h - n; i = i + 1 {
    if haystack[i] == needle[0] && haystack[i:i + n] == needle {
      return Some(i)
    }
  }
  None
}

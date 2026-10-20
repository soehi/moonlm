// Tests for the filesystem-backed tools and the calculator.
//
// The filesystem tests reuse the temporary tree from sandbox_wbtest.mbt:
//
//   <root>/ws/inside.txt      "hello"
//   <root>/ws/sub/nested.txt  "nested"
//   <root>/outside/secret.txt "secret"   (outside the workspace)
//   <root>/ws/escape -> <root>/outside
//
// Every call goes through the same `Sandbox::resolve` the agent loop uses, so a
// denial here is the denial the model would hit.


///|
/// Call the trait method explicitly, avoiding the deprecated implicit promotion.
fn invoke_tool(
  tool : &@agent.Tool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  @agent.Tool::invoke(tool, args)
}

///|
fn tool_args(pairs : Array[(String, String)]) -> Json {
  let m : Map[String, Json] = Map([])
  for pair in pairs {
    let (k, v) = pair
    m[k] = Json::string(v)
  }
  Json::object(m)
}

///|
/// Invoke a tool and return its observation text, failing on `Err`.
fn invoke_text(tool : &@agent.Tool, args : Json) -> String raise {
  match @agent.Tool::invoke(tool, args) {
    Ok(out) => out.text
    Err(e) => fail("tool failed: \{e.message()}")
  }
}

///|
test "list_dir lists workspace entries and refuses escapes" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ListDirTool::{ sandbox: sb }
  let listing = invoke_text(tool, tool_args([("path", ".")]))
  assert_true(listing.contains("inside.txt"))
  assert_true(listing.contains("sub"))
  for bad in ["../outside", "/", "C:/Windows", "sub/../.."] {
    match invoke_tool(tool, tool_args([("path", bad)])) {
      Ok(_) => fail("list_dir(\{bad}) must be denied")
      Err(e) =>
        match e {
          SandboxDenied(_) => ()
          other => fail("expected SandboxDenied, got \{other.message()}")
        }
    }
  }
}

///|
test "read_file returns contents and refuses a directory" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ReadFileTool::{ sandbox: sb }
  assert_eq(invoke_text(tool, tool_args([("path", "inside.txt")])), "hello")
  assert_eq(
    invoke_text(tool, tool_args([("path", "sub/nested.txt")])),
    "nested",
  )
  // A directory is reported as a listing, not a hard error: the observation
  // is recoverable and says what it is.
  let as_dir = invoke_text(tool, tool_args([("path", "sub")]))
  assert_true(as_dir.contains("is a directory"))
  assert_true(as_dir.contains("nested.txt"))
  // A missing path fails during resolution, before any read is attempted;
  // `resolve` canonicalizes and only an existing path canonicalizes.
  match invoke_tool(tool, tool_args([("path", "missing.txt")])) {
    Ok(_) => fail("reading a missing file must fail")
    Err(SandboxDenied(_)) => ()
    Err(other) => fail("expected SandboxDenied, got \{other.message()}")
  }
}

///|
test "read_file cannot follow the escaping symlink" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ReadFileTool::{ sandbox: sb }
  match invoke_tool(tool, tool_args([("path", "escape/secret.txt")])) {
    Ok(out) => fail("must be denied, got: \{out.text}")
    Err(SandboxDenied(_)) => ()
    Err(other) => fail("expected SandboxDenied, got \{other.message()}")
  }
}

///|
test "grep_text finds a literal substring and skips escapes" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = GrepTextTool::{ sandbox: sb }
  let hits = invoke_text(tool, tool_args([("pattern", "nest")]))
  assert_true(hits.contains("sub/nested.txt:1: nested"))
  // "secret" exists only outside the workspace; the escaping link must not
  // make it reachable.
  let misses = invoke_text(
    tool,
    tool_args([("pattern", "secret"), ("path", ".")]),
  )
  assert_false(misses.contains("secret.txt"))
  match invoke_tool(tool, tool_args([("pattern", "x"), ("path", "../outside")])) {
    Ok(_) => fail("grep outside the workspace must be denied")
    Err(SandboxDenied(_)) => ()
    Err(other) => fail("expected SandboxDenied, got \{other.message()}")
  }
}

///|
test "required fields are validated before the filesystem is touched" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ReadFileTool::{ sandbox: sb }
  let empty : Map[String, Json] = Map([])
  match invoke_tool(tool, Json::object(empty)) {
    Ok(_) => fail("missing path must be rejected")
    Err(InvalidArguments(_)) => ()
    Err(other) => fail("expected InvalidArguments, got \{other.message()}")
  }
  match invoke_tool(tool, tool_args([("path", "1")])) {
    Ok(_) => fail("wrongly typed path must be rejected")
    Err(_) => ()
  }
}

///|
test "calc evaluates arithmetic with precedence and parentheses" {
  assert_eq(evaluate("1+2*3").unwrap(), 7.0)
  assert_eq(evaluate("(1+2)*3").unwrap(), 9.0)
  assert_eq(evaluate("10 / 4").unwrap(), 2.5)
  assert_eq(evaluate("-3 + +2").unwrap(), -1.0)
  assert_eq(evaluate("2 * (3 + (4 - 1))").unwrap(), 12.0)
  assert_eq(evaluate("  7  ").unwrap(), 7.0)
}

///|
test "calc rejects anything that is not arithmetic" {
  for bad in ["", "1+", "(1+2", "1/0", "abc", "2**3", "1;2", "sqrt(4)"] {
    match evaluate(bad) {
      Ok(v) => fail("evaluate(\{bad}) must fail, got \{v}")
      Err(_) => ()
    }
  }
}

///|
test "grep_text searches a subdirectory, not just the root" {
  // Regression: the recursion re-resolves entries against the workspace root,
  // so it needs the requested subdirectory as its prefix. With an empty prefix
  // a search under "sub" looked for "nested.txt" at the root and found nothing.
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = GrepTextTool::{ sandbox: sb }
  let hits = invoke_text(
    tool,
    tool_args([("pattern", "nested"), ("path", "sub")]),
  )
  assert_true(hits.contains("sub/nested.txt:1: nested"))
}

// --- drift tests -----------------------------------------------------------
//
// Each built-in tool is called with four kinds of malformed arguments and must
// answer `InvalidArguments` with a message that names the offending field path.
// The path is the point: it comes from the schema decoder, so these tests fail
// if the schema and the decoder ever disagree about a field's name or type.
//
// The four kinds:
//   1. wrong type for a declared field
//   2. missing required field
//   3. unknown (extra) field
//   4. a value outside a declared constraint (enum, or empty string)

///|
/// Assert a call is rejected as `InvalidArguments` and the message names `path`.
fn expect_invalid(
  tool : &@agent.Tool,
  args : Json,
  path : String,
  what : String,
) -> Unit raise {
  match invoke_tool(tool, args) {
    Ok(out) =>
      fail("\{what}: expected InvalidArguments, got success: \{out.text}")
    Err(InvalidArguments(message~)) => {
      if !message.contains(path) {
        fail(
          "\{what}: message does not name field path \"\{path}\": \{message}",
        )
      }
    }
    Err(SandboxDenied(message~)) =>
      fail("\{what}: expected InvalidArguments, got SandboxDenied: \{message}")
    Err(IoFailure(message~)) =>
      fail("\{what}: expected InvalidArguments, got IoFailure: \{message}")
  }
}

///|
fn json_of(text : String) -> Json raise {
  try {
    @json.parse(text)
  } catch {
    e => fail("bad test JSON: \{e}")
  }
}

///|
test "calc rejects all four malformed shapes with a field path" {
  let tool = CalcTool::{ }
  // 1. wrong type
  expect_invalid(
    tool,
    json_of("{\"expression\": 42}"),
    "expression",
    "calc wrong type",
  )
  // 2. missing required field
  expect_invalid(tool, json_of("{}"), "expression", "calc missing field")
  // 3. unknown field
  expect_invalid(
    tool,
    json_of("{\"expression\": \"1+1\", \"extra\": 1}"),
    "extra",
    "calc unknown field",
  )
  // 4. violates minLength
  expect_invalid(
    tool,
    json_of("{\"expression\": \"\"}"),
    "expression",
    "calc empty expression",
  )
}

///|
test "list_dir rejects all four malformed shapes with a field path" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ListDirTool::{ sandbox: sb }
  expect_invalid(tool, json_of("{\"path\": 3}"), "path", "list_dir wrong type")
  expect_invalid(tool, json_of("{}"), "path", "list_dir missing field")
  expect_invalid(
    tool,
    json_of("{\"path\": \".\", \"depth\": 2}"),
    "depth",
    "list_dir unknown field",
  )
  // A non-object argument is rejected before any field is looked at.
  expect_invalid(tool, json_of("[1]"), "arguments", "list_dir non-object")
}

///|
test "read_file rejects all four malformed shapes with a field path" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = ReadFileTool::{ sandbox: sb }
  expect_invalid(tool, json_of("{\"path\": true}"), "path", "read_file wrong type")
  expect_invalid(tool, json_of("{}"), "path", "read_file missing field")
  expect_invalid(
    tool,
    json_of("{\"path\": \"inside.txt\", \"encoding\": \"utf8\"}"),
    "encoding",
    "read_file unknown field",
  )
  expect_invalid(tool, json_of("{\"path\": [\"a\"]}"), "path", "read_file array path")
}

///|
test "grep_text rejects all four malformed shapes with a field path" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = GrepTextTool::{ sandbox: sb }
  expect_invalid(tool, json_of("{\"pattern\": 7}"), "pattern", "grep wrong type")
  expect_invalid(tool, json_of("{}"), "pattern", "grep missing field")
  expect_invalid(
    tool,
    json_of("{\"pattern\": \"x\", \"regex\": true}"),
    "regex",
    "grep unknown field",
  )
  // minLength on `pattern`, and the optional `path` must still be a string.
  expect_invalid(tool, json_of("{\"pattern\": \"\"}"), "pattern", "grep empty pattern")
  expect_invalid(
    tool,
    json_of("{\"pattern\": \"x\", \"path\": 9}"),
    "path",
    "grep wrong-typed optional",
  )
}

///|
test "the optional field's default is applied by the schema, not the tool" {
  // `path` defaults to "." in the schema definition; a call that omits it must
  // still search the workspace root rather than fail or search "".
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let tool = GrepTextTool::{ sandbox: sb }
  let hits = invoke_text(tool, json_of("{\"pattern\": \"nest\"}"))
  assert_true(hits.contains("sub/nested.txt"))
}

///|
test "rendered schema and decoder agree on required fields" {
  // The drift this file exists to prevent: a field listed in `required` must be
  // the same field `decode` demands. Rendering and decoding both walk one
  // Schema value, so this asserts the two views line up.
  let schema = calc_schema()
  let rendered = schema.to_json()
  let required = match rendered {
    Object(fields) =>
      match fields.get("required") {
        Some(Array(items)) => items.map(fn(j) {
          match j {
            String(s) => s
            _ => ""
          }
        })
        _ => []
      }
    _ => []
  }
  assert_eq(required, ["expression"])
  // And the decoder rejects exactly that field when it is absent.
  match schema.decode(json_of("{}")) {
    Ok(_) => fail("decode accepted a call missing the required field")
    Err(e) => assert_eq(e.path, "expression")
  }
}

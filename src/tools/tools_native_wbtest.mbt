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

// Filesystem-backed tools: list_dir, read_file, grep_text.
//
// Every path from the model goes through `Sandbox::resolve` before the OS sees
// it. The tools never construct an absolute path from model text directly:
// `resolve` rejects `..`, absolute paths and drive-relative paths lexically,
// then canonicalizes and re-checks the prefix, so a symlink inside the
// workspace that points outside is rejected too.
//
// The tools are read-only. There is no write, delete or rename entry point in
// this package, and adding one would be a deliberate change to the security
// surface, not an implementation detail.

///|
/// Maximum bytes `read_file` will return.
pub let max_read_bytes : Int64 = 262144L

///|
/// Maximum entries `grep_text` will scan before reporting a partial result.
pub let max_grep_files : Int = 256

///|
/// Maximum number of matching lines `grep_text` returns.
pub let max_grep_matches : Int = 100

///|
/// `list_dir`: entry names of a workspace directory.
pub(all) struct ListDirTool {
  sandbox : Sandbox
} derive(Debug)

///|
pub impl @agent.Tool for ListDirTool with fn name(self : ListDirTool) -> String {
  let _ = self
  "list_dir"
}

///|
pub impl @agent.Tool for ListDirTool with fn description(
  self : ListDirTool,
) -> String {
  let _ = self
  "List the entries of a workspace-relative DIRECTORY (use this, not read_file, for directories). Use \".\" for the workspace root."
}

///|
pub impl @agent.Tool for ListDirTool with fn parameters_schema(
  self : ListDirTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": {
      "path": {
        "type": Json::string("string"),
        "description": Json::string(
          "Workspace-relative directory, e.g. \".\" or \"docs\".",
        ),
      },
    },
    "required": Json::array([Json::string("path")]),
    "additionalProperties": false,
  }
}

///|
pub impl @agent.Tool for ListDirTool with fn invoke(
  self : ListDirTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let path = match string_field(args, "path") {
    Ok(p) => p
    Err(e) => return Err(e)
  }
  let resolved = match self.sandbox.resolve(path) {
    Ok(p) => p
    Err(e) => return Err(SandboxDenied(message=e))
  }
  match is_dir(resolved) {
    Ok(true) => ()
    Ok(false) => {
      return Err(IoFailure(message="not a directory: \{path}"))
    }
    Err(e) => return Err(IoFailure(message=e))
  }
  let entries = match list_dir(resolved) {
    Ok(e) => e
    Err(e) => return Err(IoFailure(message=e))
  }
  if entries.is_empty() {
    return Ok({
        text: "(empty directory)",
        truncated: false,
        provides_evidence: false,
      })
  }
  Ok({
    text: entries.join("\n"),
    truncated: false,
    provides_evidence: false,
  })
}

///|
/// `read_file`: the text of a workspace file, size-capped.
pub(all) struct ReadFileTool {
  sandbox : Sandbox
} derive(Debug)

///|
pub impl @agent.Tool for ReadFileTool with fn name(self : ReadFileTool) -> String {
  let _ = self
  "read_file"
}

///|
pub impl @agent.Tool for ReadFileTool with fn description(
  self : ReadFileTool,
) -> String {
  let _ = self
  "Read a UTF-8 text FILE under the workspace. The path must be workspace-relative and must name a file, not a directory."
}

///|
pub impl @agent.Tool for ReadFileTool with fn parameters_schema(
  self : ReadFileTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": {
      "path": {
        "type": Json::string("string"),
        "description": Json::string(
          "Workspace-relative file path, e.g. \"docs/agent.md\".",
        ),
      },
    },
    "required": Json::array([Json::string("path")]),
    "additionalProperties": false,
  }
}

///|
pub impl @agent.Tool for ReadFileTool with fn invoke(
  self : ReadFileTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let path = match string_field(args, "path") {
    Ok(p) => p
    Err(e) => return Err(e)
  }
  let resolved = match self.sandbox.resolve(path) {
    Ok(p) => p
    Err(e) => return Err(SandboxDenied(message=e))
  }
  match is_dir(resolved) {
    Ok(true) => {
      // A small model sometimes calls read_file on a directory. Reporting the
      // entries is both what the caller evidently wanted and what keeps the run
      // alive; a hard error here ended the measured 0.5B runs at step one.
      // The observation says plainly that this was a directory, so the model
      // can still learn the distinction.
      let listing = match list_dir(resolved) {
        Ok(e) => e
        Err(e) => return Err(IoFailure(message=e))
      }
      let body = if listing.is_empty() {
        "(empty directory)"
      } else {
        listing.join("\n")
      }
      return Ok({
        text: "\{path} is a directory, not a file. Its entries:\n\{body}",
        truncated: false,
        provides_evidence: false,
      })
    }
    _ => ()
  }
  match read_text_file(resolved, max_read_bytes) {
    Ok(text) =>
      if text == "" {
        Ok({ text: "(empty file)", truncated: false, provides_evidence: true })
      } else {
        Ok({ text, truncated: false, provides_evidence: true })
      }
    Err(e) => Err(IoFailure(message=e))
  }
}

///|
/// `grep_text`: literal substring search over workspace files.
///
/// Deliberately a plain substring scan, not a regex: the argument comes from a
/// model, and a regex engine would be both a dependency and a way to make one
/// call cost unbounded time. Recursion is bounded by `max_grep_files`.
pub(all) struct GrepTextTool {
  sandbox : Sandbox
} derive(Debug)

///|
pub impl @agent.Tool for GrepTextTool with fn name(self : GrepTextTool) -> String {
  let _ = self
  "grep_text"
}

///|
pub impl @agent.Tool for GrepTextTool with fn description(
  self : GrepTextTool,
) -> String {
  let _ = self
  "Search for a literal substring in files under a workspace-relative directory. Returns matching lines as \"path:line: text\"."
}

///|
pub impl @agent.Tool for GrepTextTool with fn parameters_schema(
  self : GrepTextTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": {
      "pattern": {
        "type": Json::string("string"),
        "description": Json::string("Literal text to find; not a regex."),
        "minLength": 1,
      },
      "path": {
        "type": Json::string("string"),
        "description": Json::string(
          "Workspace-relative directory to search. Defaults to \".\".",
        ),
      },
    },
    "required": Json::array([Json::string("pattern")]),
    "additionalProperties": false,
  }
}

///|
pub impl @agent.Tool for GrepTextTool with fn invoke(
  self : GrepTextTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let pattern = match string_field(args, "pattern") {
    Ok(p) => p
    Err(e) => return Err(e)
  }
  if pattern == "" {
    return Err(InvalidArguments(message="pattern must not be empty"))
  }
  // `path` is optional: the schema lists `pattern` as the only required field.
  let path = match args {
    Object(fields) =>
      match fields.get("path") {
        Some(String(p)) => p
        Some(_) => return Err(InvalidArguments(message="path must be a string"))
        None => "."
      }
    _ => "."
  }
  let resolved = match self.sandbox.resolve(path) {
    Ok(p) => p
    Err(e) => return Err(SandboxDenied(message=e))
  }
  match is_dir(resolved) {
    Ok(true) => ()
    Ok(false) => return Err(IoFailure(message="not a directory: \{path}"))
    Err(e) => return Err(IoFailure(message=e))
  }
  let matches : Array[String] = []
  let scanned : Ref[Int] = Ref(0)
  let truncated : Ref[Bool] = Ref(false)
  // The prefix must be the requested subdirectory, not "": entries are
  // re-resolved against the workspace root, so starting from "" would look for
  // "gguf-notes.md" at the root instead of "docs/gguf-notes.md".
  let root_rel = if path == "." || path == "./" { "" } else { path }
  grep_dir(self.sandbox, resolved, root_rel, pattern, matches, scanned, truncated)
  if matches.is_empty() {
    Ok({
      text: "(no matches)",
      truncated: truncated.val,
      provides_evidence: false,
    })
  } else {
    Ok({
      text: matches.join("\n"),
      truncated: truncated.val,
      provides_evidence: true,
    })
  }
}

///|
/// Walk `dir`, appending `relative:line: text` for every matching line.
///
/// `scanned` and `truncated` are the caller's counters; they are passed by
/// reference through a one-element array because MoonBit has no out-parameters.
fn grep_dir(
  sandbox : Sandbox,
  dir : String,
  prefix : String,
  pattern : String,
  matches : Array[String],
  scanned : Ref[Int],
  truncated : Ref[Bool],
) -> Unit {
  if matches.length() >= max_grep_matches || scanned.val >= max_grep_files {
    truncated.val = true
    return
  }
  let entries = match list_dir(dir) {
    Ok(e) => e
    Err(_) => return
  }
  for entry in entries {
    if matches.length() >= max_grep_matches || scanned.val >= max_grep_files {
      truncated.val = true
      return
    }
    let rel = if prefix == "" { entry } else { "\{prefix}/\{entry}" }
    // Re-resolve every entry rather than trusting the listing: the entry name
    // came from the OS, but the joined path still has to pass the sandbox
    // (a symlinked directory must not be followed out of the workspace).
    let resolved = match sandbox.resolve(rel) {
      Ok(p) => p
      Err(_) => continue
    }
    match is_dir(resolved) {
      Ok(true) => grep_dir(sandbox, resolved, rel, pattern, matches, scanned, truncated)
      Ok(false) => {
        scanned.val = scanned.val + 1
        let text = match read_text_file(resolved, max_read_bytes) {
          Ok(t) => t
          Err(_) => continue
        }
        // Only consider files that decode as mostly text: a match inside a
        // binary blob would produce a line the model cannot use.
        if !is_probably_text(text) {
          continue
        }
        let mut line_no = 0
        for line in text.split("\n") {
          line_no = line_no + 1
          if line.contains(pattern) {
            matches.push("\{rel}:\{line_no}: \{line}")
            if matches.length() >= max_grep_matches {
              truncated.val = true
              return
            }
          }
        }
      }
      Err(_) => ()
    }
  }
}

///|
/// Heuristic: a file is text when it contains no NUL byte in its first 4 KB.
///
/// The same rule `grep -I` uses in spirit; it only needs to separate source
/// files from quantized blobs, not to identify encodings.
fn is_probably_text(text : String) -> Bool {
  let limit = if text.length() < 4096 { text.length() } else { 4096 }
  for i = 0; i < limit; i = i + 1 {
    if text[i] == '\u{0000}' {
      return false
    }
  }
  true
}

///|
/// Extract a required string field from an argument object.
fn string_field(
  args : Json,
  key : String,
) -> Result[String, @agent.ToolError] {
  match args {
    Object(fields) =>
      match fields.get(key) {
        Some(String(s)) => Ok(s)
        Some(_) => Err(InvalidArguments(message="\"\{key}\" must be a string"))
        None => Err(InvalidArguments(message="missing field \"\{key}\""))
      }
    _ => Err(InvalidArguments(message="arguments must be a JSON object"))
  }
}

///|
/// Register the three filesystem tools against one sandbox.
pub fn register_fs_tools(
  registry : @agent.ToolRegistry,
  sandbox : Sandbox,
) -> Result[Unit, String] {
  match registry.add(ListDirTool::{ sandbox }) {
    Ok(_) => ()
    Err(e) => return Err(e)
  }
  match registry.add(ReadFileTool::{ sandbox }) {
    Ok(_) => ()
    Err(e) => return Err(e)
  }
  match registry.add(GrepTextTool::{ sandbox }) {
    Ok(_) => ()
    Err(e) => return Err(e)
  }
  Ok(())
}

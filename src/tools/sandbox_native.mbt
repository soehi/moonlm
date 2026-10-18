// Workspace sandbox for the CLI's local tools.
//
// Every path a tool touches is resolved relative to a workspace root and then
// checked against that root. The check is done on the CANONICAL path (realpath,
// links resolved) rather than on the text the caller supplied: `..` and
// absolute paths are easy to reject lexically, but a symlink inside the
// workspace that points outside bypasses any lexical check. Resolving first and
// comparing canonical prefixes closes that hole.
//
// The comparison is case-insensitive only on Windows, where the filesystem is,
// and it is segment-aware: `/tmp/ws2` must not count as inside `/tmp/ws`.

///|
/// A resolved workspace root.
pub(all) struct Sandbox {
  /// Canonical absolute path of the workspace, with links resolved.
  root : String
  /// Whether prefix comparison ignores ASCII case (Windows).
  fold_case : Bool
} derive(Debug, Eq)

///|
/// Open a workspace directory as a sandbox.
///
/// The root itself must exist and be a directory: `realpath` needs an existing
/// path, and a root that does not resolve would make every later comparison
/// meaningless.
pub fn Sandbox::open(workspace : String) -> Result[Sandbox, String] {
  if workspace == "" {
    return Err("sandbox: workspace path is empty")
  }
  let root = match real_path(workspace) {
    Ok(p) => p
    Err(e) => return Err("sandbox: cannot resolve workspace: \{e}")
  }
  match is_dir(root) {
    Ok(true) => ()
    Ok(false) => return Err("sandbox: workspace is not a directory: \{root}")
    Err(e) => return Err("sandbox: \{e}")
  }
  Ok({ root, fold_case: host_is_windows() })
}

///|
/// ASCII-only case fold; sufficient for Windows path comparison, which is
/// defined on the ASCII letters plus the invariant that non-ASCII names keep
/// their own case.
fn fold_ascii(s : String) -> String {
  let sb = StringBuilder::new()
  for ch in s {
    let v = ch.to_int()
    if v >= 0x41 && v <= 0x5A {
      sb.write_char(Int::unsafe_to_char(v + 0x20))
    } else {
      sb.write_char(ch)
    }
  }
  sb.to_string()
}

///|
/// Whether `child` is `root` itself or lies under it, segment-aware.
///
/// `/tmp/ws` is not a prefix of `/tmp/ws2/x` because the character after the
/// root must be a separator (or the paths must be equal).
fn is_within(root : String, child : String, fold_case : Bool) -> Bool {
  let r = if fold_case { fold_ascii(root) } else { root }
  let c = if fold_case { fold_ascii(child) } else { child }
  if c == r {
    return true
  }
  if !c.has_prefix(r) {
    return false
  }
  if c.length() <= r.length() {
    return false
  }
  let sep = c[r.length()]
  sep == '/' || sep == '\\'
}

///|
/// Lexically reject the input shapes that can never be valid workspace-relative
/// paths, before any filesystem call.
///
/// `..` is rejected as a path segment rather than normalized away: a tool that
/// asks for `../x` should be told no, not silently redirected to a sibling.
fn check_relative_shape(rel : String) -> Result[Unit, String] {
  if rel == "" {
    return Err("sandbox: empty path")
  }
  if rel.has_prefix("/") || rel.has_prefix("\\") {
    return Err("sandbox: absolute paths are not allowed: \{rel}")
  }
  // "C:" or "C:/..." — a drive-relative or drive-absolute Windows path.
  if rel.length() >= 2 && rel[1] == ':' {
    let c = rel[0]
    if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
      return Err("sandbox: absolute paths are not allowed: \{rel}")
    }
  }
  let normalized = rel.replace_all(old="\\", new="/")
  for segment in normalized.split("/") {
    if segment == ".." {
      return Err("sandbox: \"..\" is not allowed in a workspace path: \{rel}")
    }
  }
  Ok(())
}

///|
/// Resolve `rel` inside the sandbox and return its canonical absolute path.
///
/// Fails when the path is empty, absolute, contains `..`, does not exist, or
/// resolves (through a symlink or junction) to somewhere outside the workspace.
pub fn Sandbox::resolve(
  self : Sandbox,
  rel : String,
) -> Result[String, String] {
  match check_relative_shape(rel) {
    Ok(_) => ()
    Err(e) => return Err(e)
  }
  let joined = if self.root.has_suffix("/") || self.root.has_suffix("\\") {
    self.root + rel
  } else {
    "\{self.root}/\{rel}"
  }
  let canonical = match real_path(joined) {
    Ok(p) => p
    Err(e) => return Err("sandbox: \{e}")
  }
  if !is_within(self.root, canonical, self.fold_case) {
    return Err(
      "sandbox: path escapes the workspace: \{rel} resolves to \{canonical}",
    )
  }
  Ok(canonical)
}

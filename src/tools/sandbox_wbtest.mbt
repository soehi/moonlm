// Sandbox tests. Native-only: they use a real temporary directory tree.
//
// The tree is created by `ml_test_make_sandbox` in stubs.c so the symlink can
// be created through the platform API (Python would need privileges on some
// Windows setups, and a checked-in fixture cannot contain a link at all).
//
//   <root>/ws/inside.txt
//   <root>/ws/sub/nested.txt
//   <root>/outside/secret.txt
//   <root>/ws/escape -> <root>/outside
//
// Every test resolves paths through the same `Sandbox::open` the tools will
// use, so what is exercised is the production path, not a test double.

///|
/// The fixture root, or a failure that aborts the test with the OS message.
extern "C" fn ml_test_make_sandbox() -> Bytes = "ml_test_make_sandbox"

///|
fn sandbox_root() -> String raise {
  match unpack_envelope("make_sandbox", ml_test_make_sandbox()) {
    Ok(root) => root
    Err(e) => fail("cannot create sandbox fixture: \{e}")
  }
}

///|
/// The workspace directory of the fixture.
fn fixture_workspace(root : String) -> String {
  "\{root}/ws"
}

///|
test "a normal file inside the workspace resolves" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let resolved = sb.resolve("inside.txt").unwrap()
  // Realpath uses the platform separator, so the expectation is built by
  // joining with the same one rather than assuming "/".
  let want = "\{sb.root}\{separator()}inside.txt"
  if !sandbox_paths_equal(resolved, want) {
    fail("resolve(\"inside.txt\") = \{resolved}, expected \{want}")
  }
  // The resolved path is usable: size and directory checks agree.
  assert_eq(stat_size(resolved).unwrap(), 5L)
  assert_false(is_dir(resolved).unwrap())
}

///|
/// The native separator, for building expected paths in tests.
fn separator() -> String {
  if host_is_windows() {
    "\\"
  } else {
    "/"
  }
}

///|
/// Compare two absolute paths, honoring the platform's case sensitivity.
fn sandbox_paths_equal(a : String, b : String) -> Bool {
  if a == b {
    return true
  }
  host_is_windows() && a.to_lower() == b.to_lower()
}

///|
test "a nested path inside the workspace resolves" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let resolved = sb.resolve("sub/nested.txt").unwrap()
  assert_eq(stat_size(resolved).unwrap(), 6L)
}

///|
test "a directory inside the workspace lists its entries" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let dir = sb.resolve("sub").unwrap()
  assert_true(is_dir(dir).unwrap())
  assert_eq(list_dir(dir).unwrap(), ["nested.txt"])
}

///|
test "a listing includes a symlink as an entry name" {
  // The link itself is inside the workspace; resolving THROUGH it is what the
  // next test rejects.
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let entries = list_dir(sb.root).unwrap()
  assert_true(entries.contains("escape"))
  assert_true(entries.contains("inside.txt"))
  assert_true(entries.contains("sub"))
}

///|
test "a .. segment is rejected before touching the filesystem" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  for rel in [
    "../outside/secret.txt",
    "sub/../../outside/secret.txt",
    "..",
    "sub/..",
    "..\\outside\\secret.txt",
  ] {
    match sb.resolve(rel) {
      Ok(p) => fail("resolve(\{rel}) must be rejected, got \{p}")
      Err(e) => assert_true(e.contains(".."))
    }
  }
}

///|
test "absolute paths are rejected" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  for rel in ["/etc/passwd", "\\Windows\\win.ini", "C:/Windows/win.ini", "c:\\x"] {
    match sb.resolve(rel) {
      Ok(p) => fail("resolve(\{rel}) must be rejected, got \{p}")
      Err(e) => assert_true(e.contains("absolute"))
    }
  }
}

///|
test "a symlink pointing outside the workspace is rejected" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  match sb.resolve("escape/secret.txt") {
    Ok(p) => fail("resolve through the escaping link must fail, got \{p}")
    Err(e) => assert_true(e.contains("escapes the workspace"))
  }
  // The link's own target is outside even without a trailing component.
  match sb.resolve("escape") {
    Ok(p) => fail("resolve(\"escape\") must fail, got \{p}")
    Err(e) => assert_true(e.contains("escapes the workspace"))
  }
}

///|
test "a path that does not exist is rejected" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  match sb.resolve("missing.txt") {
    Ok(p) => fail("resolve of a missing path must fail, got \{p}")
    Err(e) => assert_true(e.contains("realpath"))
  }
}

///|
test "an empty path is rejected" {
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  match sb.resolve("") {
    Ok(p) => fail("resolve(\"\") must be rejected, got \{p}")
    Err(e) => assert_true(e.contains("empty path"))
  }
}

///|
test "the workspace root itself is inside" {
  // Resolving "." must land exactly on the root and pass the containment check.
  let root = sandbox_root()
  let sb = Sandbox::open(fixture_workspace(root)).unwrap()
  let resolved = sb.resolve(".").unwrap()
  assert_true(sandbox_paths_equal(resolved, sb.root))
}

///|
test "a sibling directory sharing the root's name prefix is outside" {
  // `/tmp/ws` must not accept `/tmp/ws2`: the check is segment-aware, not a
  // raw string prefix.
  assert_true(is_within("/tmp/ws", "/tmp/ws/a", false))
  assert_true(is_within("/tmp/ws", "/tmp/ws", false))
  assert_false(is_within("/tmp/ws", "/tmp/ws2/a", false))
  assert_false(is_within("/tmp/ws", "/tmp/w", false))
  // Windows folding, and separators of either kind.
  assert_true(is_within("C:\\Work\\Ws", "c:\\work\\ws\\a", true))
  assert_false(is_within("C:\\Work\\Ws", "c:\\work\\ws2\\a", true))
  assert_true(is_within("/tmp/ws", "/tmp/ws/a", true))
}

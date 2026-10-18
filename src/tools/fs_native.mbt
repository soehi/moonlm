// Native filesystem access for the tools package.
//
// The C side (stubs.c) reports failures as an envelope (status byte + UTF-8
// payload) or a negative integer, and keeps the errno/win32 message available
// through `ml_last_error`, so every failure reaches MoonBit as an `Err` with
// the OS's own wording. Nothing here opens a file for writing: the tool surface
// is read-only by construction, not by convention.

///|
/// 1 on Windows, 0 elsewhere; decides path-prefix case folding.
extern "C" fn ml_is_windows() -> Int = "ml_is_windows"

///|
/// The last failure message (UTF-8, empty when none).
extern "C" fn ml_last_error() -> Bytes = "ml_last_error"

///|
/// Canonical absolute path with links resolved, as an envelope.
#borrow(path)
extern "C" fn ml_realpath(path : Bytes) -> Bytes = "ml_realpath"

///|
/// Newline-separated directory entries, as an envelope.
#borrow(path)
extern "C" fn ml_list_dir(path : Bytes) -> Bytes = "ml_list_dir"

///|
/// File size in bytes, negative on failure.
#borrow(path)
extern "C" fn ml_stat_size(path : Bytes) -> Int64 = "ml_stat_size"

///|
/// 1 for a directory, 0 for a non-directory, negative on failure.
#borrow(path)
extern "C" fn ml_is_dir(path : Bytes) -> Int = "ml_is_dir"

///|
/// Encode a MoonBit string as a NUL-terminated UTF-8 byte buffer.
fn cstr(s : String) -> Bytes {
  @utf8.encode(s) + b"\x00"
}

///|
/// The last OS error, for callers that got a bare negative status.
fn last_error() -> String {
  let raw = ml_last_error()
  let text = @utf8.decode_lossy(raw.view())
  if text == "" {
    "unknown OS error".to_string()
  } else {
    text
  }
}

///|
/// Whether the host is Windows. Exposed for the sandbox's prefix comparison.
pub fn host_is_windows() -> Bool {
  ml_is_windows() != 0
}

///|
/// Split an envelope into `Ok(payload)` or `Err(message)`.
fn unpack_envelope(kind : String, raw : Bytes) -> Result[String, String] {
  if raw.length() == 0 {
    return Err("\{kind}: malformed response from native layer")
  }
  let status = raw[0].to_int()
  let payload = @utf8.decode_lossy(raw.view(start=1))
  if status == 0 {
    Ok(payload)
  } else if payload == "" {
    Err("\{kind}: \{last_error()}")
  } else {
    Err(payload)
  }
}

///|
/// Canonicalize `path`, resolving symlinks/junctions.
///
/// The result is the form the sandbox compares: a prefix check on the raw input
/// can be defeated by a link that points outside the workspace, while the
/// canonical path cannot. Fails when the path does not exist.
pub fn real_path(path : String) -> Result[String, String] {
  unpack_envelope("realpath", ml_realpath(cstr(path)))
}

///|
/// List a directory's entry names (no "." or ".."), sorted.
///
/// Sorted here rather than relying on filesystem order so tool output is stable
/// across runs and platforms.
pub fn list_dir(path : String) -> Result[Array[String], String] {
  match unpack_envelope("list_dir", ml_list_dir(cstr(path))) {
    Err(e) => Err(e)
    Ok(body) => {
      if body == "" {
        return Ok([])
      }
      let out : Array[String] = []
      for part in body.split("\n") {
        out.push(part.to_owned())
      }
      out.sort()
      Ok(out)
    }
  }
}

///|
/// Size of a file in bytes.
pub fn stat_size(path : String) -> Result[Int64, String] {
  let n = ml_stat_size(cstr(path))
  if n < 0L {
    Err("stat_size: \{last_error()}")
  } else {
    Ok(n)
  }
}

///|
/// Whether `path` names a directory.
pub fn is_dir(path : String) -> Result[Bool, String] {
  match ml_is_dir(cstr(path)) {
    -1 => Err("is_dir: \{last_error()}")
    1 => Ok(true)
    _ => Ok(false)
  }
}

///|
/// Read a whole file as bytes. Read-only, and size-capped by the caller.
#borrow(path)
extern "C" fn ml_read_text_file(path : Bytes, max_bytes : Int64) -> Bytes = "ml_read_text_file"

///|
/// Read a UTF-8 text file, up to `max_bytes`.
///
/// The cap is enforced here rather than by the caller so a large file is never
/// materialized: a tool that asks for a 100 MB log gets an error, not 100 MB of
/// heap. Text is decoded lossily because model-facing tools should show a
/// mojibake character rather than fail on one bad byte.
pub fn read_text_file(path : String, max_bytes : Int64) -> Result[String, String] {
  let raw = ml_read_text_file(cstr(path), max_bytes)
  match unpack_envelope("read_file", raw) {
    Ok(text) => Ok(text)
    Err(e) => Err(e)
  }
}

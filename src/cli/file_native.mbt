// Native file reading for the CLI.
//
// The CLI is native-only: it needs argv and the filesystem, and the pure
// `gguf`/`tensor` packages deliberately carry no I/O. This file is gated to
// `native` in moon.pkg so wasm-gc builds do not see the `extern "C"` calls.
//
// `fopen`/`fread` are used directly rather than `moonbitlang/async` because the
// CLI reads one file once, up front: an async runtime is a lot of machinery for
// a synchronous single read, and it would add a dependency to a milestone whose
// premise is "read the model with nothing but MoonBit and libc".

///|
/// Clojure to libc's `FILE *`. `#external` keeps the C pointer opaque so the
/// MoonBit side never dereferences it.
#external
pub type MlFile

///|
#borrow(path, mode)
extern "C" fn ml_fopen(path : Bytes, mode : Bytes) -> MlFile = "ml_fopen"

///|
extern "C" fn ml_fclose(f : MlFile) -> Int = "ml_fclose"

///|
extern "C" fn ml_size(f : MlFile) -> Int64 = "ml_size"

///|
extern "C" fn ml_is_null(f : MlFile) -> Int = "ml_is_null"

///|
/// Encode a MoonBit string as a NUL-terminated UTF-8 byte buffer.
///
/// `String` values do not carry a terminator, and `String::to_bytes` is a
/// deprecated, non-UTF-8 representation, so the C string is built explicitly.
fn cstr(s : String) -> Bytes {
  @utf8.encode(s) + b"\x00"
}

///|
/// Read exactly `n` bytes from `f` into a freshly allocated `Bytes`.
///
/// The allocation happens on the C side with `moonbit_make_bytes_raw`, so the
/// file exists in the heap exactly once. Staging it through a
/// `FixedArray[Byte]` and then copying into `Bytes` would hold two full copies
/// of a 138 MB model at once, which is the dominant term in this CLI's peak
/// memory.
///
/// Returns a zero-length `Bytes` on a short read; the caller compares against
/// the size it already obtained, so the failure is still reported precisely.
#borrow(handle)
extern "C" fn ml_read_owned(handle : MlFile, n : Int64) -> Bytes = "ml_read_owned"

///|
/// Read an entire file into memory.
///
/// Returns `Err` with a message rather than panicking when the file is missing
/// or unreadable, so a mistyped path produces a diagnostic and a non-zero exit
/// status instead of a traceback.
///
/// Peak allocation is one copy of the file: the size is checked first (which
/// costs no memory), and the bytes are then allocated once on the C side.
pub fn read_file(path : String) -> Result[Bytes, String] {
  let f = ml_fopen(cstr(path), cstr("rb"))
  if ml_is_null(f) != 0 {
    return Err("cannot open file: \{path}")
  }
  let size = ml_size(f)
  if size < 0L {
    ml_fclose(f) |> ignore
    return Err("cannot determine the size of: \{path}")
  }
  if size > 0x7FFFFFFFL {
    ml_fclose(f) |> ignore
    return Err("file is too large to map into a 32-bit buffer: \{size} bytes")
  }
  let buf = ml_read_owned(f, size)
  ml_fclose(f) |> ignore
  if buf.length().to_int64() != size {
    return Err(
      "short read on \{path}: got \{buf.length()} of \{size} bytes",
    )
  }
  Ok(buf)
}

///|
extern "C" fn ml_exit(code : Int) -> Unit = "ml_exit"

///|
/// Terminate the process with `code`.
///
/// Declared here rather than used directly because `exit` is a native-only
/// libc symbol; routing it through this file keeps the non-native entry point
/// free of platform assumptions.
pub fn exit_with(code : Int) -> Unit {
  ml_exit(code)
}

///|
#borrow(buf, n)
extern "C" fn ml_stdin_read(buf : FixedArray[Byte], n : Int) -> Int = "ml_stdin_read"

///|
/// Read one line from stdin, without the trailing newline.
///
/// Returns `None` at end of input, which is how interactive chat knows to stop.
/// A fixed-size buffer is used because lines in a chat session are short; a
/// longer line is returned truncated rather than dropped.
pub fn read_line() -> String? {
  let buf : FixedArray[Byte] = FixedArray::make(4096, b'\x00')
  let n = ml_stdin_read(buf, buf.length())
  if n <= 0 {
    return None
  }
  let raw = Bytes::from_array(buf[:n])
  let text = @utf8.decode_lossy(raw.view())
  // Trim the line terminator the C side left in place.
  let mut end = text.length()
  while end > 0 {
    let ch = text[end - 1]
    if ch == '\n' || ch == '\r' {
      end = end - 1
    } else {
      break
    }
  }
  Some(text[:end].to_owned())
}

///|
#borrow(s)
extern "C" fn ml_puts(s : Bytes) -> Int = "ml_puts"

///|
/// Write `s` to stdout without a trailing newline, then flush.
///
/// Core only offers `println`, which is line-buffered; streaming a token at a
/// time needs the bytes to reach the terminal immediately, so this goes through
/// libc and flushes explicitly.
pub fn print_raw(s : String) -> Unit {
  ml_puts(@utf8.encode(s) + b"\x00") |> ignore
}


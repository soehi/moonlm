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
#borrow(ptr)
extern "C" fn ml_read(ptr : FixedArray[Byte], f : MlFile, n : Int64) -> Int64 = "ml_read"

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
/// Read an entire file into memory.
///
/// Returns `Err` with a message rather than panicking when the file is missing
/// or unreadable, so a mistyped path produces a diagnostic and a non-zero exit
/// status instead of a traceback.
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
  let n = size.to_int()
  let buf : FixedArray[Byte] = FixedArray::make(n, b'\x00')
  let got = ml_read(buf, f, size)
  ml_fclose(f) |> ignore
  if got != size {
    return Err("short read on \{path}: got \{got} of \{size} bytes")
  }
  Ok(Bytes::from_array(buf[:]))
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

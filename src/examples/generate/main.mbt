// Native-only example: the smallest program that loads a GGUF and generates.
//
// Usage: moon run src/examples/generate --target native --release -- <model.gguf> "<prompt>" [max_tokens]
//
// This exists to show the library's shape in about a page: read bytes,
// `PureEngine::load_bytes`, `Engine::generate` with a callback. It deliberately
// is not part of `src/cli/` — that package is a full command-line tool with
// subcommand parsing, and an example that a newcomer has to untangle is not an
// example.

///|
#external
priv type ExFile

///|
#borrow(path, mode)
extern "C" fn ex_fopen(path : Bytes, mode : Bytes) -> ExFile = "ex_fopen"

///|
extern "C" fn ex_fclose(f : ExFile) -> Int32 = "ex_fclose"

///|
extern "C" fn ex_size(f : ExFile) -> Int64 = "ex_size"

///|
extern "C" fn ex_is_null(f : ExFile) -> Int32 = "ex_is_null"

///|
#borrow(handle)
extern "C" fn ex_read_owned(handle : ExFile, n : Int64) -> Bytes = "ex_read_owned"

///|
extern "C" fn ex_exit(code : Int32) -> Unit = "ex_exit"

///|
#borrow(s)
extern "C" fn ex_puts(s : Bytes) -> Int32 = "ex_puts"

///|
/// Write `s` to stdout without a trailing newline, then flush.
///
/// Flushing per token is the point: `println` is line-buffered, so streaming
/// through it would hold the text back until the generation finished.
fn print_raw(s : String) -> Unit {
  ex_puts(cstr(s)) |> ignore
}

///|
/// NUL-terminated UTF-8, because the C side wants a C string.
fn cstr(s : String) -> Bytes {
  @utf8.encode(s) + b"\x00"
}

///|
/// Read a whole file into memory, or say why it could not be read.
fn read_whole(path : String) -> Result[Bytes, String] {
  let f = ex_fopen(cstr(path), cstr("rb"))
  if ex_is_null(f) != 0 {
    return Err("cannot open \{path} (does it exist? is it readable?)")
  }
  let size = ex_size(f)
  if size < 0L {
    ex_fclose(f) |> ignore
    return Err("cannot determine the size of \{path}")
  }
  if size > 0x7FFFFFFFL {
    ex_fclose(f) |> ignore
    return Err("\{path} is \{size} bytes, above the 32-bit buffer limit")
  }
  let buf = ex_read_owned(f, size)
  ex_fclose(f) |> ignore
  if buf.length().to_int64() != size {
    return Err("short read on \{path}: got \{buf.length()} of \{size} bytes")
  }
  Ok(buf)
}

///|
fn usage() -> String {
  "usage: moon run src/examples/generate -- <model.gguf> \"<prompt>\" [max_tokens]"
}

///|
/// Parse the optional third argument. Returns `None` on anything that is not a
/// positive integer, so the caller can print usage instead of generating zero
/// tokens and looking like it worked.
fn parse_max_tokens(argv : Array[String]) -> Int32? {
  if argv.length() < 4 {
    return Some(64)
  }
  let parsed = @string.parse_int(argv[3][:]) catch { _ => -1 }
  if parsed <= 0 {
    None
  } else {
    Some(parsed)
  }
}

///|
/// Do the work and return an exit code, so every branch has one type and the
/// process exits exactly once.
fn run(model_path : String, prompt : String, max_tokens : Int32) -> Int32 {
  let bytes = match read_whole(model_path) {
    Ok(b) => b
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  // Loading parses the GGUF, builds the vocabulary, and sets up the forward
  // pass. It is the only expensive step besides the prompt prefill.
  let engine = match @engine.PureEngine::load_bytes(bytes, model_path) {
    Ok(e) => e
    Err(e) => {
      println("error: loading the model failed: \{e}")
      return 1
    }
  }
  println("model: \{model_path}")
  println("context: \{@engine.Engine::context_length(engine)} tokens")
  println("prompt: \{prompt}")
  println("---")
  // The callback fires once per generated token, so text streams as it is
  // produced. A multi-byte character can span two tokens, which is why the
  // summary below is printed by the engine's own decode rather than stitched
  // together here.
  let result = @engine.Engine::generate(
    engine,
    prompt,
    max_tokens,
    @sampler.Greedy,
    42UL,
    fn(_id, piece) { print_raw(piece) },
  )
  println("")
  println("---")
  match result {
    Err(e) => {
      println("error: generation failed: \{e}")
      1
    }
    Ok(stats) => {
      println(
        "\{stats.generated_tokens} tokens, \{stats.tokens_per_second().to_string()} tok/s, hit_eos=\{stats.hit_eos}, prefill \{stats.prefill_seconds.to_string()} s",
      )
      0
    }
  }
}

///|
fn main {
  let argv = @env.args()
  if argv.length() < 3 {
    println(usage())
    ex_exit(2)
  }
  let max_tokens = match parse_max_tokens(argv) {
    Some(n) => n
    None => {
      println("error: max_tokens must be a positive integer")
      println(usage())
      ex_exit(2)
      0
    }
  }
  ex_exit(run(argv[1], argv[2], max_tokens))
}

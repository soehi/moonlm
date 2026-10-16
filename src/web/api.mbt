// JavaScript-facing inference API.
//
// This package exists for one reason: a browser page cannot call `moonlm` the
// way a shell does, so the engine needs an entry point that takes and returns
// JavaScript-native values. `#export_name` on a `foreign_library` package is
// how MoonBit exposes functions to JS; the generated `.d.ts` beside the `.js`
// is the contract.
//
// On the `js` target the boundary types are plain JavaScript:
// `Bytes` is a `Uint8Array`, `FixedArray[Double]` is a `number[]`, and a MoonBit
// closure is a JavaScript function. So a model file can be handed straight from
// a `<input type="file">` read, and tokens can be streamed out through a
// callback as they are produced.
//
// Deliberately *not* on the `wasm-gc` target: there, `Bytes` is a GC array
// reference that JavaScript cannot construct (measured: passing a Uint8Array
// fails with "type incompatibility when transforming from/to JS"), and the
// module exports no memory. `js` is also the target MoonBit's own web template
// uses. See docs/browser.md.

///|
/// A loaded engine, addressed by integer handle.
///
/// JavaScript cannot hold a MoonBit value, so the engine lives here and the
/// page holds the handle. A table rather than a single slot because it keeps
/// "which model am I talking to" explicit, and makes a stale handle after a
/// second load an error instead of a silent switch.
let slots : Array[@engine.PureEngine?] = []

///|
/// The most recent failure, for the caller to read after a non-zero status.
///
/// MoonBit's `Result` does not cross into JavaScript, so the error travels
/// beside the return value. Reading it clears nothing: the message stays
/// readable until the next call that can fail.
let last_error : Ref[String] = Ref("")

///|
/// Record a failure and return the status code that reports it.
fn fail(msg : String) -> Int {
  last_error.val = msg
  -1
}

///|
/// Load a GGUF model from bytes already in memory.
///
/// Returns a handle >= 0, or -1 with the reason in `moonlm_last_error()`.
/// `name` is used only in messages.
#export_name("moonlm_load")
pub fn moonlm_load(buf : Bytes, name : String) -> Int {
  let engine = match @engine.PureEngine::load_bytes(buf, name) {
    Ok(e) => e
    Err(e) => return fail(e)
  }
  let handle = slots.length()
  slots.push(Some(engine))
  last_error.val = ""
  handle
}

///|
/// The message from the last failed call. Empty after a successful one.
#export_name("moonlm_last_error")
pub fn moonlm_last_error() -> String {
  last_error.val
}

///|
/// Release a loaded model, so a long-lived page can drop the memory.
#export_name("moonlm_free")
pub fn moonlm_free(handle : Int) -> Int {
  if handle < 0 || handle >= slots.length() {
    return fail("no model for handle \{handle}")
  }
  slots[handle] = None
  0
}

///|
/// Encode text to token ids, for showing what the model actually reads.
///
/// Returns an empty array on error, distinguishable from a real encoding
/// because every non-empty text encodes to at least one token.
#export_name("moonlm_tokenize")
pub fn moonlm_tokenize(handle : Int, text : String) -> FixedArray[Int] {
  match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      []
    }
    Ok(engine) => FixedArray::from_array(engine.tokenizer.encode(text))
  }
}

///|
/// The token ids produced by the most recent `moonlm_generate`, so a page can
/// show tokens rather than only text and compare against a reference
/// implementation. Cleared at the start of every generate call.
let last_tokens : Array[Int] = []

///|
/// Generate a continuation, calling `on_token` with each piece as it arrives.
///
/// Returns `[prompt_tokens, generated_tokens, hit_eos, prefill_seconds,
/// decode_seconds]`, or an empty array on error (reason in
/// `moonlm_last_error()`). The stats are a plain number array so JavaScript can
/// index them without a decoder.
///
/// `temperature <= 0` means greedy. `on_token` receives the raw piece for the
/// token, which is not always valid text on its own — a multi-byte character
/// can span two tokens — so a caller that must show text immediately should
/// expect a replacement character occasionally and correct it on the next
/// piece. The accumulated text from `moonlm_generate_text` is always correct.
#export_name("moonlm_generate")
pub fn moonlm_generate(
  handle : Int,
  prompt : String,
  max_tokens : Int,
  temperature : Double,
  on_token : (String) -> Unit,
) -> FixedArray[Double] {
  let engine = match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      return []
    }
    Ok(engine) => engine
  }
  let sampler : @sampler.Sampler = if temperature <= 0.0 {
    @sampler.Greedy
  } else {
    @sampler.Temperature(temperature=temperature)
  }
  last_tokens.clear()
  // The engine reports failures per phase with a position, which is more useful
  // than a bare "generation failed" when a long prompt runs past the context.
  match @engine.Engine::generate(engine, prompt, max_tokens, sampler, 42UL, fn(id, piece) {
    last_tokens.push(id)
    on_token(piece)
  }) {
    Err(e) => {
      fail(e) |> ignore
      []
    }
    Ok(stats) => {
      last_error.val = ""
      [
        stats.prompt_tokens.to_double(),
        stats.generated_tokens.to_double(),
        if stats.hit_eos { 1.0 } else { 0.0 },
        stats.prefill_seconds,
        stats.decode_seconds,
      ]
    }
  }
}

///|
/// The token ids from the last `moonlm_generate`.
#export_name("moonlm_last_tokens")
pub fn moonlm_last_tokens() -> FixedArray[Int] {
  FixedArray::from_array(last_tokens)
}

///|
/// Decode token ids back to text, for the caller to turn `moonlm_last_tokens`
/// into the exact string the model produced.
#export_name("moonlm_decode")
pub fn moonlm_decode(handle : Int, ids : FixedArray[Int]) -> String {
  match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      ""
    }
    Ok(engine) => {
      // Core has no FixedArray-to-Array conversion and the tokenizer takes an
      // Array, so the copy is explicit here.
      let tokens : Array[Int] = []
      for i = 0; i < ids.length(); i = i + 1 {
        tokens.push(ids[i])
      }
      engine.tokenizer.decode(tokens)
    }
  }
}

///|
/// How many tokens a string encodes to, so a page can warn before a prompt
/// exceeds the context rather than after generation fails.
#export_name("moonlm_count_tokens")
pub fn moonlm_count_tokens(handle : Int, text : String) -> Int {
  match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      -1
    }
    Ok(engine) => engine.tokenizer.encode(text).length()
  }
}

///|
/// The model's own context length, for sizing that warning.
#export_name("moonlm_context_length")
pub fn moonlm_context_length(handle : Int) -> Int {
  match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      0
    }
    Ok(engine) => @engine.Engine::context_length(engine)
  }
}

///|
/// Look up a handle, reporting an unknown or freed one by name.
fn engine_of(handle : Int) -> Result[@engine.PureEngine, String] {
  if handle < 0 || handle >= slots.length() {
    return Err("no model for handle \{handle}")
  }
  match slots[handle] {
    Some(e) => Ok(e)
    None => Err("model for handle \{handle} was freed")
  }
}

// The `Engine` abstraction and the pure-MoonBit implementation.
//
// `Engine` is the seam the rest of the project talks to: M4 adds a
// llama.cpp-backed engine that implements the same surface, so chat, the agent
// loop and the benchmarks never learn which engine they are running on. The
// trait is deliberately small — load, encode, decode, generate — because those
// four operations are what every backend can honestly provide.
//
// `PureEngine` wires `tokenizer`, `model` and `sampler` together: prefill the
// prompt one token at a time, then decode a token at a time, feeding each
// sampled token back in.

///|
/// A text generation backend.
///
/// `generate` streams through `on_token` so a caller can print as tokens arrive
/// without the engine deciding what to do with them.
pub(open) trait Engine {
  /// Encode text to token ids.
  fn encode(self : Self, text : String) -> Result[Array[Int], String]
  /// Decode token ids back to text.
  fn decode(self : Self, tokens : Array[Int]) -> Result[String, String]
  /// Generate a continuation, calling `on_token` for each new token.
  fn generate(
    self : Self,
    prompt : String,
    max_tokens : Int,
    sampler : @sampler.Sampler,
    seed : UInt64,
    on_token : (Int, String) -> Unit,
  ) -> Result[GenerationStats, String]
  /// Number of tokens the model can attend over, from the model's own config.
  fn context_length(self : Self) -> Int
}

///|
/// What a generation run did, for reporting and benchmarking.
pub(all) struct GenerationStats {
  /// Tokens in the prompt after encoding.
  prompt_tokens : Int
  /// Tokens actually produced.
  generated_tokens : Int
  /// Whether generation stopped because the model emitted EOS.
  hit_eos : Bool
  /// Seconds spent on the prefill pass.
  prefill_seconds : Double
  /// Seconds spent decoding (the per-token loop).
  decode_seconds : Double
} derive(Eq, Debug)

///|
/// Tokens per second over the decode loop; the number that actually describes
/// interactive speed.
pub fn GenerationStats::tokens_per_second(self : GenerationStats) -> Double {
  if self.decode_seconds <= 0.0 {
    0.0
  } else {
    Double::from_int(self.generated_tokens) / self.decode_seconds
  }
}

///|
/// Wall-clock seconds since an arbitrary fixed origin.
///
/// Used only for the benchmark numbers in `GenerationStats`; the engine's
/// correctness does not depend on it.
pub fn monotonic_seconds() -> Double {
  @env.now().to_double() / 1000.0
}

///|
/// A GGUF model evaluated entirely in MoonBit.
pub(all) struct PureEngine {
  model : @model.Model
  tokenizer : @tokenizer.Tokenizer
  /// Path the model was loaded from, for messages.
  path : String
} derive(Debug)

///|
/// Load a model from an in-memory GGUF buffer.
///
/// The buffer must have been parsed with materialized metadata (`parse` with the
/// tokenizer's requirement), because the vocabulary arrays are needed in full.
pub fn PureEngine::load_bytes(buf : Bytes, path : String) -> Result[PureEngine, String] {
  let f = match @gguf.parse_materializing_metadata(buf) {
    Ok(f) => f
    Err(e) => return Err("parsing \{path}: \{e.message()}")
  }
  let tokenizer = match @tokenizer.load(f) {
    Ok(t) => t
    Err(e) => return Err("loading the tokenizer from \{path}: \{e.message()}")
  }
  let model = match @model.Model::load(f) {
    Ok(m) => m
    Err(e) => return Err("loading the model from \{path}: \{e.message()}")
  }
  // The model and the tokenizer must agree on the vocabulary, or token ids
  // would index the embedding table out of range at run time.
  if tokenizer.vocab_size() > model.config.vocab_size {
    return Err(
      "tokenizer vocabulary (\{tokenizer.vocab_size()}) is larger than the model's embedding table (\{model.config.vocab_size})",
    )
  }
  Ok({ model, tokenizer, path })
}

///|
/// Make the trait's methods callable directly on `PureEngine`.
///|
pub impl Engine for PureEngine with fn encode(
  self : PureEngine,
  text : String,
) -> Result[Array[Int], String] {
  Ok(self.tokenizer.encode(text))
}

///|
pub impl Engine for PureEngine with fn decode(
  self : PureEngine,
  tokens : Array[Int],
) -> Result[String, String] {
  Ok(self.tokenizer.decode(tokens))
}

///|
pub impl Engine for PureEngine with fn context_length(self : PureEngine) -> Int {
  self.model.config.context_length
}

///|
pub impl Engine for PureEngine with fn generate(
  self : PureEngine,
  prompt : String,
  max_tokens : Int,
  sampler : @sampler.Sampler,
  seed : UInt64,
  on_token : (Int, String) -> Unit,
) -> Result[GenerationStats, String] {
  let tokens = self.tokenizer.encode(prompt)
  if tokens.length() == 0 {
    return Err("the prompt encoded to zero tokens")
  }
  let ctx = self.model.config.context_length
  if tokens.length() >= ctx {
    return Err(
      "the prompt has \{tokens.length()} tokens, which does not fit the model's context length \{ctx}",
    )
  }
  // A run always starts from an empty cache: the engine is stateless across
  // calls, so two generate() calls cannot contaminate each other.
  self.model.cache.reset()
  let rng = @sampler.Rng::new(seed)
  let prefill_start = monotonic_seconds()
  // Prefill: every prompt token but the last, so the last one can be decoded by
  // the loop below and there is always a fresh set of logits to sample from.
  let n_prompt = tokens.length()
  for pos = 0; pos < n_prompt - 1; pos = pos + 1 {
    match self.model.forward(tokens[pos], pos) {
      Ok(_) => ()
      Err(e) => return Err("prefill at position \{pos}: \{e.message()}")
    }
    self.model.cache.len = pos + 1
  }
  let prefill_seconds = monotonic_seconds() - prefill_start
  let decode_start = monotonic_seconds()
  let produced : Array[Int] = []
  let mut hit_eos = false
  let mut pos = n_prompt - 1
  let mut next_token = tokens[pos]
  let mut emitted = 0
  let limit = if max_tokens < 0 { 0 } else { max_tokens }
  while emitted < limit && pos < ctx {
    match self.model.forward(next_token, pos) {
      Ok(_) => ()
      Err(e) => return Err("decoding at position \{pos}: \{e.message()}")
    }
    self.model.cache.len = pos + 1
    let sampled = match @sampler.sample(self.model.logits(), sampler, rng) {
      Ok(t) => t
      Err(e) => return Err("sampling at position \{pos}: \{e.message()}")
    }
    if self.tokenizer.is_eos(sampled) {
      hit_eos = true
      break
    }
    produced.push(sampled)
    emitted = emitted + 1
    // Emit incrementally so a caller can stream. The token text alone is not
    // always valid UTF-8 (a multi-byte character can span tokens), so callers
    // that print as they go should buffer; `on_token` gets the raw piece and the
    // index, and the full text is available afterwards via `decode`.
    on_token(sampled, self.tokenizer.decode([sampled]))
    next_token = sampled
    pos = pos + 1
  }
  let decode_seconds = monotonic_seconds() - decode_start
  Ok({
    prompt_tokens: n_prompt,
    generated_tokens: emitted,
    hit_eos,
    prefill_seconds,
    decode_seconds,
  })
}

///|
/// Generate and return the completion text (the tokens after the prompt).
///
/// Convenience for callers that do not need streaming.
pub fn PureEngine::generate_text(
  self : PureEngine,
  prompt : String,
  max_tokens : Int,
  sampler : @sampler.Sampler,
  seed : UInt64,
) -> Result[(String, GenerationStats), String] {
  let collected : Array[Int] = []
  let stats = match Engine::generate(self, prompt, max_tokens, sampler, seed, fn(tok, _) {
    collected.push(tok)
  }) {
    Ok(s) => s
    Err(e) => return Err(e)
  }
  Ok((self.tokenizer.decode(collected), stats))
}

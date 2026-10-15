// Architecture hyperparameters, read from GGUF metadata.
//
// Nothing here is hardcoded for a specific model: the key prefix comes from
// `general.architecture`, and every dimension is read from the file. Missing
// optional keys fall back to the values llama.cpp uses for that architecture,
// and a missing required key is an error rather than a guess.

///|
/// Transformer hyperparameters for a decoder-only, RMSNorm-pre-norm,
/// RoPE, GQA, SwiGLU model (the SmolLM2 / Llama family layout).
pub(all) struct ModelConfig {
  /// `general.architecture` verbatim, e.g. "llama".
  architecture : String
  /// Vocabulary size, from the embedding tensor's row count.
  vocab_size : Int
  /// Hidden dimension.
  n_embd : Int
  /// Number of transformer blocks.
  n_layer : Int
  /// SwiGLU intermediate dimension.
  n_ff : Int
  /// Query heads.
  n_head : Int
  /// Key/value heads; equal to `n_head` when the model does not use GQA.
  n_head_kv : Int
  /// Per-head dimension.
  head_dim : Int
  /// Maximum sequence length the KV cache is sized for.
  context_length : Int
  /// `attention.layer_norm_rms_epsilon`.
  rms_eps : Double
  /// `rope.freq_base` (rope_theta).
  rope_theta : Double
  /// Number of hidden dimensions RoPE rotates; equals `head_dim` unless the
  /// model sets `rope.dimension_count` (partial rotation).
  n_rot : Int
  /// Whether the LM head reuses the token embedding matrix.
  tied_lm_head : Bool
} derive(Eq, Debug)

///|
/// Config-loading errors.
pub(all) suberror ModelError {
  /// A required metadata key was absent.
  MissingKey(key~ : String)
  /// A metadata value had the wrong shape or type.
  BadValue(key~ : String, detail~ : String)
  /// A required tensor was absent from the file.
  MissingTensor(name~ : String)
  /// A tensor's shape disagrees with the config.
  TensorShape(name~ : String, expected~ : String, found~ : String)
  /// The tensor's storage type is not one this build can multiply against.
  UnsupportedTensorType(name~ : String, type_name~ : String)
  /// A prompt produced no tokens to evaluate.
  EmptyPrompt
  /// A position exceeded the KV cache capacity.
  ContextOverflow(pos~ : Int, max_len~ : Int)
  /// A tensor payload could not be located or decoded.
  TensorRead(name~ : String, reason~ : String)
  /// The tokenizer could not be loaded or used.
  Tokenizer(reason~ : String)
  /// The architecture is not implemented by this build.
  UnsupportedArchitecture(arch~ : String)
} derive(Eq, Debug)

///|
pub fn ModelError::message(self : ModelError) -> String {
  match self {
    MissingKey(key~) => "missing metadata key \"\{key}\""
    BadValue(key~, detail~) => "metadata key \"\{key}\": \{detail}"
    MissingTensor(name~) => "missing tensor \"\{name}\""
    TensorShape(name~, expected~, found~) =>
      "tensor \"\{name}\": expected shape \{expected}, found \{found}"
    UnsupportedTensorType(name~, type_name~) =>
      "tensor \"\{name}\" has type \{type_name}, which this build cannot multiply"
    EmptyPrompt => "the prompt encoded to zero tokens"
    ContextOverflow(pos~, max_len~) =>
      "position \{pos} exceeds the KV cache capacity \{max_len}"
    TensorRead(name~, reason~) => "tensor \"\{name}\": \{reason}"
    Tokenizer(reason~) => "tokenizer: \{reason}"
    UnsupportedArchitecture(arch~) =>
      "architecture \"\{arch}\" is not implemented (this build handles the llama/SmolLM2 decoder layout)"
  }
}

///|
pub impl Show for ModelError with fn to_string(self : ModelError) {
  self.message()
}

///|
/// Read a required integer metadata value, tolerating either type width.
fn req_int(f : @gguf.GgufFile, key : String) -> Result[Int, ModelError] {
  match f.get_int(key) {
    Some(v) => Ok(v.to_int())
    None => Err(MissingKey(key=key))
  }
}

///|
/// Read an optional integer metadata value with a fallback.
fn opt_int(f : @gguf.GgufFile, key : String, default : Int) -> Int {
  match f.get_int(key) {
    Some(v) => v.to_int()
    None => default
  }
}

///|
/// Read an optional float metadata value with a fallback.
fn opt_double(f : @gguf.GgufFile, key : String, default : Double) -> Double {
  match f.get_double(key) {
    Some(v) => v
    None => default
  }
}

///|
/// Build a `ModelConfig` from a parsed GGUF file.
///
/// The architecture's key prefix comes from `general.architecture`; a model
/// whose architecture is not the llama-family layout is rejected explicitly
/// rather than parsed into nonsense. Optional keys fall back to llama.cpp's
/// defaults: `rope.freq_base` 10000, `attention.layer_norm_rms_epsilon` 1e-5,
/// `attention.head_count_kv` = `attention.head_count`, `rope.dimension_count` =
/// `head_dim`.
pub fn ModelConfig::from_gguf(
  f : @gguf.GgufFile,
) -> Result[ModelConfig, ModelError] {
  let arch = match f.get_string("general.architecture") {
    Some(a) => a
    None => return Err(MissingKey(key="general.architecture"))
  }
  // The decoder layout below is shared by llama, smollm2 and qwen2 style files.
  // Anything else would need a different forward pass, so refuse it by name.
  let known = arch == "llama" || arch == "smollm" || arch == "smollm2" ||
    arch == "qwen2"
  if !known {
    return Err(UnsupportedArchitecture(arch=arch))
  }
  let p = "\{arch}."
  let n_embd = match req_int(f, p + "embedding_length") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  let n_layer = match req_int(f, p + "block_count") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  let n_ff = match req_int(f, p + "feed_forward_length") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  let n_head = match req_int(f, p + "attention.head_count") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  if n_head <= 0 || n_embd <= 0 || n_layer <= 0 || n_ff <= 0 {
    return Err(
      BadValue(
        key=p + "(dimensions)",
        detail="embedding_length, block_count, feed_forward_length and attention.head_count must all be positive",
      ),
    )
  }
  if n_embd % n_head != 0 {
    return Err(
      BadValue(
        key=p + "embedding_length",
        detail="\{n_embd} is not divisible by attention.head_count \{n_head}",
      ),
    )
  }
  let head_dim = n_embd / n_head
  let n_head_kv = opt_int(f, p + "attention.head_count_kv", n_head)
  if n_head_kv <= 0 || n_head % n_head_kv != 0 {
    return Err(
      BadValue(
        key=p + "attention.head_count_kv",
        detail="\{n_head_kv} does not divide attention.head_count \{n_head}",
      ),
    )
  }
  let context_length = opt_int(f, p + "context_length", 2048)
  let rms_eps = opt_double(f, p + "attention.layer_norm_rms_epsilon", 1.0e-5)
  let rope_theta = opt_double(f, p + "rope.freq_base", 10000.0)
  let n_rot = opt_int(f, p + "rope.dimension_count", head_dim)
  if n_rot <= 0 || n_rot > head_dim || n_rot % 2 != 0 {
    return Err(
      BadValue(
        key=p + "rope.dimension_count",
        detail="\{n_rot} must be a positive even number no larger than head_dim \{head_dim}",
      ),
    )
  }
  // Vocabulary size and LM-head tying both come from the tensors, which are
  // authoritative when metadata and tensors disagree.
  let embd = match f.tensor("token_embd.weight") {
    Some(t) => t
    None => return Err(MissingTensor(name="token_embd.weight"))
  }
  if embd.n_dims() != 2 {
    return Err(
      TensorShape(
        name="token_embd.weight",
        expected="[n_embd, n_vocab]",
        found="\{embd.n_dims()} dimensions",
      ),
    )
  }
  let embd_rows = embd.dims[0].reinterpret_as_int64().to_int()
  let embd_cols = embd.dims[1].reinterpret_as_int64().to_int()
  // GGUF stores the fastest-varying dimension first, so a Llama embedding is
  // [n_embd, n_vocab]; the hidden size must match the metadata.
  if embd_rows != n_embd {
    return Err(
      TensorShape(
        name="token_embd.weight",
        expected="first dimension \{n_embd}",
        found="first dimension \{embd_rows}",
      ),
    )
  }
  let vocab_size = embd_cols
  let tied_lm_head = f.tensor("output.weight") is None
  Ok({
    architecture: arch,
    vocab_size,
    n_embd,
    n_layer,
    n_ff,
    n_head,
    n_head_kv,
    head_dim,
    context_length,
    rms_eps,
    rope_theta,
    n_rot,
    tied_lm_head,
  })
}

///|
/// Number of query heads sharing each key/value head.
pub fn ModelConfig::heads_per_kv(self : ModelConfig) -> Int {
  self.n_head / self.n_head_kv
}

///|
/// Rows in each attention projection.
pub fn ModelConfig::kv_dim(self : ModelConfig) -> Int {
  self.n_head_kv * self.head_dim
}

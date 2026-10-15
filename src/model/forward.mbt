// The decoder forward pass: RMSNorm, RoPE, grouped-query attention, SwiGLU.
//
// Layout and arithmetic follow llama.cpp's llama-graph.cpp for the
// `LLM_ARCH_LLAMA` family, which is what a GGUF declaring
// `general.architecture = "llama"` means (SmolLM2 ships as "llama").
//
// Two conventions are easy to get wrong and are called out where they are used:
//
//  1. RoPE is the *NORMAL* variant, operating on pairs of ADJACENT head values
//     (`[cscscscs]`), not the NeoX variant that splits the head in half
//     (`[ccccssss]`). llama.cpp selects NORMAL for the llama architecture.
//  2. Attention logits are scaled by `1/sqrt(head_dim)` before the softmax.
//
// Weights stay quantized; only activations are floats.

///|
/// Everything the forward pass needs for one token: the weights and the
/// recurrent state.
pub(all) struct Model {
  config : ModelConfig
  /// Token embedding, [n_embd, vocab_size]: row `id` is the embedding.
  token_embd : Matrix
  /// Per-layer weights, in block order.
  layers : Array[LayerWeights]
  /// Final RMSNorm gain.
  output_norm : Vector
  /// LM head, [n_embd, vocab_size]. Equals `token_embd` when the file omits
  /// `output.weight` (tied embeddings).
  output : Matrix
  cache : KVCache
  /// Scratch buffers, allocated once and reused for every token.
  scratch : Scratch
} derive(Debug)

///|
/// The weights of one transformer block.
pub(all) struct LayerWeights {
  attn_norm : Vector
  wq : Matrix
  wk : Matrix
  wv : Matrix
  wo : Matrix
  ffn_norm : Vector
  w_gate : Matrix
  w_up : Matrix
  w_down : Matrix
} derive(Debug)

///|
/// Preallocated KV cache: [n_layer][n_head_kv][max_len][head_dim].
///
/// Sized once from `context_length` and never reallocated, so decoding a token
/// performs no allocation at all.
pub(all) struct KVCache {
  max_len : Int
  head_dim : Int
  n_head_kv : Int
  /// Flattened as ((layer * n_head_kv + head) * max_len + pos) * head_dim + d.
  k : FixedArray[Float]
  v : FixedArray[Float]
  /// Number of positions written so far.
  mut len : Int
} derive(Debug)

///|
/// Create a zeroed KV cache sized for `max_len` positions.
pub fn KVCache::new(
  n_layer : Int,
  n_head_kv : Int,
  head_dim : Int,
  max_len : Int,
) -> KVCache {
  let n = n_layer * n_head_kv * max_len * head_dim
  {
    max_len,
    head_dim,
    n_head_kv,
    k: FixedArray::make(n, 0.0),
    v: FixedArray::make(n, 0.0),
    len: 0,
  }
}

///|
/// Reset the cache to empty without freeing its storage.
pub fn KVCache::reset(self : KVCache) -> Unit {
  self.len = 0
}

///|
/// Scratch buffers reused across tokens, so the hot path allocates nothing.
pub(all) struct Scratch {
  /// Current hidden state, `n_embd`.
  hidden : FixedArray[Float]
  /// Normalized copy feeding attention or the FFN.
  normed : FixedArray[Float]
  /// Query projection, `n_head * head_dim`.
  q : FixedArray[Float]
  /// Key projection for the current token, `n_head_kv * head_dim`.
  k : FixedArray[Float]
  /// Value projection for the current token.
  v : FixedArray[Float]
  /// Attention output, `n_head * head_dim`.
  attn : FixedArray[Float]
  /// Projected attention result, `n_embd`.
  proj : FixedArray[Float]
  /// SwiGLU intermediate, `n_ff`.
  gate : FixedArray[Float]
  up : FixedArray[Float]
  /// Logits, `vocab_size`.
  logits : FixedArray[Float]
  /// Attention scores for one head over the cached positions.
  scores : FixedArray[Float]
} derive(Debug)

///|
/// Allocate the scratch buffers for a config.
pub fn Scratch::new(config : ModelConfig) -> Scratch {
  let n_embd = config.n_embd
  let kv_dim = config.kv_dim()
  {
    hidden: FixedArray::make(n_embd, 0.0),
    normed: FixedArray::make(n_embd, 0.0),
    q: FixedArray::make(n_embd, 0.0),
    k: FixedArray::make(kv_dim, 0.0),
    v: FixedArray::make(kv_dim, 0.0),
    attn: FixedArray::make(n_embd, 0.0),
    proj: FixedArray::make(n_embd, 0.0),
    gate: FixedArray::make(config.n_ff, 0.0),
    up: FixedArray::make(config.n_ff, 0.0),
    logits: FixedArray::make(config.vocab_size, 0.0),
    // One score per cached position plus the current one.
    scores: FixedArray::make(config.context_length + 1, 0.0),
  }
}

///|
/// Build a `Model` from a parsed GGUF file, allocating weights and cache.
///
/// Every tensor is looked up by the names this architecture uses; a missing
/// tensor is an error naming it, never a silent zero. The LM head falls back to
/// the embedding matrix when `output.weight` is absent, which is how tied
/// models are stored.
pub fn Model::load(f : @gguf.GgufFile) -> Result[Model, ModelError] {
  let config = match ModelConfig::from_gguf(f) {
    Ok(c) => c
    Err(e) => return Err(e)
  }
  let token_embd = match load_matrix(f, "token_embd.weight") {
    Ok(m) => m
    Err(e) => return Err(e)
  }
  let output_norm = match load_vector(f, "output_norm.weight") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  if output_norm.data.length() != config.n_embd {
    return Err(
      TensorShape(
        name="output_norm.weight",
        expected="\{config.n_embd} elements",
        found="\{output_norm.data.length()}",
      ),
    )
  }
  let layers : Array[LayerWeights] = []
  for i = 0; i < config.n_layer; i = i + 1 {
    let p = "blk.\{i}."
    let attn_norm = match load_vector(f, p + "attn_norm.weight") {
      Ok(v) => v
      Err(e) => return Err(e)
    }
    let wq = match load_matrix(f, p + "attn_q.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let wk = match load_matrix(f, p + "attn_k.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let wv = match load_matrix(f, p + "attn_v.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let wo = match load_matrix(f, p + "attn_output.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let ffn_norm = match load_vector(f, p + "ffn_norm.weight") {
      Ok(v) => v
      Err(e) => return Err(e)
    }
    let w_gate = match load_matrix(f, p + "ffn_gate.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let w_up = match load_matrix(f, p + "ffn_up.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    let w_down = match load_matrix(f, p + "ffn_down.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
    // Shape checks: anything that disagrees with the config would produce
    // wrong-but-plausible numbers rather than an obvious failure.
    match check_layer_shapes(
      config,
      i,
      attn_norm,
      wq,
      wk,
      wv,
      wo,
      ffn_norm,
      w_gate,
      w_up,
      w_down,
    ) {
      Ok(_) => ()
      Err(e) => return Err(e)
    }
    layers.push({
      attn_norm,
      wq,
      wk,
      wv,
      wo,
      ffn_norm,
      w_gate,
      w_up,
      w_down,
    })
  }
  let output = if config.tied_lm_head {
    // Tied: reuse the embedding payload rather than copying 40 MB.
    { ..token_embd, name: "token_embd.weight (tied lm head)" }
  } else {
    match load_matrix(f, "output.weight") {
      Ok(m) => m
      Err(e) => return Err(e)
    }
  }
  let cache = KVCache::new(
    config.n_layer,
    config.n_head_kv,
    config.head_dim,
    config.context_length,
  )
  let scratch = Scratch::new(config)
  Ok({ config, token_embd, layers, output_norm, output, cache, scratch })
}

///|
/// Verify one layer's tensor shapes against the config.
fn check_layer_shapes(
  config : ModelConfig,
  i : Int,
  attn_norm : Vector,
  wq : Matrix,
  wk : Matrix,
  wv : Matrix,
  wo : Matrix,
  ffn_norm : Vector,
  w_gate : Matrix,
  w_up : Matrix,
  w_down : Matrix,
) -> Result[Unit, ModelError] {
  let n_embd = config.n_embd
  let kv_dim = config.kv_dim()
  let p = "blk.\{i}."
  let checks : Array[(String, Bool, String)] = [
    (
      p + "attn_norm.weight",
      attn_norm.data.length() == n_embd,
      "\{n_embd} elements",
    ),
    (p + "attn_q.weight", wq.cols == n_embd && wq.rows == n_embd, "\{n_embd}x\{n_embd}"),
    (p + "attn_k.weight", wk.cols == n_embd && wk.rows == kv_dim, "\{n_embd}x\{kv_dim}"),
    (p + "attn_v.weight", wv.cols == n_embd && wv.rows == kv_dim, "\{n_embd}x\{kv_dim}"),
    (p + "attn_output.weight", wo.cols == n_embd && wo.rows == n_embd, "\{n_embd}x\{n_embd}"),
    (
      p + "ffn_norm.weight",
      ffn_norm.data.length() == n_embd,
      "\{n_embd} elements",
    ),
    (
      p + "ffn_gate.weight",
      w_gate.cols == n_embd && w_gate.rows == config.n_ff,
      "\{n_embd}x\{config.n_ff}",
    ),
    (
      p + "ffn_up.weight",
      w_up.cols == n_embd && w_up.rows == config.n_ff,
      "\{n_embd}x\{config.n_ff}",
    ),
    (
      p + "ffn_down.weight",
      w_down.cols == config.n_ff && w_down.rows == n_embd,
      "\{config.n_ff}x\{n_embd}",
    ),
  ]
  for c in checks {
    let (name, ok, expected) = c
    if !ok {
      let found = match name {
        n if n.contains("attn_norm") || n.contains("ffn_norm") =>
          "\{if n.contains("attn_norm") { attn_norm.data.length() } else { ffn_norm.data.length() }} elements"
        n if n.contains("attn_q") => "\{wq.cols}x\{wq.rows}"
        n if n.contains("attn_k") => "\{wk.cols}x\{wk.rows}"
        n if n.contains("attn_v") => "\{wv.cols}x\{wv.rows}"
        n if n.contains("attn_output") => "\{wo.cols}x\{wo.rows}"
        n if n.contains("ffn_gate") => "\{w_gate.cols}x\{w_gate.rows}"
        n if n.contains("ffn_up") => "\{w_up.cols}x\{w_up.rows}"
        _ => "\{w_down.cols}x\{w_down.rows}"
      }
      return Err(TensorShape(name=name, expected=expected, found=found))
    }
  }
  Ok(())
}

///|
/// Root-mean-square normalization, in place into `out`.
///
/// `out[i] = x[i] / sqrt(mean(x^2) + eps) * weight[i]`. The mean and the
/// reciprocal square root are computed in `Float` to match the reference, which
/// does the same arithmetic in `float`.
fn rms_norm(
  x : FixedArray[Float],
  weight : FixedArray[Float],
  out : FixedArray[Float],
  n : Int,
  eps : Double,
) -> Unit {
  let mut sum_sq : Float = 0.0
  for i = 0; i < n; i = i + 1 {
    let xi = x[i]
    sum_sq = sum_sq + xi * xi
  }
  let mean_sq = sum_sq / Float::from_int(n)
  let scale = Float::from_double(1.0 / (mean_sq.to_double() + eps).sqrt())
  for i = 0; i < n; i = i + 1 {
    out[i] = x[i] * scale * weight[i]
  }
}

///|
/// Swish (SiLU): `x * sigmoid(x)`, computed without overflow for large |x|.
fn silu(x : Float) -> Float {
  let xd = x.to_double()
  // For very negative x, exp(-x) overflows to inf and x*sigmoid -> -0, which is
  // the correct limit; the branch avoids the inf*0 that would give NaN.
  if xd < -30.0 {
    0.0
  } else {
    Float::from_double(xd / (1.0 + @math.exp(-xd)))
  }
}

///|
/// Rotary position embedding over one head's `head_dim` values, NORMAL pairing.
///
/// llama.cpp's `GGML_ROPE_TYPE_NORMAL` rotates consecutive pairs `(x[2i],
/// x[2i+1])`, i.e. the result is `[cscscscs]` across the head. This differs from
/// the NeoX layout, which rotates `(x[i], x[i + head_dim/2])` and yields
/// `[ccccssss]`; using the wrong one produces fluent-looking but wrong text.
///
/// `n_rot` may be smaller than `head_dim` (partial rotation); dimensions past
/// `n_rot` are left untouched.
fn rope_in_place(
  x : FixedArray[Float],
  offset : Int,
  pos : Int,
  head_dim : Int,
  n_rot : Int,
  theta : Double,
) -> Unit {
  let n_pairs = n_rot / 2
  for i = 0; i < n_pairs; i = i + 1 {
    // freq = theta^(-2i/head_dim)
    let exponent = -2.0 * Double::from_int(i) / Double::from_int(head_dim)
    let freq = @math.pow(theta, exponent)
    let angle = Double::from_int(pos) * freq
    let c = Float::from_double(@math.cos(angle))
    let s = Float::from_double(@math.sin(angle))
    let a = x[offset + 2 * i]
    let b = x[offset + 2 * i + 1]
    x[offset + 2 * i] = a * c - b * s
    x[offset + 2 * i + 1] = a * s + b * c
  }
}

///|
/// Forward one token at `pos`, writing `vocab_size` logits into
/// `scratch.logits`.
///
/// The KV cache is written at `pos` for every layer; the caller advances
/// `cache.len` after the token is accepted, so a prefill loop and a decode step
/// share this one entry point.
pub fn Model::forward(self : Model, token : Int, pos : Int) -> Result[Unit, ModelError] {
  let cfg = self.config
  if pos >= self.cache.max_len {
    return Err(ContextOverflow(pos=pos, max_len=self.cache.max_len))
  }
  if token < 0 || token >= cfg.vocab_size {
    return Err(BadValue(key="token_id", detail="\{token} is outside the vocabulary"))
  }
  let n_embd = cfg.n_embd
  let head_dim = cfg.head_dim
  let n_head = cfg.n_head
  let n_head_kv = cfg.n_head_kv
  let kv_dim = cfg.kv_dim()
  let sc = self.scratch
  // 1. Token embedding: row `token` of the embedding matrix.
  match self.token_embd.dequant_row(token, sc.hidden) {
    Ok(_) => ()
    Err(e) => return Err(e)
  }
  for layer_idx = 0; layer_idx < cfg.n_layer; layer_idx = layer_idx + 1 {
    let lw = self.layers[layer_idx]
    // 2. Pre-attention RMSNorm.
    rms_norm(sc.hidden, lw.attn_norm.data, sc.normed, n_embd, cfg.rms_eps)
    // 3. Q/K/V projections.
    lw.wq.matvec(sc.normed, sc.q)
    lw.wk.matvec(sc.normed, sc.k)
    lw.wv.matvec(sc.normed, sc.v)
    // 4. RoPE, applied to Q and K only, once per token. Because the rotated K is
    // stored in the cache, cached positions are never re-rotated.
    for h = 0; h < n_head; h = h + 1 {
      rope_in_place(sc.q, h * head_dim, pos, head_dim, cfg.n_rot, cfg.rope_theta)
    }
    for h = 0; h < n_head_kv; h = h + 1 {
      rope_in_place(sc.k, h * head_dim, pos, head_dim, cfg.n_rot, cfg.rope_theta)
    }
    // 5. Append K/V for this position.
    let base = (layer_idx * n_head_kv) * self.cache.max_len * head_dim
    for h = 0; h < n_head_kv; h = h + 1 {
      let kc = base + h * self.cache.max_len * head_dim + pos * head_dim
      for d = 0; d < head_dim; d = d + 1 {
        self.cache.k[kc + d] = sc.k[h * head_dim + d]
        self.cache.v[kc + d] = sc.v[h * head_dim + d]
      }
    }
    // 6. Attention over positions 0..=pos.
    let n_pos = pos + 1
    let scale = Float::from_double(1.0 / Double::from_int(head_dim).sqrt())
    let heads_per_kv = cfg.heads_per_kv()
    for h = 0; h < n_head; h = h + 1 {
      let kvh = h / heads_per_kv
      let kbase = base + kvh * self.cache.max_len * head_dim
      // Scores: one dot product per cached position.
      for p = 0; p < n_pos; p = p + 1 {
        let mut dot : Float = 0.0
        let kb = kbase + p * head_dim
        for d = 0; d < head_dim; d = d + 1 {
          dot = dot + sc.q[h * head_dim + d] * self.cache.k[kb + d]
        }
        sc.scores[p] = dot * scale
      }
      // Softmax, with the max subtracted first to keep exp in range.
      let mut max_score : Float = sc.scores[0]
      for p = 1; p < n_pos; p = p + 1 {
        if sc.scores[p] > max_score {
          max_score = sc.scores[p]
        }
      }
      let mut denom : Float = 0.0
      for p = 0; p < n_pos; p = p + 1 {
        let e = @math.expf(sc.scores[p] - max_score)
        sc.scores[p] = e
        denom = denom + e
      }
      let inv : Float = 1.0 / denom
      // Weighted sum of cached values into this head's slice of `attn`.
      let ob = h * head_dim
      for d = 0; d < head_dim; d = d + 1 {
        sc.attn[ob + d] = 0.0
      }
      for p = 0; p < n_pos; p = p + 1 {
        let w = sc.scores[p] * inv
        let vb = kbase + p * head_dim
        for d = 0; d < head_dim; d = d + 1 {
          sc.attn[ob + d] = sc.attn[ob + d] + w * self.cache.v[vb + d]
        }
      }
    }
    // 7. Output projection + residual.
    lw.wo.matvec(sc.attn, sc.proj)
    for i = 0; i < n_embd; i = i + 1 {
      sc.hidden[i] = sc.hidden[i] + sc.proj[i]
    }
    // 8. Pre-FFN RMSNorm and SwiGLU.
    rms_norm(sc.hidden, lw.ffn_norm.data, sc.normed, n_embd, cfg.rms_eps)
    lw.w_gate.matvec(sc.normed, sc.gate)
    lw.w_up.matvec(sc.normed, sc.up)
    for i = 0; i < cfg.n_ff; i = i + 1 {
      sc.gate[i] = silu(sc.gate[i]) * sc.up[i]
    }
    lw.w_down.matvec(sc.gate, sc.proj)
    for i = 0; i < n_embd; i = i + 1 {
      sc.hidden[i] = sc.hidden[i] + sc.proj[i]
    }
  }
  ignore(kv_dim)
  // 9. Final norm and LM head.
  rms_norm(sc.hidden, self.output_norm.data, sc.normed, n_embd, cfg.rms_eps)
  self.output.matvec(sc.normed, sc.logits)
  Ok(())
}

///|
/// The logits produced by the most recent `forward`.
pub fn Model::logits(self : Model) -> FixedArray[Float] {
  self.scratch.logits
}

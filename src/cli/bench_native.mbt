// Fine-grained profiling helper for the decode loop.
//
// Kept in the CLI (native-only) because it needs a real model file. The numbers
// it prints are what drive the optimization work, so it reports each stage
// separately rather than only the total.

///|
/// Time each stage of a decode step over `iters` iterations on a real model.
///
/// Reported per-stage so a bottleneck is attributable: the LM head and the FFN
/// are the two stages that dominate a 135M model, and they need different fixes.
pub fn profile_decode(path : String, iters : Int) -> Int {
  let buf = match read_file(path) {
    Ok(b) => b
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let engine = match @engine.PureEngine::load_bytes(buf, path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let m = engine.model
  let cfg = m.config
  println(
    "config: n_embd=\{cfg.n_embd} n_layer=\{cfg.n_layer} n_ff=\{cfg.n_ff} vocab=\{cfg.vocab_size} heads=\{cfg.n_head}/\{cfg.n_head_kv}",
  )
  // Warm up so the first touch of the weights is not measured.
  m.forward(0, 0) |> ignore
  m.cache.reset()
  let x : FixedArray[Float] = FixedArray::make(cfg.n_embd, 1.0)
  let y_ff : FixedArray[Float] = FixedArray::make(cfg.n_ff, 0.0)
  let y_embd : FixedArray[Float] = FixedArray::make(cfg.n_embd, 0.0)
  let y_vocab : FixedArray[Float] = FixedArray::make(cfg.vocab_size, 0.0)
  let lw = m.layers[0]
  // The LM head is 88% of the arithmetic, so it is timed first and separately.
  let t0 = @engine.monotonic_seconds()
  for i = 0; i < iters; i = i + 1 {
    m.output.matvec(x, y_vocab)
  }
  let t_lm = @engine.monotonic_seconds() - t0
  let t1 = @engine.monotonic_seconds()
  for i = 0; i < iters; i = i + 1 {
    lw.w_gate.matvec(x, y_ff)
    lw.w_up.matvec(x, y_ff)
    lw.w_down.matvec(y_ff, y_embd)
  }
  let t_ffn = @engine.monotonic_seconds() - t1
  let t2 = @engine.monotonic_seconds()
  for i = 0; i < iters; i = i + 1 {
    lw.wq.matvec(x, y_embd)
    lw.wk.matvec(x, y_embd)
    lw.wv.matvec(x, y_embd)
    lw.wo.matvec(x, y_embd)
  }
  let t_attn = @engine.monotonic_seconds() - t2
  let t3 = @engine.monotonic_seconds()
  for i = 0; i < iters; i = i + 1 {
    m.forward(1, 0) |> ignore
    m.cache.reset()
  }
  let t_full = @engine.monotonic_seconds() - t3
  let macs_lm = Double::from_int(cfg.vocab_size * cfg.n_embd)
  let macs_ffn = Double::from_int(3 * cfg.n_embd * cfg.n_ff)
  let macs_attn = Double::from_int(4 * cfg.n_embd * cfg.n_embd)
  let show = fn(label : String, t : Double, macs : Double) {
    let per_iter = t / Double::from_int(iters)
    let rate = macs / per_iter / 1000000.0
    println(
      "\{label}: \{(per_iter * 1000.0).to_string()} ms/iter, \{(macs / 1000000.0).to_string()} MMACs, \{rate.to_string()} MMACs/s",
    )
  }
  show("lm_head (x1)", t_lm, macs_lm)
  show("ffn     (x1, 3 mats)", t_ffn, macs_ffn)
  show("attn    (x1, 4 mats)", t_attn, macs_attn)
  show(
    "full forward",
    t_full,
    macs_lm + Double::from_int(cfg.n_layer) * (macs_ffn + macs_attn),
  )
  let per_token = t_full / Double::from_int(iters)
  if per_token > 0.0 {
    println("=> \{(1.0 / per_token).to_string()} tok/s implied by the forward alone")
  }
  0
}

///|
/// Dump the top-k logits after evaluating a prompt given as token ids.
///
/// Exists for the cross-implementation check: comparing *sampled tokens* cannot
/// tell a real bug from a near-tie broken by floating-point drift, so this
/// reports the logit values at each position. A reference implementation's
/// `logprob` for the same position is the other half of the comparison.
///
/// The prompt is taken as ids rather than text on purpose — it removes the
/// tokenizer from the experiment, so a mismatch can only come from the forward
/// pass.
pub fn dump_logits(path : String, ids : Array[Int], top : Int) -> Int {
  let buf = match read_file(path) {
    Ok(b) => b
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let engine = match @engine.PureEngine::load_bytes(buf, path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let m = engine.model
  m.cache.reset()
  let mut pos = 0
  for id in ids {
    match m.forward(id, pos) {
      Ok(_) => ()
      Err(e) => {
        println("error: forward at \{pos}: \{e.message()}")
        return 1
      }
    }
    m.cache.len = pos + 1
    // Emit the ranking after each prompt token: the logits that follow the
    // prefix `<ids[0..=pos]>`. That is the same quantity a reference reports
    // when it gives per-position logprobs, so no alignment step is needed.
    emit_top_logits(m.logits(), top, pos)
    pos = pos + 1
  }
  0
}

///|
/// Print the `top` highest logits with their ids and values, highest first.
fn emit_top_logits(logits : FixedArray[Float], top : Int, pos : Int) -> Unit {
  let n = logits.length()
  let idx : Array[Int] = []
  for i = 0; i < n; i = i + 1 {
    idx.push(i)
  }
  // Partial selection sort over the ids: only the first `top` positions need to
  // be right, so this is cheaper than sorting all 49152 entries.
  let k = if top < n { top } else { n }
  for i = 0; i < k; i = i + 1 {
    let mut best = i
    for j = i + 1; j < n; j = j + 1 {
      if logits[idx[j]] > logits[idx[best]] {
        best = j
      }
    }
    let tmp = idx[i]
    idx[i] = idx[best]
    idx[best] = tmp
  }
  println("pos \{pos}:")
  for i = 0; i < k; i = i + 1 {
    let id = idx[i]
    println("  \{(i + 1)} \{id} \{logits[id].to_double()}")
  }
}

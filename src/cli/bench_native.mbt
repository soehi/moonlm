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

// End-to-end forward-pass test for the Qwen2-shaped fixture.
//
// The fixture is a complete 2-layer GQA transformer stored as a real GGUF,
// declaring `qwen2.rope.<i>.type = "neox"` for every layer and carrying
// per-layer Q/K/V projection biases. The expected logits come from a numpy
// reference in tools/gen_forward_tests.py that applies the biases after the
// projections and rotates with NEOX pairing.
//
// This complements forward_test.mbt, which covers the llama layout (NORMAL
// RoPE, no biases): a regression in either path fails its own fixture.

///|
test "qwen2 forward pass matches the numpy reference" {
  let f = @gguf.parse(forward_qwen_gguf).unwrap()
  let m = Model::load(f).unwrap()
  // The config must have come from the file: NEOX from the per-layer keys and
  // an untied LM head.
  assert_eq(m.config.architecture, "qwen2")
  assert_eq(m.config.rope_type, NEOX)
  assert_eq(m.config.n_rot, m.config.head_dim)
  assert_eq(m.config.n_layer, 2)
  assert_eq(m.config.n_embd, 48)
  assert_eq(m.config.n_head, 4)
  assert_eq(m.config.n_head_kv, 2)
  assert_eq(m.config.head_dim, 12)
  assert_false(m.config.tied_lm_head)
  // Every layer must have loaded all three biases, at the right lengths.
  for lw in m.layers {
    match lw.bq {
      Some(b) => assert_eq(b.data.length(), m.config.n_embd)
      None => fail("attn_q.bias was not loaded")
    }
    match lw.bk {
      Some(b) => assert_eq(b.data.length(), m.config.kv_dim())
      None => fail("attn_k.bias was not loaded")
    }
    match lw.bv {
      Some(b) => assert_eq(b.data.length(), m.config.kv_dim())
      None => fail("attn_v.bias was not loaded")
    }
  }
  for pos, tok in forward_qwen_tokens {
    m.forward(tok, pos).unwrap()
    m.cache.len = pos + 1
  }
  let logits = m.logits()
  assert_eq(logits.length(), forward_qwen_vocab)
  let mut max_rel = 0.0
  for i, want in forward_qwen_logits {
    let got = logits[i].to_double()
    let diff = (got - want).abs()
    let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
    let rel = diff / scale
    if rel > max_rel {
      max_rel = rel
    }
    if rel > 1.0e-5 {
      fail("logit \{i}: got \{got}, expected \{want} (relative error \{rel})")
    }
  }
  if max_rel > 1.0e-5 {
    fail("max relative logit error \{max_rel} exceeds 1e-5")
  }
}

///|
test "qwen2 fixture decode step continues the prefill" {
  // A split prefill/decode run must land on the same logits: with biases in
  // play, a mistake in when they are applied (before vs after RoPE) shows up
  // differently for cached and fresh positions only if the cache is mishandled.
  let f = @gguf.parse(forward_qwen_gguf).unwrap()
  let m = Model::load(f).unwrap()
  let n = forward_qwen_tokens.length()
  for pos = 0; pos < n - 1; pos = pos + 1 {
    m.forward(forward_qwen_tokens[pos], pos).unwrap()
    m.cache.len = pos + 1
  }
  m.forward(forward_qwen_tokens[n - 1], n - 1).unwrap()
  m.cache.len = n
  let logits = m.logits()
  for i, want in forward_qwen_logits {
    let got = logits[i].to_double()
    let diff = (got - want).abs()
    let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
    if diff / scale > 1.0e-5 {
      fail("split prefill/decode logit \{i}: got \{got}, expected \{want}")
    }
  }
}

///|
test "a bias-free llama model still loads with no biases" {
  // The optional-bias path must leave llama files untouched: no tensors, no
  // bias vectors, and the existing NORMAL fixture still matches its reference
  // (forward_test.mbt). This checks the representation directly.
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  for lw in m.layers {
    assert_true(lw.bq is None)
    assert_true(lw.bk is None)
    assert_true(lw.bv is None)
  }
}

// End-to-end forward-pass test against a numpy reference.
//
// The fixture is a complete 2-layer GQA transformer written as a real GGUF
// file, so this exercises the whole path: metadata parsing, weight loading,
// matvec, RMSNorm, RoPE, attention with KV cache, SwiGLU, and the tied LM head.
// Getting here requires every one of those to agree with an independent
// implementation, which is why a single mismatch would be visible.

///|
test "forward pass matches the numpy reference" {
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  // Verify the config came from the file, not from defaults.
  assert_eq(m.config.architecture, "llama")
  assert_eq(m.config.n_layer, 2)
  assert_eq(m.config.n_embd, 64)
  assert_eq(m.config.n_head, 4)
  assert_eq(m.config.n_head_kv, 2)
  assert_eq(m.config.head_dim, 16)
  assert_eq(m.config.n_rot, 16)
  assert_eq(m.config.vocab_size, 128)
  assert_true(m.config.tied_lm_head)
  // Prefill the prompt, one token per position.
  for pos, tok in forward_test_tokens {
    m.forward(tok, pos).unwrap()
    m.cache.len = pos + 1
  }
  let logits = m.logits()
  assert_eq(logits.length(), forward_test_vocab)
  let mut max_rel = 0.0
  for i, want in forward_test_logits {
    let got = logits[i].to_double()
    let diff = (got - want).abs()
    let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
    let rel = diff / scale
    if rel > max_rel {
      max_rel = rel
    }
    if rel > 1.0e-4 {
      fail("logit \{i}: got \{got}, expected \{want} (relative error \{rel})")
    }
  }
  // A tolerance loose enough for float32 accumulation but far tighter than the
  // gaps between logits, so a rotated-by-one-pair or misgrouped-head bug could
  // not slip through.
  if max_rel > 1.0e-4 {
    fail("max relative logit error \{max_rel} exceeds 1e-4")
  }
}

///|
test "forward pass is deterministic and cache length is honoured" {
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  for pos, tok in forward_test_tokens {
    m.forward(tok, pos).unwrap()
    m.cache.len = pos + 1
  }
  let first = Array::from_fixed_array(m.logits())
  // Re-running the same prompt from a reset cache must give identical logits.
  m.cache.reset()
  for pos, tok in forward_test_tokens {
    m.forward(tok, pos).unwrap()
    m.cache.len = pos + 1
  }
  let second = Array::from_fixed_array(m.logits())
  for i, a in first {
    if a != second[i] {
      fail("logit \{i} differs between runs: \{a} vs \{second[i]}")
    }
  }
}

///|
test "a decode step after the prefill continues the same sequence" {
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  // Prefill all but the last prompt token.
  let n = forward_test_tokens.length()
  for pos = 0; pos < n - 1; pos = pos + 1 {
    m.forward(forward_test_tokens[pos], pos).unwrap()
    m.cache.len = pos + 1
  }
  // Then decode the last token as a single step.
  m.forward(forward_test_tokens[n - 1], n - 1).unwrap()
  m.cache.len = n
  let logits = m.logits()
  for i, want in forward_test_logits {
    let got = logits[i].to_double()
    let diff = (got - want).abs()
    let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
    if diff / scale > 1.0e-4 {
      fail("split prefill/decode logit \{i}: got \{got}, expected \{want}")
    }
  }
}

///|
test "positions past the context length are rejected" {
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  match m.forward(0, m.cache.max_len) {
    Ok(_) => fail("a position beyond the cache must be rejected")
    Err(ContextOverflow(pos~, max_len~)) => {
      assert_eq(pos, m.cache.max_len)
      assert_eq(max_len, 64)
    }
    Err(e) => fail("expected ContextOverflow, got \{e.message()}")
  }
}

///|
test "out-of-vocabulary tokens are rejected" {
  let f = @gguf.parse(forward_test_gguf).unwrap()
  let m = Model::load(f).unwrap()
  match m.forward(forward_test_vocab, 0) {
    Ok(_) => fail("a token beyond the vocabulary must be rejected")
    Err(_) => ()
  }
}

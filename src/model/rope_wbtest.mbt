// Hand-written RoPE tests: pairing and configuration.
//
// These are deliberately not generated. The generated forward fixture covers
// the NORMAL layout end-to-end; these pin down the two pairings numerically
// and prove the GGUF metadata path selects the right one.

///|
fn rope_fixture(rope_type : RopeType, n_rot : Int) -> FixedArray[Float] {
  let x : FixedArray[Float] = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]
  rope_in_place(x, 0, 1, 8, n_rot, 10000.0, rope_type)
  x
}

///|
fn assert_close(got : Float, want : Double, what : String) -> Unit raise {
  let diff = (got.to_double() - want).abs()
  let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
  if diff / scale > 1.0e-6 {
    fail("\{what}: got \{got.to_double()}, expected \{want}")
  }
}

///|
test "NORMAL rotates adjacent pairs at pos 1" {
  // head_dim 8, n_rot 8, theta 10000, pos 1. Pair i uses
  // theta^(-2i/8): angles 1, 0.1, 0.01, 0.001.
  let x = rope_fixture(NORMAL, 8)
  assert_close(x[0], -1.1426396637476532, "x[0]")
  assert_close(x[1], 1.9220755965441760, "x[1]")
  assert_close(x[2], 2.5856788292467650, "x[2]")
  assert_close(x[3], 4.2795169110525880, "x[3]")
}

///|
test "NEOX rotates half-split pairs at pos 1" {
  // Same angles, but pair i is (x[i], x[i + 4]): (1,5) by 1, (2,6) by 0.1,
  // (3,7) by 0.01, (4,8) by 0.001. The first four outputs live in slots 0..3.
  let x = rope_fixture(NEOX, 8)
  assert_close(x[0], -3.6670526181713430, "x[0]")
  assert_close(x[1], 1.3910078306750827, "x[1]")
  assert_close(x[2], 2.9298511679108294, "x[2]")
  assert_close(x[3], 3.9919980013335000, "x[3]")
  // Second halves of the pairs, to catch a variant that rotates both halves
  // but forgets to write the partner.
  assert_close(x[4], 3.5429825141485955, "x[4]")
  assert_close(x[5], 6.1696918249618110, "x[5]")
  assert_close(x[6], 7.0296495029191570, "x[6]")
  assert_close(x[7], 8.0039959993336660, "x[7]")
}

///|
test "NORMAL leaves dimensions past n_rot untouched" {
  // n_rot 4 rotates pairs (1,2) and (3,4); slots 4..7 keep their raw values.
  let x = rope_fixture(NORMAL, 4)
  assert_close(x[0], 0.5403023058681398 - 2.0 * 0.8414709848078965, "x[0]")
  assert_close(x[1], 0.8414709848078965 + 2.0 * 0.5403023058681398, "x[1]")
  assert_close(x[2], 3.0 * 0.9950041652780258 - 4.0 * 0.09983341664682815, "x[2]")
  assert_close(x[3], 3.0 * 0.09983341664682815 + 4.0 * 0.9950041652780258, "x[3]")
  assert_eq(x[4], 5.0)
  assert_eq(x[5], 6.0)
  assert_eq(x[6], 7.0)
  assert_eq(x[7], 8.0)
}

///|
test "NEOX leaves dimensions past n_rot untouched" {
  // n_rot 4 pairs (x[0],x[2]) and (x[1],x[3]); slots 4..7 must stay put. A
  // half-split implementation that used head_dim/2 instead of n_rot/2 would
  // write slots 4 and 5 here.
  let x = rope_fixture(NEOX, 4)
  assert_close(x[0], 0.5403023058681398 - 3.0 * 0.8414709848078965, "x[0]")
  assert_close(x[2], 0.8414709848078965 + 3.0 * 0.5403023058681398, "x[2]")
  assert_close(x[1], 2.0 * 0.9950041652780258 - 4.0 * 0.09983341664682815, "x[1]")
  assert_close(x[3], 2.0 * 0.09983341664682815 + 4.0 * 0.9950041652780258, "x[3]")
  assert_eq(x[4], 5.0)
  assert_eq(x[5], 6.0)
  assert_eq(x[6], 7.0)
  assert_eq(x[7], 8.0)
}

///|
test "NORMAL and NEOX differ once the head is wider than one pair" {
  let normal = rope_fixture(NORMAL, 8)
  let neox = rope_fixture(NEOX, 8)
  assert_true(normal[0] != neox[0])
  assert_true(normal[1] != neox[1])
}

// --- config metadata handling ------------------------------------------------

///|
/// A minimal GGUF metadata/tensor map sufficient for `ModelConfig::from_gguf`.
/// No payload bytes are needed: the config path only reads the tensor
/// directory, so an empty buffer is fine.
fn config_gguf(
  extra : Array[(String, @gguf.MetaValue)],
) -> @gguf.GgufFile {
  let metadata : Array[(String, @gguf.MetaValue)] = [
    ("general.architecture", @gguf.Str("qwen2")),
    ("qwen2.embedding_length", @gguf.U32(8U)),
    ("qwen2.block_count", @gguf.U32(2U)),
    ("qwen2.feed_forward_length", @gguf.U32(16U)),
    ("qwen2.attention.head_count", @gguf.U32(2U)),
  ]
  for kv in extra {
    metadata.push(kv)
  }
  let embd : @gguf.TensorInfo = {
    name: "token_embd.weight",
    dims: [8UL, 16UL],
    type_id: 0U,
    offset: 0UL,
    n_elems: 128L,
    nbytes: Some(512L),
  }
  {
    version: 3U,
    alignment: 32U,
    tensors: [embd],
    metadata,
    data_start: 0L,
    buf: b"",
  }
}

///|
/// The same minimal config as `config_gguf`, but for a llama-architecture file.
fn config_gguf_llama(
  extra : Array[(String, @gguf.MetaValue)],
) -> @gguf.GgufFile {
  let metadata : Array[(String, @gguf.MetaValue)] = [
    ("general.architecture", @gguf.Str("llama")),
    ("llama.embedding_length", @gguf.U32(8U)),
    ("llama.block_count", @gguf.U32(2U)),
    ("llama.feed_forward_length", @gguf.U32(16U)),
    ("llama.attention.head_count", @gguf.U32(2U)),
  ]
  for kv in extra {
    metadata.push(kv)
  }
  let embd : @gguf.TensorInfo = {
    name: "token_embd.weight",
    dims: [8UL, 16UL],
    type_id: 0U,
    offset: 0UL,
    n_elems: 128L,
    nbytes: Some(512L),
  }
  {
    version: 3U,
    alignment: 32U,
    tensors: [embd],
    metadata,
    data_start: 0L,
    buf: b"",
  }
}

///|
test "missing RoPE metadata follows the architecture, as llama.cpp does" {
  // llama.cpp's `llama_model_rope_type` maps qwen2 to NEOX and the llama
  // family to NORMAL; a converter that emits no variant key must still get
  // the architecture's own pairing. The real Qwen2.5-0.5B GGUF has no
  // `qwen2.rope.*.type` key at all, so this is the path that runs in practice.
  let qwen = ModelConfig::from_gguf(config_gguf([])).unwrap()
  assert_eq(qwen.rope_type, NEOX)
  // llama files are unchanged: no key, NORMAL.
  let llama = ModelConfig::from_gguf(config_gguf_llama([])).unwrap()
  assert_eq(llama.rope_type, NORMAL)
}

///|
test "Qwen2 per-layer neox key selects NEOX" {
  // Qwen2 converters write the key under every layer index.
  let cfg = ModelConfig::from_gguf(
    config_gguf([
      ("qwen2.rope.0.type", @gguf.Str("neox")),
      ("qwen2.rope.1.type", @gguf.Str("neox")),
    ]),
  ).unwrap()
  assert_eq(cfg.rope_type, NEOX)
  // A single layer entry is enough; absent entries do not imply NORMAL.
  let one = ModelConfig::from_gguf(
    config_gguf([("qwen2.rope.1.type", @gguf.Str("neox"))]),
  ).unwrap()
  assert_eq(one.rope_type, NEOX)
}

///|
test "layers that disagree on the RoPE variant are rejected" {
  match ModelConfig::from_gguf(
    config_gguf([
      ("qwen2.rope.0.type", @gguf.Str("normal")),
      ("qwen2.rope.1.type", @gguf.Str("neox")),
    ]),
  ) {
    Ok(_) => fail("expected BadValue for disagreeing per-layer RoPE variants")
    Err(BadValue(key~, detail~)) => {
      assert_eq(key, "qwen2.rope.1.type")
      assert_true(detail.contains("qwen2.rope.0.type"))
    }
    Err(e) => fail("expected BadValue, got \{e.message()}")
  }
}

///|
test "shared rope.type key is honoured" {
  let cfg = ModelConfig::from_gguf(
    config_gguf([("qwen2.rope.type", @gguf.Str("neox"))]),
  ).unwrap()
  assert_eq(cfg.rope_type, NEOX)
  let normal = ModelConfig::from_gguf(
    config_gguf([("qwen2.rope.type", @gguf.Str("normal"))]),
  ).unwrap()
  assert_eq(normal.rope_type, NORMAL)
}

///|
test "per-layer key wins over the shared key" {
  let cfg = ModelConfig::from_gguf(
    config_gguf([
      ("qwen2.rope.type", @gguf.Str("normal")),
      ("qwen2.rope.1.type", @gguf.Str("neox")),
    ]),
  ).unwrap()
  assert_eq(cfg.rope_type, NEOX)
}

///|
test "an unknown RoPE variant is rejected, not silently defaulted" {
  match ModelConfig::from_gguf(
    config_gguf([("qwen2.rope.1.type", @gguf.Str("yarn"))]),
  ) {
    Ok(_) => fail("expected BadValue for an unknown RoPE variant, but the config loaded")
    Err(BadValue(key~, detail~)) => {
      assert_eq(key, "qwen2.rope.1.type")
      assert_true(detail.contains("yarn"))
    }
    Err(e) => fail("expected BadValue, got \{e.message()}")
  }
}

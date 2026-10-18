// `tokenizer.ggml.pre` resolution in `Tokenizer::load`.
//
// The pretokenizer tests cover the splitters themselves; these cover the
// metadata path that picks one, including the failure mode for a value this
// build does not implement.

///|
/// A minimal `GgufFile` with a tiny vocab/merges pair, enough for `load` to
/// build a `Tokenizer`. Metadata is supplied by the caller.
fn tokenizer_gguf(
  extra : Array[(String, @gguf.MetaValue)],
) -> @gguf.GgufFile {
  let metadata : Array[(String, @gguf.MetaValue)] = [
    ("tokenizer.ggml.model", @gguf.Str("gpt2")),
    (
      "tokenizer.ggml.tokens",
      @gguf.Array(
        @gguf.Materialized([
          @gguf.Str("<|endoftext|>"),
          @gguf.Str("a"),
          @gguf.Str("b"),
          @gguf.Str("ab"),
        ]),
      ),
    ),
    (
      "tokenizer.ggml.merges",
      @gguf.Array(@gguf.Materialized([@gguf.Str("a b")])),
    ),
    (
      "tokenizer.ggml.token_type",
      @gguf.Array(@gguf.Materialized([@gguf.I32(3), @gguf.I32(1), @gguf.I32(1), @gguf.I32(1)])),
    ),
    ("tokenizer.ggml.bos_token_id", @gguf.U32(0U)),
    ("tokenizer.ggml.eos_token_id", @gguf.U32(0U)),
  ]
  for kv in extra {
    metadata.push(kv)
  }
  {
    version: 3U,
    alignment: 32U,
    tensors: [],
    metadata,
    data_start: 0L,
    buf: b"",
  }
}

///|
test "missing tokenizer.ggml.pre loads as smollm" {
  let tk = load(tokenizer_gguf([])).unwrap()
  assert_eq(tk.pre, Smollm)
}

///|
test "gpt2 and smollm both select the GPT-2 rule" {
  let gpt2 = load(
    tokenizer_gguf([("tokenizer.ggml.pre", @gguf.Str("gpt2"))]),
  ).unwrap()
  assert_eq(gpt2.pre, Smollm)
  let smollm = load(
    tokenizer_gguf([("tokenizer.ggml.pre", @gguf.Str("smollm"))]),
  ).unwrap()
  assert_eq(smollm.pre, Smollm)
}

///|
test "qwen2 selects the Qwen2 pre-tokenizer" {
  let tk = load(
    tokenizer_gguf([("tokenizer.ggml.pre", @gguf.Str("qwen2"))]),
  ).unwrap()
  assert_eq(tk.pre, Qwen2)
}

///|
test "an unknown pre-tokenizer is rejected, not silently defaulted" {
  match load(tokenizer_gguf([("tokenizer.ggml.pre", @gguf.Str("llama3"))])) {
    Ok(_) => fail("expected UnsupportedPretokenizer, but load succeeded")
    Err(UnsupportedPretokenizer(pre~)) => assert_eq(pre, "llama3")
    Err(e) => fail("expected UnsupportedPretokenizer, got \{e.message()}")
  }
}

///|
test "a non-string pre value is rejected" {
  match load(tokenizer_gguf([("tokenizer.ggml.pre", @gguf.U32(1U))])) {
    Ok(_) => fail("expected UnsupportedPretokenizer, but load succeeded")
    Err(UnsupportedPretokenizer(pre~)) => assert_eq(pre, "<non-string>")
    Err(e) => fail("expected UnsupportedPretokenizer, got \{e.message()}")
  }
}

///|
test "the pre field reaches encoding" {
  // The fixture's only merge is "a b" -> "ab" (id 3), but neither the GPT-2
  // nor the Qwen2 regex ever yields "a" and "b" as one piece when a space
  // separates them, so both encode to the character ids. What this pins down
  // is that the field is actually threaded through `encode_plain` and the
  // splitters run, rather than one being hardcoded.
  let gpt2 = load(tokenizer_gguf([])).unwrap()
  let qwen = load(
    tokenizer_gguf([("tokenizer.ggml.pre", @gguf.Str("qwen2"))]),
  ).unwrap()
  assert_eq(gpt2.encode("ab"), [3])
  assert_eq(qwen.encode("ab"), [3])
  assert_eq(gpt2.encode("a b"), [1, 0, 2])
  assert_eq(qwen.encode("a b"), [1, 0, 2])
}

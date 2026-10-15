// Tokenizer golden tests against the real SmolLM2 vocabulary.
//
// The fixture in gen_golden_test.mbt carries the full 49k-entry vocab and
// 48.9k merges, plus 31 corpus strings with their exact token ids from
// HuggingFace's reference `tokenizers` implementation. A MoonBit-side
// round-trip (encode -> decode == input) is asserted for every case, and the
// special-token scan is exercised through inputs containing <|im_start|> etc.
//
// Build the Tokenizer exactly the way the engine will: parse the fixture bytes
// as a GGUF? No — the fixture emits vocab/merges arrays directly, so a small
// constructor mirrors Tokenizer::load without GGUF. That keeps the test honest
// about the BPE logic (same code path) while avoiding a 1.4MB embedded GGUF.

///|
/// Truncate a string for display, clamping to its actual length.
fn truncate(s : String, limit : Int) -> String {
  // Walks characters rather than slicing: a String view indexed at a
  // code-point position inside a surrogate pair aborts the native runtime
  // (observed on moon 0.1.20260819), and the test inputs contain emoji.
  let sb = StringBuilder::new()
  let mut n = 0
  for ch in s {
    if n >= limit {
      break
    }
    sb.write_char(ch)
    n = n + 1
  }
  sb.to_string()
}

///|
/// Build a Tokenizer from the fixture arrays (same construction as
/// `Tokenizer::load` minus GGUF extraction).
///|
test "fixture vocab size matches" {
  inspect(golden_vocab.length(), content="\{golden_vocab_size}")
}

///|
fn golden_tokenizer() -> Tokenizer {
  let token_ids : Map[String, Int] = Map([])
  for i, t in golden_vocab {
    token_ids[t] = i
  }
  let specials : Array[(String, Int)] = []
  // Control tokens: the 17 leading <|...|> entries, matching the real model.
  for i = 0; i < 17; i = i + 1 {
    specials.push((golden_vocab[i], i))
  }
  {
    vocab: golden_vocab,
    token_ids,
    specials,
    merges: MergeTable::new(golden_merges),
    ids: { bos: golden_bos, eos: golden_eos, unk: 0, pad: golden_eos },
    add_bos: false,
    add_eos: false,
  }
}

///|
test "golden encode matches reference ids" {
  let tk = golden_tokenizer()
  let mut off = 0
  for i, text in golden_inputs {
    let want_len = golden_ids_lengths[i]
    let got = tk.encode(text)
    if got.length() != want_len {
      fail("input \{i} (\{truncate(text, 20)}...): length \{got.length()} != \{want_len}")
    }
    for j = 0; j < want_len; j = j + 1 {
      let want = golden_ids_flat[off + j]
      if got[j] != want {
        fail("input \{i} (\{truncate(text, 20)}...): token[\{j}] = \{got[j]}, expected \{want}")
      }
    }
    off = off + want_len
  }
}

///|
test "golden encode-decode round-trips exactly" {
  let tk = golden_tokenizer()
  for i, text in golden_inputs {
    let ids = tk.encode(text)
    let decoded = tk.decode(ids)
    if decoded != text {
      fail("input \{i}: round-trip mismatch\n  input:   \{truncate(text, 60)}\n  decoded: \{truncate(decoded, 60)}")
    }
  }
}

///|
test "special tokens encode to single ids" {
  let tk = golden_tokenizer()
  // First 17 vocab entries are control tokens.
  for i = 0; i < 17; i = i + 1 {
    let text = golden_vocab[i]
    let ids = tk.encode(text)
    if ids.length() != 1 || ids[0] != i {
      fail("special token \{text} encoded to \{ids.length()} ids, first \{ids.get(0).unwrap_or(-1)}, expected [\{i}]")
    }
  }
}

///|
test "specials embedded in text split correctly" {
  let tk = golden_tokenizer()
  // "Hello<|im_end|>world" -> hello tokens, one im_end id, world tokens.
  let ids = tk.encode("Hello<|im_end|>world")
  let contains = ids.contains(golden_eos)
  assert_true(contains)
  // The whole string must decode back exactly.
  assert_eq(tk.decode(ids), "Hello<|im_end|>world")
}

///|
test "byte encoder is a bijection over 0..255" {
  for b = 0; b < 256; b = b + 1 {
    let cp = byte_to_codepoint(b)
    if codepoint_to_byte(cp) != b {
      fail("byte \{b} -> cp \{cp} -> byte \{codepoint_to_byte(cp)}")
    }
  }
}

///|
test "gpt2 string encoding preserves byte count" {
  let samples : Array[String] = [
    "hello world",
    "你好，世界",
    "\u{1}\u{2} control",
    "emoji 🎉 bytes",
    "",
  ]
  for s in samples {
    let bytes = @utf8.encode(s[:])
    let encoded = bytes_to_gpt2_string(bytes)
    inspect(encoded.length(), content="\{bytes.length()}")
  }
}

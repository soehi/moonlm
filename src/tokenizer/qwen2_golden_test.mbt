// Qwen2 tokenizer tests against the real Qwen2.5-0.5B vocabulary.
//
// The fixture in gen_qwen2_test.mbt carries the full 151936-entry vocab,
// 151387 merges, and 44 corpus inputs with their exact reference ids. The
// reference tokenizer was reconstructed from the same GGUF (vocab, merges,
// `tokenizer.ggml.pre = "qwen2"`) plus transformers' `PRETOKENIZE_REGEX`, and
// every reference encoding was asserted to round-trip before being written.
//
// Kept in its own file so the SmolLM2 fixture's ids and expectations do not
// move when Qwen2 cases are added or removed.

///|
fn qwen2_tokenizer() -> Tokenizer {
  let vocab = qwen2_vocab()
  let token_ids : Map[String, Int] = Map([])
  for i, t in vocab {
    token_ids[t] = i
  }
  let specials : Array[(String, Int)] = []
  for i in qwen2_control_ids {
    specials.push((vocab[i], i))
  }
  {
    vocab,
    token_ids,
    specials,
    merges: MergeTable::new(qwen2_merges()),
    pre: Qwen2,
    ids: { bos: qwen2_bos, eos: qwen2_eos, unk: qwen2_eos, pad: qwen2_eos },
    add_bos: false,
    add_eos: false,
  }
}

///|
test "qwen2 fixture vocab size matches" {
  inspect(qwen2_vocab().length(), content="\{qwen2_vocab_size}")
}

///|
test "qwen2 encode matches reference ids" {
  let tk = qwen2_tokenizer()
  let mut off = 0
  for i, text in qwen2_inputs() {
    let want_len = qwen2_ids_lengths()[i]
    let got = tk.encode(text)
    if got.length() != want_len {
      fail("qwen2 input \{i} (\{truncate(text, 20)}...): length \{got.length()} != \{want_len}")
    }
    for j = 0; j < want_len; j = j + 1 {
      let want = qwen2_ids_flat()[off + j]
      if got[j] != want {
        fail("qwen2 input \{i} (\{truncate(text, 20)}...): token[\{j}] = \{got[j]}, expected \{want}")
      }
    }
    off = off + want_len
  }
}

///|
test "qwen2 encode-decode round-trips exactly" {
  let tk = qwen2_tokenizer()
  for i, text in qwen2_inputs() {
    let ids = tk.encode(text)
    let decoded = tk.decode(ids)
    if decoded != text {
      fail("qwen2 input \{i}: round-trip mismatch\n  input:   \{truncate(text, 60)}\n  decoded: \{truncate(decoded, 60)}")
    }
  }
}

///|
test "qwen2 control tokens encode to single ids" {
  let tk = qwen2_tokenizer()
  let vocab = qwen2_vocab()
  for id in qwen2_control_ids {
    let text = vocab[id]
    let ids = tk.encode(text)
    if ids.length() != 1 || ids[0] != id {
      fail("qwen2 control token \{text} encoded to \{ids.length()} ids, first \{ids.get(0).unwrap_or(-1)}, expected [\{id}]")
    }
  }
}

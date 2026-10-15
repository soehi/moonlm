// The GPT-2-style byte-level BPE tokenizer for GGUF models.
//
// Loading consumes a `GgufFile` parsed with `parse_materializing_metadata`
// (the vocabulary arrays are tens of thousands of entries and are folded into
// summaries by the default parse). Encoding runs the SmolLM2 pre-tokenizer and
// then BPE per piece; decoding reverses byte-encodes and concatenates.
//
// Special tokens (CONTROL type in `tokenizer.ggml.token_type`) are matched by
// exact string scan before BPE, so `<|im_start|>` in the input encodes to one
// id instead of being split into characters.

///|
/// Special-token id slots a model can reference.
pub(all) struct SpecialIds {
  bos : Int
  eos : Int
  unk : Int
  pad : Int
} derive(Debug, Eq)

///|
/// A loaded GPT-2 BPE tokenizer.
pub(all) struct Tokenizer {
  vocab : Array[String]
  /// token string -> id, for the final BPE lookup.
  token_ids : Map[String, Int]
  /// Special-token strings mapped to ids, scanned before BPE.
  specials : Array[(String, Int)]
  merges : MergeTable
  ids : SpecialIds
  add_bos : Bool
  add_eos : Bool
} derive(Debug)

///|
/// Tokenizer construction and load errors.
pub(all) suberror TokenizerError {
  /// `tokenizer.ggml.model` was present but not a supported value.
  UnsupportedModel(model~ : String)
  /// A required GGUF metadata key was missing.
  MissingKey(key~ : String)
  /// A key was present with an unexpected value type.
  WrongType(key~ : String, expected~ : String)
  /// The tokens array is empty.
  EmptyVocab
  /// A vocab entry is empty, which would make decode ambiguous.
  EmptyToken(index~ : Int)
  /// The merges array references tokens absent from the vocab.
  MergeNotInVocab(index~ : Int, token~ : String)
} derive(Eq, Debug)

///|
fn tk_err_string(e : TokenizerError) -> String {
  match e {
    UnsupportedModel(model~) => "unsupported tokenizer.ggml.model \"\{model}\" (this build implements gpt2)"
    MissingKey(key~) => "missing GGUF metadata key \"\{key}\""
    WrongType(key~, expected~) => "metadata key \"\{key}\" has an unexpected type, expected \{expected}"
    EmptyVocab => "tokenizer.ggml.tokens is empty"
    EmptyToken(index~) => "tokenizer.ggml.tokens[\{index}] is empty"
    MergeNotInVocab(index~, token~) => "merges[\{index}] references token \"\{token}\" not present in the vocab"
  }
}

///|
pub impl Show for TokenizerError with fn to_string(self : TokenizerError) {
  tk_err_string(self)
}

///|
/// Extract a string metadata value or fail with a named error.
fn get_string(f : @gguf.GgufFile, key : String) -> Result[String, TokenizerError] {
  match f.get_string(key) {
    Some(s) => Ok(s)
    None => Err(MissingKey(key=key))
  }
}

///|
/// Extract an optional integer metadata value, with a default.
fn get_int_or(f : @gguf.GgufFile, key : String, default : Int) -> Int {
  match f.get_int(key) {
    Some(v) => v.to_int()
    None => default
  }
}

///|
/// Extract a materialized string-array metadata value.
fn get_string_array(
  f : @gguf.GgufFile,
  key : String,
) -> Result[Array[String], TokenizerError] {
  match f.get(key) {
    None => Err(MissingKey(key=key))
    Some(@gguf.Array(@gguf.Materialized(elems))) => {
      let out : Array[String] = []
      for e in elems {
        match e {
          @gguf.Str(s) => out.push(s)
          _ => return Err(WrongType(key=key, expected="string array"))
        }
      }
      Ok(out)
    }
    Some(_) => Err(WrongType(key=key, expected="string array (was the file parsed with parse_materializing_metadata?)"))
  }
}

///|
/// Load a tokenizer from a parsed GGUF file.
///
/// Requires `parse_materializing_metadata`: the default `parse` folds vocab-
/// sized arrays into summaries and this function reports that as a
/// `WrongType` error rather than silently producing a tokenizer that cannot
/// encode.
pub fn load(f : @gguf.GgufFile) -> Result[Tokenizer, TokenizerError] {
  let model = match get_string(f, "tokenizer.ggml.model") {
    Ok(m) => m
    Err(e) => return Err(e)
  }
  if model != "gpt2" {
    return Err(UnsupportedModel(model=model))
  }
  let vocab = match get_string_array(f, "tokenizer.ggml.tokens") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  let merges_raw = match get_string_array(f, "tokenizer.ggml.merges") {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  if vocab.length() == 0 {
    return Err(EmptyVocab)
  }
  let token_ids : Map[String, Int] = Map([])
  for i, t in vocab {
    token_ids[t] = i
  }
  let bos = get_int_or(f, "tokenizer.ggml.bos_token_id", -1)
  let eos = get_int_or(f, "tokenizer.ggml.eos_token_id", -1)
  let unk = get_int_or(f, "tokenizer.ggml.unknown_token_id", 0)
  let pad = get_int_or(f, "tokenizer.ggml.padding_token_id", eos)
  let add_bos = match f.get("tokenizer.ggml.add_bos_token") {
    Some(@gguf.Bool(b)) => b
    _ => false
  }
  let add_eos = match f.get("tokenizer.ggml.add_eos_token") {
    Some(@gguf.Bool(b)) => b
    _ => false
  }
  // Special tokens: every CONTROL-type entry in token_type. token_type is
  // optional in the format; without it, fall back to treating nothing as
  // special, which still round-trips plain text.
  let specials : Array[(String, Int)] = []
  match f.get("tokenizer.ggml.token_type") {
    Some(@gguf.Array(@gguf.Materialized(elems))) => {
      for i, e in elems {
        let is_control = match e {
          @gguf.I32(t) => t == 3
          _ => false
        }
        if is_control && i < vocab.length() {
          specials.push((vocab[i], i))
        }
      }
    }
    _ => ()
  }
  let merges = MergeTable::new(merges_raw)
  Ok({
    vocab,
    token_ids,
    specials,
    merges,
    ids: { bos, eos, unk, pad },
    add_bos,
    add_eos,
  })
}

///|
/// The tokenizer's special-token id slots.
pub fn Tokenizer::special_ids(self : Tokenizer) -> SpecialIds {
  self.ids
}

///|
/// Vocabulary size (= number of rows in the embedding table).
pub fn Tokenizer::vocab_size(self : Tokenizer) -> Int {
  self.vocab.length()
}

///|
/// Whether `id` is the EOS token.
pub fn Tokenizer::is_eos(self : Tokenizer, id : Int) -> Bool {
  id == self.ids.eos
}

///|
/// The token string for an id, if in range.
pub fn Tokenizer::token_text(self : Tokenizer, id : Int) -> String? {
  if id >= 0 && id < self.vocab.length() {
    Some(self.vocab[id])
  } else {
    None
  }
}

///|
/// Encode a raw UTF-8 string to token ids.
///
/// Special tokens present in the input are emitted as single ids; everything
/// else goes through pre-tokenization and BPE. Unknown pieces map to the
/// unknown id. `add_bos`/`add_eos` are honored per the GGUF metadata.
pub fn Tokenizer::encode(self : Tokenizer, text : String) -> Array[Int] {
  let out : Array[Int] = []
  // Scan for special tokens first: longest match at each position. Specials
  // are plain ASCII sequences like <|im_start|>, scanned on the raw text.
  let mut pos = 0
  let mut plain_start = 0
  let text_len = text.length()
  while pos < text_len {
    let mut matched = false
    for entry in self.specials {
      let (sp, sp_id) = entry
      if text[pos:].has_prefix(sp) {
        if pos > plain_start {
          self.encode_plain(text[plain_start:pos].to_owned(), out)
        }
        out.push(sp_id)
        pos = pos + sp.length()
        plain_start = pos
        matched = true
        break
      }
    }
    if !matched {
      // Advance by one character (not one code unit).
      pos = pos + char_advance(text, pos)
    }
  }
  if plain_start < text_len {
    self.encode_plain(text[plain_start:].to_owned(), out)
  }
  if self.add_bos && self.ids.bos >= 0 {
    out.insert(0, self.ids.bos)
  }
  if self.add_eos && self.ids.eos >= 0 {
    out.push(self.ids.eos)
  }
  out
}

///|
/// Encode one special-free span of text through pre-tokenizer + BPE.
fn Tokenizer::encode_plain(
  self : Tokenizer,
  span : String,
  out : Array[Int],
) -> Unit {
  // The reference pre-tokenizer splits the RAW text (Unicode classes apply to
  // real characters), then byte-encodes each piece. Splitting after byte
  // encoding is wrong: encoded stand-ins like U+00BD (byte 0xBD) are Unicode
  // numbers in their own right and would be split off, which the reference
  // never does.
  let pieces = pretokenize_text(span)
  for piece in pieces {
    let piece_bytes = @utf8.encode(piece[:])
    let encoded = bytes_to_gpt2_string(piece_bytes)
    for part in bpe_merge(self.merges, encoded) {
      match self.token_ids.get(part) {
        Some(id) => out.push(id)
        None => out.push(self.ids.unk)
      }
    }
  }
}

///|
/// Number of code units to advance to skip one character at `pos`.
fn char_advance(text : String, pos : Int) -> Int {
  // A char is 1 code unit unless it is a surrogate pair (astral plane), which
  // takes 2.
  let unit = text[pos].to_int()
  if unit >= 0xD800 && unit <= 0xDBFF && pos + 1 < text.length() {
    let next = text[pos + 1].to_int()
    if next >= 0xDC00 && next <= 0xDFFF {
      return 2
    }
  }
  1
}

///|
/// Decode token ids back to text.
///
/// Ids out of range decode as empty (and are skipped) rather than raising: a
/// sampled stream is occasionally mid-update and callers want best-effort text.
pub fn Tokenizer::decode(self : Tokenizer, tokens : Array[Int]) -> String {
  let mut bytes : FixedArray[Byte] = FixedArray::make(tokens.length() * 16 + 16, b'\x00')
  let mut n = 0
  for id in tokens {
    if id >= 0 && id < self.vocab.length() {
      let t = self.vocab[id]
      // Every token occupies at most one byte per character in its GPT-2 form.
      let cap = t.length() + 1
      let buf : FixedArray[Byte] = FixedArray::make(cap, b'\x00')
      let written = gpt2_string_to_bytes(t, buf)
      for k = 0; k < written; k = k + 1 {
        if n >= bytes.length() {
          // Grow: reallocation path for pathological sequences.
          let bigger : FixedArray[Byte] = FixedArray::make(bytes.length() * 2, b'\x00')
          for j = 0; j < n; j = j + 1 {
            bigger[j] = bytes[j]
          }
          bytes = bigger
        }
        bytes[n] = buf[k]
        n = n + 1
      }
    }
  }
  let out_bytes = Bytes::from_array(bytes[:n])
  @utf8.decode_lossy(out_bytes.view())
}

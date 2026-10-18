// Pre-tokenizers: split text into pieces the BPE merge stage treats
// independently.
//
// GGUF names the variant in `tokenizer.ggml.pre`. This build supports:
//
//   "smollm" (and "gpt2", which means the same thing here) — the GPT-2
//   ByteLevel regex with `Digits(individual_digits)` applied first:
//
//     's|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
//
//   "qwen2" — the Qwen2 regex from transformers' `tokenization_qwen2.py`
//   (`PRETOKENIZE_REGEX`), checked against HF `tokenizers` behaviour:
//
//     (?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}|
//       ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+
//
//   Note `\p{N}` here is a SINGLE number character (no `+`), so number runs
//   are split one character at a time — the same piece boundaries as SmolLM2's
//   `Digits(individual_digits)`, but reached without the Digits pre-tokenizer.
//
// MoonBit core has no regex engine, so this file implements each splitting as
// a hand-written scanner over codepoints, checking each alternative of the
// alternation in order at the current position. Order matters: contractions
// must win over the generic letter branch, and `\s+(?!\S)` (trailing
// whitespace) must win over the plain `\s+` fallback.
//
// The scan operates on raw Unicode text; each returned piece is later
// byte-encoded by the caller.

///|
/// Contractions `'s 't 're 've 'm 'll 'd, matched exactly as the regex
/// alternation's first branch — note these match without any leading space.
fn match_contractions(chars : Array[Char], i : Int, n : Int) -> Int? {
  if i >= n || chars[i] != '\'' {
    return None
  }
  if i + 1 < n {
    let c = chars[i + 1]
    if c == 's' || c == 't' || c == 'm' || c == 'd' {
      return Some(i + 2)
    }
    if i + 2 < n {
      let c2 = chars[i + 2]
      if (c == 'r' && c2 == 'e') || (c == 'v' && c2 == 'e') || (c == 'l' && c2 == 'l') {
        return Some(i + 3)
      }
    }
  }
  None
}

///|
/// The three "optional space + run of one class" branches:
/// ` ?\p{L}+`, then ` ?\p{N}+`, then ` ?[^\s\p{L}\p{N}]+`.
///
/// The SmolLM2 scanner runs this per digit-free chunk (see
/// `pretokenize_smollm`), so `\p{N}` never reaches the class test; the branch is
/// kept so the function matches the regex on its own terms.
fn match_leading_space_class(chars : Array[Char], i : Int, n : Int) -> Int? {
  let mut j = i
  if chars[j] == ' ' {
    j = j + 1
    if j >= n {
      // A lone trailing space belongs to the whitespace branches.
      return None
    }
  }
  let c = chars[j].to_int()
  if is_unicode_space(c) {
    return None // space then space: whitespace branches handle it
  }
  // Determine which of the three runs applies from the first character.
  let class_of = if is_unicode_letter(c) {
    0 // letters
  } else if is_unicode_number(c) {
    1 // numbers
  } else {
    2 // other
  }
  j = j + 1
  if class_of == 1 {
    // A single digit, no run.
    return Some(j)
  }
  while j < n {
    let c2 = chars[j].to_int()
    let same = if class_of == 0 {
      is_unicode_letter(c2)
    } else {
      !is_unicode_space(c2) && !is_unicode_letter(c2) && !is_unicode_number(c2)
    }
    if !same {
      break
    }
    j = j + 1
  }
  Some(j)
}

///|
/// `\s+(?!\S)` (trailing whitespace, or all but the last space of a run before
/// a word) followed by plain `\s+`.
///
/// The regex tries `\s+(?!\S)` first: a run whose last char is followed by a
/// non-space must give that char's preceding space to the next piece (it
/// becomes the ` ?` prefix), so the run matches only up to there. A run that
/// extends to end-of-input matches whole. If the whole run is a single space
/// followed by non-space, both whitespace branches fail and the ` ?` prefix of
/// the class branches picks it up (already attempted above).
fn match_whitespace(chars : Array[Char], i : Int, n : Int) -> Int? {
  if !is_unicode_space(chars[i].to_int()) {
    return None
  }
  let mut j = i
  while j < n && is_unicode_space(chars[j].to_int()) {
    j = j + 1
  }
  if j < n {
    // Run is followed by non-space. `\s+(?!\S)` can only match if it gives up
    // its final char's position, i.e. ends one short; a single-space run
    // therefore cannot match here (j - i == 1 -> empty match -> reject).
    if j - i > 1 {
      return Some(j - 1)
    }
    return None
  }
  Some(j)
}

///|
/// Join `chars[start..end)` into a String.
fn chars_to_string(chars : Array[Char], start : Int, end : Int) -> String {
  let sb = StringBuilder::new()
  for k = start; k < end; k = k + 1 {
    sb.write_char(chars[k])
  }
  sb.to_string()
}

///|
/// Which pre-tokenizer a model uses, resolved from `tokenizer.ggml.pre`.
pub(all) enum Pretokenizer {
  /// The SmolLM2 / GPT-2 rule: optional leading space, letter runs, and
  /// `Digits(individual_digits)`.
  Smollm
  /// The Qwen2 rule: GPT-2-like, but with its own alternation (no Digits
  /// pre-tokenizer, `\p{N}` is a single character, contractions are
  /// case-insensitive).
  Qwen2
} derive(Eq, Debug)

///|
/// Split raw text with the selected pre-tokenizer.
pub fn pretokenize(pre : Pretokenizer, text : String) -> Array[String] {
  match pre {
    Smollm => pretokenize_smollm(text)
    Qwen2 => pretokenize_qwen2(text)
  }
}

///|
/// Split raw (non-byte-encoded) text into pre-tokenizer pieces.
///
/// The GPT-2 regex operates on raw Unicode characters; each returned piece is
/// a substring of `text` cut on character boundaries, later byte-encoded
/// separately by the caller. `Digits(individual_digits)` splits number runs
/// into single characters.
///
/// Kept as the public SmolLM2 entry point so existing callers and tests do not
/// change; `pretokenize` is the variant-aware entry.
pub fn pretokenize_text(text : String) -> Array[String] {
  pretokenize_smollm(text)
}

///|
/// The SmolLM2 pre-tokenizer: `Digits(individual_digits)` followed by the
/// GPT-2 ByteLevel regex.
///
/// The two stages are separate, as they are in HuggingFace's pipeline: every
/// digit becomes its own chunk first, and only then is the regex applied to
/// each chunk. Folding the digit split into the regex's `\p{N}` branch gives
/// the wrong boundaries for `" 1"` — HF yields `" "` and `"1"`, because the
/// digit is already isolated when the regex runs, while a folded scanner would
/// produce `" 1"`. The token ids often coincide (a vocab without `Ġ1` merges
/// `Ġ` + `1` back), which is exactly why the split-stage boundary has to be
/// modelled rather than inferred from ids.
pub fn pretokenize_smollm(text : String) -> Array[String] {
  let chars = text.to_array()
  let n = chars.length()
  let pieces : Array[String] = []
  // Stage 1: `Digits(individual_digits)` cuts the text into chunks, one digit
  // per chunk and everything else in between. Chunks are scanned independently
  // in stage 2, which matters for lookahead branches: `\s+(?!\S)` at the end of
  // a chunk cannot see the following digit, so "\n\xa0" before "1" is one
  // whitespace chunk with the NBSP kept, not "\n" plus a separate NBSP.
  let mut chunk_start = 0
  let mut i = 0
  let flush = fn(chars : Array[Char], start : Int, end : Int, pieces : Array[String]) {
    if end > start {
      match_whitespace_chunk(chars, start, end, pieces)
    }
  }
  while i < n {
    if is_unicode_number(chars[i].to_int()) {
      flush(chars, chunk_start, i, pieces)
      pieces.push(chars_to_string(chars, i, i + 1))
      i = i + 1
      chunk_start = i
    } else {
      i = i + 1
    }
  }
  flush(chars, chunk_start, n, pieces)
  pieces
}

///|
/// Apply the GPT-2 ByteLevel regex to one digit-free chunk `[start, end)`.
///
/// The chunk is scanned as its own string, so end-of-chunk behaves like
/// end-of-input for the `\s+(?!\S)` lookahead.
fn match_whitespace_chunk(
  chars : Array[Char],
  start : Int,
  end : Int,
  pieces : Array[String],
) -> Unit {
  let n = end
  let mut i = start
  while i < n {
    let piece_start = i
    let next = match match_contractions(chars, i, n) {
      Some(j) => Some(j)
      None =>
        match match_leading_space_class(chars, i, n) {
          Some(j) => Some(j)
          None => match_whitespace(chars, i, n)
        }
    }
    match next {
      Some(j) => i = j
      None => i = i + 1 // unreachable over the full alphabet; loop guard
    }
    if i > piece_start {
      pieces.push(chars_to_string(chars, piece_start, i))
    }
  }
}

// --- Qwen2 -----------------------------------------------------------------
//
// `PRETOKENIZE_REGEX` from transformers/models/qwen2/tokenization_qwen2.py:
//
//   (?i:'s|'t|'re|'ve|'m|'ll|'d)    1. case-insensitive contractions
//   |[^\r\n\p{L}\p{N}]?\p{L}+       2. optional non-alnum prefix + letters
//   |\p{N}                          3. ONE number character
//   | ?[^\s\p{L}\p{N}]+[\r\n]*      4. optional space + punctuation + newlines
//   |\s*[\r\n]+                     5. any whitespace ending in newline(s)
//   |\s+(?!\S)                      6. trailing whitespace
//   |\s+                            7. whitespace fallback
//
// Unlike the GPT-2 rule, branch 2 accepts a leading character from ANY class
// except CR/LF/letter/number — so ",world" is one piece, and so is "\tworld",
// because a tab is not `\r`, `\n`, a letter, or a number. Branch 4's trailing
// `[\r\n]*` pulls line breaks into the punctuation piece, and branch 5 runs
// before the two generic whitespace branches, so "x  \n  b" gives
// "x", "  \n", " ", " b".

///|
/// Case-insensitive contraction: `'s 't 're 've 'm 'll 'd` in any case.
///
/// `(?i:...)` folds case, so `'S` and `'RE` match. Checked before every other
/// branch, and matched without a leading space.
fn match_contractions_ci(chars : Array[Char], i : Int, n : Int) -> Int? {
  if i >= n || chars[i] != '\'' {
    return None
  }
  if i + 1 >= n {
    return None
  }
  let c = ascii_lower(chars[i + 1])
  if c == 's' || c == 't' || c == 'm' || c == 'd' {
    return Some(i + 2)
  }
  if i + 2 < n {
    let c2 = ascii_lower(chars[i + 2])
    if (c == 'r' && c2 == 'e') || (c == 'v' && c2 == 'e') || (c == 'l' && c2 == 'l') {
      return Some(i + 3)
    }
  }
  None
}

///|
/// ASCII-only case fold, which is all the contraction branch needs.
fn ascii_lower(c : Char) -> Char {
  let v = c.to_int()
  if v >= 0x41 && v <= 0x5A {
    Int::unsafe_to_char(v + 0x20)
  } else {
    c
  }
}

///|
/// Qwen2 branch 2: `[^\r\n\p{L}\p{N}]?\p{L}+`.
///
/// The optional prefix character may be a space, a tab, or punctuation — any
/// one character that is not CR, LF, a letter, or a number. Letters then run
/// until a non-letter. Returns `None` when the current position cannot start
/// the branch.
fn match_qwen2_letters(chars : Array[Char], i : Int, n : Int) -> Int? {
  let mut j = i
  let first = chars[j].to_int()
  if !is_unicode_letter(first) {
    // Try consuming one prefix character.
    if j + 1 < n && first != 0x0D && first != 0x0A &&
      !is_unicode_number(first) &&
      is_unicode_letter(chars[j + 1].to_int()) {
      j = j + 1
    } else {
      return None
    }
  }
  // `\p{L}+`: j currently points at a letter.
  while j < n && is_unicode_letter(chars[j].to_int()) {
    j = j + 1
  }
  Some(j)
}

///|
/// Qwen2 branch 4: ` ?[^\s\p{L}\p{N}]+[\r\n]*`.
fn match_qwen2_punct(chars : Array[Char], i : Int, n : Int) -> Int? {
  let mut j = i
  if chars[j] == ' ' {
    j = j + 1
    if j >= n {
      return None
    }
  }
  let c = chars[j].to_int()
  if is_unicode_space(c) || is_unicode_letter(c) || is_unicode_number(c) {
    return None
  }
  j = j + 1
  while j < n {
    let c2 = chars[j].to_int()
    if is_unicode_space(c2) || is_unicode_letter(c2) || is_unicode_number(c2) {
      break
    }
    j = j + 1
  }
  // Trailing `[\r\n]*`: newlines are `\s`, so they were excluded above.
  while j < n {
    let c2 = chars[j].to_int()
    if c2 != 0x0D && c2 != 0x0A {
      break
    }
    j = j + 1
  }
  Some(j)
}

///|
/// Qwen2 branch 5: `\s*[\r\n]+` — a whitespace run containing a newline.
///
/// This runs before the generic whitespace branches, so "  \n  b" splits as
/// "  \n", then " ", then " b". The regex backtracks: `\s*` is greedy, so it
/// first takes the whole whitespace run, then gives characters back from the
/// end until `[\r\n]+` matches. The first success is the LAST newline in the
/// run, and the piece ends right after it — trailing spaces stay for the next
/// piece. For example the run " \n \n " (in "a \n \n b") yields " \n \n",
/// matching HuggingFace.
fn match_qwen2_ws_newline(chars : Array[Char], i : Int, n : Int) -> Int? {
  if i >= n || !is_unicode_space(chars[i].to_int()) {
    return None
  }
  let mut j = i
  while j < n && is_unicode_space(chars[j].to_int()) {
    j = j + 1
  }
  // Find the last newline in [i, j); the piece ends after it.
  let mut k = j
  while k > i {
    let c = chars[k - 1].to_int()
    if c == 0x0D || c == 0x0A {
      return Some(k)
    }
    k = k - 1
  }
  None
}

///|
/// The Qwen2 pre-tokenizer.
///
/// Branch order is the regex's: contractions, letter run with optional
/// non-alnum prefix, single number character, punctuation with trailing
/// newlines, whitespace ending in a newline, trailing whitespace, plain
/// whitespace.
pub fn pretokenize_qwen2(text : String) -> Array[String] {
  let chars = text.to_array()
  let n = chars.length()
  let pieces : Array[String] = []
  let mut i = 0
  while i < n {
    let start = i
    let next = match match_contractions_ci(chars, i, n) {
      Some(j) => Some(j)
      None =>
        match match_qwen2_letters(chars, i, n) {
          Some(j) => Some(j)
          None =>
            if is_unicode_number(chars[i].to_int()) {
              Some(i + 1)
            } else {
              match match_qwen2_punct(chars, i, n) {
                Some(j) => Some(j)
                None =>
                  match match_qwen2_ws_newline(chars, i, n) {
                    Some(j) => Some(j)
                    // `\s+(?!\S)` followed by the `\s+` fallback: the helper
                    // implements both, and a lone space before non-space is
                    // consumed by the caller's one-character guard.
                    None => match_whitespace(chars, i, n)
                  }
              }
            }
        }
    }
    match next {
      Some(j) => i = j
      None => i = i + 1 // unreachable over the full alphabet; loop guard
    }
    if i > start {
      pieces.push(chars_to_string(chars, start, i))
    }
  }
  pieces
}

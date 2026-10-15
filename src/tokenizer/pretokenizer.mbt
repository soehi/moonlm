// The SmolLM2 pre-tokenizer: split text into pieces the BPE merge stage treats
// independently.
//
// SmolLM2 (`tokenizer.ggml.pre = "smollm"`) applies `Digits(individual_digits)`
// and then the GPT-2 ByteLevel regex:
//
//   's|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+
//
// MoonBit core has no regex engine, so this file implements the same splitting
// as a hand-written scanner over codepoints, checking each alternative of the
// alternation in order at the current position. Order matters: `'s` must win
// over the generic punctuation branch, and `\s+(?!\S)` (trailing whitespace)
// must win over the plain `\s+` fallback.
//
// The scan operates on the GPT-2-encoded string (one char per byte), so an
// index is simultaneously a char index and a byte index; per-digit splitting is
// folded into the `\p{N}` branch by matching one digit at a time.

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
/// ` ?\p{L}+`, then ` ?\p{N}+` (SmolLM2 splits digits, so one digit per piece),
/// then ` ?[^\s\p{L}\p{N}]+`.
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
    1 // numbers (digits split individually)
  } else {
    2 // other
  }
  j = j + 1
  if class_of == 1 {
    // Digits(individual_digits): a single digit, no run.
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
/// Split raw (non-byte-encoded) text into pre-tokenizer pieces.
///
/// The GPT-2 regex operates on raw Unicode characters; each returned piece is
/// a substring of `text` cut on character boundaries, later byte-encoded
/// separately by the caller. `Digits(individual_digits)` splits number runs
/// into single characters.
pub fn pretokenize_text(text : String) -> Array[String] {
  let chars = text.to_array()
  let n = chars.length()
  let pieces : Array[String] = []
  let mut i = 0
  while i < n {
    let start = i
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
    if i > start {
      pieces.push(chars_to_string(chars, start, i))
    }
  }
  pieces
}

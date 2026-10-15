// Unicode category lookups for the pre-tokenizer.
//
// The GPT-2 pre-tokenizer's character classes (`\p{L}`, `\p{N}`, `\s`) need
// per-codepoint Unicode category membership, which MoonBit core does not
// provide. `gen_unicode_tables.mbt` carries the membership intervals extracted
// from Python's `unicodedata`; this file binary-searches them.
//
// The tables cover the full scalar range 0..0x10FFFF, so astral-plane
// characters (CJK extension blocks, mathematical alphanumerics) classify
// correctly, not just the BMP.

///|
/// Whether `cp` falls in one of the sorted inclusive (lo, hi) ranges.
fn in_ranges(ranges : Array[Int], cp : Int) -> Bool {
  let n = ranges.length() / 2
  let mut lo = 0
  let mut hi = n
  while lo < hi {
    let mid = (lo + hi) / 2
    let rlo = ranges[mid * 2]
    let rhi = ranges[mid * 2 + 1]
    if cp < rlo {
      hi = mid
    } else if cp > rhi {
      lo = mid + 1
    } else {
      return true
    }
  }
  false
}

///|
/// Whether `cp` is a Unicode letter (`\p{L}`).
pub fn is_unicode_letter(cp : Int) -> Bool {
  in_ranges(unicode_letter_ranges, cp)
}

///|
/// Whether `cp` is a Unicode number (`\p{N}`).
pub fn is_unicode_number(cp : Int) -> Bool {
  in_ranges(unicode_number_ranges, cp)
}

///|
/// Whether `cp` is whitespace in the regex `\s` sense.
pub fn is_unicode_space(cp : Int) -> Bool {
  in_ranges(unicode_space_ranges, cp)
}

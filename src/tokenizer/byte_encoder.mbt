// GPT-2 byte encoder: the reversible byte <-> unicode-character mapping that
// lets a string-based BPE vocabulary represent arbitrary bytes (UTF-8 of any
// language, control characters) without ever producing invalid strings.
//
// The table in gen_unicode_tables.mbt was generated from the reference
// implementation: bytes 33-126, 161-172, 174-255 map to themselves; the
// remaining 68 map to U+0100.. in byte order.

///|
/// Map one byte to its GPT-2 unicode representation's codepoint.
pub fn byte_to_codepoint(b : Int) -> Int {
  byte_encoder_table[b]
}

///|
/// Inverse of `byte_to_codepoint`, built by inverting the table once.
///
/// Byte-encoder codepoints span 33..323 (the 68 non-printable bytes map to
/// U+0100..U+0143), so the inverse table is indexed by `cp - 33` and needs 291
/// entries, not 256. The mapping is a bijection, so every slot in 33..323 that
/// occurs is written exactly once and unused slots stay at the -1 fill.
let byte_decoder_table : Array[Int] = {
  let inv : Array[Int] = Array::make(291, -1)
  for b = 0; b < 256; b = b + 1 {
    inv[byte_encoder_table[b] - 33] = b
  }
  inv
}

///|
/// Map a GPT-2 unicode representation's codepoint back to its byte.
///
/// Returns -1 for codepoints that are not part of the mapping, which happens
/// only for corrupt vocabularies.
pub fn codepoint_to_byte(cp : Int) -> Int {
  if cp < 33 || cp > 323 {
    -1
  } else {
    byte_decoder_table[cp - 33]
  }
}

///|
/// Encode UTF-8 bytes into the GPT-2 "unicode string" form.
///
/// Each byte becomes one character of the output string, so the result's length
/// equals the input's byte count — a property the BPE merge step relies on.
pub fn bytes_to_gpt2_string(bytes : Bytes) -> String {
  let sb = StringBuilder::new()
  for i = 0; i < bytes.length(); i = i + 1 {
    sb.write_char(byte_to_codepoint(bytes[i].to_int()).unsafe_to_char())
  }
  sb.to_string()
}

///|
/// Decode the GPT-2 "unicode string" form back into raw bytes.
///
/// Returns the byte count written; characters outside the mapping are skipped.
pub fn gpt2_string_to_bytes(s : String, out : FixedArray[Byte]) -> Int {
  let mut n = 0
  for ch in s {
    if n >= out.length() {
      break
    }
    let b = codepoint_to_byte(ch.to_int())
    if b >= 0 {
      out[n] = b.to_byte()
      n = n + 1
    }
  }
  n
}

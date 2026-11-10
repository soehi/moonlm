///|
/// Copy logits and penalize each distinct recent output token once.
pub fn penalize_repetition(
  logits : FixedArray[Float],
  history : Array[Int32],
  penalty : Double,
  window : Int32,
) -> FixedArray[Float] {
  let out = FixedArray::make(logits.length(), 0.0F)
  for i = 0; i < logits.length(); i = i + 1 {
    out[i] = logits[i]
  }
  if penalty <= 1.0 || window <= 0 {
    return out
  }
  let seen : Map[Int32, Bool] = Map([])
  let start = if history.length() > window {
    history.length() - window
  } else {
    0
  }
  for i = start; i < history.length(); i = i + 1 {
    let id = history[i]
    if id >= 0 && id < out.length() && !seen.contains(id) {
      seen[id] = true
      let value = out[id].to_double()
      out[id] = Float::from_double(
        if value < 0.0 {
          value * penalty
        } else {
          value / penalty
        },
      )
    }
  }
  out
}

///|
/// Stop only after three identical suffix blocks of at least eight tokens.
pub fn has_repeated_suffix(ids : Array[Int32]) -> Bool {
  let n = ids.length()
  for width = 8; width <= 64 && width * 3 <= n; width = width + 1 {
    let mut same = true
    for i = 0; i < width * 2; i = i + 1 {
      if ids[n - 1 - i] != ids[n - 1 - width - i] {
        same = false
        break
      }
    }
    if same {
      return true
    }
  }
  false
}

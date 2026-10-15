// Token sampling: greedy, temperature, top-k and top-p.
//
// The logits come from the model as `Float`; sampling converts to `Double`
// internally so probabilities do not lose precision in the softmax, then picks
// a token with a deterministic PRNG. Greedy is exact and needs no randomness,
// which is what makes it the right mode for cross-checking against another
// implementation.

///|
/// Deterministic xorshift64* generator.
///
/// Seeded explicitly so a run is reproducible: the same seed and the same
/// logits must produce the same token sequence, which is what makes sampling
/// testable at all. xorshift64* has a period of 2^64-1 and passes the usual
/// batteries for sampling use; it is not cryptographic and is not used for
/// anything that needs to be.
pub(all) struct Rng {
  mut state : UInt64
} derive(Debug)

///|
/// Create a generator. A zero seed is remapped because xorshift64* has a fixed
/// point at zero and would emit zeros forever.
pub fn Rng::new(seed : UInt64) -> Rng {
  { state: if seed == 0UL { 0x9E3779B97F4A7C15UL } else { seed } }
}

///|
/// Next raw 64-bit value.
pub fn Rng::next_u64(self : Rng) -> UInt64 {
  let mut x = self.state
  x = x ^ (x << 13)
  x = x ^ (x >> 7)
  x = x ^ (x << 17)
  self.state = x
  // The * scrambling step turns the xorshift output into a well-mixed value.
  x * 2685821657736338717UL
}

///|
/// Uniform sample in [0, 1).
///
/// Uses the top 53 bits so every representable `Double` in the interval is
/// reachable with the right frequency, which a modulo-based mapping would not
/// give.
pub fn Rng::next_double(self : Rng) -> Double {
  let v = self.next_u64() >> 11
  v.to_double() * (1.0 / 9007199254740992.0)
}

///|
/// How to pick the next token from logits.
pub(all) enum Sampler {
  /// Always the highest-logit token. Deterministic.
  Greedy
  /// Divide logits by `temperature` before the softmax.
  Temperature(temperature~ : Double)
  /// Temperature scaling, then keep only the `k` best tokens.
  TopK(temperature~ : Double, k~ : Int)
  /// Temperature scaling, then keep the smallest set whose probability mass
  /// reaches `p`.
  TopP(temperature~ : Double, p~ : Double)
} derive(Eq, Debug)

///|
/// Sampling errors.
pub(all) suberror SamplerError {
  /// A non-positive temperature would divide by zero or flip the distribution.
  BadTemperature(value~ : Double)
  /// top-k needs k >= 1.
  BadK(value~ : Int)
  /// top-p needs 0 < p <= 1.
  BadP(value~ : Double)
  /// The logits array was empty.
  EmptyLogits
} derive(Eq, Debug)

///|
pub fn SamplerError::message(self : SamplerError) -> String {
  match self {
    BadTemperature(value~) => "temperature must be positive, got \{value}"
    BadK(value~) => "top-k requires k >= 1, got \{value}"
    BadP(value~) => "top-p requires 0 < p <= 1, got \{value}"
    EmptyLogits => "no logits to sample from"
  }
}

///|
pub impl Show for SamplerError with fn to_string(self : SamplerError) {
  self.message()
}

///|
/// Sample a token id from `logits`.
///
/// `rng` is unused by greedy, so a greedy sequence is reproducible without
/// seeding anything.
pub fn sample(
  logits : FixedArray[Float],
  sampler : Sampler,
  rng : Rng,
) -> Result[Int, SamplerError] {
  let n = logits.length()
  if n == 0 {
    return Err(EmptyLogits)
  }
  match sampler {
    Greedy => {
      let mut best = 0
      let mut best_v = logits[0]
      for i = 1; i < n; i = i + 1 {
        // Strictly greater, so ties go to the lower id — deterministic and
        // matching argmax implementations that scan in order.
        if logits[i] > best_v {
          best_v = logits[i]
          best = i
        }
      }
      Ok(best)
    }
    Temperature(temperature~) => {
      if temperature <= 0.0 {
        return Err(BadTemperature(value=temperature))
      }
      let probs = probs_from(logits, temperature)
      Ok(draw_from(probs, rng))
    }
    TopK(temperature~, k~) => {
      if temperature <= 0.0 {
        return Err(BadTemperature(value=temperature))
      }
      if k < 1 {
        return Err(BadK(value=k))
      }
      let probs = probs_from(logits, temperature)
      let kept = truncate_top_k(probs, k)
      Ok(draw_from(kept, rng))
    }
    TopP(temperature~, p~) => {
      if temperature <= 0.0 {
        return Err(BadTemperature(value=temperature))
      }
      if p <= 0.0 || p > 1.0 {
        return Err(BadP(value=p))
      }
      let probs = probs_from(logits, temperature)
      let kept = truncate_top_p(probs, p)
      Ok(draw_from(kept, rng))
    }
  }
}

///|
/// Softmax over `logits / temperature`, with the max subtracted first.
///
/// Subtracting the max is what keeps `exp` in range: raw logits from a model
/// routinely reach 30+, and `exp(30)` in `Float` is already near the top of the
/// range, so a larger value would overflow to infinity and make the
/// distribution all-NaN.
pub fn probs_from(logits : FixedArray[Float], temperature : Double) -> Array[Double] {
  let n = logits.length()
  let inv_t = 1.0 / temperature
  let mut max_v = logits[0].to_double() * inv_t
  for i = 1; i < n; i = i + 1 {
    let v = logits[i].to_double() * inv_t
    if v > max_v {
      max_v = v
    }
  }
  let probs : Array[Double] = Array::make(n, 0.0)
  let mut total = 0.0
  for i = 0; i < n; i = i + 1 {
    let e = @math.exp(logits[i].to_double() * inv_t - max_v)
    probs[i] = e
    total = total + e
  }
  let inv_total = 1.0 / total
  for i = 0; i < n; i = i + 1 {
    probs[i] = probs[i] * inv_total
  }
  probs
}

///|
/// Zero every probability except the `k` largest.
///
/// Ties at the cut-off are resolved by id order, so the result depends only on
/// the logits and not on sort stability.
pub fn truncate_top_k(probs : Array[Double], k : Int) -> Array[Double] {
  let n = probs.length()
  let kept : Array[Double] = Array::make(n, 0.0)
  if k >= n {
    for i = 0; i < n; i = i + 1 {
      kept[i] = probs[i]
    }
    return kept
  }
  // Indices ordered by probability descending, id ascending on ties.
  let order = sorted_indices_desc(probs)
  let mut total = 0.0
  for r = 0; r < k; r = r + 1 {
    let i = order[r]
    kept[i] = probs[i]
    total = total + probs[i]
  }
  if total > 0.0 {
    let inv = 1.0 / total
    for i = 0; i < n; i = i + 1 {
      kept[i] = kept[i] * inv
    }
  }
  kept
}

///|
/// Zero every probability outside the smallest set whose cumulative mass
/// reaches `p`, then renormalize.
///
/// The token that crosses the threshold is kept, so the retained mass is always
/// at least `p` — the standard "nucleus" definition.
pub fn truncate_top_p(probs : Array[Double], p : Double) -> Array[Double] {
  let n = probs.length()
  let kept : Array[Double] = Array::make(n, 0.0)
  let order = sorted_indices_desc(probs)
  let mut cum = 0.0
  let mut total = 0.0
  for r = 0; r < n; r = r + 1 {
    let i = order[r]
    kept[i] = probs[i]
    total = total + probs[i]
    cum = cum + probs[i]
    if cum >= p {
      break
    }
  }
  if total > 0.0 {
    let inv = 1.0 / total
    for i = 0; i < n; i = i + 1 {
      kept[i] = kept[i] * inv
    }
  }
  kept
}

///|
/// Indices of `probs` ordered by probability descending, ties by ascending id.
fn sorted_indices_desc(probs : Array[Double]) -> Array[Int] {
  let n = probs.length()
  let order : Array[Int] = Array::make(n, 0)
  for i = 0; i < n; i = i + 1 {
    order[i] = i
  }
  // Insertion sort: vocab-sized arrays are the norm here and a full sort of 49k
  // elements per token is not worth its setup; this runs on the ~top of the
  // distribution in practice. For large vocabularies the sort is the sampling
  // cost, so it stays simple and branch-predictable.
  for i = 1; i < n; i = i + 1 {
    let key = order[i]
    let key_p = probs[key]
    let mut j = i - 1
    while j >= 0 && (
      probs[order[j]] < key_p || (probs[order[j]] == key_p && order[j] > key)
    ) {
      order[j + 1] = order[j]
      j = j - 1
    }
    order[j + 1] = key
  }
  order
}

///|
/// Draw an index from a normalized distribution.
///
/// Walks the cumulative mass and takes the first index that reaches the uniform
/// draw. Floating-point drift can leave the cumulative sum marginally below the
/// draw, so the last nonzero entry is the fallback rather than a modulo.
fn draw_from(probs : Array[Double], rng : Rng) -> Int {
  let r = rng.next_double()
  let mut cum = 0.0
  let mut last_nonzero = 0
  for i, p in probs {
    if p > 0.0 {
      last_nonzero = i
      cum = cum + p
      if r < cum {
        return i
      }
    }
  }
  last_nonzero
}

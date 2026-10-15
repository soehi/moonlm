// Sampler tests.
//
// Greedy is checked exactly, the distribution-shaping modes are checked for the
// properties that define them (which tokens survive, and that the survivors are
// renormalized), and the PRNG is checked for determinism and range.

///|
fn to_logits(values : Array[Double]) -> FixedArray[Float] {
  FixedArray::from_array(values.map(fn(v) { Float::from_double(v) })[:])
}

///|
test "greedy picks the argmax, breaking ties by lowest id" {
  let rng = Rng::new(1UL)
  assert_eq(sample(to_logits([0.5, 2.0, -1.0]), @sampler.Greedy, rng), Ok(1))
  // Equal maxima: the first wins, so the choice does not depend on scan order.
  assert_eq(sample(to_logits([1.0, 1.0, 0.0]), @sampler.Greedy, rng), Ok(0))
  assert_eq(sample(to_logits([-3.0, -2.0, -2.5]), @sampler.Greedy, rng), Ok(1))
}

///|
test "greedy ignores the rng, so it is reproducible without seeding" {
  let a = sample(to_logits([0.1, 0.9]), @sampler.Greedy, Rng::new(1UL))
  let b = sample(to_logits([0.1, 0.9]), @sampler.Greedy, Rng::new(99999UL))
  assert_eq(a, b)
}

///|
test "temperature scaling sharpens with t<1 and flattens with t>1" {
  let logits = to_logits([2.0, 1.0, 0.0])
  let sharp = probs_from(logits, 0.5)
  let flat = probs_from(logits, 2.0)
  // Lower temperature must concentrate more mass on the top token.
  assert_true(sharp[0] > flat[0])
  // Both must be valid distributions.
  for p in [sharp, flat] {
    let mut total = 0.0
    for x in p {
      assert_true(x >= 0.0 && x <= 1.0)
      total = total + x
    }
    assert_true((total - 1.0).abs() < 1.0e-9)
  }
}

///|
test "softmax does not overflow on large logits" {
  // Raw logits of this magnitude are normal; without subtracting the max,
  // exp(1000) is inf and the distribution becomes all-NaN.
  let logits = to_logits([1000.0, 999.0, -1000.0])
  let p = probs_from(logits, 1.0)
  for x in p {
    assert_false(x.is_nan())
  }
  let mut total = 0.0
  for x in p {
    total = total + x
  }
  assert_true((total - 1.0).abs() < 1.0e-9)
}

///|
test "top-k keeps exactly k tokens and renormalizes" {
  let logits = to_logits([1.0, 5.0, 3.0, 2.0, 4.0])
  // k=2 keeps the ids with the two largest logits (1 and 4).
  let p = truncate_top_k(probs_from(logits, 1.0), 2)
  let mut nonzero = 0
  let mut total = 0.0
  for i, x in p {
    if x > 0.0 {
      nonzero = nonzero + 1
      assert_true(i == 1 || i == 4)
    }
    total = total + x
  }
  assert_eq(nonzero, 2)
  assert_true((total - 1.0).abs() < 1.0e-9)
}

///|
test "top-k larger than the vocabulary keeps everything" {
  let logits = to_logits([1.0, 2.0, 3.0])
  let p = truncate_top_k(probs_from(logits, 1.0), 99)
  let mut total = 0.0
  for x in p {
    assert_true(x > 0.0)
    total = total + x
  }
  assert_true((total - 1.0).abs() < 1.0e-9)
}

///|
test "top-p retains at least p of the mass and drops the tail" {
  // One dominant token plus a long flat tail: the nucleus must be small.
  let logits = to_logits([10.0, 0.0, 0.0, 0.0, 0.0, 0.0])
  let p = truncate_top_p(probs_from(logits, 1.0), 0.9)
  assert_true(p[0] > 0.0)
  // The tail tokens are far below the threshold and must be dropped.
  let mut tail_nonzero = 0
  for i = 1; i < p.length(); i = i + 1 {
    if p[i] > 0.0 {
      tail_nonzero = tail_nonzero + 1
    }
  }
  assert_true(tail_nonzero < p.length() - 1)
  let mut total = 0.0
  for x in p {
    total = total + x
  }
  assert_true((total - 1.0).abs() < 1.0e-9)
}

///|
test "top-p with p=1 keeps the whole distribution" {
  let logits = to_logits([1.0, 2.0, 3.0, 4.0])
  let full = probs_from(logits, 1.0)
  let p = truncate_top_p(full, 1.0)
  for i, x in p {
    assert_true((x - full[i]).abs() < 1.0e-12)
  }
}

///|
test "sampling is reproducible for a given seed" {
  let logits = to_logits([1.0, 1.2, 0.9, 1.1, 0.8])
  let s = @sampler.TopK(temperature=0.8, k=3)
  let a = sample(logits, s, Rng::new(12345UL)).unwrap()
  let b = sample(logits, s, Rng::new(12345UL)).unwrap()
  assert_eq(a, b)
}

///|
test "sampling only ever returns a token with nonzero probability" {
  // A distribution concentrated on one id must never sample anything else,
  // regardless of the draw.
  let logits = to_logits([100.0, -100.0, -100.0])
  for seed = 1UL; seed <= 200UL; seed = seed + 1UL {
    let t = sample(logits, @sampler.Temperature(temperature=1.0), Rng::new(seed)).unwrap()
    assert_eq(t, 0)
  }
}

///|
test "invalid parameters are rejected rather than producing garbage" {
  let logits = to_logits([1.0, 2.0])
  let rng = Rng::new(1UL)
  assert_eq(
    sample(logits, @sampler.Temperature(temperature=0.0), rng),
    Err(@sampler.BadTemperature(value=0.0)),
  )
  assert_eq(sample(logits, @sampler.TopK(temperature=1.0, k=0), rng), Err(@sampler.BadK(value=0)))
  assert_eq(
    sample(logits, @sampler.TopP(temperature=1.0, p=0.0), rng),
    Err(@sampler.BadP(value=0.0)),
  )
  assert_eq(
    sample(logits, @sampler.TopP(temperature=1.0, p=1.5), rng),
    Err(@sampler.BadP(value=1.5)),
  )
  let empty : FixedArray[Float] = FixedArray::make(0, 0.0)
  assert_eq(sample(empty, @sampler.Greedy, rng), Err(@sampler.EmptyLogits))
}

///|
test "rng is deterministic, in range, and not stuck" {
  let a = Rng::new(7UL)
  let b = Rng::new(7UL)
  let mut distinct = 0
  let mut prev = -1.0
  for i = 0; i < 1000; i = i + 1 {
    let x = a.next_double()
    let y = b.next_double()
    assert_eq(x, y)
    assert_true(x >= 0.0 && x < 1.0)
    if x != prev {
      distinct = distinct + 1
    }
    prev = x
  }
  assert_true(distinct > 990)
}

///|
test "a zero seed is remapped instead of emitting a fixed point" {
  let r = Rng::new(0UL)
  let a = r.next_u64()
  let b = r.next_u64()
  assert_true(a != 0UL)
  assert_true(a != b)
}

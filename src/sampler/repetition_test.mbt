///|
test "repetition penalty is sign aware nonmutating and applied once" {
  let logits : FixedArray[Float] = [4.0F, -4.0F, 2.0F]
  let out = @sampler.penalize_repetition(logits, [0, 0, 1], 2.0, 64)
  assert_eq(out[0], 2.0F)
  assert_eq(out[1], -8.0F)
  assert_eq(out[2], 2.0F)
  assert_eq(logits[0], 4.0F)
}

///|
test "repetition window ignores older and invalid ids" {
  let out = @sampler.penalize_repetition([4.0F, 4.0F], [0, -1, 99, 1], 2.0, 1)
  assert_eq(out[0], 4.0F)
  assert_eq(out[1], 2.0F)
  assert_eq(@sampler.penalize_repetition([4.0F], [0], 1.0, 64)[0], 4.0F)
}

///|
test "cycle guard requires three full blocks" {
  let ids : Array[Int32] = []
  for _ in 0..<2 {
    ids.append([1, 2, 3, 4, 5, 6, 7, 8][:])
  }
  assert_false(@sampler.has_repeated_suffix(ids))
  ids.append([1, 2, 3, 4, 5, 6, 7, 8][:])
  assert_true(@sampler.has_repeated_suffix(ids))
  ids.push(9)
  assert_false(@sampler.has_repeated_suffix(ids))
}

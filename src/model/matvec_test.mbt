// Golden tests for the fused quantized matvec.
//
// The fixture's blocked weights were built by the same code that M0's golden
// dequantization tests proved identical to llama.cpp elementwise, and the
// expected `y = W @ x` values come from numpy. Agreement here means the fused
// kernel is right, including row addressing, which elementwise tests cannot
// check.

///|
/// Build a Matrix view over raw blocks (no GGUF container needed).
fn matrix_from_blocks(
  label : String,
  type_id : Int,
  rows : Int,
  cols : Int,
  blocks : Bytes,
) -> Matrix {
  let ty = @tensor.GgmlType::from_id(type_id)
  {
    name: label,
    ty,
    rows,
    cols,
    row_bytes: cols / ty.block_size * ty.type_size,
    data: blocks,
  }
}

///|
/// Compare a `Float` result against a `Double` reference with a relative bound.
fn close_enough(got : Float, want : Double, rel : Double) -> Bool {
  let g = got.to_double()
  let diff = (g - want).abs()
  let scale = if want.abs() > 1.0 { want.abs() } else { 1.0 }
  diff / scale <= rel
}

///|
test "fused matvec matches the reference for every block type" {
  for c in matvec_cases {
    let m = matrix_from_blocks(c.label, c.type_id, c.rows, c.cols, c.blocks)
    let x = FixedArray::from_array(
      c.x.map(fn(v) { Float::from_double(v) })[:],
    )
    let y : FixedArray[Float] = FixedArray::make(c.rows, 0.0)
    m.matvec(x, y)
    for r = 0; r < c.rows; r = r + 1 {
      if !close_enough(y[r], c.y[r], 1.0e-5) {
        fail(
          "\{c.label}: row \{r} = \{y[r].to_double()}, expected \{c.y[r]} (relative error exceeds 1e-5)",
        )
      }
    }
  }
}

///|
test "matvec_at honours output offsets" {
  for c in matvec_cases {
    let m = matrix_from_blocks(c.label, c.type_id, c.rows, c.cols, c.blocks)
    let x = FixedArray::from_array(
      c.x.map(fn(v) { Float::from_double(v) })[:],
    )
    // Write into a padded buffer and compare the shifted region.
    let pad = 3
    let y : FixedArray[Float] = FixedArray::make(c.rows + pad, 0.0)
    m.matvec_at(x, 0, y, pad)
    for r = 0; r < c.rows; r = r + 1 {
      if !close_enough(y[pad + r], c.y[r], 1.0e-5) {
        fail("\{c.label}: offset row \{r} = \{y[pad + r].to_double()}")
      }
    }
  }
}

///|
test "matvec_at honours input offsets" {
  for c in matvec_cases {
    let m = matrix_from_blocks(c.label, c.type_id, c.rows, c.cols, c.blocks)
    // Prepend garbage to the input; the result must not change.
    let pad = 5
    let x : FixedArray[Float] = FixedArray::make(c.cols + pad, 12345.0)
    for i, v in c.x {
      x[pad + i] = Float::from_double(v)
    }
    let y : FixedArray[Float] = FixedArray::make(c.rows, 0.0)
    m.matvec_at(x, pad, y, 0)
    for r = 0; r < c.rows; r = r + 1 {
      if !close_enough(y[r], c.y[r], 1.0e-5) {
        fail("\{c.label}: input-offset row \{r} = \{y[r].to_double()}")
      }
    }
  }
}

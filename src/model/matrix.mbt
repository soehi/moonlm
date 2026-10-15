// Quantized weight matrices and matrix-vector products.
//
// A weight matrix keeps its on-disk quantized form and is dequantized inside the
// dot-product loop, so a 135M model never materializes a float copy of its
// weights: that would be ~540 MB against 145 MB on disk, and on wasm-gc it is
// the difference between loading and not loading.
//
// GGUF stores a 2-D tensor as [cols, rows] with the row dimension fastest
// varying, so output row `r` owns a contiguous `row_bytes` block of the payload.
// `matvec` therefore walks rows and accumulates one dot product per row.
//
// Weights are `Bytes` (immutable, read-only views into the model buffer);
// activations are `FixedArray[Float]`, which is what the forward pass mutates.

///|
/// Read `off` of `buf` as a signed byte.
///
/// `Byte` is unsigned in this toolchain, so the sign extension is explicit.
/// Local to this package because the equivalent in `tensor/` takes a `Bytes`
/// and an `Int64` offset, and adapting per row would copy the row.
pub fn bv_sbyte(buf : Bytes, off : Int) -> Int {
  let u = buf[off].to_int()
  if u >= 128 {
    u - 256
  } else {
    u
  }
}

///|
/// Unpack sub-block `j`'s 6-bit scale and min from a q4_K/q5_K super-block.
///
/// Mirrors `get_scale_min_k4` in ggml-quants.c: sub-blocks 0..3 take their low
/// 6 bits from `q[j]`/`q[j+4]`; sub-blocks 4..7 take their low nibbles from
/// `q[j+4]` and their high 2 bits from the top bits of `q[j-4]`/`q[j]`.
fn bv_scale_min_k4(j : Int, buf : Bytes, q_off : Int) -> (Int, Int) {
  if j < 4 {
    (buf[q_off + j].to_int() & 63, buf[q_off + j + 4].to_int() & 63)
  } else {
    let hi = buf[q_off + j + 4].to_int()
    (
      (hi & 0xF) | ((buf[q_off + j - 4].to_int() >> 6) << 4),
      (hi >> 4) | ((buf[q_off + j].to_int() >> 6) << 4),
    )
  }
}

///|
/// A quantized matrix: the raw GGUF payload plus its geometry.
pub(all) struct Matrix {
  /// Tensor name, for error messages.
  name : String
  /// Element type of the payload.
  ty : @tensor.GgmlType
  /// Rows (output features).
  rows : Int
  /// Columns (input features); always a whole number of blocks.
  cols : Int
  /// Bytes per row.
  row_bytes : Int
  /// The quantized payload, exactly as it appears in the file.
  data : Bytes
} derive(Debug)

///|
/// Build a `Matrix` over a tensor's payload.
///
/// Rejects tensors that are not 2-D, whose column count is not a whole number
/// of blocks, or whose payload size disagrees with the declared shape — any of
/// those would make row addressing wrong.
pub fn Matrix::from_tensor(
  f : @gguf.GgufFile,
  name : String,
) -> Result[Matrix, ModelError] {
  let t = match f.tensor(name) {
    Some(t) => t
    None => return Err(MissingTensor(name=name))
  }
  if t.n_dims() != 2 {
    return Err(
      TensorShape(name=name, expected="2 dimensions", found="\{t.n_dims()}"),
    )
  }
  let cols = t.dims[0].reinterpret_as_int64().to_int()
  let rows = t.dims[1].reinterpret_as_int64().to_int()
  let ty = t.ggml_type()
  if !ty.is_dequantizable() {
    return Err(UnsupportedTensorType(name=name, type_name=ty.name))
  }
  if cols % ty.block_size != 0 {
    return Err(
      TensorShape(
        name=name,
        expected="columns divisible by block size \{ty.block_size}",
        found="\{cols} columns",
      ),
    )
  }
  let row_bytes = cols / ty.block_size * ty.type_size
  let index = match f.index_of_tensor(name) {
    Some(i) => i
    None => return Err(MissingTensor(name=name))
  }
  let data = match f.tensor_bytes(index) {
    Ok(b) => b
    Err(e) => return Err(TensorRead(name=name, reason=e.message()))
  }
  let expected = row_bytes * rows
  if data.length() != expected {
    return Err(
      TensorShape(
        name=name,
        expected="\{expected} payload bytes",
        found="\{data.length()}",
      ),
    )
  }
  Ok({ name, ty, rows, cols, row_bytes, data })
}

///|
/// Load a 2-D tensor as a `Matrix`.
pub fn load_matrix(
  f : @gguf.GgufFile,
  name : String,
) -> Result[Matrix, ModelError] {
  Matrix::from_tensor(f, name)
}

///|
/// Dequantize one row into `out`, which must hold `self.cols` floats.
///
/// Used for the token embedding, where one row is needed per token instead of a
/// full matrix product.
pub fn Matrix::dequant_row(
  self : Matrix,
  row : Int,
  out : FixedArray[Float],
) -> Result[Unit, ModelError] {
  if row < 0 || row >= self.rows {
    return Err(BadValue(key=self.name, detail="row \{row} out of range"))
  }
  let bs = self.ty.block_size
  let n_blocks = self.cols / bs
  match self.ty.id {
    0 | 1 | 2 | 8 | 12 | 14 => {
      decode_row_into(self.ty, self.data, row * self.row_bytes, out, n_blocks)
      Ok(())
    }
    _ =>
      Err(UnsupportedTensorType(name=self.name, type_name=self.ty.name))
  }
}

///|
/// Decode every block of a row into consecutive output slots.
fn decode_row_into(
  ty : @tensor.GgmlType,
  data : Bytes,
  row_off : Int,
  out : FixedArray[Float],
  n_blocks : Int,
) -> Unit {
  match ty.id {
    0 => {
      for b = 0; b < n_blocks; b = b + 1 {
        out[b] = Float::reinterpret_from_uint(data.unsafe_read_uint32_le(row_off + b * 4))
      }
    }
    1 => {
      for b = 0; b < n_blocks; b = b + 1 {
        out[b] = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + b * 2).to_int())
      }
    }
    2 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 18
        let d = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + base).to_int())
        for j = 0; j < 16; j = j + 1 {
          let byte = data[row_off + base + 2 + j].to_int()
          out[b * 32 + j] = Float::from_int((byte & 0xF) - 8) * d
          out[b * 32 + 16 + j] = Float::from_int((byte >> 4) - 8) * d
        }
      }
    }
    8 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 34
        let d = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + base).to_int())
        for j = 0; j < 32; j = j + 1 {
          out[b * 32 + j] = Float::from_int(bv_sbyte(data, row_off + base + 2 + j)) * d
        }
      }
    }
    12 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 144
        let d = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + base).to_int())
        let dmin = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + base + 2).to_int())
        let sc_base = base + 4
        let q_base = base + 16
        for g = 0; g < 4; g = g + 1 {
          let (sc0, m0) = bv_scale_min_k4(g * 2, data, row_off + sc_base)
          let (sc1, m1) = bv_scale_min_k4(g * 2 + 1, data, row_off + sc_base)
          let d0 = d * Float::from_int(sc0)
          let min0 = dmin * Float::from_int(m0)
          let d1 = d * Float::from_int(sc1)
          let min1 = dmin * Float::from_int(m1)
          for l = 0; l < 32; l = l + 1 {
            let byte = data[row_off + q_base + g * 32 + l].to_int()
            out[b * 256 + g * 64 + l] = d0 * Float::from_int(byte & 0xF) - min0
            out[b * 256 + g * 64 + 32 + l] = d1 * Float::from_int(byte >> 4) - min1
          }
        }
      }
    }
    14 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 210
        let d = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + base + 208).to_int())
        for half = 0; half < 2; half = half + 1 {
          let ql = base + half * 64
          let qh = base + 128 + half * 32
          let sc = base + 192 + half * 8
          for l = 0; l < 32; l = l + 1 {
            let si = l / 16
            let qhv = data[row_off + qh + l].to_int()
            let ql_lo = data[row_off + ql + l].to_int()
            let ql_hi = data[row_off + ql + 32 + l].to_int()
            let y = b * 256 + half * 128
            out[y + l] = d *
              Float::from_int(bv_sbyte(data, row_off + sc + si)) *
              Float::from_int(((ql_lo & 0xF) | ((qhv & 3) << 4)) - 32)
            out[y + l + 32] = d *
              Float::from_int(bv_sbyte(data, row_off + sc + si + 2)) *
              Float::from_int(((ql_hi & 0xF) | (((qhv >> 2) & 3) << 4)) - 32)
            out[y + l + 64] = d *
              Float::from_int(bv_sbyte(data, row_off + sc + si + 4)) *
              Float::from_int(((ql_lo >> 4) | (((qhv >> 4) & 3) << 4)) - 32)
            out[y + l + 96] = d *
              Float::from_int(bv_sbyte(data, row_off + sc + si + 6)) *
              Float::from_int(((ql_hi >> 4) | (((qhv >> 6) & 3) << 4)) - 32)
          }
        }
      }
    }
    _ => ()
  }
}

///|
/// `y = x @ W^T` for `W = self` (rows x cols), `x` holding `cols` floats.
///
/// Each output element is one dot product over one quantized row, with
/// dequantization fused into the loop. `y[0..rows]` is overwritten.
pub fn Matrix::matvec(
  self : Matrix,
  x : FixedArray[Float],
  y : FixedArray[Float],
) -> Unit {
  let n_rows = self.rows
  let cols = self.cols
  let bs = self.ty.block_size
  let n_blocks = cols / bs
  let data = self.data
  let rb = self.row_bytes
  let ty = self.ty
  // Each row is addressed by offset into the whole payload rather than by
  // slicing out a view: the LM head has 49152 rows, and constructing a view per
  // row costs more than the arithmetic in it.
  match ty.id {
    0 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_f32(data, r * rb, x, 0, n_blocks)
      }
    }
    1 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_f16(data, r * rb, x, 0, n_blocks)
      }
    }
    2 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_q4_0(data, r * rb, x, 0, n_blocks)
      }
    }
    8 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_q8_0(data, r * rb, x, 0, n_blocks)
      }
    }
    12 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_q4_K(data, r * rb, x, 0, n_blocks)
      }
    }
    14 => {
      for r = 0; r < n_rows; r = r + 1 {
        y[r] = dot_q6_K(data, r * rb, x, 0, n_blocks)
      }
    }
    _ => ()
  }
}

///|
/// `y = x @ W^T` reading `x` from a larger buffer starting at `x_off`.
///
/// The forward pass keeps one flat activation buffer per stage and slices into
/// it, which avoids copying sub-vectors around.
pub fn Matrix::matvec_at(
  self : Matrix,
  x : FixedArray[Float],
  x_off : Int,
  y : FixedArray[Float],
  y_off : Int,
) -> Unit {
  let n_rows = self.rows
  let cols = self.cols
  let bs = self.ty.block_size
  let n_blocks = cols / bs
  for r = 0; r < n_rows; r = r + 1 {
    y[y_off + r] = dot_row(
      self.ty,
      self.data,
      r * self.row_bytes,
      x,
      x_off,
      n_blocks,
      bs,
    )
  }
}

///|
/// One row of `self` dotted with `x[x_off..]`, dispatching to the block kernel.
///
/// The dispatch happens once per row, outside the element loop, so each kernel
/// compiles as straight-line code with no per-element type test.
fn dot_row(
  ty : @tensor.GgmlType,
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
  bs : Int,
) -> Float {
  ignore(bs)
  match ty.id {
    0 => dot_f32(data, row_off, x, x_off, n_blocks)
    1 => dot_f16(data, row_off, x, x_off, n_blocks)
    2 => dot_q4_0(data, row_off, x, x_off, n_blocks)
    8 => dot_q8_0(data, row_off, x, x_off, n_blocks)
    12 => dot_q4_K(data, row_off, x, x_off, n_blocks)
    14 => dot_q6_K(data, row_off, x, x_off, n_blocks)
    _ => 0.0
  }
}

///|
/// Unchecked fixed-array read, for the matvec inner loops only.
///
/// Every index in those loops is bounded by the matrix geometry, which the
/// loader has already validated, so the bounds check is pure overhead: it costs
/// one compare and branch per element over tens of millions of elements per
/// token. Declared here rather than taken from core because core's version is
/// not exported.
#intrinsic("%fixedarray.unsafe_get")
fn[T] uget(a : FixedArray[T], i : Int) -> T = "%fixedarray.unsafe_get"

///|
/// byte value -> signed int8 value, so the inner loops need no branch.
///
/// Sign-extending a byte costs a compare and a select per element, which in the
/// LM head is 28M extra ops per token; a table lookup replaces it with a load.
let sbyte_table : Array[Int] = {
  let t : Array[Int] = Array::make(256, 0)
  for i = 0; i < 256; i = i + 1 {
    t[i] = if i >= 128 { i - 256 } else { i }
  }
  t
}

///|
/// byte value -> signed int8 value as a `Float`, so the q8_0 inner loop needs
/// neither a branch nor an integer-to-float conversion per weight.
let sbyte_float_table : Array[Float] = {
  let t : Array[Float] = Array::make(256, 0.0)
  for i = 0; i < 256; i = i + 1 {
    t[i] = Float::from_int(if i >= 128 { i - 256 } else { i })
  }
  t
}

///|
/// f32 weights: a plain float dot product.
fn dot_f32(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let w = Float::reinterpret_from_uint(data.unsafe_read_uint32_le(row_off + b * 4))
    acc = acc + w * uget(x, x_off + b)
  }
  acc
}

///|
/// f16 weights: decode each half then multiply.
fn dot_f16(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let w = @tensor.half_to_float(data.unsafe_read_uint16_le(row_off + b * 2).to_int())
    acc = acc + w * uget(x, x_off + b)
  }
  acc
}

///|
/// q4_0: fp16 scale + 16 nibble-pair bytes covering 32 elements.
///
/// The scale multiplies the accumulated integer sum, matching llama.cpp's
/// reference: summing integers first and scaling once is both faster and
/// closer to the reference arithmetic than scaling per element.
fn dot_q4_0(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = row_off + b * 18
    let d = @tensor.half_to_float(data.unsafe_read_uint16_le(base).to_int())
    let xb = x_off + b * 32
    // Two partial sums: the low nibbles feed one, the high nibbles the other, so
    // the two dependency chains interleave.
    let mut sl : Float = 0.0
    let mut sh : Float = 0.0
    for j = 0; j < 16; j = j + 1 {
      let byte = data[base + 2 + j].to_int()
      sl = sl + Float::from_int((byte & 0xF) - 8) * uget(x, xb + j)
      sh = sh + Float::from_int((byte >> 4) - 8) * uget(x, xb + 16 + j)
    }
    acc = acc + d * (sl + sh)
  }
  acc
}

///|
/// q8_0: fp16 scale + 32 signed bytes.
fn dot_q8_0(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = row_off + b * 34
    let d = @tensor.half_to_float(data.unsafe_read_uint16_le(base).to_int())
    let xb = x_off + b * 32
    // Unrolled by 4: the accumulator chain is what limits this loop, so four
    // partial sums give the pipeline independent work to overlap.
    let mut s0 : Float = 0.0
    let mut s1 : Float = 0.0
    let mut s2 : Float = 0.0
    let mut s3 : Float = 0.0
    for j = 0; j < 32; j = j + 4 {
      s0 = s0 + sbyte_float_table[data[base + 2 + j].to_int()] * uget(x, xb + j)
      s1 = s1 +
        sbyte_float_table[data[base + 3 + j].to_int()] * uget(x, xb + j + 1)
      s2 = s2 +
        sbyte_float_table[data[base + 4 + j].to_int()] * uget(x, xb + j + 2)
      s3 = s3 +
        sbyte_float_table[data[base + 5 + j].to_int()] * uget(x, xb + j + 3)
    }
    acc = acc + d * ((s0 + s1) + (s2 + s3))
  }
  acc
}

///|
/// q4_K: 256-element super-blocks, 8 sub-blocks of 32 with 6-bit scales/mins.
///
/// `value = d*sc*q - dmin*m`, so the min term is a constant times the sum of
/// that sub-block's inputs: computing the sum once avoids a per-element add.
fn dot_q4_K(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = row_off + b * 144
    let d = @tensor.half_to_float(data.unsafe_read_uint16_le(base).to_int())
    let dmin = @tensor.half_to_float(
      data.unsafe_read_uint16_le(base + 2).to_int(),
    )
    let sc_base = base + 4
    let q_base = base + 16
    let y0 = x_off + b * 256
    for g = 0; g < 4; g = g + 1 {
      let (sc0, m0) = bv_scale_min_k4(g * 2, data, sc_base)
      let (sc1, m1) = bv_scale_min_k4(g * 2 + 1, data, sc_base)
      let d0 = d * Float::from_int(sc0)
      let min0 = dmin * Float::from_int(m0)
      let d1 = d * Float::from_int(sc1)
      let min1 = dmin * Float::from_int(m1)
      let mut sum0 : Float = 0.0
      let mut sum1 : Float = 0.0
      let mut xsum0 : Float = 0.0
      let mut xsum1 : Float = 0.0
      let qb = q_base + g * 32
      let yb = y0 + g * 64
      for l = 0; l < 32; l = l + 1 {
        let byte = data[qb + l].to_int()
        let xa = uget(x, yb + l)
        let xbv = uget(x, yb + 32 + l)
        sum0 = sum0 + Float::from_int(byte & 0xF) * xa
        sum1 = sum1 + Float::from_int(byte >> 4) * xbv
        xsum0 = xsum0 + xa
        xsum1 = xsum1 + xbv
      }
      acc = acc + d0 * sum0 - min0 * xsum0 + d1 * sum1 - min1 * xsum1
    }
  }
  acc
}

///|
/// q6_K: 256-element super-blocks, 16-element sub-block int8 scales.
fn dot_q6_K(
  data : Bytes,
  row_off : Int,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = row_off + b * 210
    let d = @tensor.half_to_float(data.unsafe_read_uint16_le(base + 208).to_int())
    let y0 = x_off + b * 256
    for half = 0; half < 2; half = half + 1 {
      let ql = base + half * 64
      let qh = base + 128 + half * 32
      let sc = base + 192 + half * 8
      let yb = y0 + half * 128
      // One partial sum per element lane; the scales are gathered once per
      // 16-element group instead of per element.
      let mut s0 : Float = 0.0
      let mut s1 : Float = 0.0
      let mut s2 : Float = 0.0
      let mut s3 : Float = 0.0
      let mut prev_si = -1
      let mut a0 : Float = 0.0
      let mut a1 : Float = 0.0
      let mut a2 : Float = 0.0
      let mut a3 : Float = 0.0
      for l = 0; l < 32; l = l + 1 {
        let si = l / 16
        if si != prev_si {
          a0 = Float::from_int(sbyte_table[data[sc + si].to_int()])
          a1 = Float::from_int(sbyte_table[data[sc + si + 2].to_int()])
          a2 = Float::from_int(sbyte_table[data[sc + si + 4].to_int()])
          a3 = Float::from_int(sbyte_table[data[sc + si + 6].to_int()])
          prev_si = si
        }
        let qhv = data[qh + l].to_int()
        let ql_lo = data[ql + l].to_int()
        let ql_hi = data[ql + 32 + l].to_int()
        s0 = s0 + a0 * Float::from_int(((ql_lo & 0xF) | ((qhv & 3) << 4)) - 32) *
          uget(x, yb + l)
        s1 = s1 +
          a1 *
          Float::from_int(((ql_hi & 0xF) | (((qhv >> 2) & 3) << 4)) - 32) *
          uget(x, yb + l + 32)
        s2 = s2 +
          a2 *
          Float::from_int(((ql_lo >> 4) | (((qhv >> 4) & 3) << 4)) - 32) *
          uget(x, yb + l + 64)
        s3 = s3 +
          a3 *
          Float::from_int(((ql_hi >> 4) | (((qhv >> 6) & 3) << 4)) - 32) *
          uget(x, yb + l + 96)
      }
      acc = acc + d * ((s0 + s1) + (s2 + s3))
    }
  }
  acc
}

///|
/// A 1-D weight vector (RMSNorm gains, biases), stored as floats.
pub(all) struct Vector {
  name : String
  data : FixedArray[Float]
} derive(Debug)

///|
/// Load a 1-D tensor as a float vector.
///
/// Norm weights are small (one float per hidden dimension), so they are
/// dequantized once at load time rather than per token.
pub fn load_vector(f : @gguf.GgufFile, name : String) -> Result[Vector, ModelError] {
  let t = match f.tensor(name) {
    Some(t) => t
    None => return Err(MissingTensor(name=name))
  }
  if t.n_dims() != 1 {
    return Err(
      TensorShape(name=name, expected="1 dimension", found="\{t.n_dims()}"),
    )
  }
  let n = t.n_elems.to_int()
  let index = match f.index_of_tensor(name) {
    Some(i) => i
    None => return Err(MissingTensor(name=name))
  }
  let ty = t.ggml_type()
  if !ty.is_dequantizable() {
    return Err(UnsupportedTensorType(name=name, type_name=ty.name))
  }
  let values = match f.dequant_tensor(index) {
    Ok(v) => v
    Err(e) => return Err(TensorRead(name=name, reason=e.message()))
  }
  if values.length() != n {
    return Err(
      TensorShape(
        name=name,
        expected="\{n} elements",
        found="\{values.length()}",
      ),
    )
  }
  Ok({ name, data: FixedArray::from_array(values[:]) })
}

///|
/// `(y_gate, y_up) = (x @ Wg^T, x @ Wu^T)` in a single pass over `x`.
///
/// The SwiGLU gate and up projections share their input and their shape, so
/// computing them separately reads the activation vector twice and runs the loop
/// machinery twice. Fusing them costs nothing in arithmetic and halves the
/// activation traffic, which for a 576-wide activation and two 1536-row matrices
/// is worth measurably more than it sounds.
///
/// Both matrices must have the same geometry; the caller is the model's own FFN,
/// which constructs them from the same config, and a mismatch falls back to two
/// separate calls rather than producing a wrong result.
pub fn matvec_pair(
  a : Matrix,
  b : Matrix,
  x : FixedArray[Float],
  y_a : FixedArray[Float],
  y_b : FixedArray[Float],
) -> Unit {
  if a.cols != b.cols || a.rows != b.rows || a.ty.id != b.ty.id {
    a.matvec(x, y_a)
    b.matvec(x, y_b)
    return
  }
  let n_rows = a.rows
  let cols = a.cols
  let bs = a.ty.block_size
  let n_blocks = cols / bs
  let data_a = a.data
  let data_b = b.data
  let rb = a.row_bytes
  match a.ty.id {
    8 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_q8_0(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_q8_0(data_b, off, x, 0, n_blocks)
      }
    }
    2 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_q4_0(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_q4_0(data_b, off, x, 0, n_blocks)
      }
    }
    0 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_f32(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_f32(data_b, off, x, 0, n_blocks)
      }
    }
    1 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_f16(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_f16(data_b, off, x, 0, n_blocks)
      }
    }
    12 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_q4_K(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_q4_K(data_b, off, x, 0, n_blocks)
      }
    }
    14 => {
      for r = 0; r < n_rows; r = r + 1 {
        let off = r * rb
        y_a[r] = dot_q6_K(data_a, off, x, 0, n_blocks)
        y_b[r] = dot_q6_K(data_b, off, x, 0, n_blocks)
      }
    }
    _ => {
      a.matvec(x, y_a)
      b.matvec(x, y_b)
    }
  }
}

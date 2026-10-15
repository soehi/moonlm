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
fn bv_sbyte(buf : BytesView, off : Int) -> Int {
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
fn bv_scale_min_k4(j : Int, buf : BytesView, q_off : Int) -> (Int, Int) {
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
  let row_start = self.data.view(
    start=row * self.row_bytes,
    end=(row + 1) * self.row_bytes,
  )
  let bs = self.ty.block_size
  let n_blocks = self.cols / bs
  match self.ty.id {
    0 | 1 | 2 | 8 | 12 | 14 => {
      // Reuse the dot kernels' block readers by scattering through a one-hot
      // vector is wasteful; decode blocks directly instead.
      decode_row_into(self.ty, row_start, out, n_blocks)
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
  row : BytesView,
  out : FixedArray[Float],
  n_blocks : Int,
) -> Unit {
  match ty.id {
    0 => {
      for b = 0; b < n_blocks; b = b + 1 {
        out[b] = Float::reinterpret_from_uint(row.unsafe_read_uint32_le(b * 4))
      }
    }
    1 => {
      for b = 0; b < n_blocks; b = b + 1 {
        out[b] = @tensor.half_to_float(row.unsafe_read_uint16_le(b * 2).to_int())
      }
    }
    2 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 18
        let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
        for j = 0; j < 16; j = j + 1 {
          let byte = row[base + 2 + j].to_int()
          out[b * 32 + j] = Float::from_int((byte & 0xF) - 8) * d
          out[b * 32 + 16 + j] = Float::from_int((byte >> 4) - 8) * d
        }
      }
    }
    8 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 34
        let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
        for j = 0; j < 32; j = j + 1 {
          out[b * 32 + j] = Float::from_int(bv_sbyte(row, base + 2 + j)) * d
        }
      }
    }
    12 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 144
        let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
        let dmin = @tensor.half_to_float(row.unsafe_read_uint16_le(base + 2).to_int())
        let sc_base = base + 4
        let q_base = base + 16
        for g = 0; g < 4; g = g + 1 {
          let (sc0, m0) = bv_scale_min_k4(g * 2, row, sc_base)
          let (sc1, m1) = bv_scale_min_k4(g * 2 + 1, row, sc_base)
          let d0 = d * Float::from_int(sc0)
          let min0 = dmin * Float::from_int(m0)
          let d1 = d * Float::from_int(sc1)
          let min1 = dmin * Float::from_int(m1)
          for l = 0; l < 32; l = l + 1 {
            let byte = row[q_base + g * 32 + l].to_int()
            out[b * 256 + g * 64 + l] = d0 * Float::from_int(byte & 0xF) - min0
            out[b * 256 + g * 64 + 32 + l] = d1 * Float::from_int(byte >> 4) - min1
          }
        }
      }
    }
    14 => {
      for b = 0; b < n_blocks; b = b + 1 {
        let base = b * 210
        let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base + 208).to_int())
        for half = 0; half < 2; half = half + 1 {
          let ql = base + half * 64
          let qh = base + 128 + half * 32
          let sc = base + 192 + half * 8
          for l = 0; l < 32; l = l + 1 {
            let si = l / 16
            let qhv = row[qh + l].to_int()
            let ql_lo = row[ql + l].to_int()
            let ql_hi = row[ql + 32 + l].to_int()
            let y = b * 256 + half * 128
            out[y + l] = d *
              Float::from_int(bv_sbyte(row, sc + si)) *
              Float::from_int(((ql_lo & 0xF) | ((qhv & 3) << 4)) - 32)
            out[y + l + 32] = d *
              Float::from_int(bv_sbyte(row, sc + si + 2)) *
              Float::from_int(((ql_hi & 0xF) | (((qhv >> 2) & 3) << 4)) - 32)
            out[y + l + 64] = d *
              Float::from_int(bv_sbyte(row, sc + si + 4)) *
              Float::from_int(((ql_lo >> 4) | (((qhv >> 4) & 3) << 4)) - 32)
            out[y + l + 96] = d *
              Float::from_int(bv_sbyte(row, sc + si + 6)) *
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
  for r = 0; r < n_rows; r = r + 1 {
    let row_start = self.data.view(
      start=r * self.row_bytes,
      end=(r + 1) * self.row_bytes,
    )
    y[r] = dot_row(self.ty, row_start, x, 0, n_blocks, bs)
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
    let row_start = self.data.view(
      start=r * self.row_bytes,
      end=(r + 1) * self.row_bytes,
    )
    y[y_off + r] = dot_row(self.ty, row_start, x, x_off, n_blocks, bs)
  }
}

///|
/// One row of `self` dotted with `x[x_off..]`, dispatching to the block kernel.
///
/// The dispatch happens once per row, outside the element loop, so each kernel
/// compiles as straight-line code with no per-element type test.
fn dot_row(
  ty : @tensor.GgmlType,
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
  bs : Int,
) -> Float {
  ignore(bs)
  match ty.id {
    0 => dot_f32(row, x, x_off, n_blocks)
    1 => dot_f16(row, x, x_off, n_blocks)
    2 => dot_q4_0(row, x, x_off, n_blocks)
    8 => dot_q8_0(row, x, x_off, n_blocks)
    12 => dot_q4_K(row, x, x_off, n_blocks)
    14 => dot_q6_K(row, x, x_off, n_blocks)
    _ => 0.0
  }
}

///|
/// f32 weights: a plain float dot product.
fn dot_f32(
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let w = Float::reinterpret_from_uint(row.unsafe_read_uint32_le(b * 4))
    acc = acc + w * x[x_off + b]
  }
  acc
}

///|
/// f16 weights: decode each half then multiply.
fn dot_f16(
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let w = @tensor.half_to_float(row.unsafe_read_uint16_le(b * 2).to_int())
    acc = acc + w * x[x_off + b]
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
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = b * 18
    let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
    let mut isum : Float = 0.0
    for j = 0; j < 16; j = j + 1 {
      let byte = row[base + 2 + j].to_int()
      isum = isum +
        Float::from_int((byte & 0xF) - 8) * x[x_off + b * 32 + j] +
        Float::from_int((byte >> 4) - 8) * x[x_off + b * 32 + 16 + j]
    }
    acc = acc + d * isum
  }
  acc
}

///|
/// q8_0: fp16 scale + 32 signed bytes.
fn dot_q8_0(
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = b * 34
    let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
    let mut isum : Float = 0.0
    for j = 0; j < 32; j = j + 1 {
      isum = isum +
        Float::from_int(bv_sbyte(row, base + 2 + j)) *
        x[x_off + b * 32 + j]
    }
    acc = acc + d * isum
  }
  acc
}

///|
/// q4_K: 256-element super-blocks, 8 sub-blocks of 32 with 6-bit scales/mins.
///
/// `value = d*sc*q - dmin*m`, so the min term is a constant times the sum of
/// that sub-block's inputs: computing the sum once avoids a per-element add.
fn dot_q4_K(
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = b * 144
    let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base).to_int())
    let dmin = @tensor.half_to_float(row.unsafe_read_uint16_le(base + 2).to_int())
    let sc_base = base + 4
    let q_base = base + 16
    let y0 = x_off + b * 256
    for g = 0; g < 4; g = g + 1 {
      let (sc0, m0) = bv_scale_min_k4(g * 2, row, sc_base)
      let (sc1, m1) = bv_scale_min_k4(g * 2 + 1, row, sc_base)
      let d0 = d * Float::from_int(sc0)
      let min0 = dmin * Float::from_int(m0)
      let d1 = d * Float::from_int(sc1)
      let min1 = dmin * Float::from_int(m1)
      let mut sum0 : Float = 0.0
      let mut sum1 : Float = 0.0
      let mut xsum0 : Float = 0.0
      let mut xsum1 : Float = 0.0
      for l = 0; l < 32; l = l + 1 {
        let byte = row[q_base + g * 32 + l].to_int()
        let xa = x[y0 + g * 64 + l]
        let xb = x[y0 + g * 64 + 32 + l]
        sum0 = sum0 + Float::from_int(byte & 0xF) * xa
        sum1 = sum1 + Float::from_int(byte >> 4) * xb
        xsum0 = xsum0 + xa
        xsum1 = xsum1 + xb
      }
      acc = acc + d0 * sum0 - min0 * xsum0 + d1 * sum1 - min1 * xsum1
    }
  }
  acc
}

///|
/// q6_K: 256-element super-blocks, 16-element sub-block int8 scales.
fn dot_q6_K(
  row : BytesView,
  x : FixedArray[Float],
  x_off : Int,
  n_blocks : Int,
) -> Float {
  let mut acc : Float = 0.0
  for b = 0; b < n_blocks; b = b + 1 {
    let base = b * 210
    let d = @tensor.half_to_float(row.unsafe_read_uint16_le(base + 208).to_int())
    let y0 = x_off + b * 256
    for half = 0; half < 2; half = half + 1 {
      let ql = base + half * 64
      let qh = base + 128 + half * 32
      let sc = base + 192 + half * 8
      for l = 0; l < 32; l = l + 1 {
        let si = l / 16
        let qhv = row[qh + l].to_int()
        let ql_lo = row[ql + l].to_int()
        let ql_hi = row[ql + 32 + l].to_int()
        let s0 = bv_sbyte(row, sc + si)
        let s1 = bv_sbyte(row, sc + si + 2)
        let s2 = bv_sbyte(row, sc + si + 4)
        let s3 = bv_sbyte(row, sc + si + 6)
        // A zero sub-block scale zeroes its whole contribution; skipping the
        // multiply keeps that case free instead of paying for it.
        if s0 != 0 {
          acc = acc +
            d *
            Float::from_int(s0) *
            Float::from_int(((ql_lo & 0xF) | ((qhv & 3) << 4)) - 32) *
            x[y0 + half * 128 + l]
        }
        if s1 != 0 {
          acc = acc +
            d *
            Float::from_int(s1) *
            Float::from_int(((ql_hi & 0xF) | (((qhv >> 2) & 3) << 4)) - 32) *
            x[y0 + half * 128 + l + 32]
        }
        if s2 != 0 {
          acc = acc +
            d *
            Float::from_int(s2) *
            Float::from_int(((ql_lo >> 4) | (((qhv >> 4) & 3) << 4)) - 32) *
            x[y0 + half * 128 + l + 64]
        }
        if s3 != 0 {
          acc = acc +
            d *
            Float::from_int(s3) *
            Float::from_int(((ql_hi >> 4) | (((qhv >> 6) & 3) << 4)) - 32) *
            x[y0 + half * 128 + l + 96]
        }
      }
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

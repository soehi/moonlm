const $reinterpret_view = new DataView(new ArrayBuffer(8));
function $f32_reinterpret_i32(a) {
  $reinterpret_view.setInt32(0, a, true);
  return $reinterpret_view.getFloat32(0, true);
}
function _M0TP35soehi6moonlm6tensor8GgmlType(param0, param1, param2, param3) {
  this.id = param0;
  this.name = param1;
  this.block_size = param2;
  this.type_size = param3;
}
function _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
function $bound_check(arr, index) {
  if (index < 0 || index >= arr.length) throw new Error("Index out of bounds");
}
function _M0TPC14math9Exp2fData(param0, param1, param2, param3) {
  this.tab = param0;
  this.shift = param1;
  this.invln2_scaled = param2;
  this.poly_scaled = param3;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE2Ok.prototype.$tag = 1;
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
const _M0FPB12random__seed = () => {
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }
};
class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
const _M0FPB20uint__to__string__js = (x, radix) => {
  return (x >>> 0).toString(radix);
};
const _M0FPB21int64__to__string__js = (num, radix) => BigInt.asIntN(64, num).toString(radix);
const _M0FPB22uint64__to__string__js = (num, radix) => num.toString(radix);
function _M0TPB4IterGcE(param0, param1) {
  this.f = param0;
  this.size_hint = param1;
}
function _M0TPB9ArrayViewGyE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function $makebytes(a, b) {
  const arr = new Uint8Array(a);
  if (b !== 0) {
    arr.fill(b);
  }
  return arr;
}
const _M0MPB7JSArray4push = (arr, val) => { arr.push(val); };
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0TPB3MapGsiE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB5EntryGsiE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0TPC15bytes9BytesView(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
const $bytes_literal$0 = new Uint8Array();
const _M0MPB7JSArray11set__length = (arr, len) => { arr.length = len; };
const _M0MPB7JSArray7splice1 = (arr, idx, cnt, val) => arr.splice(idx, cnt, val);
const _M0FPC28encoding4utf816encode__utf8__js = (() => {
   const encoder = new TextEncoder();
   return function(src, start, len, bom) {
     const end = start + len;
     const encoded = encoder.encode(src.slice(start, end));
     if (!bom) {
       return encoded;
     }
     const result = new Uint8Array(encoded.length + 3);
     result[0] = 0xEF;
     result[1] = 0xBB;
     result[2] = 0xBF;
     result.set(encoded, 3);
     return result;
   };
 })();
const _M0FPC28encoding4utf823decode__utf8__lossy__js = ((preserveBOMDecoder, dropBOMDecoder) => function(bytes, start, len, preserveBOM) {
   const end = start + len;
   const slice = bytes.subarray(start, end);
   const decoder = preserveBOM ? preserveBOMDecoder : dropBOMDecoder;
   return decoder.decode(slice);
 })(
   new TextDecoder("utf-8", { ignoreBOM: true }),
   new TextDecoder("utf-8", { ignoreBOM: false }),
 );
function _M0TPC13ref3RefGsE(param0) {
  this.val = param0;
}
const _M0FPC13env13now__internal = function() {
   const nowMs = Date.now();
   return BigInt.asUintN(64, BigInt(nowMs));
 };
function $i32_reinterpret_f32(a) {
  $reinterpret_view.setFloat32(0, a, true);
  return $reinterpret_view.getInt32(0, true);
}
function $f64_reinterpret_i64(a) {
  $reinterpret_view.setFloat64(0, a, false);
  return BigInt.asUintN(64, $reinterpret_view.getBigUint64(0, false));
}
function $i64_reinterpret_f64(a) {
  $reinterpret_view.setBigUint64(0, BigInt.asUintN(64, a), false);
  return $reinterpret_view.getFloat64(0, false);
}
function _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE2Ok.prototype.$tag = 1;
function _M0DTPC15error5Error62soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eUnsupportedModel(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error62soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eUnsupportedModel.prototype.$tag = 42;
function _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMissingKey(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMissingKey.prototype.$tag = 41;
function _M0DTPC15error5Error55soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eWrongType(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error55soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eWrongType.prototype.$tag = 40;
function _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyVocab() {}
_M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyVocab.prototype.$tag = 39;
const _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyVocab__ = new _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyVocab();
function _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyToken(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyToken.prototype.$tag = 38;
function _M0DTPC15error5Error61soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMergeNotInVocab(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error61soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMergeNotInVocab.prototype.$tag = 37;
function _M0DTPC15error5Error56soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadTemperature(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error56soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadTemperature.prototype.$tag = 36;
function _M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadK(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadK.prototype.$tag = 35;
function _M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadP(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadP.prototype.$tag = 34;
function _M0DTPC15error5Error53soehi_2fmoonlm_2fsampler_2eSamplerError_2eEmptyLogits() {}
_M0DTPC15error5Error53soehi_2fmoonlm_2fsampler_2eSamplerError_2eEmptyLogits.prototype.$tag = 33;
const _M0DTPC15error5Error53soehi_2fmoonlm_2fsampler_2eSamplerError_2eEmptyLogits__ = new _M0DTPC15error5Error53soehi_2fmoonlm_2fsampler_2eSamplerError_2eEmptyLogits();
function _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eMissingKey(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eMissingKey.prototype.$tag = 32;
function _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue.prototype.$tag = 31;
function _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor.prototype.$tag = 30;
function _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape.prototype.$tag = 29;
function _M0DTPC15error5Error59soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedTensorType(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error59soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedTensorType.prototype.$tag = 28;
function _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eEmptyPrompt() {}
_M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eEmptyPrompt.prototype.$tag = 27;
function _M0DTPC15error5Error53soehi_2fmoonlm_2fmodel_2eModelError_2eContextOverflow(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error53soehi_2fmoonlm_2fmodel_2eModelError_2eContextOverflow.prototype.$tag = 26;
function _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eTensorRead(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eTensorRead.prototype.$tag = 25;
function _M0DTPC15error5Error47soehi_2fmoonlm_2fmodel_2eModelError_2eTokenizer(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error47soehi_2fmoonlm_2fmodel_2eModelError_2eTokenizer.prototype.$tag = 24;
function _M0DTPC15error5Error61soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedArchitecture(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error61soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedArchitecture.prototype.$tag = 23;
function _M0DTPC15error5Error51soehi_2fmoonlm_2ftensor_2eTensorError_2eUnknownType(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error51soehi_2fmoonlm_2ftensor_2eTensorError_2eUnknownType.prototype.$tag = 22;
function _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eUnsupportedType(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eUnsupportedType.prototype.$tag = 21;
function _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eNegativeLength(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eNegativeLength.prototype.$tag = 20;
function _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eNotBlockAligned(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eNotBlockAligned.prototype.$tag = 19;
function _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eLengthOverflow(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eLengthOverflow.prototype.$tag = 18;
function _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eBufferTooSmall(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eBufferTooSmall.prototype.$tag = 17;
function _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eOutputTooSmall(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eOutputTooSmall.prototype.$tag = 16;
function _M0DTPC15error5Error45soehi_2fmoonlm_2fgguf_2eGgufError_2eTruncated(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error45soehi_2fmoonlm_2fgguf_2eGgufError_2eTruncated.prototype.$tag = 15;
function _M0DTPC15error5Error44soehi_2fmoonlm_2fgguf_2eGgufError_2eBadMagic(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error44soehi_2fmoonlm_2fgguf_2eGgufError_2eBadMagic.prototype.$tag = 14;
function _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eUnsupportedVersion(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eUnsupportedVersion.prototype.$tag = 13;
function _M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eUnknownValueType(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eUnknownValueType.prototype.$tag = 12;
function _M0DTPC15error5Error48soehi_2fmoonlm_2fgguf_2eGgufError_2eBadAlignment(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error48soehi_2fmoonlm_2fgguf_2eGgufError_2eBadAlignment.prototype.$tag = 11;
function _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eAlignmentWrongType(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eAlignmentWrongType.prototype.$tag = 10;
function _M0DTPC15error5Error55soehi_2fmoonlm_2fgguf_2eGgufError_2eArrayNestingTooDeep(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error55soehi_2fmoonlm_2fgguf_2eGgufError_2eArrayNestingTooDeep.prototype.$tag = 9;
function _M0DTPC15error5Error59soehi_2fmoonlm_2fgguf_2eGgufError_2eIllegalArrayElementType(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error59soehi_2fmoonlm_2fgguf_2eGgufError_2eIllegalArrayElementType.prototype.$tag = 8;
function _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountOverflow(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountOverflow.prototype.$tag = 7;
function _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountTooLarge(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountTooLarge.prototype.$tag = 6;
function _M0DTPC15error5Error58soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorCountImplausible(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error58soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorCountImplausible.prototype.$tag = 5;
function _M0DTPC15error5Error47soehi_2fmoonlm_2fgguf_2eGgufError_2eTooManyDims(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error47soehi_2fmoonlm_2fgguf_2eGgufError_2eTooManyDims.prototype.$tag = 4;
function _M0DTPC15error5Error57soehi_2fmoonlm_2fgguf_2eGgufError_2eDataSectionOutOfRange(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error57soehi_2fmoonlm_2fgguf_2eGgufError_2eDataSectionOutOfRange.prototype.$tag = 3;
function _M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorOutOfRange(param0, param1, param2, param3) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
  this._3 = param3;
}
_M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorOutOfRange.prototype.$tag = 2;
function _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorNotSupported(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorNotSupported.prototype.$tag = 1;
function _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eDequantFailed(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eDequantFailed.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTP35soehi6moonlm4gguf9MetaValue2U8(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue2U8.prototype.$tag = 0;
function _M0DTP35soehi6moonlm4gguf9MetaValue2I8(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue2I8.prototype.$tag = 1;
function _M0DTP35soehi6moonlm4gguf9MetaValue3U16(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3U16.prototype.$tag = 2;
function _M0DTP35soehi6moonlm4gguf9MetaValue3I16(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3I16.prototype.$tag = 3;
function _M0DTP35soehi6moonlm4gguf9MetaValue3U32(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3U32.prototype.$tag = 4;
function _M0DTP35soehi6moonlm4gguf9MetaValue3I32(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3I32.prototype.$tag = 5;
function _M0DTP35soehi6moonlm4gguf9MetaValue3F32(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3F32.prototype.$tag = 6;
function _M0DTP35soehi6moonlm4gguf9MetaValue4Bool(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue4Bool.prototype.$tag = 7;
function _M0DTP35soehi6moonlm4gguf9MetaValue3Str(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3Str.prototype.$tag = 8;
function _M0DTP35soehi6moonlm4gguf9MetaValue5Array(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue5Array.prototype.$tag = 9;
function _M0DTP35soehi6moonlm4gguf9MetaValue3U64(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3U64.prototype.$tag = 10;
function _M0DTP35soehi6moonlm4gguf9MetaValue3I64(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3I64.prototype.$tag = 11;
function _M0DTP35soehi6moonlm4gguf9MetaValue3F64(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaValue3F64.prototype.$tag = 12;
function _M0DTP35soehi6moonlm4gguf9MetaArray12Materialized(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaArray12Materialized.prototype.$tag = 0;
function _M0DTP35soehi6moonlm4gguf9MetaArray10Summarized(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm4gguf9MetaArray10Summarized.prototype.$tag = 1;
function _M0TP35soehi6moonlm4gguf16MetaArraySummary(param0, param1, param2) {
  this.elem_type = param0;
  this.count = param1;
  this.prefix = param2;
}
function _M0DTPC16option6OptionGdE4None() {}
_M0DTPC16option6OptionGdE4None.prototype.$tag = 0;
const _M0DTPC16option6OptionGdE4None__ = new _M0DTPC16option6OptionGdE4None();
function _M0DTPC16option6OptionGdE4Some(param0) {
  this._0 = param0;
}
_M0DTPC16option6OptionGdE4Some.prototype.$tag = 1;
function $f64_convert_i32_u(a) {
  return a < 0 ? a + 4294967296.0 : a + 0.0;
}
function $f64_convert_i64(a) {
  return Number(BigInt.asIntN(64, a));
}
function _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm4gguf10TensorInfo(param0, param1, param2, param3, param4, param5) {
  this.name = param0;
  this.dims = param1;
  this.type_id = param2;
  this.offset = param3;
  this.n_elems = param4;
  this.nbytes = param5;
}
function _M0TP35soehi6moonlm4gguf10ByteCursor(param0, param1) {
  this.buf = param0;
  this.pos = param1;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm4gguf8GgufFile(param0, param1, param2, param3, param4, param5) {
  this.version = param0;
  this.alignment = param1;
  this.tensors = param2;
  this.metadata = param3;
  this.data_start = param4;
  this.buf = param5;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm5model6Matrix(param0, param1, param2, param3, param4, param5) {
  this.name = param0;
  this.ty = param1;
  this.rows = param2;
  this.cols = param3;
  this.row_bytes = param4;
  this.data = param5;
}
function _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm5model6Vector(param0, param1) {
  this.name = param0;
  this.data = param1;
}
function _M0TPB9ArrayViewGfE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TP35soehi6moonlm5model7KVCache(param0, param1, param2, param3, param4, param5) {
  this.max_len = param0;
  this.head_dim = param1;
  this.n_head_kv = param2;
  this.k = param3;
  this.v = param4;
  this.len = param5;
}
function _M0TP35soehi6moonlm5model7Scratch(param0, param1, param2, param3, param4, param5, param6, param7, param8, param9, param10) {
  this.hidden = param0;
  this.normed = param1;
  this.q = param2;
  this.k = param3;
  this.v = param4;
  this.attn = param5;
  this.proj = param6;
  this.gate = param7;
  this.up = param8;
  this.logits = param9;
  this.scores = param10;
}
function _M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm5model11ModelConfig(param0, param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12) {
  this.architecture = param0;
  this.vocab_size = param1;
  this.n_embd = param2;
  this.n_layer = param3;
  this.n_ff = param4;
  this.n_head = param5;
  this.n_head_kv = param6;
  this.head_dim = param7;
  this.context_length = param8;
  this.rms_eps = param9;
  this.rope_theta = param10;
  this.n_rot = param11;
  this.tied_lm_head = param12;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm5model12LayerWeights(param0, param1, param2, param3, param4, param5, param6, param7, param8) {
  this.attn_norm = param0;
  this.wq = param1;
  this.wk = param2;
  this.wv = param3;
  this.wo = param4;
  this.ffn_norm = param5;
  this.w_gate = param6;
  this.w_up = param7;
  this.w_down = param8;
}
function _M0TP35soehi6moonlm5model5Model(param0, param1, param2, param3, param4, param5, param6) {
  this.config = param0;
  this.token_embd = param1;
  this.layers = param2;
  this.output_norm = param3;
  this.output = param4;
  this.cache = param5;
  this.scratch = param6;
}
function _M0TP35soehi6moonlm7sampler3Rng(param0) {
  this.state = param0;
}
function $f64_convert_i64_u(a) {
  return Number(a);
}
function _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok.prototype.$tag = 1;
function _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm9tokenizer10MergeTable(param0, param1, param2, param3) {
  this.lefts = param0;
  this.rights = param1;
  this.joined = param2;
  this.priority = param3;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok.prototype.$tag = 1;
function _M0TPB9ArrayViewGUsiEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TP35soehi6moonlm9tokenizer9Tokenizer(param0, param1, param2, param3, param4, param5, param6) {
  this.vocab = param0;
  this.token_ids = param1;
  this.specials = param2;
  this.merges = param3;
  this.ids = param4;
  this.add_bos = param5;
  this.add_eos = param6;
}
function _M0TP35soehi6moonlm9tokenizer10SpecialIds(param0, param1, param2, param3) {
  this.bos = param0;
  this.eos = param1;
  this.unk = param2;
  this.pad = param3;
}
function _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE2Ok.prototype.$tag = 1;
function _M0TP35soehi6moonlm6engine10PureEngine(param0, param1, param2) {
  this.model = param0;
  this.tokenizer = param1;
  this.path = param2;
}
function _M0TP35soehi6moonlm6engine15GenerationStats(param0, param1, param2, param3, param4) {
  this.prompt_tokens = param0;
  this.generated_tokens = param1;
  this.hit_eos = param2;
  this.prefill_seconds = param3;
  this.decode_seconds = param4;
}
function _M0TPB9ArrayViewGiE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTP35soehi6moonlm7sampler7Sampler6Greedy() {}
_M0DTP35soehi6moonlm7sampler7Sampler6Greedy.prototype.$tag = 0;
const _M0DTP35soehi6moonlm7sampler7Sampler6Greedy__ = new _M0DTP35soehi6moonlm7sampler7Sampler6Greedy();
function _M0DTP35soehi6moonlm7sampler7Sampler11Temperature(param0) {
  this._0 = param0;
}
_M0DTP35soehi6moonlm7sampler7Sampler11Temperature.prototype.$tag = 1;
function _M0DTP35soehi6moonlm7sampler7Sampler4TopK(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP35soehi6moonlm7sampler7Sampler4TopK.prototype.$tag = 2;
function _M0DTP35soehi6moonlm7sampler7Sampler4TopP(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP35soehi6moonlm7sampler7Sampler4TopP.prototype.$tag = 3;
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char, method_4: _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE, method_5: _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE };
const _M0MPB4Iter4nextN6constrS9385GcE = 0;
const _M0MPB4Iter4nextN6constrS9386GcE = 0;
const _M0MPB4Iter3newN6constrS9393GcE = 0;
const _M0FPC15float8infinity = $f32_reinterpret_i32(2139095040);
const _M0FPC15float13neg__infinity = $f32_reinterpret_i32(-8388608);
const _M0FPC14math14exp2f__data__n = 32 + 0;
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS456 = new _M0TP35soehi6moonlm6tensor8GgmlType(0, "f32", 1, 4);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS457 = new _M0TP35soehi6moonlm6tensor8GgmlType(1, "f16", 1, 2);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS458 = new _M0TP35soehi6moonlm6tensor8GgmlType(2, "q4_0", 32, 18);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS459 = new _M0TP35soehi6moonlm6tensor8GgmlType(3, "q4_1", 32, 20);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS460 = new _M0TP35soehi6moonlm6tensor8GgmlType(4, "q4_2 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS461 = new _M0TP35soehi6moonlm6tensor8GgmlType(5, "q4_3 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS462 = new _M0TP35soehi6moonlm6tensor8GgmlType(6, "q5_0", 32, 22);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS463 = new _M0TP35soehi6moonlm6tensor8GgmlType(7, "q5_1", 32, 24);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS464 = new _M0TP35soehi6moonlm6tensor8GgmlType(8, "q8_0", 32, 34);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS465 = new _M0TP35soehi6moonlm6tensor8GgmlType(9, "q8_1", 32, 36);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS466 = new _M0TP35soehi6moonlm6tensor8GgmlType(10, "q2_K", 256, 84);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS467 = new _M0TP35soehi6moonlm6tensor8GgmlType(11, "q3_K", 256, 110);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS468 = new _M0TP35soehi6moonlm6tensor8GgmlType(12, "q4_K", 256, 144);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS469 = new _M0TP35soehi6moonlm6tensor8GgmlType(13, "q5_K", 256, 176);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS470 = new _M0TP35soehi6moonlm6tensor8GgmlType(14, "q6_K", 256, 210);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS471 = new _M0TP35soehi6moonlm6tensor8GgmlType(15, "q8_K", 256, 292);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS472 = new _M0TP35soehi6moonlm6tensor8GgmlType(16, "iq2_xxs", 256, 66);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS473 = new _M0TP35soehi6moonlm6tensor8GgmlType(17, "iq2_xs", 256, 74);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS474 = new _M0TP35soehi6moonlm6tensor8GgmlType(18, "iq3_xxs", 256, 98);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS475 = new _M0TP35soehi6moonlm6tensor8GgmlType(19, "iq1_s", 256, 50);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS476 = new _M0TP35soehi6moonlm6tensor8GgmlType(20, "iq4_nl", 32, 18);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS477 = new _M0TP35soehi6moonlm6tensor8GgmlType(21, "iq3_s", 256, 110);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS478 = new _M0TP35soehi6moonlm6tensor8GgmlType(22, "iq2_s", 256, 82);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS479 = new _M0TP35soehi6moonlm6tensor8GgmlType(23, "iq4_xs", 256, 136);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS480 = new _M0TP35soehi6moonlm6tensor8GgmlType(24, "i8", 1, 1);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS481 = new _M0TP35soehi6moonlm6tensor8GgmlType(25, "i16", 1, 2);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS482 = new _M0TP35soehi6moonlm6tensor8GgmlType(26, "i32", 1, 4);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS483 = new _M0TP35soehi6moonlm6tensor8GgmlType(27, "i64", 1, 8);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS484 = new _M0TP35soehi6moonlm6tensor8GgmlType(28, "f64", 1, 8);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS485 = new _M0TP35soehi6moonlm6tensor8GgmlType(29, "iq1_m", 256, 56);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS486 = new _M0TP35soehi6moonlm6tensor8GgmlType(30, "bf16", 1, 2);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS487 = new _M0TP35soehi6moonlm6tensor8GgmlType(31, "q4_0_4_4 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS488 = new _M0TP35soehi6moonlm6tensor8GgmlType(32, "q4_0_4_8 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS489 = new _M0TP35soehi6moonlm6tensor8GgmlType(33, "q4_0_8_8 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS490 = new _M0TP35soehi6moonlm6tensor8GgmlType(34, "tq1_0", 256, 54);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS491 = new _M0TP35soehi6moonlm6tensor8GgmlType(35, "tq2_0", 256, 66);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS492 = new _M0TP35soehi6moonlm6tensor8GgmlType(36, "iq4_nl_4_4 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS493 = new _M0TP35soehi6moonlm6tensor8GgmlType(37, "iq4_nl_4_8 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS494 = new _M0TP35soehi6moonlm6tensor8GgmlType(38, "iq4_nl_8_8 (removed)", 0, 0);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS495 = new _M0TP35soehi6moonlm6tensor8GgmlType(39, "mxfp4", 32, 17);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS496 = new _M0TP35soehi6moonlm6tensor8GgmlType(40, "nvfp4", 64, 36);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS497 = new _M0TP35soehi6moonlm6tensor8GgmlType(41, "q1_0", 128, 18);
const _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS498 = new _M0TP35soehi6moonlm6tensor8GgmlType(42, "q2_0", 64, 18);
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS909 = "attn_norm";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS910 = "ffn_norm";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS864 = "attn_norm";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS911 = "attn_q";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS912 = "attn_k";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS913 = "attn_v";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS914 = "attn_output";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS915 = "ffn_gate";
const _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS916 = "ffn_up";
const _M0FP35soehi6moonlm9tokenizer23unicode__letter__ranges = [65, 90, 97, 122, 170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 895, 895, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1327, 1329, 1366, 1369, 1369, 1376, 1416, 1488, 1514, 1519, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2144, 2154, 2160, 2183, 2185, 2190, 2208, 2249, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2432, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2556, 2556, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2809, 2809, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3129, 3133, 3133, 3160, 3162, 3165, 3165, 3168, 3169, 3200, 3200, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3293, 3294, 3296, 3297, 3313, 3314, 3332, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3412, 3414, 3423, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3718, 3722, 3724, 3747, 3749, 3749, 3751, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5109, 5112, 5117, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5873, 5880, 5888, 5905, 5919, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6264, 6272, 6276, 6279, 6312, 6314, 6314, 6320, 6389, 6400, 6430, 6480, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6988, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7296, 7304, 7312, 7354, 7357, 7359, 7401, 7404, 7406, 7411, 7413, 7414, 7418, 7418, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8579, 8580, 11264, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12294, 12337, 12341, 12347, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12591, 12593, 12686, 12704, 12735, 12784, 12799, 13312, 19903, 19968, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42653, 42656, 42725, 42775, 42783, 42786, 42888, 42891, 42954, 42960, 42961, 42963, 42963, 42965, 42969, 42994, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43261, 43262, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43488, 43492, 43494, 43503, 43514, 43518, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43646, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43824, 43866, 43868, 43881, 43888, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65536, 65547, 65549, 65574, 65576, 65594, 65596, 65597, 65599, 65613, 65616, 65629, 65664, 65786, 66176, 66204, 66208, 66256, 66304, 66335, 66349, 66368, 66370, 66377, 66384, 66421, 66432, 66461, 66464, 66499, 66504, 66511, 66560, 66717, 66736, 66771, 66776, 66811, 66816, 66855, 66864, 66915, 66928, 66938, 66940, 66954, 66956, 66962, 66964, 66965, 66967, 66977, 66979, 66993, 66995, 67001, 67003, 67004, 67072, 67382, 67392, 67413, 67424, 67431, 67456, 67461, 67463, 67504, 67506, 67514, 67584, 67589, 67592, 67592, 67594, 67637, 67639, 67640, 67644, 67644, 67647, 67669, 67680, 67702, 67712, 67742, 67808, 67826, 67828, 67829, 67840, 67861, 67872, 67897, 67968, 68023, 68030, 68031, 68096, 68096, 68112, 68115, 68117, 68119, 68121, 68149, 68192, 68220, 68224, 68252, 68288, 68295, 68297, 68324, 68352, 68405, 68416, 68437, 68448, 68466, 68480, 68497, 68608, 68680, 68736, 68786, 68800, 68850, 68864, 68899, 69248, 69289, 69296, 69297, 69376, 69404, 69415, 69415, 69424, 69445, 69488, 69505, 69552, 69572, 69600, 69622, 69635, 69687, 69745, 69746, 69749, 69749, 69763, 69807, 69840, 69864, 69891, 69926, 69956, 69956, 69959, 69959, 69968, 70002, 70006, 70006, 70019, 70066, 70081, 70084, 70106, 70106, 70108, 70108, 70144, 70161, 70163, 70187, 70207, 70208, 70272, 70278, 70280, 70280, 70282, 70285, 70287, 70301, 70303, 70312, 70320, 70366, 70405, 70412, 70415, 70416, 70419, 70440, 70442, 70448, 70450, 70451, 70453, 70457, 70461, 70461, 70480, 70480, 70493, 70497, 70656, 70708, 70727, 70730, 70751, 70753, 70784, 70831, 70852, 70853, 70855, 70855, 71040, 71086, 71128, 71131, 71168, 71215, 71236, 71236, 71296, 71338, 71352, 71352, 71424, 71450, 71488, 71494, 71680, 71723, 71840, 71903, 71935, 71942, 71945, 71945, 71948, 71955, 71957, 71958, 71960, 71983, 71999, 71999, 72001, 72001, 72096, 72103, 72106, 72144, 72161, 72161, 72163, 72163, 72192, 72192, 72203, 72242, 72250, 72250, 72272, 72272, 72284, 72329, 72349, 72349, 72368, 72440, 72704, 72712, 72714, 72750, 72768, 72768, 72818, 72847, 72960, 72966, 72968, 72969, 72971, 73008, 73030, 73030, 73056, 73061, 73063, 73064, 73066, 73097, 73112, 73112, 73440, 73458, 73474, 73474, 73476, 73488, 73490, 73523, 73648, 73648, 73728, 74649, 74880, 75075, 77712, 77808, 77824, 78895, 78913, 78918, 82944, 83526, 92160, 92728, 92736, 92766, 92784, 92862, 92880, 92909, 92928, 92975, 92992, 92995, 93027, 93047, 93053, 93071, 93760, 93823, 93952, 94026, 94032, 94032, 94099, 94111, 94176, 94177, 94179, 94179, 94208, 100343, 100352, 101589, 101632, 101640, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 113664, 113770, 113776, 113788, 113792, 113800, 113808, 113817, 119808, 119892, 119894, 119964, 119966, 119967, 119970, 119970, 119973, 119974, 119977, 119980, 119982, 119993, 119995, 119995, 119997, 120003, 120005, 120069, 120071, 120074, 120077, 120084, 120086, 120092, 120094, 120121, 120123, 120126, 120128, 120132, 120134, 120134, 120138, 120144, 120146, 120485, 120488, 120512, 120514, 120538, 120540, 120570, 120572, 120596, 120598, 120628, 120630, 120654, 120656, 120686, 120688, 120712, 120714, 120744, 120746, 120770, 120772, 120779, 122624, 122654, 122661, 122666, 122928, 122989, 123136, 123180, 123191, 123197, 123214, 123214, 123536, 123565, 123584, 123627, 124112, 124139, 124896, 124902, 124904, 124907, 124909, 124910, 124912, 124926, 124928, 125124, 125184, 125251, 125259, 125259, 126464, 126467, 126469, 126495, 126497, 126498, 126500, 126500, 126503, 126503, 126505, 126514, 126516, 126519, 126521, 126521, 126523, 126523, 126530, 126530, 126535, 126535, 126537, 126537, 126539, 126539, 126541, 126543, 126545, 126546, 126548, 126548, 126551, 126551, 126553, 126553, 126555, 126555, 126557, 126557, 126559, 126559, 126561, 126562, 126564, 126564, 126567, 126570, 126572, 126578, 126580, 126583, 126585, 126588, 126590, 126590, 126592, 126601, 126603, 126619, 126625, 126627, 126629, 126633, 126635, 126651, 131072, 173791, 173824, 177977, 177984, 178205, 178208, 183969, 183984, 191456, 191472, 192093, 194560, 195101, 196608, 201546, 201552, 205743];
const _M0FP35soehi6moonlm9tokenizer23unicode__number__ranges = [48, 57, 178, 179, 185, 185, 188, 190, 1632, 1641, 1776, 1785, 1984, 1993, 2406, 2415, 2534, 2543, 2548, 2553, 2662, 2671, 2790, 2799, 2918, 2927, 2930, 2935, 3046, 3058, 3174, 3183, 3192, 3198, 3302, 3311, 3416, 3422, 3430, 3448, 3558, 3567, 3664, 3673, 3792, 3801, 3872, 3891, 4160, 4169, 4240, 4249, 4969, 4988, 5870, 5872, 6112, 6121, 6128, 6137, 6160, 6169, 6470, 6479, 6608, 6618, 6784, 6793, 6800, 6809, 6992, 7001, 7088, 7097, 7232, 7241, 7248, 7257, 8304, 8304, 8308, 8313, 8320, 8329, 8528, 8578, 8581, 8585, 9312, 9371, 9450, 9471, 10102, 10131, 11517, 11517, 12295, 12295, 12321, 12329, 12344, 12346, 12690, 12693, 12832, 12841, 12872, 12879, 12881, 12895, 12928, 12937, 12977, 12991, 42528, 42537, 42726, 42735, 43056, 43061, 43216, 43225, 43264, 43273, 43472, 43481, 43504, 43513, 43600, 43609, 44016, 44025, 65296, 65305, 65799, 65843, 65856, 65912, 65930, 65931, 66273, 66299, 66336, 66339, 66369, 66369, 66378, 66378, 66513, 66517, 66720, 66729, 67672, 67679, 67705, 67711, 67751, 67759, 67835, 67839, 67862, 67867, 68028, 68029, 68032, 68047, 68050, 68095, 68160, 68168, 68221, 68222, 68253, 68255, 68331, 68335, 68440, 68447, 68472, 68479, 68521, 68527, 68858, 68863, 68912, 68921, 69216, 69246, 69405, 69414, 69457, 69460, 69573, 69579, 69714, 69743, 69872, 69881, 69942, 69951, 70096, 70105, 70113, 70132, 70384, 70393, 70736, 70745, 70864, 70873, 71248, 71257, 71360, 71369, 71472, 71483, 71904, 71922, 72016, 72025, 72784, 72812, 73040, 73049, 73120, 73129, 73552, 73561, 73664, 73684, 74752, 74862, 92768, 92777, 92864, 92873, 93008, 93017, 93019, 93025, 93824, 93846, 119488, 119507, 119520, 119539, 119648, 119672, 120782, 120831, 123200, 123209, 123632, 123641, 124144, 124153, 125127, 125135, 125264, 125273, 126065, 126123, 126125, 126127, 126129, 126132, 126209, 126253, 126255, 126269, 127232, 127244, 130032, 130041];
const _M0FP35soehi6moonlm9tokenizer22unicode__space__ranges = [9, 13, 28, 32, 133, 133, 160, 160, 5760, 5760, 8192, 8202, 8232, 8233, 8239, 8239, 8287, 8287, 12288, 12288];
const _M0FP35soehi6moonlm9tokenizer20byte__encoder__table = [256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 323, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255];
const _M0FP35soehi6moonlm3web5slots = [];
const _M0FP35soehi6moonlm3web12last__tokens = [];
const _M0FP35soehi6moonlm3web11last__error = _M0MPC13ref3Ref3RefGsE("");
const _M0FP35soehi6moonlm4gguf15find__alignmentN6constrS1663 = new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE2Ok(32);
const _M0FPB4seed = _M0FPB12random__seed();
const _M0MPC16string10StringView4findN6constrS9395 = 0;
const inv = _M0MPC15array5Array4makeGiE(291, -1);
let _tmp = 0;
while (true) {
  const b = _tmp;
  if (b < 256) {
    _M0MPC15array5Array3setGiE(inv, _M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm9tokenizer20byte__encoder__table, b) - 33 | 0, b);
    _tmp = b + 1 | 0;
    continue;
  } else {
    break;
  }
}
const _M0FP35soehi6moonlm9tokenizer20byte__decoder__table = inv;
const t = $make_array_len_and_init(256, 0);
let _tmp$2 = 0;
while (true) {
  const i = _tmp$2;
  if (i < 256) {
    const _p = i >= 128 ? i - 256 | 0 : i;
    $bound_check(t, i);
    t[i] = _p + 0;
    _tmp$2 = i + 1 | 0;
    continue;
  } else {
    break;
  }
}
const _M0FP35soehi6moonlm5model20sbyte__double__table = t;
const t$2 = _M0MPC15array5Array4makeGiE(256, 0);
let _tmp$3 = 0;
while (true) {
  const i = _tmp$3;
  if (i < 256) {
    _M0MPC15array5Array3setGiE(t$2, i, i >= 128 ? i - 256 | 0 : i);
    _tmp$3 = i + 1 | 0;
    continue;
  } else {
    break;
  }
}
const _M0FP35soehi6moonlm5model12sbyte__table = t$2;
const _p = 32;
const _M0FPC14math7expf__n = BigInt.asUintN(64, BigInt(_p));
const _M0FPC14math11exp2f__data = new _M0TPC14math9Exp2fData([4607182418800017408n, 4607140297302181236n, 4607100335213349135n, 4607062579818421073n, 4607027079437701499n, 4606993883449571754n, 4606963042313658936n, 4606934607594512097n, 4606908631985796885n, 4606885169335019979n, 4606864274668794914n, 4606846004218661165n, 4606830415447468583n, 4606817567076339586n, 4606807519112221737n, 4606800332876043653n, 4606796071031487437n, 4606794797614391156n, 4606796578062795143n, 4606801479247646227n, 4606809569504174299n, 4606820918663955941n, 4606835598087680144n, 4606853680698631517n, 4606875241016906669n, 4606900355194379847n, 4606929101050434204n, 4606961558108475497n, 4606997807633245319n, 4607037932668951391n, 4607082018078232794n, 4607130150581978432n], 6755399441055744, 1.4426950408889634 * _M0FPC14math14exp2f__data__n, [0.055503615593415351 / _M0FPC14math14exp2f__data__n / _M0FPC14math14exp2f__data__n / _M0FPC14math14exp2f__data__n, 0.2402284522445722 / _M0FPC14math14exp2f__data__n / _M0FPC14math14exp2f__data__n, 0.69314718069162029 / _M0FPC14math14exp2f__data__n]);
const _M0IP35soehi6moonlm6engine10PureEngineP35soehi6moonlm6engine6Engine8generateN6constrS149 = new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err("the prompt encoded to zero tokens");
function _M0FPB13consume4__acc(acc, input) {
  const _p$2 = (acc >>> 0) + ((Math.imul(input, -1028477379) | 0) >>> 0) | 0;
  const _p$3 = 17;
  return Math.imul(_p$2 << _p$3 | (_p$2 >>> (32 - _p$3 | 0) | 0), 668265263) | 0;
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGyEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp$4 = 0;
    while (true) {
      const i = _tmp$4;
      if (i < len) {
        const _tmp$5 = dst_offset + i | 0;
        const _tmp$6 = src_offset + i | 0;
        $bound_check(src, _tmp$6);
        $bound_check(dst, _tmp$5);
        dst[_tmp$5] = src[_tmp$6];
        _tmp$4 = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp$4 = len - 1 | 0;
    while (true) {
      const i = _tmp$4;
      if (i >= 0) {
        const _tmp$5 = dst_offset + i | 0;
        const _tmp$6 = src_offset + i | 0;
        $bound_check(src, _tmp$6);
        $bound_check(dst, _tmp$5);
        dst[_tmp$5] = src[_tmp$6];
        _tmp$4 = i - 1 | 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPC15array10FixedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp$4 = 0;
    while (true) {
      const i = _tmp$4;
      if (i < len) {
        const _tmp$5 = dst_offset + i | 0;
        const _tmp$6 = src_offset + i | 0;
        $bound_check(src, _tmp$6);
        $bound_check(dst, _tmp$5);
        dst[_tmp$5] = src[_tmp$6];
        _tmp$4 = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp$4 = len - 1 | 0;
    while (true) {
      const i = _tmp$4;
      if (i >= 0) {
        const _tmp$5 = dst_offset + i | 0;
        const _tmp$6 = src_offset + i | 0;
        $bound_check(src, _tmp$6);
        $bound_check(dst, _tmp$5);
        dst[_tmp$5] = src[_tmp$6];
        _tmp$4 = i - 1 | 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPB18UninitializedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGyEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGyE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Uint8Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB13StringBuilder13write__objectGiE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGiE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGsE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGsE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGlE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGlE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGjE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGjE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGmE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGmE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGdE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGdE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder21StringBuilder_2einner(size_hint) {
  return new _M0TPB13StringBuilder("");
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0FPB32code__point__of__surrogate__pair(leading, trailing) {
  return (((Math.imul(leading - 55296 | 0, 1024) | 0) + trailing | 0) - 56320 | 0) + 65536 | 0;
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0FPB14avalanche__acc(acc) {
  let acc$2 = acc;
  acc$2 = acc$2 ^ (acc$2 >>> 15 | 0);
  acc$2 = Math.imul(acc$2, -2048144777) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 13 | 0);
  acc$2 = Math.imul(acc$2, -1028477379) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 16 | 0);
  return acc$2;
}
function _M0FPB13finalize__acc(acc) {
  return _M0FPB14avalanche__acc(acc);
}
function _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPC16string6String11sub_2einner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    const _end = _Some;
    end$2 = _end;
  }
  if (start >= 0 && (start <= end$2 && end$2 <= len)) {
    if (start < len) {
      const _p$2 = self.charCodeAt(start);
      if (!(_p$2 >= 56320 && _p$2 <= 57343)) {
      } else {
        $panic();
      }
    }
    if (end$2 < len) {
      const _p$2 = self.charCodeAt(end$2);
      if (!(_p$2 >= 56320 && _p$2 <= 57343)) {
      } else {
        $panic();
      }
    }
    return new _M0TPC16string10StringView(self, start, end$2);
  } else {
    return $panic();
  }
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String11sub_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show6outputGiE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC13int3IntPB4Show10to__string(self));
}
function _M0IP016_24default__implPB4Show6outputGsE(self, logger) {
  logger.method_table.method_0(logger.self, self);
}
function _M0IP016_24default__implPB4Show6outputGlE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC15int645Int64PB4Show10to__string(self));
}
function _M0IP016_24default__implPB4Show6outputGjE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC14uint4UIntPB4Show10to__string(self));
}
function _M0IP016_24default__implPB4Show6outputGmE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC16uint646UInt64PB4Show10to__string(self));
}
function _M0IP016_24default__implPB4Show6outputGdE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC16double6DoublePB4Show10to__string(self));
}
function _M0MPB4Iter4nextGcE(self) {
  const _func = self.f;
  const result = _func();
  const _bind = self.size_hint;
  if (result === -1) {
    self.size_hint = _M0MPB4Iter4nextN6constrS9386GcE;
  } else {
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _n = _Some;
      self.size_hint = _n > 0 ? _n - 1 | 0 : _M0MPB4Iter4nextN6constrS9385GcE;
    }
  }
  return result;
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPC14uint4UInt18to__string_2einner(self, radix) {
  return _M0FPB20uint__to__string__js(self, radix);
}
function _M0MPC15int645Int6418to__string_2einner(self, radix) {
  return _M0FPB21int64__to__string__js(self, radix);
}
function _M0MPC16uint646UInt6418to__string_2einner(self, radix) {
  return _M0FPB22uint64__to__string__js(self, radix);
}
function _M0MPB4Iter3newGcE(f, size_hint) {
  let size_hint$2;
  if (size_hint === undefined) {
    size_hint$2 = undefined;
  } else {
    const _Some = size_hint;
    const _n = _Some;
    size_hint$2 = _n > 0 ? _n : _M0MPB4Iter3newN6constrS9393GcE;
  }
  return new _M0TPB4IterGcE(f, size_hint$2);
}
function _M0MPC15array10FixedArray12view_2einnerGyE(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    const _end = _Some;
    end$2 = _end;
  }
  if (start >= 0 && (start <= end$2 && end$2 <= len)) {
    const _bind = self;
    const _bind$2 = end$2 - start | 0;
    return new _M0TPB9ArrayViewGyE(_bind, start, start + _bind$2 | 0);
  } else {
    return $panic();
  }
}
function _M0MPC16string10StringView9to__owned(self) {
  return self.str.substring(self.start, self.end);
}
function _M0MPC16string6String20unsafe__range__equal(self, self_off, other, other_off, len) {
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < len) {
      const _p$2 = self.charCodeAt(self_off + i | 0);
      const _p$3 = other.charCodeAt(other_off + i | 0);
      if (_p$2 === _p$3) {
      } else {
        return false;
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0MPC16string10StringView9to__owned(str)}`;
}
function _M0FPB27find__pattern__scalar__from(target, pattern, start) {
  const pattern_len = pattern.end - pattern.start | 0;
  const last_offset = pattern_len - 1 | 0;
  const first = pattern.str.charCodeAt(pattern.start);
  const last = pattern.str.charCodeAt(pattern.start + last_offset | 0);
  const last_candidate = (target.end - target.start | 0) - pattern_len | 0;
  let _tmp$4 = start;
  while (true) {
    const candidate = _tmp$4;
    if (candidate <= last_candidate) {
      let middle_matches;
      let _tmp$5 = 1;
      while (true) {
        const i = _tmp$5;
        if (i < last_offset) {
          const _p$2 = target.str.charCodeAt(target.start + (candidate + i | 0) | 0);
          const _p$3 = pattern.str.charCodeAt(pattern.start + i | 0);
          if (_p$2 !== _p$3) {
            middle_matches = false;
            break;
          }
          _tmp$5 = i + 1 | 0;
          continue;
        } else {
          middle_matches = true;
          break;
        }
      }
      let _tmp$6;
      if (middle_matches) {
        let _tmp$7;
        const _p$2 = target.str.charCodeAt(target.start + candidate | 0);
        if (_p$2 === first) {
          const _p$3 = target.str.charCodeAt(target.start + (candidate + last_offset | 0) | 0);
          _tmp$7 = _p$3 === last;
        } else {
          _tmp$7 = false;
        }
        _tmp$6 = _tmp$7;
      } else {
        _tmp$6 = false;
      }
      if (_tmp$6) {
        return candidate;
      }
      _tmp$4 = candidate + 1 | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0FPB36find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last) {
  let _tmp$4 = start;
  while (true) {
    const pos = _tmp$4;
    if (pos < candidate_end) {
      let _tmp$5;
      const _p$2 = data.charCodeAt(pos);
      if (_p$2 === first) {
        const _p$3 = data.charCodeAt(pos + last_offset | 0);
        _tmp$5 = _p$3 === last;
      } else {
        _tmp$5 = false;
      }
      if (_tmp$5) {
        return pos;
      }
      _tmp$4 = pos + 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB42find__two__anchor__candidate__from__string(data, start, candidate_end, first, last_offset, last) {
  return _M0FPB36find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last);
}
function _M0FPB21string__ranges__equal(left, left_start, right, right_start, length) {
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < length) {
      const _p$2 = left.charCodeAt(left_start + i | 0);
      const _p$3 = right.charCodeAt(right_start + i | 0);
      if (_p$2 !== _p$3) {
        return false;
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0FPB22find__by__two__anchors(target, pattern) {
  const target_len = target.end - target.start | 0;
  const pattern_len = pattern.end - pattern.start | 0;
  const target_start = target.start;
  const pattern_start = pattern.start;
  const last_offset = pattern_len - 1 | 0;
  const candidate_end = ((target_start + target_len | 0) - pattern_len | 0) + 1 | 0;
  const first = pattern.str.charCodeAt(pattern.start);
  const last = pattern.str.charCodeAt(pattern.start + last_offset | 0);
  const middle_len = last_offset - 1 | 0;
  let _tmp$4 = target_start;
  let _tmp$5 = 0;
  while (true) {
    const pos = _tmp$4;
    const failures = _tmp$5;
    if (pos < candidate_end) {
      const found = _M0FPB42find__two__anchor__candidate__from__string(target.str, pos, candidate_end, first, last_offset, last);
      if (found < 0) {
        return undefined;
      }
      if (_M0FPB21string__ranges__equal(target.str, found + 1 | 0, pattern.str, pattern_start + 1 | 0, middle_len)) {
        return found - target_start | 0;
      }
      const failures$2 = failures + 1 | 0;
      const scanned = found - target_start | 0;
      if (failures$2 > 64 || failures$2 > (4 + (scanned / 8 | 0) | 0)) {
        return _M0FPB27find__pattern__scalar__from(target, pattern, scanned + 1 | 0);
      }
      _tmp$4 = found + 1 | 0;
      _tmp$5 = failures$2;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0FPB24find__code__unit__scalar(data, start, end, code) {
  let _tmp$4 = start;
  while (true) {
    const pos = _tmp$4;
    if (pos < end) {
      const _p$2 = data.charCodeAt(pos);
      if (_p$2 === code) {
        return pos;
      }
      _tmp$4 = pos + 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB30find__code__unit__from__string(data, start, end, code) {
  return _M0FPB24find__code__unit__scalar(data, start, end, code);
}
function _M0FPB28find__code__unit__from__view(target, start, end, code) {
  const target_start = target.start;
  const found = _M0FPB30find__code__unit__from__string(target.str, target_start + start | 0, target_start + end | 0, code);
  return found < 0 ? -1 : found - target_start | 0;
}
function _M0MPC16string10StringView4find(self, str) {
  const pattern_len = str.end - str.start | 0;
  switch (pattern_len) {
    case 0: {
      return _M0MPC16string10StringView4findN6constrS9395;
    }
    case 1: {
      const found = _M0FPB28find__code__unit__from__view(self, 0, self.end - self.start | 0, str.str.charCodeAt(str.start));
      return found < 0 ? undefined : found;
    }
    default: {
      return pattern_len > (self.end - self.start | 0) ? undefined : _M0FPB22find__by__two__anchors(self, str);
    }
  }
}
function _M0MPC16string10StringView11has__prefix(self, str) {
  const str_len = str.end - str.start | 0;
  if (str_len <= (self.end - self.start | 0)) {
    let _tmp$4;
    if (str_len === 0) {
      _tmp$4 = true;
    } else {
      const _p$2 = self.str.charCodeAt(self.start);
      const _p$3 = str.str.charCodeAt(str.start);
      _tmp$4 = _p$2 === _p$3;
    }
    if (_tmp$4) {
      return _M0MPC16string6String20unsafe__range__equal(self.str, self.start, str.str, str.start, str_len);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function _M0MPC15array5Array4pushGORP35soehi6moonlm6engine10PureEngineE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGiE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGUsiEE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGcE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0FPB36string__contains__code__unit__scalar(str, start, end, code) {
  let _tmp$4 = start;
  while (true) {
    const i = _tmp$4;
    if (i < end) {
      const _p$2 = str.charCodeAt(i);
      if (_p$2 === code) {
        return true;
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return false;
}
function _M0FPB28string__contains__code__unit(str, start, end, code) {
  return _M0FPB36string__contains__code__unit__scalar(str, start, end, code);
}
function _M0MPC16string10StringView20contains__code__unit(self, code) {
  return _M0FPB28string__contains__code__unit(self.str, self.start, self.end, code);
}
function _M0MPC16string10StringView8contains(self, str) {
  const _bind = str.end - str.start | 0;
  switch (_bind) {
    case 0: {
      return true;
    }
    case 1: {
      return _M0MPC16string10StringView20contains__code__unit(self, str.str.charCodeAt(str.start));
    }
    default: {
      const _bind$2 = _M0MPC16string10StringView4find(self, str);
      return !(_bind$2 === undefined);
    }
  }
}
function _M0MPC16string6String8contains(self, str) {
  return _M0MPC16string10StringView8contains(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0MPC16string6String4iter(self) {
  const len = self.length;
  const index = new _M0TPB8MutLocalGiE(0);
  return _M0MPB4Iter3newGcE(() => {
    if (index.val < len) {
      const c1 = self.charCodeAt(index.val);
      if (c1 >= 55296 && c1 <= 56319 && (index.val + 1 | 0) < len) {
        const c2 = self.charCodeAt(index.val + 1 | 0);
        if (c2 >= 56320 && c2 <= 57343) {
          const c = _M0FPB32code__point__of__surrogate__pair(c1, c2);
          index.val = index.val + 2 | 0;
          return c;
        }
      }
      index.val = index.val + 1 | 0;
      return c1;
    } else {
      return -1;
    }
  }, undefined);
}
function _M0IPC14char4CharPB4Show10to__string(self) {
  return String.fromCodePoint(self);
}
function _M0MPC16string6String9to__array(self) {
  const _p$2 = _M0MPC16string6String4iter(self);
  const _p$3 = [];
  let _p$4 = _p$3;
  while (true) {
    const _p$5 = _M0MPB4Iter4nextGcE(_p$2);
    if (_p$5 === -1) {
      break;
    } else {
      const _p$6 = _p$5;
      const _p$7 = _p$6;
      const _p$8 = _p$4;
      _M0MPC15array5Array4pushGcE(_p$8, _p$7);
      _p$4 = _p$8;
      continue;
    }
  }
  return _p$4;
}
function _M0MPC14byte4Byte10to__uint64(self) {
  const _p$2 = self;
  return BigInt.asUintN(64, BigInt(_p$2 >>> 0));
}
function _M0IPC13int3IntPB4Show10to__string(self) {
  return _M0MPC13int3Int18to__string_2einner(self, 10);
}
function _M0IPC15int645Int64PB4Show10to__string(self) {
  return _M0MPC15int645Int6418to__string_2einner(self, 10);
}
function _M0IPC14uint4UIntPB4Show10to__string(self) {
  return _M0MPC14uint4UInt18to__string_2einner(self, 10);
}
function _M0IPC16uint646UInt64PB4Show10to__string(self) {
  return _M0MPC16uint646UInt6418to__string_2einner(self, 10);
}
function _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(self, f) {
  if (self.$tag === 1) {
    const _Ok = self;
    const _value = _Ok._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(f(_value));
  } else {
    const _Err = self;
    const _err = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_err);
  }
}
function _M0MPC16result6Result3mapGjRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(self, f) {
  if (self.$tag === 1) {
    const _Ok = self;
    const _value = _Ok._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(f(_value));
  } else {
    const _Err = self;
    const _err = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_err);
  }
}
function _M0MPC16result6Result3mapGfRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(self, f) {
  if (self.$tag === 1) {
    const _Ok = self;
    const _value = _Ok._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(f(_value));
  } else {
    const _Err = self;
    const _err = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_err);
  }
}
function _M0MPC16result6Result3mapGUszERP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(self, f) {
  if (self.$tag === 1) {
    const _Ok = self;
    const _value = _Ok._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(f(_value));
  } else {
    const _Err = self;
    const _err = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_err);
  }
}
function _M0MPC16result6Result3mapGdRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(self, f) {
  if (self.$tag === 1) {
    const _Ok = self;
    const _value = _Ok._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(f(_value));
  } else {
    const _Err = self;
    const _err = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_err);
  }
}
function _M0MPC16result6Result6unwrapGlRP35soehi6moonlm6tensor11TensorErrorE(self) {
  if (self.$tag === 1) {
    const _Ok = self;
    return _Ok._0;
  } else {
    return $panic();
  }
}
function _M0MPC15array10FixedArray11from__arrayGiE(array) {
  const _p$2 = array.end - array.start | 0;
  if (_p$2 <= 0) {
    return [];
  } else {
    const _p$3 = 0;
    const _p$4 = $make_array_len_and_init(_p$2, array.buf[array.start + _p$3 | 0]);
    let _tmp$4 = 1;
    while (true) {
      const _p$5 = _tmp$4;
      if (_p$5 < _p$2) {
        $bound_check(_p$4, _p$5);
        _p$4[_p$5] = array.buf[array.start + _p$5 | 0];
        _tmp$4 = _p$5 + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return _p$4;
  }
}
function _M0MPC15array10FixedArray11from__arrayGfE(array) {
  const _p$2 = array.end - array.start | 0;
  if (_p$2 <= 0) {
    return [];
  } else {
    const _p$3 = 0;
    const _p$4 = $make_array_len_and_init(_p$2, array.buf[array.start + _p$3 | 0]);
    let _tmp$4 = 1;
    while (true) {
      const _p$5 = _tmp$4;
      if (_p$5 < _p$2) {
        $bound_check(_p$4, _p$5);
        _p$4[_p$5] = array.buf[array.start + _p$5 | 0];
        _tmp$4 = _p$5 + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return _p$4;
  }
}
function _M0MPC13int3Int20next__power__of__two(self) {
  if (self >= 0) {
    if (self <= 1) {
      return 1;
    }
    if (self > 1073741824) {
      return 1073741824;
    }
    return (2147483647 >> (Math.clz32(self - 1 | 0) - 1 | 0)) + 1 | 0;
  } else {
    return $panic();
  }
}
function _M0FPB8new__mapGsiE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = (Math.imul(capacity$2, 13) | 0) / 16 | 0;
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGsiE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB21capacity__for__length(length) {
  let capacity = _M0MPC13int3Int20next__power__of__two(length);
  const _p$2 = capacity;
  if (length > ((Math.imul(_p$2, 13) | 0) / 16 | 0)) {
    capacity = Math.imul(capacity, 2) | 0;
  }
  return capacity;
}
function _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp$4 = self.entries;
    $bound_check(_tmp$4, _bind);
    const _p$2 = _tmp$4[_bind];
    let _tmp$5;
    if (_p$2 === undefined) {
      _tmp$5 = $panic();
    } else {
      const _p$3 = _p$2;
      _tmp$5 = _p$3;
    }
    _tmp$5.next = entry;
  }
  self.tail = idx;
  const _tmp$4 = self.entries;
  $bound_check(_tmp$4, idx);
  _tmp$4[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map10set__entryGsiE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  const _tmp$4 = self.entries;
  $bound_check(_tmp$4, new_idx);
  _tmp$4[new_idx] = entry;
}
function _M0MPB3Map10push__awayGsiE(self, idx, entry) {
  let _tmp$4 = entry.psl + 1 | 0;
  let _tmp$5 = idx + 1 & self.capacity_mask;
  let _tmp$6 = entry;
  while (true) {
    const psl = _tmp$4;
    const idx$2 = _tmp$5;
    const entry$2 = _tmp$6;
    const _tmp$7 = self.entries;
    $bound_check(_tmp$7, idx$2);
    const _bind = _tmp$7[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGsiE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGsiE(self, entry$2, idx$2);
        _tmp$4 = _curr_entry.psl + 1 | 0;
        _tmp$5 = idx$2 + 1 & self.capacity_mask;
        _tmp$6 = _curr_entry;
        continue;
      } else {
        _tmp$4 = psl + 1 | 0;
        _tmp$5 = idx$2 + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGsiE(self, outer) {
  const hash = outer.hash;
  let _tmp$4 = 0;
  let _tmp$5 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp$4;
    const idx = _tmp$5;
    const _tmp$6 = self.entries;
    $bound_check(_tmp$6, idx);
    const _bind = _tmp$6[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGsiE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGsiE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGsiE(self, idx, outer);
        return undefined;
      } else {
        _tmp$4 = psl + 1 | 0;
        _tmp$5 = idx + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map4growGsiE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  const _p$2 = self.capacity;
  self.grow_at = (Math.imul(_p$2, 13) | 0) / 16 | 0;
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp$4 = old_head;
  while (true) {
    const x = _tmp$4;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGsiE(self, _e);
      _tmp$4 = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsiE(self, key, value, hash) {
  let _tmp$4 = 0;
  let _tmp$5 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp$4;
    const idx = _tmp$5;
    const _tmp$6 = self.entries;
    $bound_check(_tmp$6, idx);
    const _bind = _tmp$6[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsiE(self);
        _tmp$4 = 0;
        _tmp$5 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsiE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsiE(self);
          _tmp$4 = 0;
          _tmp$5 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsiE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsiE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry);
        return undefined;
      }
      _tmp$4 = psl + 1 | 0;
      _tmp$5 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3setGsiE(self, key, value) {
  _M0MPB3Map15set__with__hashGsiE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3MapGsiE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    const _p$2 = _M0FPB21capacity__for__length(length);
    capacity$2 = _capacity > _p$2 ? _capacity : _p$2;
  }
  const m = _M0FPB8new__mapGsiE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsiE(m, e._0, e._1);
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3getGsiE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp$4 = 0;
  let _tmp$5 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp$4;
    const idx = _tmp$5;
    const _tmp$6 = self.entries;
    $bound_check(_tmp$6, idx);
    const _bind = _tmp$6[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp$4 = i + 1 | 0;
      _tmp$5 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPC15bytes5Bytes12view_2einner(self, start, end) {
  const len = self.length;
  let end$2;
  if (end === undefined) {
    end$2 = len;
  } else {
    const _Some = end;
    const _end = _Some;
    end$2 = _end;
  }
  if (start >= 0 && (start <= end$2 && end$2 <= len)) {
    const _bind = end$2 - start | 0;
    return new _M0TPC15bytes9BytesView(self, start, start + _bind | 0);
  } else {
    return $panic();
  }
}
function _M0IPC16string6StringPB4Hash4hash(self) {
  let acc = (_M0FPB4seed >>> 0) + (374761393 >>> 0) | 0;
  const _bind = self.length;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < _bind) {
      acc = (acc >>> 0) + (4 >>> 0) | 0;
      const v = self.charCodeAt(i);
      acc = _M0FPB13consume4__acc(acc, v);
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FPB13finalize__acc(acc);
}
function _M0MPB18UninitializedArray19unsafe__blit__fixedGfE(dst, dst_offset, src, src_offset, len) {
  let _tmp$4 = len - 1 | 0;
  while (true) {
    const i = _tmp$4;
    if (i >= 0) {
      const _tmp$5 = dst_offset + i | 0;
      const _tmp$6 = src_offset + i | 0;
      $bound_check(src, _tmp$6);
      $bound_check(dst, _tmp$5);
      dst[_tmp$5] = src[_tmp$6];
      _tmp$4 = i - 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0IPC16double6DoublePB4Show10to__string(self) {
  return String(self);
}
function _M0MPC15array10FixedArray17blit__from__bytes(self, bytes_offset, src, src_offset, length) {
  const e1 = (bytes_offset + length | 0) - 1 | 0;
  const e2 = (src_offset + length | 0) - 1 | 0;
  const len1 = self.length;
  const len2 = src.length;
  if (length >= 0 && (bytes_offset >= 0 && (e1 < len1 && (src_offset >= 0 && e2 < len2)))) {
    _M0MPC15array10FixedArray12unsafe__blitGyE(self, bytes_offset, src, src_offset, length);
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15bytes9BytesView9to__owned(self) {
  if ((self.end - self.start | 0) === self.buf.length) {
    return self.buf;
  }
  const bytes = $makebytes(self.end - self.start | 0, 0);
  _M0MPC15array10FixedArray17blit__from__bytes(bytes, 0, self.buf, self.start, self.end - self.start | 0);
  return bytes;
}
function _M0MPC15bytes5Bytes24unsafe__read__uint64__le(bytes, index) {
  return BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index]) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 1 | 0]) << BigInt(8 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 2 | 0]) << BigInt(16 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 3 | 0]) << BigInt(24 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 4 | 0]) << BigInt(32 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 5 | 0]) << BigInt(40 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 6 | 0]) << BigInt(48 & 63))) | BigInt.asUintN(64, _M0MPC14byte4Byte10to__uint64(bytes[index + 7 | 0]) << BigInt(56 & 63)));
}
function _M0MPC15bytes5Bytes24unsafe__read__uint32__le(bytes, index) {
  const _p$2 = bytes[index];
  const _p$3 = bytes[index + 1 | 0];
  const _tmp$4 = _p$2 | _p$3 << 8;
  const _p$4 = bytes[index + 2 | 0];
  const _tmp$5 = _tmp$4 | _p$4 << 16;
  const _p$5 = bytes[index + 3 | 0];
  return _tmp$5 | _p$5 << 24;
}
function _M0MPC15bytes5Bytes24unsafe__read__uint16__le(bytes, index) {
  const _p$2 = bytes[index];
  const _p$3 = bytes[index + 1 | 0];
  const _p$4 = 8;
  const _p$5 = _p$3 << _p$4 & 65535;
  return (_p$2 | _p$5) & 65535;
}
function _M0MPC15bytes5Bytes11from__array(arr) {
  const len = arr.end - arr.start | 0;
  if (len === 0) {
    return $bytes_literal$0;
  }
  const result = _M0MPB18UninitializedArray23unsafe__make__and__blitGyE(arr.buf, len, arr.start, 0, len);
  return result;
}
function _M0MPC15array5Array44unsafe__make__and__blit__from__fixed_2einnerGfE(src, allocate_len, len, src_offset, dst_offset) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray19unsafe__blit__fixedGfE(dst, dst_offset, src, src_offset, len);
  return dst;
}
function _M0MPC15array5Array28unsafe__truncate__to__lengthGiE(self, new_len) {
  _M0MPB7JSArray11set__length(self, new_len);
}
function _M0MPC15array5Array28unsafe__truncate__to__lengthGsE(self, new_len) {
  _M0MPB7JSArray11set__length(self, new_len);
}
function _M0MPC15array5Array6insertGiE(self, index, value) {
  if (index >= 0 && index <= self.length) {
    _M0MPB7JSArray7splice1(self, index, 0, value);
    return;
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(60);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "index out of bounds: the len is from 0 to ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, self.length);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " but the index is ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, index);
    $panic();
    return;
  }
}
function _M0MPC15array5Array2atGORP35soehi6moonlm6engine10PureEngineE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array2atGiE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array2atGsE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array2atGdE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array2atGcE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array3setGORP35soehi6moonlm6engine10PureEngineE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array3setGiE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array3setGsE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array3setGdE(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array4makeGiE(len, elem) {
  const arr = new Array(len);
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < len) {
      arr[i] = elem;
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array4makeGdE(len, elem) {
  const arr = new Array(len);
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < len) {
      arr[i] = elem;
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC15array5Array18from__fixed__arrayGfE(arr) {
  const len = arr.length;
  return _M0MPC15array5Array44unsafe__make__and__blit__from__fixed_2einnerGfE(arr, len, len, 0, 0);
}
function _M0MPC15array5Array5clearGiE(self) {
  _M0MPC15array5Array28unsafe__truncate__to__lengthGiE(self, 0);
}
function _M0MPC15array5Array8truncateGsE(self, len) {
  if (len >= 0 && len < self.length) {
    _M0MPC15array5Array28unsafe__truncate__to__lengthGsE(self, len);
    return;
  } else {
    return;
  }
}
function _M0FPC28encoding4utf814encode_2einner(str, bom) {
  return _M0FPC28encoding4utf816encode__utf8__js(str.str, str.start, str.end - str.start | 0, bom);
}
function _M0FPC28encoding4utf821decode__lossy_2einner(bytes, ignore_bom) {
  return _M0FPC28encoding4utf823decode__utf8__lossy__js(bytes.buf, bytes.start, bytes.end - bytes.start | 0, !ignore_bom);
}
function _M0MPC13ref3Ref3RefGsE(x) {
  return new _M0TPC13ref3RefGsE(x);
}
function _M0FPC13env3now() {
  return _M0FPC13env13now__internal();
}
function _M0FPC14math3sin(_tmp$4) {
  return Math.sin(_tmp$4);
}
function _M0FPC14math3cos(_tmp$4) {
  return Math.cos(_tmp$4);
}
function _M0FPC14math3pow(_tmp$4, _tmp$5) {
  return Math.pow(_tmp$4, _tmp$5);
}
function _M0FPC14math16____math__oflowf(sign) {
  const _p$2 = Math.fround(1.5845632502852868e+029);
  return Math.fround((sign !== 0 ? -_p$2 : _p$2) * _p$2);
}
function _M0FPC14math16____math__uflowf(sign) {
  const _p$2 = Math.fround(2.5243548967072378e-029);
  return Math.fround((sign !== 0 ? -_p$2 : _p$2) * _p$2);
}
function _M0FPC14math4expf(x) {
  const xd = x;
  const abstop = $i32_reinterpret_f32(x) >>> 20 & 2047;
  const _p$2 = Math.fround(88);
  if (abstop >>> 0 >= ($i32_reinterpret_f32(_p$2) >>> 20 | 0) >>> 0) {
    if ($i32_reinterpret_f32(x) === $i32_reinterpret_f32(_M0FPC15float13neg__infinity)) {
      return Math.fround(0);
    }
    if (abstop >>> 0 >= ($i32_reinterpret_f32(_M0FPC15float8infinity) >>> 20 | 0) >>> 0) {
      return Math.fround(x + x);
    }
    if (x > Math.fround(88.722831726074219)) {
      return _M0FPC14math16____math__oflowf(0);
    }
    if (x < Math.fround(-103.97207641601562)) {
      return _M0FPC14math16____math__uflowf(0);
    }
  }
  const z = _M0FPC14math11exp2f__data.invln2_scaled * xd;
  const kd = z + _M0FPC14math11exp2f__data.shift;
  const ki = $f64_reinterpret_i64(kd);
  const kd$2 = kd - _M0FPC14math11exp2f__data.shift;
  const r = z - kd$2;
  const _tmp$4 = _M0FPC14math11exp2f__data.tab;
  if (_M0FPC14math7expf__n === 0n) {
    $panic();
  }
  const _tmp$5 = Number(BigInt.asIntN(32, BigInt.asUintN(64, BigInt.asUintN(64, ki) % BigInt.asUintN(64, _M0FPC14math7expf__n)))) | 0;
  $bound_check(_tmp$4, _tmp$5);
  const t$3 = _tmp$4[_tmp$5];
  const t$4 = BigInt.asUintN(64, t$3 + BigInt.asUintN(64, ki << BigInt(47 & 63)));
  const s = $i64_reinterpret_f64(t$4);
  const _tmp$6 = _M0FPC14math11exp2f__data.poly_scaled;
  $bound_check(_tmp$6, 0);
  const _tmp$7 = _tmp$6[0] * r;
  const _tmp$8 = _M0FPC14math11exp2f__data.poly_scaled;
  $bound_check(_tmp$8, 1);
  const z$2 = _tmp$7 + _tmp$8[1];
  const r2 = r * r;
  const _tmp$9 = _M0FPC14math11exp2f__data.poly_scaled;
  $bound_check(_tmp$9, 2);
  const y = _tmp$9[2] * r + 1;
  const y$2 = z$2 * r2 + y;
  const y$3 = y$2 * s;
  return Math.fround(y$3);
}
function _M0FPC14math3exp(_tmp$4) {
  return Math.exp(_tmp$4);
}
function _M0MP35soehi6moonlm6tensor8GgmlType8from__id(id) {
  switch (id) {
    case 0: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS456;
    }
    case 1: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS457;
    }
    case 2: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS458;
    }
    case 3: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS459;
    }
    case 4: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS460;
    }
    case 5: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS461;
    }
    case 6: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS462;
    }
    case 7: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS463;
    }
    case 8: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS464;
    }
    case 9: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS465;
    }
    case 10: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS466;
    }
    case 11: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS467;
    }
    case 12: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS468;
    }
    case 13: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS469;
    }
    case 14: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS470;
    }
    case 15: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS471;
    }
    case 16: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS472;
    }
    case 17: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS473;
    }
    case 18: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS474;
    }
    case 19: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS475;
    }
    case 20: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS476;
    }
    case 21: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS477;
    }
    case 22: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS478;
    }
    case 23: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS479;
    }
    case 24: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS480;
    }
    case 25: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS481;
    }
    case 26: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS482;
    }
    case 27: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS483;
    }
    case 28: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS484;
    }
    case 29: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS485;
    }
    case 30: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS486;
    }
    case 31: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS487;
    }
    case 32: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS488;
    }
    case 33: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS489;
    }
    case 34: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS490;
    }
    case 35: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS491;
    }
    case 36: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS492;
    }
    case 37: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS493;
    }
    case 38: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS494;
    }
    case 39: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS495;
    }
    case 40: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS496;
    }
    case 41: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS497;
    }
    case 42: {
      return _M0MP35soehi6moonlm6tensor8GgmlType8from__idN6recordS498;
    }
    default: {
      return new _M0TP35soehi6moonlm6tensor8GgmlType(id, "unknown", 0, 0);
    }
  }
}
function _M0MP35soehi6moonlm6tensor8GgmlType17is__dequantizable(self) {
  const _bind = self.id;
  switch (_bind) {
    case 0: {
      return true;
    }
    case 1: {
      return true;
    }
    case 2: {
      return true;
    }
    case 8: {
      return true;
    }
    case 12: {
      return true;
    }
    case 14: {
      return true;
    }
    default: {
      return false;
    }
  }
}
function _M0MP35soehi6moonlm6tensor8GgmlType6nbytes(self, n_elems) {
  if (BigInt.asIntN(64, n_elems) < BigInt.asIntN(64, 0n)) {
    return new _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eNegativeLength(n_elems));
  }
  if (!(self.block_size > 0)) {
    return new _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2ftensor_2eTensorError_2eUnknownType(self.id));
  }
  const block_size = BigInt.asUintN(64, BigInt(self.block_size));
  if (block_size === 0n) {
    $panic();
  }
  if (BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asIntN(64, n_elems) % BigInt.asIntN(64, block_size))) !== BigInt.asUintN(64, 0n)) {
    return new _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eNotBlockAligned(n_elems, self.block_size));
  }
  if (block_size === 0n) {
    $panic();
  }
  return new _M0DTPC16result6ResultGlRP35soehi6moonlm6tensor11TensorErrorE2Ok(BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asIntN(64, n_elems) / BigInt.asIntN(64, block_size)) * BigInt.asUintN(64, BigInt(self.type_size))));
}
function _M0MP35soehi6moonlm6tensor11TensorError7message(self) {
  switch (self.$tag) {
    case 22: {
      const _UnknownType = self;
      const _type_id = _UnknownType._0;
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(21);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "unknown ggml type id ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder, _type_id);
      return _string_builder.val;
    }
    case 21: {
      const _UnsupportedType = self;
      const _type_id$2 = _UnsupportedType._0;
      const _name = _UnsupportedType._1;
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(57);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "unsupported ggml type ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, _type_id$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " (");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _name);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "): dequantization not implemented");
      return _string_builder$2.val;
    }
    case 20: {
      const _NegativeLength = self;
      const _n_elems = _NegativeLength._0;
      const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(23);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "negative element count ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$3, _n_elems);
      return _string_builder$3.val;
    }
    case 19: {
      const _NotBlockAligned = self;
      const _n_elems$2 = _NotBlockAligned._0;
      const _block_size = _NotBlockAligned._1;
      const _string_builder$4 = _M0MPB13StringBuilder21StringBuilder_2einner(42);
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$4, _n_elems$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, " elements is not a multiple of block size ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$4, _block_size);
      return _string_builder$4.val;
    }
    case 18: {
      const _LengthOverflow = self;
      const _n_elems$3 = _LengthOverflow._0;
      const _string_builder$5 = _M0MPB13StringBuilder21StringBuilder_2einner(41);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "element count ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$5, _n_elems$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, " exceeds 32-bit index range");
      return _string_builder$5.val;
    }
    case 17: {
      const _BufferTooSmall = self;
      const _offset = _BufferTooSmall._0;
      const _needed = _BufferTooSmall._1;
      const _available = _BufferTooSmall._2;
      const _string_builder$6 = _M0MPB13StringBuilder21StringBuilder_2einner(47);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, "buffer too small at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$6, _offset);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, ": need ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$6, _needed);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, " bytes, have ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$6, _available);
      return _string_builder$6.val;
    }
    default: {
      const _OutputTooSmall = self;
      const _out_offset = _OutputTooSmall._0;
      const _n_elems$4 = _OutputTooSmall._1;
      const _out_len = _OutputTooSmall._2;
      const _string_builder$7 = _M0MPB13StringBuilder21StringBuilder_2einner(41);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, "output too small at ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$7, _out_offset);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, ": need ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$7, _n_elems$4);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, " floats, have ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$7, _out_len);
      return _string_builder$7.val;
    }
  }
}
function _M0FP35soehi6moonlm6tensor9sbyte__at(buf, off) {
  const _tmp$4 = Number(BigInt.asIntN(32, off)) | 0;
  $bound_check(buf, _tmp$4);
  const u = buf[_tmp$4];
  return u >= 128 ? u - 256 | 0 : u;
}
function _M0FP35soehi6moonlm6tensor7u16__le(buf, off) {
  const _tmp$4 = Number(BigInt.asIntN(32, off)) | 0;
  $bound_check(buf, _tmp$4);
  const _tmp$5 = buf[_tmp$4];
  const _p$2 = BigInt.asUintN(64, off + 1n);
  const _tmp$6 = Number(BigInt.asIntN(32, _p$2)) | 0;
  $bound_check(buf, _tmp$6);
  return _tmp$5 | buf[_tmp$6] << 8;
}
function _M0FP35soehi6moonlm6tensor7u32__le(buf, off) {
  return _M0MPC15bytes5Bytes24unsafe__read__uint32__le(buf, Number(BigInt.asIntN(32, off)) | 0);
}
function _M0FP35soehi6moonlm6tensor12f16__to__f32(h) {
  const sign = (h & 32768) << 16;
  const exp = h >> 10 & 31;
  const mant = h & 1023;
  let bits;
  if (exp === 0) {
    if (mant === 0) {
      bits = sign;
    } else {
      let m = mant;
      let e = 113;
      while (true) {
        if ((m & 1024) === 0) {
          m = m << 1;
          e = e - 1 | 0;
          continue;
        } else {
          break;
        }
      }
      bits = sign | e << 23 | (m & 1023) << 13;
    }
  } else {
    bits = exp === 31 ? sign | 2139095040 | mant << 13 : sign | exp + 112 << 23 | mant << 13;
  }
  return $f32_reinterpret_i32(bits);
}
function _M0FP35soehi6moonlm6tensor7dq__f32(buf, base, out, o) {
  $bound_check(out, o);
  out[o] = $f32_reinterpret_i32(_M0FP35soehi6moonlm6tensor7u32__le(buf, base));
}
function _M0FP35soehi6moonlm6tensor7dq__f16(buf, base, out, o) {
  $bound_check(out, o);
  out[o] = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, base));
}
function _M0FP35soehi6moonlm6tensor9dq__q4__0(buf, base, out, o) {
  const d = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, base));
  let _tmp$4 = 0;
  while (true) {
    const j = _tmp$4;
    if (j < 16) {
      const _p$2 = BigInt.asUintN(64, BigInt.asUintN(64, base + 2n) + BigInt.asUintN(64, BigInt(j)));
      const _tmp$5 = Number(BigInt.asIntN(32, _p$2)) | 0;
      $bound_check(buf, _tmp$5);
      const b = buf[_tmp$5];
      const _tmp$6 = o + j | 0;
      $bound_check(out, _tmp$6);
      out[_tmp$6] = Math.fround(Math.fround((b & 15) - 8 | 0) * d);
      const _tmp$7 = (o + j | 0) + 16 | 0;
      $bound_check(out, _tmp$7);
      out[_tmp$7] = Math.fround(Math.fround((b >> 4) - 8 | 0) * d);
      _tmp$4 = j + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP35soehi6moonlm6tensor9dq__q8__0(buf, base, out, o) {
  const d = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, base));
  let _tmp$4 = 0;
  while (true) {
    const j = _tmp$4;
    if (j < 32) {
      const _tmp$5 = o + j | 0;
      $bound_check(out, _tmp$5);
      out[_tmp$5] = Math.fround(Math.fround(_M0FP35soehi6moonlm6tensor9sbyte__at(buf, BigInt.asUintN(64, BigInt.asUintN(64, base + 2n) + BigInt.asUintN(64, BigInt(j))))) * d);
      _tmp$4 = j + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP35soehi6moonlm6tensor14scale__min__k4(j, buf, q_off) {
  if (j < 4) {
    const _p$2 = BigInt.asUintN(64, q_off + BigInt.asUintN(64, BigInt(j)));
    const _tmp$4 = Number(BigInt.asIntN(32, _p$2)) | 0;
    $bound_check(buf, _tmp$4);
    const _tmp$5 = buf[_tmp$4] & 63;
    const _p$3 = BigInt.asUintN(64, q_off + BigInt.asUintN(64, BigInt(j + 4 | 0)));
    const _tmp$6 = Number(BigInt.asIntN(32, _p$3)) | 0;
    $bound_check(buf, _tmp$6);
    return { _0: _tmp$5, _1: buf[_tmp$6] & 63 };
  } else {
    const _p$2 = BigInt.asUintN(64, q_off + BigInt.asUintN(64, BigInt(j + 4 | 0)));
    const _tmp$4 = Number(BigInt.asIntN(32, _p$2)) | 0;
    $bound_check(buf, _tmp$4);
    const hi = buf[_tmp$4];
    const _p$3 = BigInt.asUintN(64, q_off + BigInt.asUintN(64, BigInt(j - 4 | 0)));
    const _tmp$5 = Number(BigInt.asIntN(32, _p$3)) | 0;
    $bound_check(buf, _tmp$5);
    const carry_scale = buf[_tmp$5];
    const _p$4 = BigInt.asUintN(64, q_off + BigInt.asUintN(64, BigInt(j)));
    const _tmp$6 = Number(BigInt.asIntN(32, _p$4)) | 0;
    $bound_check(buf, _tmp$6);
    const carry_min = buf[_tmp$6];
    return { _0: hi & 15 | carry_scale >> 6 << 4, _1: hi >> 4 | carry_min >> 6 << 4 };
  }
}
function _M0FP35soehi6moonlm6tensor9dq__q4__K(buf, base, out, o) {
  const d = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, base));
  const min = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, BigInt.asUintN(64, base + 2n)));
  const sc_base = BigInt.asUintN(64, base + 4n);
  const q_base = BigInt.asUintN(64, base + 16n);
  let _tmp$4 = 0;
  while (true) {
    const group = _tmp$4;
    if (group < 4) {
      const _bind = _M0FP35soehi6moonlm6tensor14scale__min__k4(Math.imul(group, 2) | 0, buf, sc_base);
      const _sc_lo = _bind._0;
      const _m_lo = _bind._1;
      const _bind$2 = _M0FP35soehi6moonlm6tensor14scale__min__k4((Math.imul(group, 2) | 0) + 1 | 0, buf, sc_base);
      const _sc_hi = _bind$2._0;
      const _m_hi = _bind$2._1;
      const d_lo = Math.fround(d * Math.fround(_sc_lo));
      const min_lo = Math.fround(min * Math.fround(_m_lo));
      const d_hi = Math.fround(d * Math.fround(_sc_hi));
      const min_hi = Math.fround(min * Math.fround(_m_hi));
      const q = BigInt.asUintN(64, q_base + BigInt.asUintN(64, BigInt(Math.imul(group, 32) | 0)));
      const y = o + (Math.imul(group, 64) | 0) | 0;
      let _tmp$5 = 0;
      while (true) {
        const l = _tmp$5;
        if (l < 32) {
          const _p$2 = BigInt.asUintN(64, q + BigInt.asUintN(64, BigInt(l)));
          const _tmp$6 = Number(BigInt.asIntN(32, _p$2)) | 0;
          $bound_check(buf, _tmp$6);
          const b = buf[_tmp$6];
          const _tmp$7 = y + l | 0;
          $bound_check(out, _tmp$7);
          out[_tmp$7] = Math.fround(Math.fround(d_lo * Math.fround(b & 15)) - min_lo);
          const _tmp$8 = (y + l | 0) + 32 | 0;
          $bound_check(out, _tmp$8);
          out[_tmp$8] = Math.fround(Math.fround(d_hi * Math.fround(b >> 4)) - min_hi);
          _tmp$5 = l + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = group + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP35soehi6moonlm6tensor9dq__q6__K(buf, base, out, o) {
  const d = _M0FP35soehi6moonlm6tensor12f16__to__f32(_M0FP35soehi6moonlm6tensor7u16__le(buf, BigInt.asUintN(64, base + 208n)));
  const qh_base = BigInt.asUintN(64, base + 128n);
  const sc_base = BigInt.asUintN(64, base + 192n);
  let _tmp$4 = 0;
  while (true) {
    const half = _tmp$4;
    if (half < 2) {
      const ql = BigInt.asUintN(64, base + BigInt.asUintN(64, BigInt(Math.imul(half, 64) | 0)));
      const qh = BigInt.asUintN(64, qh_base + BigInt.asUintN(64, BigInt(Math.imul(half, 32) | 0)));
      const sc = BigInt.asUintN(64, sc_base + BigInt.asUintN(64, BigInt(Math.imul(half, 8) | 0)));
      const y = o + (Math.imul(half, 128) | 0) | 0;
      let _tmp$5 = 0;
      while (true) {
        const l = _tmp$5;
        if (l < 32) {
          const sc_idx = l / 16 | 0;
          const _p$2 = BigInt.asUintN(64, qh + BigInt.asUintN(64, BigInt(l)));
          const _tmp$6 = Number(BigInt.asIntN(32, _p$2)) | 0;
          $bound_check(buf, _tmp$6);
          const qhv = buf[_tmp$6];
          const _p$3 = BigInt.asUintN(64, ql + BigInt.asUintN(64, BigInt(l)));
          const _tmp$7 = Number(BigInt.asIntN(32, _p$3)) | 0;
          $bound_check(buf, _tmp$7);
          const ql_lo = buf[_tmp$7];
          const _p$4 = BigInt.asUintN(64, ql + BigInt.asUintN(64, BigInt(l + 32 | 0)));
          const _tmp$8 = Number(BigInt.asIntN(32, _p$4)) | 0;
          $bound_check(buf, _tmp$8);
          const ql_hi = buf[_tmp$8];
          const q1 = (ql_lo & 15 | (qhv >> 0 & 3) << 4) - 32 | 0;
          const q2 = (ql_hi & 15 | (qhv >> 2 & 3) << 4) - 32 | 0;
          const q3 = (ql_lo >> 4 | (qhv >> 4 & 3) << 4) - 32 | 0;
          const q4 = (ql_hi >> 4 | (qhv >> 6 & 3) << 4) - 32 | 0;
          const _tmp$9 = y + l | 0;
          $bound_check(out, _tmp$9);
          out[_tmp$9] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm6tensor9sbyte__at(buf, BigInt.asUintN(64, sc + BigInt.asUintN(64, BigInt(sc_idx)))))) * Math.fround(q1));
          const _tmp$10 = (y + l | 0) + 32 | 0;
          $bound_check(out, _tmp$10);
          out[_tmp$10] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm6tensor9sbyte__at(buf, BigInt.asUintN(64, sc + BigInt.asUintN(64, BigInt(sc_idx + 2 | 0)))))) * Math.fround(q2));
          const _tmp$11 = (y + l | 0) + 64 | 0;
          $bound_check(out, _tmp$11);
          out[_tmp$11] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm6tensor9sbyte__at(buf, BigInt.asUintN(64, sc + BigInt.asUintN(64, BigInt(sc_idx + 4 | 0)))))) * Math.fround(q3));
          const _tmp$12 = (y + l | 0) + 96 | 0;
          $bound_check(out, _tmp$12);
          out[_tmp$12] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm6tensor9sbyte__at(buf, BigInt.asUintN(64, sc + BigInt.asUintN(64, BigInt(sc_idx + 6 | 0)))))) * Math.fround(q4));
          _tmp$5 = l + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = half + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP35soehi6moonlm6tensor11each__block(buf, start, n_blocks, out, out_offset, block_bytes, block_elems, f) {
  let _tmp$4 = start;
  let _tmp$5 = n_blocks;
  let _tmp$6 = out_offset;
  while (true) {
    const start$2 = _tmp$4;
    const n_blocks$2 = _tmp$5;
    const out_offset$2 = _tmp$6;
    if (BigInt.asIntN(64, n_blocks$2) <= BigInt.asIntN(64, 0n)) {
      return undefined;
    }
    f(buf, start$2, out, out_offset$2);
    _tmp$4 = BigInt.asUintN(64, start$2 + BigInt.asUintN(64, BigInt(block_bytes)));
    _tmp$5 = BigInt.asUintN(64, n_blocks$2 - 1n);
    _tmp$6 = out_offset$2 + block_elems | 0;
    continue;
  }
}
function _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, start, n_blocks, out, out_offset, f) {
  _M0FP35soehi6moonlm6tensor11each__block(buf, start, n_blocks, out, out_offset, ty.type_size, ty.block_size, f);
}
function _M0FP35soehi6moonlm6tensor13dequant__into(buf, offset, ty, n_elems, out, out_offset) {
  if (BigInt.asIntN(64, n_elems) < BigInt.asIntN(64, 0n)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eNegativeLength(n_elems));
  }
  if (!(ty.block_size > 0)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2ftensor_2eTensorError_2eUnknownType(ty.id));
  }
  if (!_M0MP35soehi6moonlm6tensor8GgmlType17is__dequantizable(ty)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eUnsupportedType(ty.id, ty.name));
  }
  const _tmp$4 = BigInt.asUintN(64, BigInt(ty.block_size));
  if (_tmp$4 === 0n) {
    $panic();
  }
  if (BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asIntN(64, n_elems) % BigInt.asIntN(64, _tmp$4))) !== BigInt.asUintN(64, 0n)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eNotBlockAligned(n_elems, ty.block_size));
  }
  if (BigInt.asIntN(64, n_elems) > BigInt.asIntN(64, 2147483647n)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eLengthOverflow(n_elems));
  }
  const needed = _M0MPC16result6Result6unwrapGlRP35soehi6moonlm6tensor11TensorErrorE(_M0MP35soehi6moonlm6tensor8GgmlType6nbytes(ty, n_elems));
  const available = BigInt.asUintN(64, BigInt(buf.length));
  if (BigInt.asIntN(64, offset) < BigInt.asIntN(64, 0n) || BigInt.asIntN(64, BigInt.asUintN(64, offset + needed)) > BigInt.asIntN(64, available)) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eBufferTooSmall(offset, needed, available));
  }
  const out_end = out_offset + (Number(BigInt.asIntN(32, n_elems)) | 0) | 0;
  if (out_offset < 0 || out_end > out.length) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eOutputTooSmall(out_offset, n_elems, out.length));
  }
  const _tmp$5 = BigInt.asUintN(64, BigInt(ty.block_size));
  if (_tmp$5 === 0n) {
    $panic();
  }
  const n_blocks = BigInt.asUintN(64, BigInt.asIntN(64, n_elems) / BigInt.asIntN(64, _tmp$5));
  const _bind = ty.id;
  switch (_bind) {
    case 0: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor7dq__f32);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    case 1: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor7dq__f16);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    case 2: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor9dq__q4__0);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    case 8: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor9dq__q8__0);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    case 12: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor9dq__q4__K);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    case 14: {
      _M0FP35soehi6moonlm6tensor15dequant__kernel(ty, buf, offset, n_blocks, out, out_offset, _M0FP35soehi6moonlm6tensor9dq__q6__K);
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE2Ok(undefined);
    }
    default: {
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftensor_2eTensorError_2eUnsupportedType(ty.id, ty.name));
    }
  }
}
function _M0FP35soehi6moonlm6tensor7dequant(buf, offset, ty, n_elems) {
  if (BigInt.asIntN(64, n_elems) < BigInt.asIntN(64, 0n) || BigInt.asIntN(64, n_elems) > BigInt.asIntN(64, 2147483647n)) {
    return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2ftensor_2eTensorError_2eLengthOverflow(n_elems));
  }
  const out = $make_array_len_and_init(Number(BigInt.asIntN(32, n_elems)) | 0, Math.fround(0));
  const _bind = _M0FP35soehi6moonlm6tensor13dequant__into(buf, offset, ty, n_elems, out, 0);
  if (_bind.$tag === 1) {
    return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE2Ok(_M0MPC15array5Array18from__fixed__arrayGfE(out));
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm6tensor11TensorErrorE3Err(_e);
  }
}
function _M0FP35soehi6moonlm6tensor15half__to__float(bits) {
  return _M0FP35soehi6moonlm6tensor12f16__to__f32(bits);
}
function _M0MP35soehi6moonlm4gguf9MetaValue8type__id(self) {
  switch (self.$tag) {
    case 0: {
      return 0;
    }
    case 1: {
      return 1;
    }
    case 2: {
      return 2;
    }
    case 3: {
      return 3;
    }
    case 4: {
      return 4;
    }
    case 5: {
      return 5;
    }
    case 6: {
      return 6;
    }
    case 7: {
      return 7;
    }
    case 8: {
      return 8;
    }
    case 9: {
      return 9;
    }
    case 10: {
      return 10;
    }
    case 11: {
      return 11;
    }
    default: {
      return 12;
    }
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9remaining(self) {
  return BigInt.asUintN(64, BigInt.asUintN(64, BigInt(self.buf.length)) - self.pos);
}
function _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, n) {
  const remaining = _M0MP35soehi6moonlm4gguf10ByteCursor9remaining(self);
  return BigInt.asIntN(64, n) > BigInt.asIntN(64, remaining) ? new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error45soehi_2fmoonlm_2fgguf_2eGgufError_2eTruncated(self.pos, n, remaining)) : new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE2Ok(undefined);
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, 4n);
  if (_bind.$tag === 1) {
    const v = _M0MPC15bytes5Bytes24unsafe__read__uint32__le(self.buf, Number(BigInt.asIntN(32, self.pos)) | 0);
    self.pos = BigInt.asUintN(64, self.pos + 4n);
    return new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE2Ok(v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__f32(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(self);
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    const _bits = _Ok._0;
    return new _M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE2Ok($f32_reinterpret_i32(_bits));
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGfRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, 8n);
  if (_bind.$tag === 1) {
    const v = _M0MPC15bytes5Bytes24unsafe__read__uint64__le(self.buf, Number(BigInt.asIntN(32, self.pos)) | 0);
    self.pos = BigInt.asUintN(64, self.pos + 8n);
    return new _M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE2Ok(v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGmRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__f64(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(self);
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    const _bits = _Ok._0;
    return new _M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE2Ok($i64_reinterpret_f64(_bits));
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGdRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__u16(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, 2n);
  if (_bind.$tag === 1) {
    const v = _M0MPC15bytes5Bytes24unsafe__read__uint16__le(self.buf, Number(BigInt.asIntN(32, self.pos)) | 0);
    self.pos = BigInt.asUintN(64, self.pos + 2n);
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok(v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor9read__i16(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u16(self);
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    const _v = _Ok._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok(_v >= 32768 ? _v - 65536 | 0 : _v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor8read__u8(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, 1n);
  if (_bind.$tag === 1) {
    const _tmp$4 = self.buf;
    const _tmp$5 = Number(BigInt.asIntN(32, self.pos)) | 0;
    $bound_check(_tmp$4, _tmp$5);
    const v = _tmp$4[_tmp$5];
    self.pos = BigInt.asUintN(64, self.pos + 1n);
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok(v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor8read__i8(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor8read__u8(self);
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    const _v = _Ok._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE2Ok(_v >= 128 ? _v - 256 | 0 : _v);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0FP35soehi6moonlm4gguf19decode__utf8__lossy(raw) {
  return _M0FPC28encoding4utf821decode__lossy_2einner(_M0MPC15bytes5Bytes12view_2einner(raw, 0, undefined), false);
}
function _M0MP35soehi6moonlm4gguf10ByteCursor11read__bytes(self, n) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, n);
  if (_bind.$tag === 1) {
    const start = self.pos;
    self.pos = BigInt.asUintN(64, self.pos + n);
    return new _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE2Ok(_M0MPC15bytes9BytesView9to__owned(_M0MPC15bytes5Bytes12view_2einner(self.buf, Number(BigInt.asIntN(32, start)) | 0, Number(BigInt.asIntN(32, BigInt.asUintN(64, start + n))) | 0)));
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor12read__string(self) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(self);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  } else {
    const _Ok = _bind;
    const _len = _Ok._0;
    if (BigInt.asUintN(64, _len) > BigInt.asUintN(64, 2147483647n)) {
      return new _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountTooLarge(BigInt.asUintN(64, self.pos - 8n), _len));
    }
    const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor11read__bytes(self, _len);
    if (_bind$2.$tag === 0) {
      const _Err = _bind$2;
      const _e = _Err._0;
      return new _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
    } else {
      const _Ok$2 = _bind$2;
      const _raw = _Ok$2._0;
      return new _M0DTPC16result6ResultGUszERP35soehi6moonlm4gguf9GgufErrorE2Ok({ _0: _M0FP35soehi6moonlm4gguf19decode__utf8__lossy(_raw), _1: _raw });
    }
  }
}
function _M0FP35soehi6moonlm4gguf19read__scalar__value(c, type_id) {
  switch (type_id) {
    case 0: {
      return _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor8read__u8(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue2U8(v));
    }
    case 1: {
      return _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor8read__i8(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue2I8(v));
    }
    case 2: {
      return _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__u16(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3U16(v));
    }
    case 3: {
      return _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__i16(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3I16(v));
    }
    case 4: {
      return _M0MPC16result6Result3mapGjRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3U32(v));
    }
    case 5: {
      const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
      if (_bind.$tag === 1) {
        const _Ok = _bind;
        const _bits = _Ok._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(new _M0DTP35soehi6moonlm4gguf9MetaValue3I32(_bits));
      } else {
        const _Err = _bind;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
    }
    case 6: {
      return _M0MPC16result6Result3mapGfRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__f32(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3F32(v));
    }
    case 7: {
      return _M0MPC16result6Result3mapGiRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor8read__u8(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue4Bool(v !== 0));
    }
    case 8: {
      return _M0MPC16result6Result3mapGUszERP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor12read__string(c), (pair) => new _M0DTP35soehi6moonlm4gguf9MetaValue3Str(pair._0));
    }
    case 10: {
      return _M0MPC16result6Result3mapGUszERP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3U64(v));
    }
    case 11: {
      const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
      if (_bind$2.$tag === 1) {
        const _Ok = _bind$2;
        const _bits = _Ok._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(new _M0DTP35soehi6moonlm4gguf9MetaValue3I64(_bits));
      } else {
        const _Err = _bind$2;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
    }
    case 12: {
      return _M0MPC16result6Result3mapGdRP35soehi6moonlm4gguf9GgufErrorRP35soehi6moonlm4gguf9MetaValueE(_M0MP35soehi6moonlm4gguf10ByteCursor9read__f64(c), (v) => new _M0DTP35soehi6moonlm4gguf9MetaValue3F64(v));
    }
    default: {
      return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eUnknownValueType(c.pos, type_id));
    }
  }
}
function _M0MP35soehi6moonlm4gguf10ByteCursor4skip(self, n) {
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor6ensure(self, n);
  if (_bind.$tag === 1) {
    self.pos = BigInt.asUintN(64, self.pos + n);
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE2Ok(undefined);
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
}
function _M0FP35soehi6moonlm4gguf21skip__array__elements(c, elem_type, n) {
  let elem_size;
  switch (elem_type) {
    case 0: {
      elem_size = 1n;
      break;
    }
    case 1: {
      elem_size = 1n;
      break;
    }
    case 7: {
      elem_size = 1n;
      break;
    }
    case 2: {
      elem_size = 2n;
      break;
    }
    case 3: {
      elem_size = 2n;
      break;
    }
    case 4: {
      elem_size = 4n;
      break;
    }
    case 5: {
      elem_size = 4n;
      break;
    }
    case 6: {
      elem_size = 4n;
      break;
    }
    case 8: {
      let i = 0;
      while (true) {
        if (i < n) {
          const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor12read__string(c);
          if (_bind.$tag === 1) {
          } else {
            const _Err = _bind;
            const _e = _Err._0;
            return new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
          }
          i = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE2Ok(undefined);
    }
    case 10: {
      elem_size = 8n;
      break;
    }
    case 11: {
      elem_size = 8n;
      break;
    }
    case 12: {
      elem_size = 8n;
      break;
    }
    default: {
      return new _M0DTPC16result6ResultGuRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error59soehi_2fmoonlm_2fgguf_2eGgufError_2eIllegalArrayElementType(c.pos, elem_type));
    }
  }
  const total = BigInt.asUintN(64, elem_size * BigInt.asUintN(64, BigInt(n)));
  return _M0MP35soehi6moonlm4gguf10ByteCursor4skip(c, total);
}
function _M0FP35soehi6moonlm4gguf26read__array__value_2einner(c, nesting, materialize) {
  if (nesting > 8) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2fgguf_2eGgufError_2eArrayNestingTooDeep(c.pos, nesting));
  }
  const start = c.pos;
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
  let elem_type;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    elem_type = _Ok._0;
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
  let count;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    count = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  if (!(elem_type >>> 0 <= 8 >>> 0 || elem_type >>> 0 >= 10 >>> 0 && elem_type >>> 0 <= 12 >>> 0) && elem_type !== 9) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error59soehi_2fmoonlm_2fgguf_2eGgufError_2eIllegalArrayElementType(start, elem_type));
  }
  if (BigInt.asUintN(64, count) > BigInt.asUintN(64, 2147483647n)) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountTooLarge(start, count));
  }
  const too_long = (Number(BigInt.asIntN(32, count)) | 0) > 1024;
  if (!too_long || (materialize || elem_type === 9)) {
    const elems = [];
    let i = 0;
    while (true) {
      if (i < (Number(BigInt.asIntN(32, count)) | 0)) {
        let v;
        if (elem_type === 9) {
          const _bind$3 = _M0FP35soehi6moonlm4gguf26read__array__value_2einner(c, nesting + 1 | 0, false);
          if (_bind$3.$tag === 1) {
            const _Ok = _bind$3;
            v = _Ok._0;
          } else {
            const _Err = _bind$3;
            const _e = _Err._0;
            return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
          }
        } else {
          const _bind$3 = _M0FP35soehi6moonlm4gguf19read__scalar__value(c, elem_type);
          if (_bind$3.$tag === 1) {
            const _Ok = _bind$3;
            v = _Ok._0;
          } else {
            const _Err = _bind$3;
            const _e = _Err._0;
            return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
          }
        }
        _M0MPC15array5Array4pushGUsiEE(elems, v);
        i = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(new _M0DTP35soehi6moonlm4gguf9MetaValue5Array(new _M0DTP35soehi6moonlm4gguf9MetaArray12Materialized(elems)));
  } else {
    const prefix = [];
    let i = 0;
    while (true) {
      if (i < 8 && i < (Number(BigInt.asIntN(32, count)) | 0)) {
        const _bind$3 = _M0FP35soehi6moonlm4gguf19read__scalar__value(c, elem_type);
        if (_bind$3.$tag === 1) {
          const _Ok = _bind$3;
          const _v = _Ok._0;
          _M0MPC15array5Array4pushGUsiEE(prefix, _v);
        } else {
          const _Err = _bind$3;
          const _e = _Err._0;
          return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
        }
        i = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    const skipped = (Number(BigInt.asIntN(32, count)) | 0) - prefix.length | 0;
    const _bind$3 = _M0FP35soehi6moonlm4gguf21skip__array__elements(c, elem_type, skipped);
    if (_bind$3.$tag === 1) {
      return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE2Ok(new _M0DTP35soehi6moonlm4gguf9MetaValue5Array(new _M0DTP35soehi6moonlm4gguf9MetaArray10Summarized(new _M0TP35soehi6moonlm4gguf16MetaArraySummary(elem_type, count, prefix))));
    } else {
      const _Err = _bind$3;
      const _e = _Err._0;
      return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf9MetaValueRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
    }
  }
}
function _M0FP35soehi6moonlm4gguf25read__meta__value_2einner(c, type_id, materialize) {
  return type_id === 9 ? _M0FP35soehi6moonlm4gguf26read__array__value_2einner(c, 0, materialize) : _M0FP35soehi6moonlm4gguf19read__scalar__value(c, type_id);
}
function _M0MP35soehi6moonlm4gguf9MetaValue10as__string(self) {
  if (self.$tag === 8) {
    const _Str = self;
    const _s = _Str._0;
    return _s;
  } else {
    return undefined;
  }
}
function _M0MP35soehi6moonlm4gguf9MetaValue7as__int(self) {
  let v;
  _L: {
    switch (self.$tag) {
      case 0: {
        const _U8 = self;
        const _v = _U8._0;
        v = _v;
        break _L;
      }
      case 1: {
        const _I8 = self;
        const _v$2 = _I8._0;
        v = _v$2;
        break _L;
      }
      case 2: {
        const _U16 = self;
        const _v$3 = _U16._0;
        v = _v$3;
        break _L;
      }
      case 3: {
        const _I16 = self;
        const _v$4 = _I16._0;
        v = _v$4;
        break _L;
      }
      case 4: {
        const _U32 = self;
        const _v$5 = _U32._0;
        return BigInt.asUintN(64, BigInt(_v$5 >>> 0));
      }
      case 5: {
        const _I32 = self;
        const _v$6 = _I32._0;
        return BigInt.asUintN(64, BigInt(_v$6));
      }
      case 10: {
        const _U64 = self;
        const _v$7 = _U64._0;
        return _v$7;
      }
      case 11: {
        const _I64 = self;
        const _v$8 = _I64._0;
        return _v$8;
      }
      case 7: {
        const _Bool = self;
        const _v$9 = _Bool._0;
        return _v$9 ? 1n : 0n;
      }
      default: {
        return undefined;
      }
    }
  }
  return BigInt.asUintN(64, BigInt(v));
}
function _M0MP35soehi6moonlm4gguf9MetaValue10as__double(self) {
  let v;
  _L: {
    switch (self.$tag) {
      case 6: {
        const _F32 = self;
        const _v = _F32._0;
        return new _M0DTPC16option6OptionGdE4Some(_v);
      }
      case 12: {
        const _F64 = self;
        const _v$2 = _F64._0;
        return new _M0DTPC16option6OptionGdE4Some(_v$2);
      }
      case 0: {
        const _U8 = self;
        const _v$3 = _U8._0;
        v = _v$3;
        break _L;
      }
      case 1: {
        const _I8 = self;
        const _v$4 = _I8._0;
        v = _v$4;
        break _L;
      }
      case 2: {
        const _U16 = self;
        const _v$5 = _U16._0;
        v = _v$5;
        break _L;
      }
      case 3: {
        const _I16 = self;
        const _v$6 = _I16._0;
        v = _v$6;
        break _L;
      }
      case 5: {
        const _I32 = self;
        const _v$7 = _I32._0;
        v = _v$7;
        break _L;
      }
      case 4: {
        const _U32 = self;
        const _v$8 = _U32._0;
        return new _M0DTPC16option6OptionGdE4Some($f64_convert_i32_u(_v$8));
      }
      case 10: {
        const _U64 = self;
        const _v$9 = _U64._0;
        return new _M0DTPC16option6OptionGdE4Some($f64_convert_i64(BigInt.asIntN(64, _v$9)));
      }
      case 11: {
        const _I64 = self;
        const _v$10 = _I64._0;
        return new _M0DTPC16option6OptionGdE4Some($f64_convert_i64(BigInt.asIntN(64, _v$10)));
      }
      default: {
        return _M0DTPC16option6OptionGdE4None__;
      }
    }
  }
  return new _M0DTPC16option6OptionGdE4Some(v + 0);
}
function _M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(self) {
  return _M0MP35soehi6moonlm6tensor8GgmlType8from__id(self.type_id);
}
function _M0MP35soehi6moonlm4gguf10TensorInfo17is__dequantizable(self) {
  return _M0MP35soehi6moonlm6tensor8GgmlType17is__dequantizable(_M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(self));
}
function _M0MP35soehi6moonlm4gguf8GgufFile9data__len(self) {
  return BigInt.asUintN(64, BigInt.asUintN(64, BigInt(self.buf.length)) - self.data_start);
}
function _M0MP35soehi6moonlm4gguf8GgufFile3get(self, key) {
  const _bind = self.metadata;
  const _bind$2 = _bind.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind$2) {
      const entry = _bind[_];
      if (entry._0 === key) {
        return entry._1;
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP35soehi6moonlm4gguf8GgufFile11get__string(self, key) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile3get(self, key);
  if (_bind === undefined) {
    return undefined;
  } else {
    const _Some = _bind;
    const _v = _Some;
    return _M0MP35soehi6moonlm4gguf9MetaValue10as__string(_v);
  }
}
function _M0MP35soehi6moonlm4gguf8GgufFile8get__int(self, key) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile3get(self, key);
  if (_bind === undefined) {
    return undefined;
  } else {
    const _Some = _bind;
    const _v = _Some;
    return _M0MP35soehi6moonlm4gguf9MetaValue7as__int(_v);
  }
}
function _M0MP35soehi6moonlm4gguf8GgufFile11get__double(self, key) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile3get(self, key);
  if (_bind === undefined) {
    return _M0DTPC16option6OptionGdE4None__;
  } else {
    const _Some = _bind;
    const _v = _Some;
    return _M0MP35soehi6moonlm4gguf9MetaValue10as__double(_v);
  }
}
function _M0MP35soehi6moonlm4gguf8GgufFile6tensor(self, name) {
  const _bind = self.tensors;
  const _bind$2 = _bind.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind$2) {
      const t$3 = _bind[_];
      if (t$3.name === name) {
        return t$3;
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP35soehi6moonlm4gguf8GgufFile17index__of__tensor(self, name) {
  const _bind = self.tensors;
  const _bind$2 = _bind.length;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < _bind$2) {
      const t$3 = _bind[i];
      if (t$3.name === name) {
        return i;
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0MP35soehi6moonlm4gguf8GgufFile13tensor__bytes(self, index) {
  const t$3 = _M0MPC15array5Array2atGsE(self.tensors, index);
  const _bind = t$3.nbytes;
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorOutOfRange(t$3.name, 0n, 18446744073709551615n, _M0MP35soehi6moonlm4gguf8GgufFile9data__len(self)));
  } else {
    const _Some = _bind;
    const _nbytes = _Some;
    const start = BigInt.asUintN(64, self.data_start + t$3.offset);
    const view = _M0MPC15bytes5Bytes12view_2einner(self.buf, Number(BigInt.asIntN(32, start)) | 0, Number(BigInt.asIntN(32, BigInt.asUintN(64, start + _nbytes))) | 0);
    return new _M0DTPC16result6ResultGzRP35soehi6moonlm4gguf9GgufErrorE2Ok(_M0MPC15bytes9BytesView9to__owned(view));
  }
}
function _M0MP35soehi6moonlm4gguf8GgufFile15dequant__tensor(self, index) {
  const t$3 = _M0MPC15array5Array2atGsE(self.tensors, index);
  if (!_M0MP35soehi6moonlm4gguf10TensorInfo17is__dequantizable(t$3)) {
    return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorNotSupported(t$3.name, t$3.type_id, _M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(t$3).name));
  }
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile13tensor__bytes(self, index);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  } else {
    const _Ok = _bind;
    const _payload = _Ok._0;
    const _bind$2 = _M0FP35soehi6moonlm6tensor7dequant(_payload, 0n, _M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(t$3), t$3.n_elems);
    if (_bind$2.$tag === 1) {
      const _Ok$2 = _bind$2;
      const _v = _Ok$2._0;
      return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE2Ok(_v);
    } else {
      const _Err = _bind$2;
      const _e = _Err._0;
      return new _M0DTPC16result6ResultGRPB5ArrayGfERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eDequantFailed(t$3.name, _M0MP35soehi6moonlm6tensor11TensorError7message(_e)));
    }
  }
}
function _M0FP35soehi6moonlm4gguf13product__dims(dims) {
  let acc = 1n;
  const _bind = dims.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind) {
      const d = dims[_];
      if (BigInt.asUintN(64, d) > BigInt.asUintN(64, 2147483647n)) {
        return undefined;
      }
      const n = d;
      let _tmp$5;
      if (BigInt.asUintN(64, n) !== BigInt.asUintN(64, 0n)) {
        const _tmp$6 = acc;
        if (n === 0n) {
          $panic();
        }
        _tmp$5 = BigInt.asIntN(64, _tmp$6) > BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asIntN(64, 9223372036854775807n) / BigInt.asIntN(64, n)));
      } else {
        _tmp$5 = false;
      }
      if (_tmp$5) {
        return undefined;
      }
      acc = BigInt.asUintN(64, acc * n);
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm4gguf22read__metadata_2einner(c, count, materialize) {
  const out = [];
  const min_bytes = BigInt.asUintN(64, count * 13n);
  if (BigInt.asUintN(64, min_bytes) > BigInt.asUintN(64, _M0MP35soehi6moonlm4gguf10ByteCursor9remaining(c))) {
    return new _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountOverflow(c.pos, count, 13n));
  }
  const n = Number(BigInt.asIntN(32, count)) | 0;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < n) {
      const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor12read__string(c);
      let key;
      if (_bind.$tag === 1) {
        const _Ok = _bind;
        const _pair = _Ok._0;
        key = _pair._0;
      } else {
        const _Err = _bind;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
      let type_id;
      if (_bind$2.$tag === 1) {
        const _Ok = _bind$2;
        type_id = _Ok._0;
      } else {
        const _Err = _bind$2;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      const _bind$3 = _M0FP35soehi6moonlm4gguf25read__meta__value_2einner(c, type_id, materialize);
      let value;
      if (_bind$3.$tag === 1) {
        const _Ok = _bind$3;
        value = _Ok._0;
      } else {
        const _Err = _bind$3;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      _M0MPC15array5Array4pushGUsiEE(out, { _0: key, _1: value });
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGUsRP35soehi6moonlm4gguf9MetaValueEERP35soehi6moonlm4gguf9GgufErrorE2Ok(out);
}
function _M0FP35soehi6moonlm4gguf19read__tensor__infos(c, count) {
  const out = [];
  const min_bytes = BigInt.asUintN(64, count * 24n);
  if (BigInt.asUintN(64, min_bytes) > BigInt.asUintN(64, _M0MP35soehi6moonlm4gguf10ByteCursor9remaining(c))) {
    return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error58soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorCountImplausible(count, _M0MP35soehi6moonlm4gguf10ByteCursor9remaining(c)));
  }
  const n = Number(BigInt.asIntN(32, count)) | 0;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < n) {
      const info_start = c.pos;
      const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor12read__string(c);
      let name;
      if (_bind.$tag === 1) {
        const _Ok = _bind;
        const _pair = _Ok._0;
        name = _pair._0;
      } else {
        const _Err = _bind;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
      let n_dims;
      if (_bind$2.$tag === 1) {
        const _Ok = _bind$2;
        n_dims = _Ok._0;
      } else {
        const _Err = _bind$2;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      if (n_dims >>> 0 > 4 >>> 0) {
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error47soehi_2fmoonlm_2fgguf_2eGgufError_2eTooManyDims(info_start, n_dims, 4));
      }
      const dims = [];
      let _tmp$5 = 0;
      while (true) {
        const i$2 = _tmp$5;
        if (i$2 < n_dims) {
          const _bind$3 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
          if (_bind$3.$tag === 1) {
            const _Ok = _bind$3;
            const _d = _Ok._0;
            _M0MPC15array5Array4pushGUsiEE(dims, _d);
          } else {
            const _Err = _bind$3;
            const _e = _Err._0;
            return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
          }
          _tmp$5 = i$2 + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      const _bind$3 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
      let type_id;
      if (_bind$3.$tag === 1) {
        const _Ok = _bind$3;
        type_id = _Ok._0;
      } else {
        const _Err = _bind$3;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      const _bind$4 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
      let offset;
      if (_bind$4.$tag === 1) {
        const _Ok = _bind$4;
        offset = _Ok._0;
      } else {
        const _Err = _bind$4;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
      }
      const _bind$5 = _M0FP35soehi6moonlm4gguf13product__dims(dims);
      let n_elems;
      if (_bind$5 === undefined) {
        return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fgguf_2eGgufError_2eCountTooLarge(info_start, offset));
      } else {
        const _Some = _bind$5;
        n_elems = _Some;
      }
      const ty = _M0MP35soehi6moonlm6tensor8GgmlType8from__id(type_id);
      let nbytes;
      if (ty.block_size > 0) {
        const _bind$6 = _M0MP35soehi6moonlm6tensor8GgmlType6nbytes(ty, n_elems);
        if (_bind$6.$tag === 1) {
          const _Ok = _bind$6;
          const _v = _Ok._0;
          nbytes = _v;
        } else {
          nbytes = undefined;
        }
      } else {
        nbytes = undefined;
      }
      _M0MPC15array5Array4pushGUsiEE(out, new _M0TP35soehi6moonlm4gguf10TensorInfo(name, dims, type_id, offset, n_elems, nbytes));
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGRP35soehi6moonlm4gguf10TensorInfoERP35soehi6moonlm4gguf9GgufErrorE2Ok(out);
}
function _M0FP35soehi6moonlm4gguf9align__up(pos, alignment) {
  const a = BigInt.asUintN(64, BigInt(alignment));
  if (BigInt.asIntN(64, a) <= BigInt.asIntN(64, 1n)) {
    return pos;
  } else {
    if (a === 0n) {
      $panic();
    }
    return BigInt.asUintN(64, BigInt.asUintN(64, BigInt.asIntN(64, BigInt.asUintN(64, BigInt.asUintN(64, pos + a) - 1n)) / BigInt.asIntN(64, a)) * a);
  }
}
function _M0FP35soehi6moonlm4gguf15find__alignment(metadata) {
  const _bind = metadata.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind) {
      const entry = metadata[_];
      if (entry._0 === "general.alignment") {
        const _bind$2 = entry._1;
        if (_bind$2.$tag === 4) {
          const _U32 = _bind$2;
          const _v = _U32._0;
          const a = _v;
          if (a <= 0 || (a & (a - 1 | 0)) !== 0) {
            return new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error48soehi_2fmoonlm_2fgguf_2eGgufError_2eBadAlignment(_v));
          }
          return new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE2Ok(_v);
        } else {
          return new _M0DTPC16result6ResultGjRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eAlignmentWrongType(_M0MP35soehi6moonlm4gguf9MetaValue8type__id(_bind$2)));
        }
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FP35soehi6moonlm4gguf15find__alignmentN6constrS1663;
}
function _M0MP35soehi6moonlm4gguf10ByteCursor3new(buf) {
  return new _M0TP35soehi6moonlm4gguf10ByteCursor(buf, 0n);
}
function _M0FP35soehi6moonlm4gguf11parse__with(buf, materialize) {
  const c = _M0MP35soehi6moonlm4gguf10ByteCursor3new(buf);
  const _bind = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
  let magic;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    magic = _Ok._0;
  } else {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error45soehi_2fmoonlm_2fgguf_2eGgufError_2eTruncated(0n, 4n, BigInt.asUintN(64, BigInt(c.buf.length))));
  }
  if (magic !== 1179993927) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error44soehi_2fmoonlm_2fgguf_2eGgufError_2eBadMagic(magic));
  }
  const _bind$2 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u32(c);
  let version;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    version = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  if (version === 1) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eUnsupportedVersion(version, 3));
  }
  if (version >>> 0 < 2 >>> 0 || version >>> 0 > 3 >>> 0) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error54soehi_2fmoonlm_2fgguf_2eGgufError_2eUnsupportedVersion(version, 3));
  }
  const _bind$3 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
  let tensor_count;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    tensor_count = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const _bind$4 = _M0MP35soehi6moonlm4gguf10ByteCursor9read__u64(c);
  let kv_count;
  if (_bind$4.$tag === 1) {
    const _Ok = _bind$4;
    kv_count = _Ok._0;
  } else {
    const _Err = _bind$4;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const _bind$5 = _M0FP35soehi6moonlm4gguf22read__metadata_2einner(c, kv_count, materialize);
  let metadata;
  if (_bind$5.$tag === 1) {
    const _Ok = _bind$5;
    metadata = _Ok._0;
  } else {
    const _Err = _bind$5;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const _bind$6 = _M0FP35soehi6moonlm4gguf15find__alignment(metadata);
  let alignment;
  if (_bind$6.$tag === 1) {
    const _Ok = _bind$6;
    alignment = _Ok._0;
  } else {
    const _Err = _bind$6;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const _bind$7 = _M0FP35soehi6moonlm4gguf19read__tensor__infos(c, tensor_count);
  let tensors;
  if (_bind$7.$tag === 1) {
    const _Ok = _bind$7;
    tensors = _Ok._0;
  } else {
    const _Err = _bind$7;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(_e);
  }
  const data_start = tensors.length === 0 ? c.pos : _M0FP35soehi6moonlm4gguf9align__up(c.pos, alignment);
  if (BigInt.asIntN(64, data_start) > BigInt.asIntN(64, BigInt.asUintN(64, BigInt(c.buf.length)))) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error57soehi_2fmoonlm_2fgguf_2eGgufError_2eDataSectionOutOfRange(data_start, BigInt.asUintN(64, BigInt(c.buf.length))));
  }
  const file = new _M0TP35soehi6moonlm4gguf8GgufFile(version, alignment, tensors, metadata, data_start, buf);
  const _bind$8 = tensors.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind$8) {
      const t$3 = tensors[_];
      const _bind$9 = t$3.nbytes;
      if (_bind$9 === undefined) {
      } else {
        const _Some = _bind$9;
        const _nbytes = _Some;
        const end = BigInt.asUintN(64, t$3.offset + _nbytes);
        if (BigInt.asIntN(64, end) > BigInt.asIntN(64, _M0MP35soehi6moonlm4gguf8GgufFile9data__len(file))) {
          return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE3Err(new _M0DTPC15error5Error52soehi_2fmoonlm_2fgguf_2eGgufError_2eTensorOutOfRange(t$3.name, t$3.offset, _nbytes, _M0MP35soehi6moonlm4gguf8GgufFile9data__len(file)));
        }
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGRP35soehi6moonlm4gguf8GgufFileRP35soehi6moonlm4gguf9GgufErrorE2Ok(file);
}
function _M0FP35soehi6moonlm4gguf30parse__materializing__metadata(buf) {
  return _M0FP35soehi6moonlm4gguf11parse__with(buf, true);
}
function _M0FP35soehi6moonlm4gguf15magic__to__text(found) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  let _tmp$4 = 0;
  while (true) {
    const shift = _tmp$4;
    if (shift <= 24) {
      const b = found >>> shift & 255;
      _M0IPB13StringBuilderPB6Logger11write__char(sb, b >= 32 && b < 127 ? b : 46);
      _tmp$4 = shift + 8 | 0;
      continue;
    } else {
      break;
    }
  }
  return sb.val;
}
function _M0MP35soehi6moonlm4gguf9GgufError7message(self) {
  switch (self.$tag) {
    case 15: {
      const _Truncated = self;
      const _offset = _Truncated._0;
      const _needed = _Truncated._1;
      const _remaining = _Truncated._2;
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(44);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "truncated at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder, _offset);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": needed ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder, _needed);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " bytes, ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder, _remaining);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " remain");
      return _string_builder.val;
    }
    case 14: {
      const _BadMagic = self;
      const _found = _BadMagic._0;
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(29);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "bad magic \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _M0FP35soehi6moonlm4gguf15magic__to__text(_found));
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "\": expected \"GGUF\"");
      return _string_builder$2.val;
    }
    case 13: {
      const _UnsupportedVersion = self;
      const _version = _UnsupportedVersion._0;
      const _supported_max = _UnsupportedVersion._1;
      const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(49);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "unsupported GGUF version ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$3, _version);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, ": this build accepts 2..");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$3, _supported_max);
      return _string_builder$3.val;
    }
    case 12: {
      const _UnknownValueType = self;
      const _offset$2 = _UnknownValueType._0;
      const _type_id = _UnknownValueType._1;
      const _string_builder$4 = _M0MPB13StringBuilder21StringBuilder_2einner(39);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "unknown metadata value type ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$4, _type_id);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, " at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$4, _offset$2);
      return _string_builder$4.val;
    }
    case 11: {
      const _BadAlignment = self;
      const _value = _BadAlignment._0;
      const _string_builder$5 = _M0MPB13StringBuilder21StringBuilder_2einner(51);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "general.alignment = ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$5, _value);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, " is not a positive power of two");
      return _string_builder$5.val;
    }
    case 10: {
      const _AlignmentWrongType = self;
      const _type_id$2 = _AlignmentWrongType._0;
      const _string_builder$6 = _M0MPB13StringBuilder21StringBuilder_2einner(45);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, "general.alignment has type ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$6, _type_id$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, ", expected u32 (4)");
      return _string_builder$6.val;
    }
    case 9: {
      const _ArrayNestingTooDeep = self;
      const _offset$3 = _ArrayNestingTooDeep._0;
      const _depth = _ArrayNestingTooDeep._1;
      const _string_builder$7 = _M0MPB13StringBuilder21StringBuilder_2einner(49);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, "array nesting depth ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$7, _depth);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, " at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$7, _offset$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, " exceeds the limit");
      return _string_builder$7.val;
    }
    case 8: {
      const _IllegalArrayElementType = self;
      const _offset$4 = _IllegalArrayElementType._0;
      const _type_id$3 = _IllegalArrayElementType._1;
      const _string_builder$8 = _M0MPB13StringBuilder21StringBuilder_2einner(57);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$8, "array element type ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$8, _type_id$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$8, " at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$8, _offset$4);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$8, " is not a scalar value type");
      return _string_builder$8.val;
    }
    case 7: {
      const _CountOverflow = self;
      const _offset$5 = _CountOverflow._0;
      const _count = _CountOverflow._1;
      const _elem_size = _CountOverflow._2;
      const _string_builder$9 = _M0MPB13StringBuilder21StringBuilder_2einner(53);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, "count ");
      _M0MPB13StringBuilder13write__objectGmE(_string_builder$9, _count);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, " at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$9, _offset$5);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, " overflows when multiplied by ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$9, _elem_size);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, " bytes");
      return _string_builder$9.val;
    }
    case 6: {
      const _CountTooLarge = self;
      const _offset$6 = _CountTooLarge._0;
      const _count$2 = _CountTooLarge._1;
      const _string_builder$10 = _M0MPB13StringBuilder21StringBuilder_2einner(39);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$10, "count ");
      _M0MPB13StringBuilder13write__objectGmE(_string_builder$10, _count$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$10, " at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$10, _offset$6);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$10, " is too large to index");
      return _string_builder$10.val;
    }
    case 5: {
      const _TensorCountImplausible = self;
      const _count$3 = _TensorCountImplausible._0;
      const _remaining$2 = _TensorCountImplausible._1;
      const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(48);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "tensor_count ");
      _M0MPB13StringBuilder13write__objectGmE(_string_builder$11, _count$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, " cannot fit in the remaining ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$11, _remaining$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, " bytes");
      return _string_builder$11.val;
    }
    case 4: {
      const _TooManyDims = self;
      const _offset$7 = _TooManyDims._0;
      const _n_dims = _TooManyDims._1;
      const _max_dims = _TooManyDims._2;
      const _string_builder$12 = _M0MPB13StringBuilder21StringBuilder_2einner(51);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$12, "tensor at offset ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$12, _offset$7);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$12, " declares ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$12, _n_dims);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$12, " dimensions, maximum is ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$12, _max_dims);
      return _string_builder$12.val;
    }
    case 3: {
      const _DataSectionOutOfRange = self;
      const _data_start = _DataSectionOutOfRange._0;
      const _buffer_len = _DataSectionOutOfRange._1;
      const _string_builder$13 = _M0MPB13StringBuilder21StringBuilder_2einner(46);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$13, "data section starts at ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$13, _data_start);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$13, ", past the ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$13, _buffer_len);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$13, "-byte buffer");
      return _string_builder$13.val;
    }
    case 2: {
      const _TensorOutOfRange = self;
      const _name = _TensorOutOfRange._0;
      const _offset$8 = _TensorOutOfRange._1;
      const _nbytes = _TensorOutOfRange._2;
      const _data_len = _TensorOutOfRange._3;
      const _string_builder$14 = _M0MPB13StringBuilder21StringBuilder_2einner(55);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$14, "tensor ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$14, _name);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$14, ": bytes [");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$14, _offset$8);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$14, ", ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$14, BigInt.asUintN(64, _offset$8 + _nbytes));
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$14, ") fall outside the ");
      _M0MPB13StringBuilder13write__objectGlE(_string_builder$14, _data_len);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$14, "-byte data section");
      return _string_builder$14.val;
    }
    case 1: {
      const _TensorNotSupported = self;
      const _name$2 = _TensorNotSupported._0;
      const _type_id$4 = _TensorNotSupported._1;
      const _type_name = _TensorNotSupported._2;
      const _string_builder$15 = _M0MPB13StringBuilder21StringBuilder_2einner(53);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$15, "tensor ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$15, _name$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$15, ": type ");
      _M0MPB13StringBuilder13write__objectGjE(_string_builder$15, _type_id$4);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$15, " (");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$15, _type_name);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$15, ") cannot be dequantized by this build");
      return _string_builder$15.val;
    }
    default: {
      const _DequantFailed = self;
      const _name$3 = _DequantFailed._0;
      const _reason = _DequantFailed._1;
      const _string_builder$16 = _M0MPB13StringBuilder21StringBuilder_2einner(32);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$16, "tensor ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$16, _name$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$16, ": dequantization failed: ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$16, _reason);
      return _string_builder$16.val;
    }
  }
}
function _M0FP35soehi6moonlm5model9bv__sbyte(buf, off) {
  $bound_check(buf, off);
  const u = buf[off];
  return u >= 128 ? u - 256 | 0 : u;
}
function _M0FP35soehi6moonlm5model18bv__scale__min__k4(j, buf, q_off) {
  if (j < 4) {
    const _tmp$4 = q_off + j | 0;
    $bound_check(buf, _tmp$4);
    const _tmp$5 = buf[_tmp$4] & 63;
    const _tmp$6 = (q_off + j | 0) + 4 | 0;
    $bound_check(buf, _tmp$6);
    return { _0: _tmp$5, _1: buf[_tmp$6] & 63 };
  } else {
    const _tmp$4 = (q_off + j | 0) + 4 | 0;
    $bound_check(buf, _tmp$4);
    const hi = buf[_tmp$4];
    const _tmp$5 = hi & 15;
    const _tmp$6 = (q_off + j | 0) - 4 | 0;
    $bound_check(buf, _tmp$6);
    const _tmp$7 = _tmp$5 | buf[_tmp$6] >> 6 << 4;
    const _tmp$8 = hi >> 4;
    const _tmp$9 = q_off + j | 0;
    $bound_check(buf, _tmp$9);
    return { _0: _tmp$7, _1: _tmp$8 | buf[_tmp$9] >> 6 << 4 };
  }
}
function _M0MP35soehi6moonlm5model6Matrix12from__tensor(f, name) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile6tensor(f, name);
  let t$3;
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor(name));
  } else {
    const _Some = _bind;
    t$3 = _Some;
  }
  if (t$3.dims.length !== 2) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(0);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, t$3.dims.length);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(name, "2 dimensions", _string_builder.val));
  }
  const cols = Number(BigInt.asIntN(32, _M0MPC15array5Array2atGsE(t$3.dims, 0))) | 0;
  const rows = Number(BigInt.asIntN(32, _M0MPC15array5Array2atGsE(t$3.dims, 1))) | 0;
  const ty = _M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(t$3);
  if (!_M0MP35soehi6moonlm6tensor8GgmlType17is__dequantizable(ty)) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error59soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedTensorType(name, ty.name));
  }
  if ((cols % ty.block_size | 0) !== 0) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(32);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "columns divisible by block size ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, ty.block_size);
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(8);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, cols);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " columns");
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(name, _string_builder.val, _string_builder$2.val));
  }
  const row_bytes = Math.imul(cols / ty.block_size | 0, ty.type_size) | 0;
  const _bind$2 = _M0MP35soehi6moonlm4gguf8GgufFile17index__of__tensor(f, name);
  let index;
  if (_bind$2 === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor(name));
  } else {
    const _Some = _bind$2;
    index = _Some;
  }
  const _bind$3 = _M0MP35soehi6moonlm4gguf8GgufFile13tensor__bytes(f, index);
  let data;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    data = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eTensorRead(name, _M0MP35soehi6moonlm4gguf9GgufError7message(_e)));
  }
  const expected = Math.imul(row_bytes, rows) | 0;
  if (data.length !== expected) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(14);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, expected);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " payload bytes");
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(0);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, data.length);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(name, _string_builder.val, _string_builder$2.val));
  }
  return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6MatrixRP35soehi6moonlm5model10ModelErrorE2Ok(new _M0TP35soehi6moonlm5model6Matrix(name, ty, rows, cols, row_bytes, data));
}
function _M0FP35soehi6moonlm5model12load__matrix(f, name) {
  return _M0MP35soehi6moonlm5model6Matrix12from__tensor(f, name);
}
function _M0FP35soehi6moonlm5model17decode__row__into(ty, data, row_off, out, n_blocks) {
  const _bind = ty.id;
  switch (_bind) {
    case 0: {
      let _tmp$4 = 0;
      while (true) {
        const b = _tmp$4;
        if (b < n_blocks) {
          $bound_check(out, b);
          out[b] = $f32_reinterpret_i32(_M0MPC15bytes5Bytes24unsafe__read__uint32__le(data, row_off + (Math.imul(b, 4) | 0) | 0));
          _tmp$4 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 1: {
      let _tmp$5 = 0;
      while (true) {
        const b = _tmp$5;
        if (b < n_blocks) {
          $bound_check(out, b);
          out[b] = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, row_off + (Math.imul(b, 2) | 0) | 0));
          _tmp$5 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 2: {
      let _tmp$6 = 0;
      while (true) {
        const b = _tmp$6;
        if (b < n_blocks) {
          const base = Math.imul(b, 18) | 0;
          const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, row_off + base | 0));
          let _tmp$7 = 0;
          while (true) {
            const j = _tmp$7;
            if (j < 16) {
              const _tmp$8 = ((row_off + base | 0) + 2 | 0) + j | 0;
              $bound_check(data, _tmp$8);
              const byte = data[_tmp$8];
              const _tmp$9 = (Math.imul(b, 32) | 0) + j | 0;
              $bound_check(out, _tmp$9);
              out[_tmp$9] = Math.fround(Math.fround((byte & 15) - 8 | 0) * d);
              const _tmp$10 = ((Math.imul(b, 32) | 0) + 16 | 0) + j | 0;
              $bound_check(out, _tmp$10);
              out[_tmp$10] = Math.fround(Math.fround((byte >> 4) - 8 | 0) * d);
              _tmp$7 = j + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$6 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 8: {
      let _tmp$7 = 0;
      while (true) {
        const b = _tmp$7;
        if (b < n_blocks) {
          const base = Math.imul(b, 34) | 0;
          const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, row_off + base | 0));
          let _tmp$8 = 0;
          while (true) {
            const j = _tmp$8;
            if (j < 32) {
              const _tmp$9 = (Math.imul(b, 32) | 0) + j | 0;
              $bound_check(out, _tmp$9);
              out[_tmp$9] = Math.fround(Math.fround(_M0FP35soehi6moonlm5model9bv__sbyte(data, ((row_off + base | 0) + 2 | 0) + j | 0)) * d);
              _tmp$8 = j + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$7 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 12: {
      let _tmp$8 = 0;
      while (true) {
        const b = _tmp$8;
        if (b < n_blocks) {
          const base = Math.imul(b, 144) | 0;
          const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, row_off + base | 0));
          const dmin = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, (row_off + base | 0) + 2 | 0));
          const sc_base = base + 4 | 0;
          const q_base = base + 16 | 0;
          let _tmp$9 = 0;
          while (true) {
            const g = _tmp$9;
            if (g < 4) {
              const _bind$2 = _M0FP35soehi6moonlm5model18bv__scale__min__k4(Math.imul(g, 2) | 0, data, row_off + sc_base | 0);
              const _sc0 = _bind$2._0;
              const _m0 = _bind$2._1;
              const _bind$3 = _M0FP35soehi6moonlm5model18bv__scale__min__k4((Math.imul(g, 2) | 0) + 1 | 0, data, row_off + sc_base | 0);
              const _sc1 = _bind$3._0;
              const _m1 = _bind$3._1;
              const d0 = Math.fround(d * Math.fround(_sc0));
              const min0 = Math.fround(dmin * Math.fround(_m0));
              const d1 = Math.fround(d * Math.fround(_sc1));
              const min1 = Math.fround(dmin * Math.fround(_m1));
              let _tmp$10 = 0;
              while (true) {
                const l = _tmp$10;
                if (l < 32) {
                  const _tmp$11 = ((row_off + q_base | 0) + (Math.imul(g, 32) | 0) | 0) + l | 0;
                  $bound_check(data, _tmp$11);
                  const byte = data[_tmp$11];
                  const _tmp$12 = ((Math.imul(b, 256) | 0) + (Math.imul(g, 64) | 0) | 0) + l | 0;
                  $bound_check(out, _tmp$12);
                  out[_tmp$12] = Math.fround(Math.fround(d0 * Math.fround(byte & 15)) - min0);
                  const _tmp$13 = (((Math.imul(b, 256) | 0) + (Math.imul(g, 64) | 0) | 0) + 32 | 0) + l | 0;
                  $bound_check(out, _tmp$13);
                  out[_tmp$13] = Math.fround(Math.fround(d1 * Math.fround(byte >> 4)) - min1);
                  _tmp$10 = l + 1 | 0;
                  continue;
                } else {
                  break;
                }
              }
              _tmp$9 = g + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$8 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 14: {
      let _tmp$9 = 0;
      while (true) {
        const b = _tmp$9;
        if (b < n_blocks) {
          const base = Math.imul(b, 210) | 0;
          const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, (row_off + base | 0) + 208 | 0));
          let _tmp$10 = 0;
          while (true) {
            const half = _tmp$10;
            if (half < 2) {
              const ql = base + (Math.imul(half, 64) | 0) | 0;
              const qh = (base + 128 | 0) + (Math.imul(half, 32) | 0) | 0;
              const sc = (base + 192 | 0) + (Math.imul(half, 8) | 0) | 0;
              let _tmp$11 = 0;
              while (true) {
                const l = _tmp$11;
                if (l < 32) {
                  const si = l / 16 | 0;
                  const _tmp$12 = (row_off + qh | 0) + l | 0;
                  $bound_check(data, _tmp$12);
                  const qhv = data[_tmp$12];
                  const _tmp$13 = (row_off + ql | 0) + l | 0;
                  $bound_check(data, _tmp$13);
                  const ql_lo = data[_tmp$13];
                  const _tmp$14 = ((row_off + ql | 0) + 32 | 0) + l | 0;
                  $bound_check(data, _tmp$14);
                  const ql_hi = data[_tmp$14];
                  const y = (Math.imul(b, 256) | 0) + (Math.imul(half, 128) | 0) | 0;
                  const _tmp$15 = y + l | 0;
                  $bound_check(out, _tmp$15);
                  out[_tmp$15] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm5model9bv__sbyte(data, (row_off + sc | 0) + si | 0))) * Math.fround((ql_lo & 15 | (qhv & 3) << 4) - 32 | 0));
                  const _tmp$16 = (y + l | 0) + 32 | 0;
                  $bound_check(out, _tmp$16);
                  out[_tmp$16] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm5model9bv__sbyte(data, ((row_off + sc | 0) + si | 0) + 2 | 0))) * Math.fround((ql_hi & 15 | (qhv >> 2 & 3) << 4) - 32 | 0));
                  const _tmp$17 = (y + l | 0) + 64 | 0;
                  $bound_check(out, _tmp$17);
                  out[_tmp$17] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm5model9bv__sbyte(data, ((row_off + sc | 0) + si | 0) + 4 | 0))) * Math.fround((ql_lo >> 4 | (qhv >> 4 & 3) << 4) - 32 | 0));
                  const _tmp$18 = (y + l | 0) + 96 | 0;
                  $bound_check(out, _tmp$18);
                  out[_tmp$18] = Math.fround(Math.fround(d * Math.fround(_M0FP35soehi6moonlm5model9bv__sbyte(data, ((row_off + sc | 0) + si | 0) + 6 | 0))) * Math.fround((ql_hi >> 4 | (qhv >> 6 & 3) << 4) - 32 | 0));
                  _tmp$11 = l + 1 | 0;
                  continue;
                } else {
                  break;
                }
              }
              _tmp$10 = half + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$9 = b + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    default: {
      return;
    }
  }
}
function _M0MP35soehi6moonlm5model6Matrix12dequant__row(self, row, out) {
  if (row < 0 || row >= self.rows) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(17);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "row ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, row);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " out of range");
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(self.name, _string_builder.val));
  }
  const bs = self.ty.block_size;
  const n_blocks = self.cols / bs | 0;
  _L: {
    const _bind = self.ty.id;
    switch (_bind) {
      case 0: {
        break _L;
      }
      case 1: {
        break _L;
      }
      case 2: {
        break _L;
      }
      case 8: {
        break _L;
      }
      case 12: {
        break _L;
      }
      case 14: {
        break _L;
      }
      default: {
        return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error59soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedTensorType(self.name, self.ty.name));
      }
    }
  }
  _M0FP35soehi6moonlm5model17decode__row__into(self.ty, self.data, Math.imul(row, self.row_bytes) | 0, out, n_blocks);
  return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE2Ok(undefined);
}
function _M0FP35soehi6moonlm5model8dot__f16(data, row_off, x, x_off, n_blocks) {
  let acc = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const w = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, row_off + (Math.imul(b, 2) | 0) | 0));
      acc = Math.fround(acc + Math.fround(w * x[x_off + b | 0]));
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm5model8dot__f32(data, row_off, x, x_off, n_blocks) {
  let acc = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const w = $f32_reinterpret_i32(_M0MPC15bytes5Bytes24unsafe__read__uint32__le(data, row_off + (Math.imul(b, 4) | 0) | 0));
      acc = Math.fround(acc + Math.fround(w * x[x_off + b | 0]));
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm5model10dot__q4__0(data, row_off, x, x_off, n_blocks) {
  let acc = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const base = row_off + (Math.imul(b, 18) | 0) | 0;
      const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, base));
      const xb = x_off + (Math.imul(b, 32) | 0) | 0;
      let sl = Math.fround(0);
      let sh = Math.fround(0);
      let _tmp$5 = 0;
      while (true) {
        const j = _tmp$5;
        if (j < 16) {
          const _tmp$6 = (base + 2 | 0) + j | 0;
          $bound_check(data, _tmp$6);
          const byte = data[_tmp$6];
          sl = Math.fround(sl + Math.fround(Math.fround((byte & 15) - 8 | 0) * x[xb + j | 0]));
          sh = Math.fround(sh + Math.fround(Math.fround((byte >> 4) - 8 | 0) * x[(xb + 16 | 0) + j | 0]));
          _tmp$5 = j + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      acc = Math.fround(acc + Math.fround(d * Math.fround(sl + sh)));
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm5model10dot__q4__K(data, row_off, x, x_off, n_blocks) {
  let acc = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const base = row_off + (Math.imul(b, 144) | 0) | 0;
      const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, base));
      const dmin = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, base + 2 | 0));
      const sc_base = base + 4 | 0;
      const q_base = base + 16 | 0;
      const y0 = x_off + (Math.imul(b, 256) | 0) | 0;
      let _tmp$5 = 0;
      while (true) {
        const g = _tmp$5;
        if (g < 4) {
          const _bind = _M0FP35soehi6moonlm5model18bv__scale__min__k4(Math.imul(g, 2) | 0, data, sc_base);
          const _sc0 = _bind._0;
          const _m0 = _bind._1;
          const _bind$2 = _M0FP35soehi6moonlm5model18bv__scale__min__k4((Math.imul(g, 2) | 0) + 1 | 0, data, sc_base);
          const _sc1 = _bind$2._0;
          const _m1 = _bind$2._1;
          const d0 = Math.fround(d * Math.fround(_sc0));
          const min0 = Math.fround(dmin * Math.fround(_m0));
          const d1 = Math.fround(d * Math.fround(_sc1));
          const min1 = Math.fround(dmin * Math.fround(_m1));
          let sum0 = Math.fround(0);
          let sum1 = Math.fround(0);
          let xsum0 = Math.fround(0);
          let xsum1 = Math.fround(0);
          const qb = q_base + (Math.imul(g, 32) | 0) | 0;
          const yb = y0 + (Math.imul(g, 64) | 0) | 0;
          let _tmp$6 = 0;
          while (true) {
            const l = _tmp$6;
            if (l < 32) {
              const _tmp$7 = qb + l | 0;
              $bound_check(data, _tmp$7);
              const byte = data[_tmp$7];
              const xa = x[yb + l | 0];
              const xbv = x[(yb + 32 | 0) + l | 0];
              sum0 = Math.fround(sum0 + Math.fround(Math.fround(byte & 15) * xa));
              sum1 = Math.fround(sum1 + Math.fround(Math.fround(byte >> 4) * xbv));
              xsum0 = Math.fround(xsum0 + xa);
              xsum1 = Math.fround(xsum1 + xbv);
              _tmp$6 = l + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          acc = Math.fround(Math.fround(Math.fround(Math.fround(acc + Math.fround(d0 * sum0)) - Math.fround(min0 * xsum0)) + Math.fround(d1 * sum1)) - Math.fround(min1 * xsum1));
          _tmp$5 = g + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm5model10dot__q6__K(data, row_off, x, x_off, n_blocks) {
  let acc = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const base = row_off + (Math.imul(b, 210) | 0) | 0;
      const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, base + 208 | 0));
      const y0 = x_off + (Math.imul(b, 256) | 0) | 0;
      let _tmp$5 = 0;
      while (true) {
        const half = _tmp$5;
        if (half < 2) {
          const ql = base + (Math.imul(half, 64) | 0) | 0;
          const qh = (base + 128 | 0) + (Math.imul(half, 32) | 0) | 0;
          const sc = (base + 192 | 0) + (Math.imul(half, 8) | 0) | 0;
          const yb = y0 + (Math.imul(half, 128) | 0) | 0;
          let s0 = Math.fround(0);
          let s1 = Math.fround(0);
          let s2 = Math.fround(0);
          let s3 = Math.fround(0);
          let prev_si = -1;
          let a0 = Math.fround(0);
          let a1 = Math.fround(0);
          let a2 = Math.fround(0);
          let a3 = Math.fround(0);
          let _tmp$6 = 0;
          while (true) {
            const l = _tmp$6;
            if (l < 32) {
              const si = l / 16 | 0;
              if (si !== prev_si) {
                const _tmp$7 = sc + si | 0;
                $bound_check(data, _tmp$7);
                a0 = Math.fround(_M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm5model12sbyte__table, data[_tmp$7]));
                const _tmp$8 = (sc + si | 0) + 2 | 0;
                $bound_check(data, _tmp$8);
                a1 = Math.fround(_M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm5model12sbyte__table, data[_tmp$8]));
                const _tmp$9 = (sc + si | 0) + 4 | 0;
                $bound_check(data, _tmp$9);
                a2 = Math.fround(_M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm5model12sbyte__table, data[_tmp$9]));
                const _tmp$10 = (sc + si | 0) + 6 | 0;
                $bound_check(data, _tmp$10);
                a3 = Math.fround(_M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm5model12sbyte__table, data[_tmp$10]));
                prev_si = si;
              }
              const _tmp$7 = qh + l | 0;
              $bound_check(data, _tmp$7);
              const qhv = data[_tmp$7];
              const _tmp$8 = ql + l | 0;
              $bound_check(data, _tmp$8);
              const ql_lo = data[_tmp$8];
              const _tmp$9 = (ql + 32 | 0) + l | 0;
              $bound_check(data, _tmp$9);
              const ql_hi = data[_tmp$9];
              s0 = Math.fround(s0 + Math.fround(Math.fround(a0 * Math.fround((ql_lo & 15 | (qhv & 3) << 4) - 32 | 0)) * x[yb + l | 0]));
              s1 = Math.fround(s1 + Math.fround(Math.fround(a1 * Math.fround((ql_hi & 15 | (qhv >> 2 & 3) << 4) - 32 | 0)) * x[(yb + l | 0) + 32 | 0]));
              s2 = Math.fround(s2 + Math.fround(Math.fround(a2 * Math.fround((ql_lo >> 4 | (qhv >> 4 & 3) << 4) - 32 | 0)) * x[(yb + l | 0) + 64 | 0]));
              s3 = Math.fround(s3 + Math.fround(Math.fround(a3 * Math.fround((ql_hi >> 4 | (qhv >> 6 & 3) << 4) - 32 | 0)) * x[(yb + l | 0) + 96 | 0]));
              _tmp$6 = l + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          acc = Math.fround(acc + Math.fround(d * Math.fround(Math.fround(s0 + s1) + Math.fround(s2 + s3))));
          _tmp$5 = half + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return acc;
}
function _M0FP35soehi6moonlm5model10dot__q8__0(data, row_off, x, x_off, n_blocks) {
  let acc = 0;
  let _tmp$4 = 0;
  while (true) {
    const b = _tmp$4;
    if (b < n_blocks) {
      const base = row_off + (Math.imul(b, 34) | 0) | 0;
      const d = _M0FP35soehi6moonlm6tensor15half__to__float(_M0MPC15bytes5Bytes24unsafe__read__uint16__le(data, base));
      const xb = x_off + (Math.imul(b, 32) | 0) | 0;
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      let s3 = 0;
      let _tmp$5 = 0;
      while (true) {
        const j = _tmp$5;
        if (j < 32) {
          s0 = s0 + _M0FP35soehi6moonlm5model20sbyte__double__table[data[(base + 2 | 0) + j | 0]] * x[xb + j | 0];
          s1 = s1 + _M0FP35soehi6moonlm5model20sbyte__double__table[data[(base + 3 | 0) + j | 0]] * x[(xb + j | 0) + 1 | 0];
          s2 = s2 + _M0FP35soehi6moonlm5model20sbyte__double__table[data[(base + 4 | 0) + j | 0]] * x[(xb + j | 0) + 2 | 0];
          s3 = s3 + _M0FP35soehi6moonlm5model20sbyte__double__table[data[(base + 5 | 0) + j | 0]] * x[(xb + j | 0) + 3 | 0];
          _tmp$5 = j + 4 | 0;
          continue;
        } else {
          break;
        }
      }
      acc = acc + d * (s0 + s1 + (s2 + s3));
      _tmp$4 = b + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return Math.fround(acc);
}
function _M0MP35soehi6moonlm5model6Matrix6matvec(self, x, y) {
  const n_rows = self.rows;
  const cols = self.cols;
  const bs = self.ty.block_size;
  const n_blocks = cols / bs | 0;
  const data = self.data;
  const rb = self.row_bytes;
  const ty = self.ty;
  const _bind = ty.id;
  switch (_bind) {
    case 0: {
      let _tmp$4 = 0;
      while (true) {
        const r = _tmp$4;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model8dot__f32(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$4 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 1: {
      let _tmp$5 = 0;
      while (true) {
        const r = _tmp$5;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model8dot__f16(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$5 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 2: {
      let _tmp$6 = 0;
      while (true) {
        const r = _tmp$6;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model10dot__q4__0(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$6 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 8: {
      let _tmp$7 = 0;
      while (true) {
        const r = _tmp$7;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model10dot__q8__0(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$7 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 12: {
      let _tmp$8 = 0;
      while (true) {
        const r = _tmp$8;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model10dot__q4__K(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$8 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 14: {
      let _tmp$9 = 0;
      while (true) {
        const r = _tmp$9;
        if (r < n_rows) {
          $bound_check(y, r);
          y[r] = _M0FP35soehi6moonlm5model10dot__q6__K(data, Math.imul(r, rb) | 0, x, 0, n_blocks);
          _tmp$9 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    default: {
      return;
    }
  }
}
function _M0FP35soehi6moonlm5model12load__vector(f, name) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile6tensor(f, name);
  let t$3;
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor(name));
  } else {
    const _Some = _bind;
    t$3 = _Some;
  }
  if (t$3.dims.length !== 1) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(0);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, t$3.dims.length);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(name, "1 dimension", _string_builder.val));
  }
  const n = Number(BigInt.asIntN(32, t$3.n_elems)) | 0;
  const _bind$2 = _M0MP35soehi6moonlm4gguf8GgufFile17index__of__tensor(f, name);
  let index;
  if (_bind$2 === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor(name));
  } else {
    const _Some = _bind$2;
    index = _Some;
  }
  const ty = _M0MP35soehi6moonlm4gguf10TensorInfo10ggml__type(t$3);
  if (!_M0MP35soehi6moonlm6tensor8GgmlType17is__dequantizable(ty)) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error59soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedTensorType(name, ty.name));
  }
  const _bind$3 = _M0MP35soehi6moonlm4gguf8GgufFile15dequant__tensor(f, index);
  let values;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    values = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eTensorRead(name, _M0MP35soehi6moonlm4gguf9GgufError7message(_e)));
  }
  if (values.length !== n) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(9);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, n);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " elements");
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(0);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, values.length);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(name, _string_builder.val, _string_builder$2.val));
  }
  return new _M0DTPC16result6ResultGRP35soehi6moonlm5model6VectorRP35soehi6moonlm5model10ModelErrorE2Ok(new _M0TP35soehi6moonlm5model6Vector(name, _M0MPC15array10FixedArray11from__arrayGfE(new _M0TPB9ArrayViewGfE(values, 0, values.length))));
}
function _M0FP35soehi6moonlm5model12matvec__pair(a, b, x, y_a, y_b) {
  if (a.cols !== b.cols || (a.rows !== b.rows || a.ty.id !== b.ty.id)) {
    _M0MP35soehi6moonlm5model6Matrix6matvec(a, x, y_a);
    _M0MP35soehi6moonlm5model6Matrix6matvec(b, x, y_b);
    return undefined;
  }
  const n_rows = a.rows;
  const cols = a.cols;
  const bs = a.ty.block_size;
  const n_blocks = cols / bs | 0;
  const data_a = a.data;
  const data_b = b.data;
  const rb = a.row_bytes;
  const _bind = a.ty.id;
  switch (_bind) {
    case 8: {
      let _tmp$4 = 0;
      while (true) {
        const r = _tmp$4;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model10dot__q8__0(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model10dot__q8__0(data_b, off, x, 0, n_blocks);
          _tmp$4 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 2: {
      let _tmp$5 = 0;
      while (true) {
        const r = _tmp$5;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model10dot__q4__0(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model10dot__q4__0(data_b, off, x, 0, n_blocks);
          _tmp$5 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 0: {
      let _tmp$6 = 0;
      while (true) {
        const r = _tmp$6;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model8dot__f32(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model8dot__f32(data_b, off, x, 0, n_blocks);
          _tmp$6 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 1: {
      let _tmp$7 = 0;
      while (true) {
        const r = _tmp$7;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model8dot__f16(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model8dot__f16(data_b, off, x, 0, n_blocks);
          _tmp$7 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 12: {
      let _tmp$8 = 0;
      while (true) {
        const r = _tmp$8;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model10dot__q4__K(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model10dot__q4__K(data_b, off, x, 0, n_blocks);
          _tmp$8 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    case 14: {
      let _tmp$9 = 0;
      while (true) {
        const r = _tmp$9;
        if (r < n_rows) {
          const off = Math.imul(r, rb) | 0;
          $bound_check(y_a, r);
          y_a[r] = _M0FP35soehi6moonlm5model10dot__q6__K(data_a, off, x, 0, n_blocks);
          $bound_check(y_b, r);
          y_b[r] = _M0FP35soehi6moonlm5model10dot__q6__K(data_b, off, x, 0, n_blocks);
          _tmp$9 = r + 1 | 0;
          continue;
        } else {
          return;
        }
      }
    }
    default: {
      _M0MP35soehi6moonlm5model6Matrix6matvec(a, x, y_a);
      _M0MP35soehi6moonlm5model6Matrix6matvec(b, x, y_b);
      return;
    }
  }
}
function _M0MP35soehi6moonlm5model7KVCache3new(n_layer, n_head_kv, head_dim, max_len) {
  const n = Math.imul(Math.imul(Math.imul(n_layer, n_head_kv) | 0, max_len) | 0, head_dim) | 0;
  return new _M0TP35soehi6moonlm5model7KVCache(max_len, head_dim, n_head_kv, $make_array_len_and_init(n, Math.fround(0)), $make_array_len_and_init(n, Math.fround(0)), 0);
}
function _M0MP35soehi6moonlm5model7KVCache5reset(self) {
  self.len = 0;
}
function _M0MP35soehi6moonlm5model7Scratch3new(config) {
  const n_embd = config.n_embd;
  const kv_dim = Math.imul(config.n_head_kv, config.head_dim) | 0;
  return new _M0TP35soehi6moonlm5model7Scratch($make_array_len_and_init(n_embd, Math.fround(0)), $make_array_len_and_init(n_embd, Math.fround(0)), $make_array_len_and_init(n_embd, Math.fround(0)), $make_array_len_and_init(kv_dim, Math.fround(0)), $make_array_len_and_init(kv_dim, Math.fround(0)), $make_array_len_and_init(n_embd, Math.fround(0)), $make_array_len_and_init(n_embd, Math.fround(0)), $make_array_len_and_init(config.n_ff, Math.fround(0)), $make_array_len_and_init(config.n_ff, Math.fround(0)), $make_array_len_and_init(config.vocab_size, Math.fround(0)), $make_array_len_and_init(config.context_length + 1 | 0, Math.fround(0)));
}
function _M0FP35soehi6moonlm5model20check__layer__shapes(config, i, attn_norm, wq, wk, wv, wo, ffn_norm, w_gate, w_up, w_down) {
  const n_embd = config.n_embd;
  const kv_dim = Math.imul(config.n_head_kv, config.head_dim) | 0;
  const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(5);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "blk.");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder, i);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ".");
  const p = _string_builder.val;
  const _tmp$4 = `${p}attn_norm.weight`;
  const _tmp$5 = attn_norm.data.length === n_embd;
  const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(9);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " elements");
  const _tmp$6 = { _0: _tmp$4, _1: _tmp$5, _2: _string_builder$2.val };
  const _tmp$7 = `${p}attn_q.weight`;
  const _tmp$8 = wq.cols === n_embd && wq.rows === n_embd;
  const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$3, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$3, n_embd);
  const _tmp$9 = { _0: _tmp$7, _1: _tmp$8, _2: _string_builder$3.val };
  const _tmp$10 = `${p}attn_k.weight`;
  const _tmp$11 = wk.cols === n_embd && wk.rows === kv_dim;
  const _string_builder$4 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$4, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$4, kv_dim);
  const _tmp$12 = { _0: _tmp$10, _1: _tmp$11, _2: _string_builder$4.val };
  const _tmp$13 = `${p}attn_v.weight`;
  const _tmp$14 = wv.cols === n_embd && wv.rows === kv_dim;
  const _string_builder$5 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$5, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$5, kv_dim);
  const _tmp$15 = { _0: _tmp$13, _1: _tmp$14, _2: _string_builder$5.val };
  const _tmp$16 = `${p}attn_output.weight`;
  const _tmp$17 = wo.cols === n_embd && wo.rows === n_embd;
  const _string_builder$6 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$6, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$6, n_embd);
  const _tmp$18 = { _0: _tmp$16, _1: _tmp$17, _2: _string_builder$6.val };
  const _tmp$19 = `${p}ffn_norm.weight`;
  const _tmp$20 = ffn_norm.data.length === n_embd;
  const _string_builder$7 = _M0MPB13StringBuilder21StringBuilder_2einner(9);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$7, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, " elements");
  const _tmp$21 = { _0: _tmp$19, _1: _tmp$20, _2: _string_builder$7.val };
  const _tmp$22 = `${p}ffn_gate.weight`;
  const _tmp$23 = w_gate.cols === n_embd && w_gate.rows === config.n_ff;
  const _string_builder$8 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$8, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$8, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$8, config.n_ff);
  const _tmp$24 = { _0: _tmp$22, _1: _tmp$23, _2: _string_builder$8.val };
  const _tmp$25 = `${p}ffn_up.weight`;
  const _tmp$26 = w_up.cols === n_embd && w_up.rows === config.n_ff;
  const _string_builder$9 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$9, n_embd);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$9, config.n_ff);
  const _tmp$27 = { _0: _tmp$25, _1: _tmp$26, _2: _string_builder$9.val };
  const _tmp$28 = `${p}ffn_down.weight`;
  const _tmp$29 = w_down.cols === config.n_ff && w_down.rows === n_embd;
  const _string_builder$10 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$10, config.n_ff);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$10, "x");
  _M0MPB13StringBuilder13write__objectGiE(_string_builder$10, n_embd);
  const checks = [_tmp$6, _tmp$9, _tmp$12, _tmp$15, _tmp$18, _tmp$21, _tmp$24, _tmp$27, { _0: _tmp$28, _1: _tmp$29, _2: _string_builder$10.val }];
  const _bind = checks.length;
  let _tmp$30 = 0;
  while (true) {
    const _ = _tmp$30;
    if (_ < _bind) {
      const c = checks[_];
      const _name = c._0;
      const _ok = c._1;
      const _expected = c._2;
      if (!_ok) {
        let found;
        if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS909, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS909.length)) || _M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS910, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS910.length))) {
          const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(9);
          _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, _M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS864, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS864.length)) ? attn_norm.data.length : ffn_norm.data.length);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, " elements");
          found = _string_builder$11.val;
        } else {
          if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS911, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS911.length))) {
            const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
            _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wq.cols);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
            _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wq.rows);
            found = _string_builder$11.val;
          } else {
            if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS912, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS912.length))) {
              const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
              _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wk.cols);
              _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
              _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wk.rows);
              found = _string_builder$11.val;
            } else {
              if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS913, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS913.length))) {
                const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wv.cols);
                _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
                _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wv.rows);
                found = _string_builder$11.val;
              } else {
                if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS914, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS914.length))) {
                  const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                  _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wo.cols);
                  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
                  _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, wo.rows);
                  found = _string_builder$11.val;
                } else {
                  if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS915, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS915.length))) {
                    const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                    _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_gate.cols);
                    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
                    _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_gate.rows);
                    found = _string_builder$11.val;
                  } else {
                    if (_M0MPC16string6String8contains(_name, new _M0TPC16string10StringView(_M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS916, 0, _M0FP35soehi6moonlm5model20check__layer__shapesN7_2abindS916.length))) {
                      const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                      _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_up.cols);
                      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
                      _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_up.rows);
                      found = _string_builder$11.val;
                    } else {
                      const _string_builder$11 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                      _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_down.cols);
                      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$11, "x");
                      _M0MPB13StringBuilder13write__objectGiE(_string_builder$11, w_down.rows);
                      found = _string_builder$11.val;
                    }
                  }
                }
              }
            }
          }
        }
        return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape(_name, _expected, found));
      }
      _tmp$30 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE2Ok(undefined);
}
function _M0FP35soehi6moonlm5model11opt__double(f, key, default_) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile11get__double(f, key);
  if (_bind.$tag === 1) {
    const _Some = _bind;
    return _Some._0;
  } else {
    return default_;
  }
}
function _M0FP35soehi6moonlm5model8opt__int(f, key, default_) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile8get__int(f, key);
  if (_bind === undefined) {
    return default_;
  } else {
    const _Some = _bind;
    const _v = _Some;
    return Number(BigInt.asIntN(32, _v)) | 0;
  }
}
function _M0FP35soehi6moonlm5model8req__int(f, key) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile8get__int(f, key);
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eMissingKey(key));
  } else {
    const _Some = _bind;
    const _v = _Some;
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm5model10ModelErrorE2Ok(Number(BigInt.asIntN(32, _v)) | 0);
  }
}
function _M0MP35soehi6moonlm5model11ModelConfig10from__gguf(f) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile11get__string(f, "general.architecture");
  let arch;
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error48soehi_2fmoonlm_2fmodel_2eModelError_2eMissingKey("general.architecture"));
  } else {
    const _Some = _bind;
    arch = _Some;
  }
  const known = arch === "llama" || (arch === "smollm" || (arch === "smollm2" || arch === "qwen2"));
  if (!known) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error61soehi_2fmoonlm_2fmodel_2eModelError_2eUnsupportedArchitecture(arch));
  }
  const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGsE(_string_builder, arch);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ".");
  const p = _string_builder.val;
  const _bind$2 = _M0FP35soehi6moonlm5model8req__int(f, `${p}embedding_length`);
  let n_embd;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    n_embd = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  const _bind$3 = _M0FP35soehi6moonlm5model8req__int(f, `${p}block_count`);
  let n_layer;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    n_layer = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  const _bind$4 = _M0FP35soehi6moonlm5model8req__int(f, `${p}feed_forward_length`);
  let n_ff;
  if (_bind$4.$tag === 1) {
    const _Ok = _bind$4;
    n_ff = _Ok._0;
  } else {
    const _Err = _bind$4;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  const _bind$5 = _M0FP35soehi6moonlm5model8req__int(f, `${p}attention.head_count`);
  let n_head;
  if (_bind$5.$tag === 1) {
    const _Ok = _bind$5;
    n_head = _Ok._0;
  } else {
    const _Err = _bind$5;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  if (n_head <= 0 || (n_embd <= 0 || (n_layer <= 0 || n_ff <= 0))) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(`${p}(dimensions)`, "embedding_length, block_count, feed_forward_length and attention.head_count must all be positive"));
  }
  if ((n_embd % n_head | 0) !== 0) {
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(42);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_embd);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " is not divisible by attention.head_count ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_head);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(`${p}embedding_length`, _string_builder$2.val));
  }
  const head_dim = n_embd / n_head | 0;
  const n_head_kv = _M0FP35soehi6moonlm5model8opt__int(f, `${p}attention.head_count_kv`, n_head);
  if (n_head_kv <= 0 || (n_head % n_head_kv | 0) !== 0) {
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(38);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_head_kv);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " does not divide attention.head_count ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_head);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(`${p}attention.head_count_kv`, _string_builder$2.val));
  }
  const context_length = _M0FP35soehi6moonlm5model8opt__int(f, `${p}context_length`, 2048);
  const rms_eps = _M0FP35soehi6moonlm5model11opt__double(f, `${p}attention.layer_norm_rms_epsilon`, 1e-005);
  const rope_theta = _M0FP35soehi6moonlm5model11opt__double(f, `${p}rope.freq_base`, 10000);
  const n_rot = _M0FP35soehi6moonlm5model8opt__int(f, `${p}rope.dimension_count`, head_dim);
  if (n_rot <= 0 || (n_rot > head_dim || (n_rot % 2 | 0) !== 0)) {
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(56);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_rot);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " must be a positive even number no larger than head_dim ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, head_dim);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue(`${p}rope.dimension_count`, _string_builder$2.val));
  }
  const _bind$6 = _M0MP35soehi6moonlm4gguf8GgufFile6tensor(f, "token_embd.weight");
  let embd;
  if (_bind$6 === undefined) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error51soehi_2fmoonlm_2fmodel_2eModelError_2eMissingTensor("token_embd.weight"));
  } else {
    const _Some = _bind$6;
    embd = _Some;
  }
  if (embd.dims.length !== 2) {
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(11);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, embd.dims.length);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, " dimensions");
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape("token_embd.weight", "[n_embd, n_vocab]", _string_builder$2.val));
  }
  const embd_rows = Number(BigInt.asIntN(32, _M0MPC15array5Array2atGsE(embd.dims, 0))) | 0;
  const embd_cols = Number(BigInt.asIntN(32, _M0MPC15array5Array2atGsE(embd.dims, 1))) | 0;
  if (embd_rows !== n_embd) {
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(16);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "first dimension ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, n_embd);
    const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(16);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "first dimension ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$3, embd_rows);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape("token_embd.weight", _string_builder$2.val, _string_builder$3.val));
  }
  const _bind$7 = _M0MP35soehi6moonlm4gguf8GgufFile6tensor(f, "output.weight");
  const tied_lm_head = _bind$7 === undefined;
  return new _M0DTPC16result6ResultGRP35soehi6moonlm5model11ModelConfigRP35soehi6moonlm5model10ModelErrorE2Ok(new _M0TP35soehi6moonlm5model11ModelConfig(arch, embd_cols, n_embd, n_layer, n_ff, n_head, n_head_kv, head_dim, context_length, rms_eps, rope_theta, n_rot, tied_lm_head));
}
function _M0MP35soehi6moonlm5model5Model4load(f) {
  const _bind = _M0MP35soehi6moonlm5model11ModelConfig10from__gguf(f);
  let config;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    config = _Ok._0;
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  const _bind$2 = _M0FP35soehi6moonlm5model12load__matrix(f, "token_embd.weight");
  let token_embd;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    token_embd = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  const _bind$3 = _M0FP35soehi6moonlm5model12load__vector(f, "output_norm.weight");
  let output_norm;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    output_norm = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  if (output_norm.data.length !== config.n_embd) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(9);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, config.n_embd);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " elements");
    const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(0);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, output_norm.data.length);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error49soehi_2fmoonlm_2fmodel_2eModelError_2eTensorShape("output_norm.weight", _string_builder.val, _string_builder$2.val));
  }
  const layers = [];
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < config.n_layer) {
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(5);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "blk.");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder, i);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ".");
      const p = _string_builder.val;
      const _bind$4 = _M0FP35soehi6moonlm5model12load__vector(f, `${p}attn_norm.weight`);
      let attn_norm;
      if (_bind$4.$tag === 1) {
        const _Ok = _bind$4;
        attn_norm = _Ok._0;
      } else {
        const _Err = _bind$4;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$5 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}attn_q.weight`);
      let wq;
      if (_bind$5.$tag === 1) {
        const _Ok = _bind$5;
        wq = _Ok._0;
      } else {
        const _Err = _bind$5;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$6 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}attn_k.weight`);
      let wk;
      if (_bind$6.$tag === 1) {
        const _Ok = _bind$6;
        wk = _Ok._0;
      } else {
        const _Err = _bind$6;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$7 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}attn_v.weight`);
      let wv;
      if (_bind$7.$tag === 1) {
        const _Ok = _bind$7;
        wv = _Ok._0;
      } else {
        const _Err = _bind$7;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$8 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}attn_output.weight`);
      let wo;
      if (_bind$8.$tag === 1) {
        const _Ok = _bind$8;
        wo = _Ok._0;
      } else {
        const _Err = _bind$8;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$9 = _M0FP35soehi6moonlm5model12load__vector(f, `${p}ffn_norm.weight`);
      let ffn_norm;
      if (_bind$9.$tag === 1) {
        const _Ok = _bind$9;
        ffn_norm = _Ok._0;
      } else {
        const _Err = _bind$9;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$10 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}ffn_gate.weight`);
      let w_gate;
      if (_bind$10.$tag === 1) {
        const _Ok = _bind$10;
        w_gate = _Ok._0;
      } else {
        const _Err = _bind$10;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$11 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}ffn_up.weight`);
      let w_up;
      if (_bind$11.$tag === 1) {
        const _Ok = _bind$11;
        w_up = _Ok._0;
      } else {
        const _Err = _bind$11;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$12 = _M0FP35soehi6moonlm5model12load__matrix(f, `${p}ffn_down.weight`);
      let w_down;
      if (_bind$12.$tag === 1) {
        const _Ok = _bind$12;
        w_down = _Ok._0;
      } else {
        const _Err = _bind$12;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      const _bind$13 = _M0FP35soehi6moonlm5model20check__layer__shapes(config, i, attn_norm, wq, wk, wv, wo, ffn_norm, w_gate, w_up, w_down);
      if (_bind$13.$tag === 1) {
      } else {
        const _Err = _bind$13;
        const _e = _Err._0;
        return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
      }
      _M0MPC15array5Array4pushGUsiEE(layers, new _M0TP35soehi6moonlm5model12LayerWeights(attn_norm, wq, wk, wv, wo, ffn_norm, w_gate, w_up, w_down));
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let output;
  if (config.tied_lm_head) {
    output = new _M0TP35soehi6moonlm5model6Matrix("token_embd.weight (tied lm head)", token_embd.ty, token_embd.rows, token_embd.cols, token_embd.row_bytes, token_embd.data);
  } else {
    const _bind$4 = _M0FP35soehi6moonlm5model12load__matrix(f, "output.weight");
    if (_bind$4.$tag === 1) {
      const _Ok = _bind$4;
      output = _Ok._0;
    } else {
      const _Err = _bind$4;
      const _e = _Err._0;
      return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE3Err(_e);
    }
  }
  const cache = _M0MP35soehi6moonlm5model7KVCache3new(config.n_layer, config.n_head_kv, config.head_dim, config.context_length);
  const scratch = _M0MP35soehi6moonlm5model7Scratch3new(config);
  return new _M0DTPC16result6ResultGRP35soehi6moonlm5model5ModelRP35soehi6moonlm5model10ModelErrorE2Ok(new _M0TP35soehi6moonlm5model5Model(config, token_embd, layers, output_norm, output, cache, scratch));
}
function _M0FP35soehi6moonlm5model9rms__norm(x, weight, out, n, eps) {
  let sum_sq = Math.fround(0);
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < n) {
      $bound_check(x, i);
      const xi = x[i];
      sum_sq = Math.fround(sum_sq + Math.fround(xi * xi));
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const mean_sq = Math.fround(sum_sq / Math.fround(n));
  const scale = Math.fround(1 / Math.sqrt(mean_sq + eps));
  let _tmp$5 = 0;
  while (true) {
    const i = _tmp$5;
    if (i < n) {
      $bound_check(x, i);
      const _tmp$6 = Math.fround(x[i] * scale);
      $bound_check(weight, i);
      $bound_check(out, i);
      out[i] = Math.fround(_tmp$6 * weight[i]);
      _tmp$5 = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP35soehi6moonlm5model4silu(x) {
  const xd = x;
  return xd < -30 ? Math.fround(0) : Math.fround(xd / (1 + _M0FPC14math3exp(-xd)));
}
function _M0FP35soehi6moonlm5model15rope__in__place(x, offset, pos, head_dim, n_rot, theta) {
  const n_pairs = n_rot / 2 | 0;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < n_pairs) {
      const exponent = -2 * (i + 0) / (head_dim + 0);
      const freq = _M0FPC14math3pow(theta, exponent);
      const angle = (pos + 0) * freq;
      const c = Math.fround(_M0FPC14math3cos(angle));
      const s = Math.fround(_M0FPC14math3sin(angle));
      const _tmp$5 = offset + (Math.imul(2, i) | 0) | 0;
      $bound_check(x, _tmp$5);
      const a = x[_tmp$5];
      const _tmp$6 = (offset + (Math.imul(2, i) | 0) | 0) + 1 | 0;
      $bound_check(x, _tmp$6);
      const b = x[_tmp$6];
      const _tmp$7 = offset + (Math.imul(2, i) | 0) | 0;
      $bound_check(x, _tmp$7);
      x[_tmp$7] = Math.fround(Math.fround(a * c) - Math.fround(b * s));
      const _tmp$8 = (offset + (Math.imul(2, i) | 0) | 0) + 1 | 0;
      $bound_check(x, _tmp$8);
      x[_tmp$8] = Math.fround(Math.fround(a * s) + Math.fround(b * c));
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0MP35soehi6moonlm5model5Model7forward(self, token, pos) {
  const cfg = self.config;
  if (pos >= self.cache.max_len) {
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error53soehi_2fmoonlm_2fmodel_2eModelError_2eContextOverflow(pos, self.cache.max_len));
  }
  if (token < 0 || token >= cfg.vocab_size) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(26);
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, token);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " is outside the vocabulary");
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fmodel_2eModelError_2eBadValue("token_id", _string_builder.val));
  }
  const n_embd = cfg.n_embd;
  const head_dim = cfg.head_dim;
  const n_head = cfg.n_head;
  const n_head_kv = cfg.n_head_kv;
  Math.imul(cfg.n_head_kv, cfg.head_dim) | 0;
  const sc = self.scratch;
  const _bind = _M0MP35soehi6moonlm5model6Matrix12dequant__row(self.token_embd, token, sc.hidden);
  if (_bind.$tag === 1) {
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE3Err(_e);
  }
  let _tmp$4 = 0;
  while (true) {
    const layer_idx = _tmp$4;
    if (layer_idx < cfg.n_layer) {
      const lw = _M0MPC15array5Array2atGsE(self.layers, layer_idx);
      _M0FP35soehi6moonlm5model9rms__norm(sc.hidden, lw.attn_norm.data, sc.normed, n_embd, cfg.rms_eps);
      _M0MP35soehi6moonlm5model6Matrix6matvec(lw.wq, sc.normed, sc.q);
      _M0MP35soehi6moonlm5model6Matrix6matvec(lw.wk, sc.normed, sc.k);
      _M0MP35soehi6moonlm5model6Matrix6matvec(lw.wv, sc.normed, sc.v);
      let _tmp$5 = 0;
      while (true) {
        const h = _tmp$5;
        if (h < n_head) {
          _M0FP35soehi6moonlm5model15rope__in__place(sc.q, Math.imul(h, head_dim) | 0, pos, head_dim, cfg.n_rot, cfg.rope_theta);
          _tmp$5 = h + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      let _tmp$6 = 0;
      while (true) {
        const h = _tmp$6;
        if (h < n_head_kv) {
          _M0FP35soehi6moonlm5model15rope__in__place(sc.k, Math.imul(h, head_dim) | 0, pos, head_dim, cfg.n_rot, cfg.rope_theta);
          _tmp$6 = h + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      const base = Math.imul(Math.imul(Math.imul(layer_idx, n_head_kv) | 0, self.cache.max_len) | 0, head_dim) | 0;
      let _tmp$7 = 0;
      while (true) {
        const h = _tmp$7;
        if (h < n_head_kv) {
          const kc = (base + (Math.imul(Math.imul(h, self.cache.max_len) | 0, head_dim) | 0) | 0) + (Math.imul(pos, head_dim) | 0) | 0;
          let _tmp$8 = 0;
          while (true) {
            const d = _tmp$8;
            if (d < head_dim) {
              const _tmp$9 = self.cache.k;
              const _tmp$10 = kc + d | 0;
              const _tmp$11 = sc.k;
              const _tmp$12 = (Math.imul(h, head_dim) | 0) + d | 0;
              $bound_check(_tmp$11, _tmp$12);
              $bound_check(_tmp$9, _tmp$10);
              _tmp$9[_tmp$10] = _tmp$11[_tmp$12];
              const _tmp$13 = self.cache.v;
              const _tmp$14 = kc + d | 0;
              const _tmp$15 = sc.v;
              const _tmp$16 = (Math.imul(h, head_dim) | 0) + d | 0;
              $bound_check(_tmp$15, _tmp$16);
              $bound_check(_tmp$13, _tmp$14);
              _tmp$13[_tmp$14] = _tmp$15[_tmp$16];
              _tmp$8 = d + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$7 = h + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      const n_pos = pos + 1 | 0;
      const scale = Math.fround(1 / Math.sqrt(head_dim + 0));
      const heads_per_kv = cfg.n_head / cfg.n_head_kv | 0;
      let _tmp$8 = 0;
      while (true) {
        const h = _tmp$8;
        if (h < n_head) {
          const kvh = h / heads_per_kv | 0;
          const kbase = base + (Math.imul(Math.imul(kvh, self.cache.max_len) | 0, head_dim) | 0) | 0;
          let _tmp$9 = 0;
          while (true) {
            const p = _tmp$9;
            if (p < n_pos) {
              let dot = Math.fround(0);
              const kb = kbase + (Math.imul(p, head_dim) | 0) | 0;
              let _tmp$10 = 0;
              while (true) {
                const d = _tmp$10;
                if (d < head_dim) {
                  const _tmp$11 = dot;
                  const _tmp$12 = sc.q;
                  const _tmp$13 = (Math.imul(h, head_dim) | 0) + d | 0;
                  $bound_check(_tmp$12, _tmp$13);
                  const _tmp$14 = _tmp$12[_tmp$13];
                  const _tmp$15 = self.cache.k;
                  const _tmp$16 = kb + d | 0;
                  $bound_check(_tmp$15, _tmp$16);
                  dot = Math.fround(_tmp$11 + Math.fround(_tmp$14 * _tmp$15[_tmp$16]));
                  _tmp$10 = d + 1 | 0;
                  continue;
                } else {
                  break;
                }
              }
              const _tmp$11 = sc.scores;
              $bound_check(_tmp$11, p);
              _tmp$11[p] = Math.fround(dot * scale);
              _tmp$9 = p + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          const _tmp$10 = sc.scores;
          $bound_check(_tmp$10, 0);
          let max_score = _tmp$10[0];
          let _tmp$11 = 1;
          while (true) {
            const p = _tmp$11;
            if (p < n_pos) {
              const _tmp$12 = sc.scores;
              $bound_check(_tmp$12, p);
              if (_tmp$12[p] > max_score) {
                const _tmp$13 = sc.scores;
                $bound_check(_tmp$13, p);
                max_score = _tmp$13[p];
              }
              _tmp$11 = p + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          let denom = Math.fround(0);
          let _tmp$12 = 0;
          while (true) {
            const p = _tmp$12;
            if (p < n_pos) {
              const _tmp$13 = sc.scores;
              $bound_check(_tmp$13, p);
              const e = _M0FPC14math4expf(Math.fround(_tmp$13[p] - max_score));
              const _tmp$14 = sc.scores;
              $bound_check(_tmp$14, p);
              _tmp$14[p] = e;
              denom = Math.fround(denom + e);
              _tmp$12 = p + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          const inv$2 = Math.fround(Math.fround(1) / denom);
          const ob = Math.imul(h, head_dim) | 0;
          let _tmp$13 = 0;
          while (true) {
            const d = _tmp$13;
            if (d < head_dim) {
              const _tmp$14 = sc.attn;
              const _tmp$15 = ob + d | 0;
              $bound_check(_tmp$14, _tmp$15);
              _tmp$14[_tmp$15] = Math.fround(0);
              _tmp$13 = d + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          let _tmp$14 = 0;
          while (true) {
            const p = _tmp$14;
            if (p < n_pos) {
              const _tmp$15 = sc.scores;
              $bound_check(_tmp$15, p);
              const w = Math.fround(_tmp$15[p] * inv$2);
              const vb = kbase + (Math.imul(p, head_dim) | 0) | 0;
              let _tmp$16 = 0;
              while (true) {
                const d = _tmp$16;
                if (d < head_dim) {
                  const _tmp$17 = sc.attn;
                  const _tmp$18 = ob + d | 0;
                  const _tmp$19 = sc.attn;
                  const _tmp$20 = ob + d | 0;
                  $bound_check(_tmp$19, _tmp$20);
                  const _tmp$21 = _tmp$19[_tmp$20];
                  const _tmp$22 = self.cache.v;
                  const _tmp$23 = vb + d | 0;
                  $bound_check(_tmp$22, _tmp$23);
                  $bound_check(_tmp$17, _tmp$18);
                  _tmp$17[_tmp$18] = Math.fround(_tmp$21 + Math.fround(w * _tmp$22[_tmp$23]));
                  _tmp$16 = d + 1 | 0;
                  continue;
                } else {
                  break;
                }
              }
              _tmp$14 = p + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _tmp$8 = h + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0MP35soehi6moonlm5model6Matrix6matvec(lw.wo, sc.attn, sc.proj);
      let _tmp$9 = 0;
      while (true) {
        const i = _tmp$9;
        if (i < n_embd) {
          const _tmp$10 = sc.hidden;
          const _tmp$11 = sc.hidden;
          $bound_check(_tmp$11, i);
          const _tmp$12 = _tmp$11[i];
          const _tmp$13 = sc.proj;
          $bound_check(_tmp$13, i);
          $bound_check(_tmp$10, i);
          _tmp$10[i] = Math.fround(_tmp$12 + _tmp$13[i]);
          _tmp$9 = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0FP35soehi6moonlm5model9rms__norm(sc.hidden, lw.ffn_norm.data, sc.normed, n_embd, cfg.rms_eps);
      _M0FP35soehi6moonlm5model12matvec__pair(lw.w_gate, lw.w_up, sc.normed, sc.gate, sc.up);
      let _tmp$10 = 0;
      while (true) {
        const i = _tmp$10;
        if (i < cfg.n_ff) {
          const _tmp$11 = sc.gate;
          const _tmp$12 = sc.gate;
          $bound_check(_tmp$12, i);
          const _tmp$13 = _M0FP35soehi6moonlm5model4silu(_tmp$12[i]);
          const _tmp$14 = sc.up;
          $bound_check(_tmp$14, i);
          $bound_check(_tmp$11, i);
          _tmp$11[i] = Math.fround(_tmp$13 * _tmp$14[i]);
          _tmp$10 = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0MP35soehi6moonlm5model6Matrix6matvec(lw.w_down, sc.gate, sc.proj);
      let _tmp$11 = 0;
      while (true) {
        const i = _tmp$11;
        if (i < n_embd) {
          const _tmp$12 = sc.hidden;
          const _tmp$13 = sc.hidden;
          $bound_check(_tmp$13, i);
          const _tmp$14 = _tmp$13[i];
          const _tmp$15 = sc.proj;
          $bound_check(_tmp$15, i);
          $bound_check(_tmp$12, i);
          _tmp$12[i] = Math.fround(_tmp$14 + _tmp$15[i]);
          _tmp$11 = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = layer_idx + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  _M0FP35soehi6moonlm5model9rms__norm(sc.hidden, self.output_norm.data, sc.normed, n_embd, cfg.rms_eps);
  _M0MP35soehi6moonlm5model6Matrix6matvec(self.output, sc.normed, sc.logits);
  return new _M0DTPC16result6ResultGuRP35soehi6moonlm5model10ModelErrorE2Ok(undefined);
}
function _M0MP35soehi6moonlm5model10ModelError7message(self) {
  switch (self.$tag) {
    case 32: {
      const _MissingKey = self;
      const _key = _MissingKey._0;
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(23);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "missing metadata key \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, _key);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "\"");
      return _string_builder.val;
    }
    case 31: {
      const _BadValue = self;
      const _key$2 = _BadValue._0;
      const _detail = _BadValue._1;
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(17);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "metadata key \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _key$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "\": ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _detail);
      return _string_builder$2.val;
    }
    case 30: {
      const _MissingTensor = self;
      const _name = _MissingTensor._0;
      const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(17);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "missing tensor \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$3, _name);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "\"");
      return _string_builder$3.val;
    }
    case 29: {
      const _TensorShape = self;
      const _name$2 = _TensorShape._0;
      const _expected = _TensorShape._1;
      const _found = _TensorShape._2;
      const _string_builder$4 = _M0MPB13StringBuilder21StringBuilder_2einner(34);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "tensor \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$4, _name$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "\": expected shape ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$4, _expected);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, ", found ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$4, _found);
      return _string_builder$4.val;
    }
    case 28: {
      const _UnsupportedTensorType = self;
      const _name$3 = _UnsupportedTensorType._0;
      const _type_name = _UnsupportedTensorType._1;
      const _string_builder$5 = _M0MPB13StringBuilder21StringBuilder_2einner(53);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "tensor \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$5, _name$3);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "\" has type ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$5, _type_name);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, ", which this build cannot multiply");
      return _string_builder$5.val;
    }
    case 27: {
      return "the prompt encoded to zero tokens";
    }
    case 26: {
      const _ContextOverflow = self;
      const _pos = _ContextOverflow._0;
      const _max_len = _ContextOverflow._1;
      const _string_builder$6 = _M0MPB13StringBuilder21StringBuilder_2einner(40);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, "position ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$6, _pos);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$6, " exceeds the KV cache capacity ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$6, _max_len);
      return _string_builder$6.val;
    }
    case 25: {
      const _TensorRead = self;
      const _name$4 = _TensorRead._0;
      const _reason = _TensorRead._1;
      const _string_builder$7 = _M0MPB13StringBuilder21StringBuilder_2einner(11);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, "tensor \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$7, _name$4);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$7, "\": ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$7, _reason);
      return _string_builder$7.val;
    }
    case 24: {
      const _Tokenizer = self;
      const _reason$2 = _Tokenizer._0;
      const _string_builder$8 = _M0MPB13StringBuilder21StringBuilder_2einner(11);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$8, "tokenizer: ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$8, _reason$2);
      return _string_builder$8.val;
    }
    default: {
      const _UnsupportedArchitecture = self;
      const _arch = _UnsupportedArchitecture._0;
      const _string_builder$9 = _M0MPB13StringBuilder21StringBuilder_2einner(88);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, "architecture \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$9, _arch);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$9, "\" is not implemented (this build handles the llama/SmolLM2 decoder layout)");
      return _string_builder$9.val;
    }
  }
}
function _M0MP35soehi6moonlm7sampler3Rng3new(seed) {
  return new _M0TP35soehi6moonlm7sampler3Rng(BigInt.asUintN(64, seed) === BigInt.asUintN(64, 0n) ? 11400714819323198485n : seed);
}
function _M0MP35soehi6moonlm7sampler3Rng9next__u64(self) {
  let x = self.state;
  x = BigInt.asUintN(64, x ^ BigInt.asUintN(64, x << BigInt(13 & 63)));
  x = BigInt.asUintN(64, x ^ BigInt.asUintN(64, BigInt.asUintN(64, x) >> BigInt(7 & 63)));
  x = BigInt.asUintN(64, x ^ BigInt.asUintN(64, x << BigInt(17 & 63)));
  self.state = x;
  return BigInt.asUintN(64, x * 2685821657736338717n);
}
function _M0MP35soehi6moonlm7sampler3Rng12next__double(self) {
  const v = BigInt.asUintN(64, BigInt.asUintN(64, _M0MP35soehi6moonlm7sampler3Rng9next__u64(self)) >> BigInt(11 & 63));
  return $f64_convert_i64_u(BigInt.asUintN(64, v)) * 1.1102230246251565e-016;
}
function _M0MP35soehi6moonlm7sampler12SamplerError7message(self) {
  switch (self.$tag) {
    case 36: {
      const _BadTemperature = self;
      const _value = _BadTemperature._0;
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(34);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "temperature must be positive, got ");
      _M0MPB13StringBuilder13write__objectGdE(_string_builder, _value);
      return _string_builder.val;
    }
    case 35: {
      const _BadK = self;
      const _value$2 = _BadK._0;
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(27);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "top-k requires k >= 1, got ");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$2, _value$2);
      return _string_builder$2.val;
    }
    case 34: {
      const _BadP = self;
      const _value$3 = _BadP._0;
      const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(31);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "top-p requires 0 < p <= 1, got ");
      _M0MPB13StringBuilder13write__objectGdE(_string_builder$3, _value$3);
      return _string_builder$3.val;
    }
    default: {
      return "no logits to sample from";
    }
  }
}
function _M0FP35soehi6moonlm7sampler10draw__from(probs, rng) {
  const r = _M0MP35soehi6moonlm7sampler3Rng12next__double(rng);
  let cum = 0;
  let last_nonzero = 0;
  const _bind = probs.length;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < _bind) {
      const p = probs[i];
      if (p > 0) {
        last_nonzero = i;
        cum = cum + p;
        if (r < cum) {
          return i;
        }
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return last_nonzero;
}
function _M0FP35soehi6moonlm7sampler11probs__from(logits, temperature) {
  const n = logits.length;
  const inv_t = 1 / temperature;
  $bound_check(logits, 0);
  let max_v = logits[0] * inv_t;
  let _tmp$4 = 1;
  while (true) {
    const i = _tmp$4;
    if (i < n) {
      $bound_check(logits, i);
      const v = logits[i] * inv_t;
      if (v > max_v) {
        max_v = v;
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const probs = _M0MPC15array5Array4makeGdE(n, 0);
  let total = 0;
  let _tmp$5 = 0;
  while (true) {
    const i = _tmp$5;
    if (i < n) {
      $bound_check(logits, i);
      const e = _M0FPC14math3exp(logits[i] * inv_t - max_v);
      _M0MPC15array5Array3setGdE(probs, i, e);
      total = total + e;
      _tmp$5 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const inv_total = 1 / total;
  let _tmp$6 = 0;
  while (true) {
    const i = _tmp$6;
    if (i < n) {
      _M0MPC15array5Array3setGdE(probs, i, _M0MPC15array5Array2atGdE(probs, i) * inv_total);
      _tmp$6 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return probs;
}
function _M0FP35soehi6moonlm7sampler21sorted__indices__desc(probs) {
  const n = probs.length;
  const order = _M0MPC15array5Array4makeGiE(n, 0);
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < n) {
      _M0MPC15array5Array3setGiE(order, i, i);
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let _tmp$5 = 1;
  while (true) {
    const i = _tmp$5;
    if (i < n) {
      const key = _M0MPC15array5Array2atGiE(order, i);
      const key_p = _M0MPC15array5Array2atGdE(probs, key);
      let j = i - 1 | 0;
      while (true) {
        if (j >= 0 && (_M0MPC15array5Array2atGdE(probs, _M0MPC15array5Array2atGiE(order, j)) < key_p || _M0MPC15array5Array2atGdE(probs, _M0MPC15array5Array2atGiE(order, j)) === key_p && _M0MPC15array5Array2atGiE(order, j) > key)) {
          _M0MPC15array5Array3setGiE(order, j + 1 | 0, _M0MPC15array5Array2atGiE(order, j));
          j = j - 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0MPC15array5Array3setGiE(order, j + 1 | 0, key);
      _tmp$5 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return order;
}
function _M0FP35soehi6moonlm7sampler16truncate__top__k(probs, k) {
  const n = probs.length;
  const kept = _M0MPC15array5Array4makeGdE(n, 0);
  if (k >= n) {
    let _tmp$4 = 0;
    while (true) {
      const i = _tmp$4;
      if (i < n) {
        _M0MPC15array5Array3setGdE(kept, i, _M0MPC15array5Array2atGdE(probs, i));
        _tmp$4 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return kept;
  }
  const order = _M0FP35soehi6moonlm7sampler21sorted__indices__desc(probs);
  let total = 0;
  let _tmp$4 = 0;
  while (true) {
    const r = _tmp$4;
    if (r < k) {
      const i = _M0MPC15array5Array2atGiE(order, r);
      _M0MPC15array5Array3setGdE(kept, i, _M0MPC15array5Array2atGdE(probs, i));
      total = total + _M0MPC15array5Array2atGdE(probs, i);
      _tmp$4 = r + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (total > 0) {
    const inv$2 = 1 / total;
    let _tmp$5 = 0;
    while (true) {
      const i = _tmp$5;
      if (i < n) {
        _M0MPC15array5Array3setGdE(kept, i, _M0MPC15array5Array2atGdE(kept, i) * inv$2);
        _tmp$5 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
  }
  return kept;
}
function _M0FP35soehi6moonlm7sampler16truncate__top__p(probs, p) {
  const n = probs.length;
  const kept = _M0MPC15array5Array4makeGdE(n, 0);
  const order = _M0FP35soehi6moonlm7sampler21sorted__indices__desc(probs);
  let cum = 0;
  let total = 0;
  let _tmp$4 = 0;
  while (true) {
    const r = _tmp$4;
    if (r < n) {
      const i = _M0MPC15array5Array2atGiE(order, r);
      _M0MPC15array5Array3setGdE(kept, i, _M0MPC15array5Array2atGdE(probs, i));
      total = total + _M0MPC15array5Array2atGdE(probs, i);
      cum = cum + _M0MPC15array5Array2atGdE(probs, i);
      if (cum >= p) {
        break;
      }
      _tmp$4 = r + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (total > 0) {
    const inv$2 = 1 / total;
    let _tmp$5 = 0;
    while (true) {
      const i = _tmp$5;
      if (i < n) {
        _M0MPC15array5Array3setGdE(kept, i, _M0MPC15array5Array2atGdE(kept, i) * inv$2);
        _tmp$5 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
  }
  return kept;
}
function _M0FP35soehi6moonlm7sampler6sample(logits, sampler, rng) {
  const n = logits.length;
  if (n === 0) {
    return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(_M0DTPC15error5Error53soehi_2fmoonlm_2fsampler_2eSamplerError_2eEmptyLogits__);
  }
  switch (sampler.$tag) {
    case 0: {
      let best = 0;
      $bound_check(logits, 0);
      let best_v = logits[0];
      let _tmp$4 = 1;
      while (true) {
        const i = _tmp$4;
        if (i < n) {
          $bound_check(logits, i);
          if (logits[i] > best_v) {
            $bound_check(logits, i);
            best_v = logits[i];
            best = i;
          }
          _tmp$4 = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok(best);
    }
    case 1: {
      const _Temperature = sampler;
      const _temperature = _Temperature._0;
      if (_temperature <= 0) {
        return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(new _M0DTPC15error5Error56soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadTemperature(_temperature));
      }
      const probs = _M0FP35soehi6moonlm7sampler11probs__from(logits, _temperature);
      return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok(_M0FP35soehi6moonlm7sampler10draw__from(probs, rng));
    }
    case 2: {
      const _TopK = sampler;
      const _temperature$2 = _TopK._0;
      const _k = _TopK._1;
      if (_temperature$2 <= 0) {
        return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(new _M0DTPC15error5Error56soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadTemperature(_temperature$2));
      }
      if (_k < 1) {
        return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadK(_k));
      }
      const probs$2 = _M0FP35soehi6moonlm7sampler11probs__from(logits, _temperature$2);
      const kept = _M0FP35soehi6moonlm7sampler16truncate__top__k(probs$2, _k);
      return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok(_M0FP35soehi6moonlm7sampler10draw__from(kept, rng));
    }
    default: {
      const _TopP = sampler;
      const _temperature$3 = _TopP._0;
      const _p$2 = _TopP._1;
      if (_temperature$3 <= 0) {
        return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(new _M0DTPC15error5Error56soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadTemperature(_temperature$3));
      }
      if (_p$2 <= 0 || _p$2 > 1) {
        return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE3Err(new _M0DTPC15error5Error46soehi_2fmoonlm_2fsampler_2eSamplerError_2eBadP(_p$2));
      }
      const probs$3 = _M0FP35soehi6moonlm7sampler11probs__from(logits, _temperature$3);
      const kept$2 = _M0FP35soehi6moonlm7sampler16truncate__top__p(probs$3, _p$2);
      return new _M0DTPC16result6ResultGiRP35soehi6moonlm7sampler12SamplerErrorE2Ok(_M0FP35soehi6moonlm7sampler10draw__from(kept$2, rng));
    }
  }
}
function _M0FP35soehi6moonlm9tokenizer10in__ranges(ranges, cp) {
  const n = ranges.length / 2 | 0;
  let lo = 0;
  let hi = n;
  while (true) {
    if (lo < hi) {
      const mid = (lo + hi | 0) / 2 | 0;
      const rlo = _M0MPC15array5Array2atGiE(ranges, Math.imul(mid, 2) | 0);
      const rhi = _M0MPC15array5Array2atGiE(ranges, (Math.imul(mid, 2) | 0) + 1 | 0);
      if (cp < rlo) {
        hi = mid;
      } else {
        if (cp > rhi) {
          lo = mid + 1 | 0;
        } else {
          return true;
        }
      }
      continue;
    } else {
      break;
    }
  }
  return false;
}
function _M0FP35soehi6moonlm9tokenizer19is__unicode__letter(cp) {
  return _M0FP35soehi6moonlm9tokenizer10in__ranges(_M0FP35soehi6moonlm9tokenizer23unicode__letter__ranges, cp);
}
function _M0FP35soehi6moonlm9tokenizer19is__unicode__number(cp) {
  return _M0FP35soehi6moonlm9tokenizer10in__ranges(_M0FP35soehi6moonlm9tokenizer23unicode__number__ranges, cp);
}
function _M0FP35soehi6moonlm9tokenizer18is__unicode__space(cp) {
  return _M0FP35soehi6moonlm9tokenizer10in__ranges(_M0FP35soehi6moonlm9tokenizer22unicode__space__ranges, cp);
}
function _M0FP35soehi6moonlm9tokenizer15tk__err__string(e) {
  switch (e.$tag) {
    case 42: {
      const _UnsupportedModel = e;
      const _model = _UnsupportedModel._0;
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(64);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "unsupported tokenizer.ggml.model \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, _model);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "\" (this build implements gpt2)");
      return _string_builder.val;
    }
    case 41: {
      const _MissingKey = e;
      const _key = _MissingKey._0;
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(28);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "missing GGUF metadata key \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _key);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "\"");
      return _string_builder$2.val;
    }
    case 40: {
      const _WrongType = e;
      const _key$2 = _WrongType._0;
      const _expected = _WrongType._1;
      const _string_builder$3 = _M0MPB13StringBuilder21StringBuilder_2einner(49);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "metadata key \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$3, _key$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$3, "\" has an unexpected type, expected ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$3, _expected);
      return _string_builder$3.val;
    }
    case 39: {
      return "tokenizer.ggml.tokens is empty";
    }
    case 38: {
      const _EmptyToken = e;
      const _index = _EmptyToken._0;
      const _string_builder$4 = _M0MPB13StringBuilder21StringBuilder_2einner(32);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "tokenizer.ggml.tokens[");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$4, _index);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$4, "] is empty");
      return _string_builder$4.val;
    }
    default: {
      const _MergeNotInVocab = e;
      const _index$2 = _MergeNotInVocab._0;
      const _token = _MergeNotInVocab._1;
      const _string_builder$5 = _M0MPB13StringBuilder21StringBuilder_2einner(53);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "merges[");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder$5, _index$2);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "] references token \"");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$5, _token);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$5, "\" not present in the vocab");
      return _string_builder$5.val;
    }
  }
}
function _M0MP35soehi6moonlm9tokenizer14TokenizerError7message(self) {
  return _M0FP35soehi6moonlm9tokenizer15tk__err__string(self);
}
function _M0FP35soehi6moonlm9tokenizer11get__string(f, key) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile11get__string(f, key);
  if (_bind === undefined) {
    return new _M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(new _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMissingKey(key));
  } else {
    const _Some = _bind;
    const _s = _Some;
    return new _M0DTPC16result6ResultGsRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(_s);
  }
}
function _M0FP35soehi6moonlm9tokenizer12get__int__or(f, key, default_) {
  const _bind = _M0MP35soehi6moonlm4gguf8GgufFile8get__int(f, key);
  if (_bind === undefined) {
    return default_;
  } else {
    const _Some = _bind;
    const _v = _Some;
    return Number(BigInt.asIntN(32, _v)) | 0;
  }
}
function _M0FP35soehi6moonlm9tokenizer18get__string__array(f, key) {
  _L: {
    const _bind = _M0MP35soehi6moonlm4gguf8GgufFile3get(f, key);
    if (_bind === undefined) {
      return new _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(new _M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eMissingKey(key));
    } else {
      const _Some = _bind;
      const _x = _Some;
      if (_x.$tag === 9) {
        const _Array = _x;
        const _x$2 = _Array._0;
        if (_x$2.$tag === 0) {
          const _Materialized = _x$2;
          const _elems = _Materialized._0;
          const out = [];
          const _bind$2 = _elems.length;
          let _tmp$4 = 0;
          while (true) {
            const _ = _tmp$4;
            if (_ < _bind$2) {
              const e = _elems[_];
              if (e.$tag === 8) {
                const _Str = e;
                const _s = _Str._0;
                _M0MPC15array5Array4pushGUsiEE(out, _s);
              } else {
                return new _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eWrongType(key, "string array"));
              }
              _tmp$4 = _ + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          return new _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(out);
        } else {
          break _L;
        }
      } else {
        break _L;
      }
    }
  }
  return new _M0DTPC16result6ResultGRPB5ArrayGsERP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(new _M0DTPC15error5Error55soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eWrongType(key, "string array (was the file parsed with parse_materializing_metadata?)"));
}
function _M0FP35soehi6moonlm9tokenizer8cmp__str(a, b) {
  const la = a.length;
  const lb = b.length;
  const n = la < lb ? la : lb;
  let i = 0;
  while (true) {
    if (i < n) {
      const _tmp$4 = i;
      $bound_check(a, _tmp$4);
      const x = a.charCodeAt(_tmp$4);
      const _tmp$5 = i;
      $bound_check(b, _tmp$5);
      const y = b.charCodeAt(_tmp$5);
      if (x < y) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return la < lb ? -1 : la > lb ? 1 : 0;
}
function _M0FP35soehi6moonlm9tokenizer9cmp__pair(l1, r1, l2, r2) {
  const c = _M0FP35soehi6moonlm9tokenizer8cmp__str(l1, l2);
  return c !== 0 ? c : _M0FP35soehi6moonlm9tokenizer8cmp__str(r1, r2);
}
function _M0FP35soehi6moonlm9tokenizer11find__space(s) {
  let i = 0;
  const _bind = s.length;
  let _tmp$4 = 0;
  while (true) {
    const _string_index = _tmp$4;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = s.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = s.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$5 = _string_index + 2 | 0;
            const _p$2 = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          } else {
            const _tmp$5 = _string_index + 1 | 0;
            const _p$2 = _bind$2;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          }
        } else {
          const _tmp$5 = _string_index + 1 | 0;
          const _p$2 = _bind$2;
          _decoded_next_string_index = _tmp$5;
          _decoded_char = _p$2;
          break _L;
        }
      }
      if (_decoded_char === 32) {
        return i;
      }
      i = i + 1 | 0;
      _tmp$4 = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  return -1;
}
function _M0MP35soehi6moonlm9tokenizer10MergeTable3new(merges) {
  const lefts = [];
  const rights = [];
  const joined = [];
  const prio = [];
  const _bind = merges.length;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < _bind) {
      const entry = merges[i];
      const sp = _M0FP35soehi6moonlm9tokenizer11find__space(entry);
      if (sp > 0) {
        const l = _M0MPC16string10StringView9to__owned(_M0MPC16string6String11sub_2einner(entry, 0, sp));
        const r = _M0MPC16string10StringView9to__owned(_M0MPC16string6String11sub_2einner(entry, sp + 1 | 0, undefined));
        _M0MPC15array5Array4pushGUsiEE(lefts, l);
        _M0MPC15array5Array4pushGUsiEE(rights, r);
        _M0MPC15array5Array4pushGUsiEE(joined, `${l}${r}`);
        _M0MPC15array5Array4pushGiE(prio, i);
      }
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const n = lefts.length;
  const ord = _M0MPC15array5Array4makeGiE(n, 0);
  let _tmp$5 = 0;
  while (true) {
    const i = _tmp$5;
    if (i < n) {
      _M0MPC15array5Array3setGiE(ord, i, i);
      _tmp$5 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const tmp = _M0MPC15array5Array4makeGiE(n, 0);
  let width = 1;
  while (true) {
    if (width < n) {
      let lo = 0;
      while (true) {
        if (lo < (n - width | 0)) {
          const mid = lo + width | 0;
          const hi = (lo + (Math.imul(2, width) | 0) | 0) < n ? lo + (Math.imul(2, width) | 0) | 0 : n;
          let a = lo;
          let b = mid;
          let k = lo;
          while (true) {
            if (a < mid && b < hi) {
              const ca = _M0FP35soehi6moonlm9tokenizer9cmp__pair(_M0MPC15array5Array2atGsE(lefts, _M0MPC15array5Array2atGiE(ord, a)), _M0MPC15array5Array2atGsE(rights, _M0MPC15array5Array2atGiE(ord, a)), _M0MPC15array5Array2atGsE(lefts, _M0MPC15array5Array2atGiE(ord, b)), _M0MPC15array5Array2atGsE(rights, _M0MPC15array5Array2atGiE(ord, b)));
              if (ca <= 0) {
                _M0MPC15array5Array3setGiE(tmp, k, _M0MPC15array5Array2atGiE(ord, a));
                a = a + 1 | 0;
              } else {
                _M0MPC15array5Array3setGiE(tmp, k, _M0MPC15array5Array2atGiE(ord, b));
                b = b + 1 | 0;
              }
              k = k + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          while (true) {
            if (a < mid) {
              _M0MPC15array5Array3setGiE(tmp, k, _M0MPC15array5Array2atGiE(ord, a));
              a = a + 1 | 0;
              k = k + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          while (true) {
            if (b < hi) {
              _M0MPC15array5Array3setGiE(tmp, k, _M0MPC15array5Array2atGiE(ord, b));
              b = b + 1 | 0;
              k = k + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          let _tmp$6 = lo;
          while (true) {
            const x = _tmp$6;
            if (x < hi) {
              _M0MPC15array5Array3setGiE(ord, x, _M0MPC15array5Array2atGiE(tmp, x));
              _tmp$6 = x + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          lo = lo + (Math.imul(2, width) | 0) | 0;
          continue;
        } else {
          break;
        }
      }
      width = Math.imul(width, 2) | 0;
      continue;
    } else {
      break;
    }
  }
  const s_lefts = [];
  const s_rights = [];
  const s_joined = [];
  const s_prio = [];
  let _tmp$6 = 0;
  while (true) {
    const k = _tmp$6;
    if (k < n) {
      const i = _M0MPC15array5Array2atGiE(ord, k);
      _M0MPC15array5Array4pushGUsiEE(s_lefts, _M0MPC15array5Array2atGsE(lefts, i));
      _M0MPC15array5Array4pushGUsiEE(s_rights, _M0MPC15array5Array2atGsE(rights, i));
      _M0MPC15array5Array4pushGUsiEE(s_joined, _M0MPC15array5Array2atGsE(joined, i));
      _M0MPC15array5Array4pushGiE(s_prio, _M0MPC15array5Array2atGiE(prio, i));
      _tmp$6 = k + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return new _M0TP35soehi6moonlm9tokenizer10MergeTable(s_lefts, s_rights, s_joined, s_prio);
}
function _M0FP35soehi6moonlm9tokenizer4load(f) {
  const _bind = _M0FP35soehi6moonlm9tokenizer11get__string(f, "tokenizer.ggml.model");
  let model;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    model = _Ok._0;
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(_e);
  }
  const _p$2 = "gpt2";
  if (!(model === _p$2)) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(new _M0DTPC15error5Error62soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eUnsupportedModel(model));
  }
  const _bind$2 = _M0FP35soehi6moonlm9tokenizer18get__string__array(f, "tokenizer.ggml.tokens");
  let vocab;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    vocab = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(_e);
  }
  const _bind$3 = _M0FP35soehi6moonlm9tokenizer18get__string__array(f, "tokenizer.ggml.merges");
  let merges_raw;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    merges_raw = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(_e);
  }
  if (vocab.length === 0) {
    return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE3Err(_M0DTPC15error5Error56soehi_2fmoonlm_2ftokenizer_2eTokenizerError_2eEmptyVocab__);
  }
  const _bind$4 = [];
  const token_ids = _M0MPB3Map3MapGsiE(new _M0TPB9ArrayViewGUsiEE(_bind$4, 0, 0), undefined);
  const _bind$5 = vocab.length;
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < _bind$5) {
      const t$3 = vocab[i];
      _M0MPB3Map3setGsiE(token_ids, t$3, i);
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const bos = _M0FP35soehi6moonlm9tokenizer12get__int__or(f, "tokenizer.ggml.bos_token_id", -1);
  const eos = _M0FP35soehi6moonlm9tokenizer12get__int__or(f, "tokenizer.ggml.eos_token_id", -1);
  const unk = _M0FP35soehi6moonlm9tokenizer12get__int__or(f, "tokenizer.ggml.unknown_token_id", 0);
  const pad = _M0FP35soehi6moonlm9tokenizer12get__int__or(f, "tokenizer.ggml.padding_token_id", eos);
  const _bind$6 = _M0MP35soehi6moonlm4gguf8GgufFile3get(f, "tokenizer.ggml.add_bos_token");
  let add_bos;
  if (_bind$6 === undefined) {
    add_bos = false;
  } else {
    const _Some = _bind$6;
    const _x = _Some;
    if (_x.$tag === 7) {
      const _Bool = _x;
      add_bos = _Bool._0;
    } else {
      add_bos = false;
    }
  }
  const _bind$7 = _M0MP35soehi6moonlm4gguf8GgufFile3get(f, "tokenizer.ggml.add_eos_token");
  let add_eos;
  if (_bind$7 === undefined) {
    add_eos = false;
  } else {
    const _Some = _bind$7;
    const _x = _Some;
    if (_x.$tag === 7) {
      const _Bool = _x;
      add_eos = _Bool._0;
    } else {
      add_eos = false;
    }
  }
  const specials = [];
  const _bind$8 = _M0MP35soehi6moonlm4gguf8GgufFile3get(f, "tokenizer.ggml.token_type");
  if (_bind$8 === undefined) {
  } else {
    const _Some = _bind$8;
    const _x = _Some;
    if (_x.$tag === 9) {
      const _Array = _x;
      const _x$2 = _Array._0;
      if (_x$2.$tag === 0) {
        const _Materialized = _x$2;
        const _elems = _Materialized._0;
        const _bind$9 = _elems.length;
        let _tmp$5 = 0;
        while (true) {
          const i = _tmp$5;
          if (i < _bind$9) {
            const e = _elems[i];
            let is_control;
            if (e.$tag === 5) {
              const _I32 = e;
              const _t = _I32._0;
              is_control = _t === 3;
            } else {
              is_control = false;
            }
            if (is_control && i < vocab.length) {
              _M0MPC15array5Array4pushGUsiEE(specials, { _0: _M0MPC15array5Array2atGsE(vocab, i), _1: i });
            }
            _tmp$5 = i + 1 | 0;
            continue;
          } else {
            break;
          }
        }
      }
    }
  }
  const merges = _M0MP35soehi6moonlm9tokenizer10MergeTable3new(merges_raw);
  return new _M0DTPC16result6ResultGRP35soehi6moonlm9tokenizer9TokenizerRP35soehi6moonlm9tokenizer14TokenizerErrorE2Ok(new _M0TP35soehi6moonlm9tokenizer9Tokenizer(vocab, token_ids, specials, merges, new _M0TP35soehi6moonlm9tokenizer10SpecialIds(bos, eos, unk, pad), add_bos, add_eos));
}
function _M0FP35soehi6moonlm9tokenizer13char__advance(text, pos) {
  $bound_check(text, pos);
  const unit = text.charCodeAt(pos);
  if (unit >= 55296 && (unit <= 56319 && (pos + 1 | 0) < text.length)) {
    const _tmp$4 = pos + 1 | 0;
    $bound_check(text, _tmp$4);
    const next = text.charCodeAt(_tmp$4);
    if (next >= 56320 && next <= 57343) {
      return 2;
    }
  }
  return 1;
}
function _M0MP35soehi6moonlm9tokenizer10MergeTable6lookup(self, left, right) {
  const n = self.lefts.length;
  let lo = 0;
  let hi = n;
  while (true) {
    if (lo < hi) {
      const mid = (lo + hi | 0) / 2 | 0;
      const cmp = _M0FP35soehi6moonlm9tokenizer9cmp__pair(_M0MPC15array5Array2atGsE(self.lefts, mid), _M0MPC15array5Array2atGsE(self.rights, mid), left, right);
      if (cmp === 0) {
        return mid;
      } else {
        if (cmp < 0) {
          lo = mid + 1 | 0;
        } else {
          hi = mid;
        }
      }
      continue;
    } else {
      break;
    }
  }
  return -1;
}
function _M0MP35soehi6moonlm9tokenizer10MergeTable12priority__at(self, pos) {
  return _M0MPC15array5Array2atGiE(self.priority, pos);
}
function _M0FP35soehi6moonlm9tokenizer10bpe__merge(table, piece) {
  if (piece.length <= 1) {
    return [piece];
  }
  const parts = [];
  const _bind = piece.length;
  let _tmp$4 = 0;
  while (true) {
    const _string_index = _tmp$4;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = piece.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = piece.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$5 = _string_index + 2 | 0;
            const _p$2 = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          } else {
            const _tmp$5 = _string_index + 1 | 0;
            const _p$2 = _bind$2;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          }
        } else {
          const _tmp$5 = _string_index + 1 | 0;
          const _p$2 = _bind$2;
          _decoded_next_string_index = _tmp$5;
          _decoded_char = _p$2;
          break _L;
        }
      }
      _M0MPC15array5Array4pushGUsiEE(parts, _M0IPC14char4CharPB4Show10to__string(_decoded_char));
      _tmp$4 = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  let parts_len = parts.length;
  while (true) {
    if (parts_len > 1) {
      let best_pri = -1;
      let best_i = -1;
      let best_pos = -1;
      let _tmp$5 = 0;
      while (true) {
        const i = _tmp$5;
        if (i < (parts_len - 1 | 0)) {
          const pos = _M0MP35soehi6moonlm9tokenizer10MergeTable6lookup(table, _M0MPC15array5Array2atGsE(parts, i), _M0MPC15array5Array2atGsE(parts, i + 1 | 0));
          if (pos >= 0) {
            const pri = _M0MP35soehi6moonlm9tokenizer10MergeTable12priority__at(table, pos);
            if (best_pri < 0 || pri < best_pri) {
              best_pri = pri;
              best_i = i;
              best_pos = pos;
            }
          }
          _tmp$5 = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      if (best_i < 0) {
        break;
      }
      _M0MPC15array5Array3setGsE(parts, best_i, _M0MPC15array5Array2atGsE(table.joined, best_pos));
      let _tmp$6 = best_i + 1 | 0;
      while (true) {
        const j = _tmp$6;
        if (j < (parts_len - 1 | 0)) {
          _M0MPC15array5Array3setGsE(parts, j, _M0MPC15array5Array2atGsE(parts, j + 1 | 0));
          _tmp$6 = j + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      parts_len = parts_len - 1 | 0;
      _M0MPC15array5Array8truncateGsE(parts, parts_len);
      continue;
    } else {
      break;
    }
  }
  return parts;
}
function _M0FP35soehi6moonlm9tokenizer19byte__to__codepoint(b) {
  return _M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm9tokenizer20byte__encoder__table, b);
}
function _M0FP35soehi6moonlm9tokenizer23bytes__to__gpt2__string(bytes) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  let _tmp$4 = 0;
  while (true) {
    const i = _tmp$4;
    if (i < bytes.length) {
      $bound_check(bytes, i);
      _M0IPB13StringBuilderPB6Logger11write__char(sb, _M0FP35soehi6moonlm9tokenizer19byte__to__codepoint(bytes[i]));
      _tmp$4 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return sb.val;
}
function _M0FP35soehi6moonlm9tokenizer17chars__to__string(chars, start, end) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  let _tmp$4 = start;
  while (true) {
    const k = _tmp$4;
    if (k < end) {
      _M0IPB13StringBuilderPB6Logger11write__char(sb, _M0MPC15array5Array2atGcE(chars, k));
      _tmp$4 = k + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return sb.val;
}
function _M0FP35soehi6moonlm9tokenizer19match__contractions(chars, i, n) {
  if (i >= n || _M0MPC15array5Array2atGcE(chars, i) !== 39) {
    return undefined;
  }
  if ((i + 1 | 0) < n) {
    const c = _M0MPC15array5Array2atGcE(chars, i + 1 | 0);
    if (c === 115 || (c === 116 || (c === 109 || c === 100))) {
      return i + 2 | 0;
    }
    if ((i + 2 | 0) < n) {
      const c2 = _M0MPC15array5Array2atGcE(chars, i + 2 | 0);
      if (c === 114 && c2 === 101 || (c === 118 && c2 === 101 || c === 108 && c2 === 108)) {
        return i + 3 | 0;
      }
    }
  }
  return undefined;
}
function _M0FP35soehi6moonlm9tokenizer28match__leading__space__class(chars, i, n) {
  let j = i;
  if (_M0MPC15array5Array2atGcE(chars, j) === 32) {
    j = j + 1 | 0;
    if (j >= n) {
      return undefined;
    }
  }
  const c = _M0MPC15array5Array2atGcE(chars, j);
  if (_M0FP35soehi6moonlm9tokenizer18is__unicode__space(c)) {
    return undefined;
  }
  const class_of = _M0FP35soehi6moonlm9tokenizer19is__unicode__letter(c) ? 0 : _M0FP35soehi6moonlm9tokenizer19is__unicode__number(c) ? 1 : 2;
  j = j + 1 | 0;
  if (class_of === 1) {
    return j;
  }
  while (true) {
    if (j < n) {
      const c2 = _M0MPC15array5Array2atGcE(chars, j);
      const same = class_of === 0 ? _M0FP35soehi6moonlm9tokenizer19is__unicode__letter(c2) : !_M0FP35soehi6moonlm9tokenizer18is__unicode__space(c2) && (!_M0FP35soehi6moonlm9tokenizer19is__unicode__letter(c2) && !_M0FP35soehi6moonlm9tokenizer19is__unicode__number(c2));
      if (!same) {
        break;
      }
      j = j + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return j;
}
function _M0FP35soehi6moonlm9tokenizer17match__whitespace(chars, i, n) {
  if (!_M0FP35soehi6moonlm9tokenizer18is__unicode__space(_M0MPC15array5Array2atGcE(chars, i))) {
    return undefined;
  }
  let j = i;
  while (true) {
    if (j < n && _M0FP35soehi6moonlm9tokenizer18is__unicode__space(_M0MPC15array5Array2atGcE(chars, j))) {
      j = j + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (j < n) {
    if ((j - i | 0) > 1) {
      return j - 1 | 0;
    }
    return undefined;
  }
  return j;
}
function _M0FP35soehi6moonlm9tokenizer17pretokenize__text(text) {
  const chars = _M0MPC16string6String9to__array(text);
  const n = chars.length;
  const pieces = [];
  let i = 0;
  while (true) {
    if (i < n) {
      const start = i;
      const _bind = _M0FP35soehi6moonlm9tokenizer19match__contractions(chars, i, n);
      let next;
      if (_bind === undefined) {
        const _bind$2 = _M0FP35soehi6moonlm9tokenizer28match__leading__space__class(chars, i, n);
        if (_bind$2 === undefined) {
          next = _M0FP35soehi6moonlm9tokenizer17match__whitespace(chars, i, n);
        } else {
          const _Some = _bind$2;
          const _j = _Some;
          next = _j;
        }
      } else {
        const _Some = _bind;
        const _j = _Some;
        next = _j;
      }
      if (next === undefined) {
        i = i + 1 | 0;
      } else {
        const _Some = next;
        const _j = _Some;
        i = _j;
      }
      if (i > start) {
        _M0MPC15array5Array4pushGUsiEE(pieces, _M0FP35soehi6moonlm9tokenizer17chars__to__string(chars, start, i));
      }
      continue;
    } else {
      break;
    }
  }
  return pieces;
}
function _M0MP35soehi6moonlm9tokenizer9Tokenizer13encode__plain(self, span, out) {
  const pieces = _M0FP35soehi6moonlm9tokenizer17pretokenize__text(span);
  const _bind = pieces.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind) {
      const piece = pieces[_];
      const piece_bytes = _M0FPC28encoding4utf814encode_2einner(new _M0TPC16string10StringView(piece, 0, piece.length), false);
      const encoded = _M0FP35soehi6moonlm9tokenizer23bytes__to__gpt2__string(piece_bytes);
      const _bind$2 = _M0FP35soehi6moonlm9tokenizer10bpe__merge(self.merges, encoded);
      const _bind$3 = _bind$2.length;
      let _tmp$5 = 0;
      while (true) {
        const _$2 = _tmp$5;
        if (_$2 < _bind$3) {
          const part = _bind$2[_$2];
          const _bind$4 = _M0MPB3Map3getGsiE(self.token_ids, part);
          if (_bind$4 === undefined) {
            _M0MPC15array5Array4pushGiE(out, self.ids.unk);
          } else {
            const _Some = _bind$4;
            const _id = _Some;
            _M0MPC15array5Array4pushGiE(out, _id);
          }
          _tmp$5 = _$2 + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0MP35soehi6moonlm9tokenizer9Tokenizer6encode(self, text) {
  const out = [];
  let pos = 0;
  let plain_start = 0;
  const text_len = text.length;
  while (true) {
    if (pos < text_len) {
      let matched = false;
      const _bind = self.specials;
      const _bind$2 = _bind.length;
      let _tmp$4 = 0;
      while (true) {
        const _ = _tmp$4;
        if (_ < _bind$2) {
          const entry = _bind[_];
          const _sp = entry._0;
          const _sp_id = entry._1;
          if (_M0MPC16string10StringView11has__prefix(_M0MPC16string6String11sub_2einner(text, pos, undefined), new _M0TPC16string10StringView(_sp, 0, _sp.length))) {
            if (pos > plain_start) {
              _M0MP35soehi6moonlm9tokenizer9Tokenizer13encode__plain(self, _M0MPC16string10StringView9to__owned(_M0MPC16string6String11sub_2einner(text, plain_start, pos)), out);
            }
            _M0MPC15array5Array4pushGiE(out, _sp_id);
            pos = pos + _sp.length | 0;
            plain_start = pos;
            matched = true;
            break;
          }
          _tmp$4 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      if (!matched) {
        pos = pos + _M0FP35soehi6moonlm9tokenizer13char__advance(text, pos) | 0;
      }
      continue;
    } else {
      break;
    }
  }
  if (plain_start < text_len) {
    _M0MP35soehi6moonlm9tokenizer9Tokenizer13encode__plain(self, _M0MPC16string10StringView9to__owned(_M0MPC16string6String11sub_2einner(text, plain_start, undefined)), out);
  }
  if (self.add_bos && self.ids.bos >= 0) {
    _M0MPC15array5Array6insertGiE(out, 0, self.ids.bos);
  }
  if (self.add_eos && self.ids.eos >= 0) {
    _M0MPC15array5Array4pushGiE(out, self.ids.eos);
  }
  return out;
}
function _M0FP35soehi6moonlm9tokenizer19codepoint__to__byte(cp) {
  return cp < 33 || cp > 323 ? -1 : _M0MPC15array5Array2atGiE(_M0FP35soehi6moonlm9tokenizer20byte__decoder__table, cp - 33 | 0);
}
function _M0FP35soehi6moonlm9tokenizer23gpt2__string__to__bytes(s, out) {
  let n = 0;
  const _bind = s.length;
  let _tmp$4 = 0;
  while (true) {
    const _string_index = _tmp$4;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = s.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = s.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$5 = _string_index + 2 | 0;
            const _p$2 = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          } else {
            const _tmp$5 = _string_index + 1 | 0;
            const _p$2 = _bind$2;
            _decoded_next_string_index = _tmp$5;
            _decoded_char = _p$2;
            break _L;
          }
        } else {
          const _tmp$5 = _string_index + 1 | 0;
          const _p$2 = _bind$2;
          _decoded_next_string_index = _tmp$5;
          _decoded_char = _p$2;
          break _L;
        }
      }
      if (n >= out.length) {
        break;
      }
      const b = _M0FP35soehi6moonlm9tokenizer19codepoint__to__byte(_decoded_char);
      if (b >= 0) {
        const _tmp$5 = n;
        $bound_check(out, _tmp$5);
        out[_tmp$5] = b & 255;
        n = n + 1 | 0;
      }
      _tmp$4 = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  return n;
}
function _M0MP35soehi6moonlm9tokenizer9Tokenizer6decode(self, tokens) {
  let bytes = $makebytes((Math.imul(tokens.length, 16) | 0) + 16 | 0, 0);
  let n = 0;
  const _bind = tokens.length;
  let _tmp$4 = 0;
  while (true) {
    const _ = _tmp$4;
    if (_ < _bind) {
      const id = tokens[_];
      if (id >= 0 && id < self.vocab.length) {
        const t$3 = _M0MPC15array5Array2atGsE(self.vocab, id);
        const cap = t$3.length + 1 | 0;
        const buf = $makebytes(cap, 0);
        const written = _M0FP35soehi6moonlm9tokenizer23gpt2__string__to__bytes(t$3, buf);
        let _tmp$5 = 0;
        while (true) {
          const k = _tmp$5;
          if (k < written) {
            if (n >= bytes.length) {
              const bigger = $makebytes(Math.imul(bytes.length, 2) | 0, 0);
              let _tmp$6 = 0;
              while (true) {
                const j = _tmp$6;
                if (j < n) {
                  const _tmp$7 = bytes;
                  $bound_check(_tmp$7, j);
                  $bound_check(bigger, j);
                  bigger[j] = _tmp$7[j];
                  _tmp$6 = j + 1 | 0;
                  continue;
                } else {
                  break;
                }
              }
              bytes = bigger;
            }
            const _tmp$6 = bytes;
            const _tmp$7 = n;
            $bound_check(buf, k);
            $bound_check(_tmp$6, _tmp$7);
            _tmp$6[_tmp$7] = buf[k];
            n = n + 1 | 0;
            _tmp$5 = k + 1 | 0;
            continue;
          } else {
            break;
          }
        }
      }
      _tmp$4 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const out_bytes = _M0MPC15bytes5Bytes11from__array(_M0MPC15array10FixedArray12view_2einnerGyE(bytes, 0, n));
  return _M0FPC28encoding4utf821decode__lossy_2einner(_M0MPC15bytes5Bytes12view_2einner(out_bytes, 0, undefined), false);
}
function _M0FP35soehi6moonlm6engine18monotonic__seconds() {
  return $f64_convert_i64_u(BigInt.asUintN(64, _M0FPC13env3now())) / 1000;
}
function _M0MP35soehi6moonlm6engine10PureEngine11load__bytes(buf, path) {
  const _bind = _M0FP35soehi6moonlm4gguf30parse__materializing__metadata(buf);
  let f;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    f = _Ok._0;
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(10);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "parsing ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, path);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm4gguf9GgufError7message(_e));
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  }
  const _bind$2 = _M0FP35soehi6moonlm9tokenizer4load(f);
  let tokenizer;
  if (_bind$2.$tag === 1) {
    const _Ok = _bind$2;
    tokenizer = _Ok._0;
  } else {
    const _Err = _bind$2;
    const _e = _Err._0;
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(29);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "loading the tokenizer from ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, path);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm9tokenizer14TokenizerError7message(_e));
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  }
  const _bind$3 = _M0MP35soehi6moonlm5model5Model4load(f);
  let model;
  if (_bind$3.$tag === 1) {
    const _Ok = _bind$3;
    model = _Ok._0;
  } else {
    const _Err = _bind$3;
    const _e = _Err._0;
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(25);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "loading the model from ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, path);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm5model10ModelError7message(_e));
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  }
  if (tokenizer.vocab.length > model.config.vocab_size) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(69);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "tokenizer vocabulary (");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, tokenizer.vocab.length);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ") is larger than the model's embedding table (");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, model.config.vocab_size);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ")");
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  }
  return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE2Ok(new _M0TP35soehi6moonlm6engine10PureEngine(model, tokenizer, path));
}
function _M0IP35soehi6moonlm6engine10PureEngineP35soehi6moonlm6engine6Engine8generate(self, prompt, max_tokens, sampler, seed, on_token) {
  const tokens = _M0MP35soehi6moonlm9tokenizer9Tokenizer6encode(self.tokenizer, prompt);
  if (tokens.length === 0) {
    return _M0IP35soehi6moonlm6engine10PureEngineP35soehi6moonlm6engine6Engine8generateN6constrS149;
  }
  const ctx = self.model.config.context_length;
  if (tokens.length >= ctx) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(70);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "the prompt has ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, tokens.length);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " tokens, which does not fit the model's context length ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, ctx);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err(_string_builder.val);
  }
  _M0MP35soehi6moonlm5model7KVCache5reset(self.model.cache);
  const rng = _M0MP35soehi6moonlm7sampler3Rng3new(seed);
  const prefill_start = _M0FP35soehi6moonlm6engine18monotonic__seconds();
  const n_prompt = tokens.length;
  let _tmp$4 = 0;
  while (true) {
    const pos = _tmp$4;
    if (pos < (n_prompt - 1 | 0)) {
      const _bind = _M0MP35soehi6moonlm5model5Model7forward(self.model, _M0MPC15array5Array2atGiE(tokens, pos), pos);
      if (_bind.$tag === 1) {
      } else {
        const _Err = _bind;
        const _e = _Err._0;
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(22);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "prefill at position ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, pos);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm5model10ModelError7message(_e));
        return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err(_string_builder.val);
      }
      self.model.cache.len = pos + 1 | 0;
      _tmp$4 = pos + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const prefill_seconds = _M0FP35soehi6moonlm6engine18monotonic__seconds() - prefill_start;
  const decode_start = _M0FP35soehi6moonlm6engine18monotonic__seconds();
  const produced = [];
  let hit_eos = false;
  let pos = n_prompt - 1 | 0;
  let next_token = _M0MPC15array5Array2atGiE(tokens, pos);
  let emitted = 0;
  const limit = max_tokens < 0 ? 0 : max_tokens;
  while (true) {
    if (emitted < limit && pos < ctx) {
      const _bind = _M0MP35soehi6moonlm5model5Model7forward(self.model, next_token, pos);
      if (_bind.$tag === 1) {
      } else {
        const _Err = _bind;
        const _e = _Err._0;
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(23);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "decoding at position ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, pos);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm5model10ModelError7message(_e));
        return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err(_string_builder.val);
      }
      self.model.cache.len = pos + 1 | 0;
      const _p$2 = self.model;
      const _bind$2 = _M0FP35soehi6moonlm7sampler6sample(_p$2.scratch.logits, sampler, rng);
      let sampled;
      if (_bind$2.$tag === 1) {
        const _Ok = _bind$2;
        sampled = _Ok._0;
      } else {
        const _Err = _bind$2;
        const _e = _Err._0;
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(23);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "sampling at position ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, pos);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": ");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MP35soehi6moonlm7sampler12SamplerError7message(_e));
        return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE3Err(_string_builder.val);
      }
      const _p$3 = self.tokenizer;
      if (sampled === _p$3.ids.eos) {
        hit_eos = true;
        break;
      }
      _M0MPC15array5Array4pushGiE(produced, sampled);
      emitted = emitted + 1 | 0;
      on_token(sampled, _M0MP35soehi6moonlm9tokenizer9Tokenizer6decode(self.tokenizer, [sampled]));
      next_token = sampled;
      pos = pos + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const decode_seconds = _M0FP35soehi6moonlm6engine18monotonic__seconds() - decode_start;
  return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine15GenerationStatssE2Ok(new _M0TP35soehi6moonlm6engine15GenerationStats(n_prompt, emitted, hit_eos, prefill_seconds, decode_seconds));
}
function _M0FP35soehi6moonlm3web4fail(msg) {
  _M0FP35soehi6moonlm3web11last__error.val = msg;
  return -1;
}
function _M0FP35soehi6moonlm3web12moonlm__load(buf, name) {
  const _bind = _M0MP35soehi6moonlm6engine10PureEngine11load__bytes(buf, name);
  let engine;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    engine = _Ok._0;
  } else {
    const _Err = _bind;
    const _e = _Err._0;
    return _M0FP35soehi6moonlm3web4fail(_e);
  }
  const handle = _M0FP35soehi6moonlm3web5slots.length;
  _M0MPC15array5Array4pushGORP35soehi6moonlm6engine10PureEngineE(_M0FP35soehi6moonlm3web5slots, engine);
  _M0FP35soehi6moonlm3web11last__error.val = "";
  return handle;
}
function _M0FP35soehi6moonlm3web19moonlm__last__error() {
  return _M0FP35soehi6moonlm3web11last__error.val;
}
function _M0FP35soehi6moonlm3web12moonlm__free(handle) {
  if (handle < 0 || handle >= _M0FP35soehi6moonlm3web5slots.length) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(20);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "no model for handle ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, handle);
    return _M0FP35soehi6moonlm3web4fail(_string_builder.val);
  }
  _M0MPC15array5Array3setGORP35soehi6moonlm6engine10PureEngineE(_M0FP35soehi6moonlm3web5slots, handle, undefined);
  return 0;
}
function _M0FP35soehi6moonlm3web10engine__of(handle) {
  if (handle < 0 || handle >= _M0FP35soehi6moonlm3web5slots.length) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(20);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "no model for handle ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, handle);
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  }
  const _bind = _M0MPC15array5Array2atGORP35soehi6moonlm6engine10PureEngineE(_M0FP35soehi6moonlm3web5slots, handle);
  if (_bind === undefined) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(27);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "model for handle ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, handle);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " was freed");
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE3Err(_string_builder.val);
  } else {
    const _Some = _bind;
    const _e = _Some;
    return new _M0DTPC16result6ResultGRP35soehi6moonlm6engine10PureEnginesE2Ok(_e);
  }
}
function _M0FP35soehi6moonlm3web16moonlm__tokenize(handle, text) {
  const _bind = _M0FP35soehi6moonlm3web10engine__of(handle);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return [];
  } else {
    const _Ok = _bind;
    const _engine = _Ok._0;
    const _bind$2 = _M0MP35soehi6moonlm9tokenizer9Tokenizer6encode(_engine.tokenizer, text);
    return _M0MPC15array10FixedArray11from__arrayGiE(new _M0TPB9ArrayViewGiE(_bind$2, 0, _bind$2.length));
  }
}
function _M0FP35soehi6moonlm3web16moonlm__generate(handle, prompt, max_tokens, temperature, on_token) {
  const _bind = _M0FP35soehi6moonlm3web10engine__of(handle);
  let engine;
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return [];
  } else {
    const _Ok = _bind;
    engine = _Ok._0;
  }
  const sampler = temperature <= 0 ? _M0DTP35soehi6moonlm7sampler7Sampler6Greedy__ : new _M0DTP35soehi6moonlm7sampler7Sampler11Temperature(temperature);
  _M0MPC15array5Array5clearGiE(_M0FP35soehi6moonlm3web12last__tokens);
  const _bind$2 = _M0IP35soehi6moonlm6engine10PureEngineP35soehi6moonlm6engine6Engine8generate(engine, prompt, max_tokens, sampler, 42n, (id, piece) => {
    _M0MPC15array5Array4pushGiE(_M0FP35soehi6moonlm3web12last__tokens, id);
    on_token(piece);
  });
  if (_bind$2.$tag === 0) {
    const _Err = _bind$2;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return [];
  } else {
    const _Ok = _bind$2;
    const _stats = _Ok._0;
    _M0FP35soehi6moonlm3web11last__error.val = "";
    return [_stats.prompt_tokens + 0, _stats.generated_tokens + 0, _stats.hit_eos ? 1 : 0, _stats.prefill_seconds, _stats.decode_seconds];
  }
}
function _M0FP35soehi6moonlm3web20moonlm__last__tokens() {
  return _M0MPC15array10FixedArray11from__arrayGiE(new _M0TPB9ArrayViewGiE(_M0FP35soehi6moonlm3web12last__tokens, 0, _M0FP35soehi6moonlm3web12last__tokens.length));
}
function _M0FP35soehi6moonlm3web14moonlm__decode(handle, ids) {
  const _bind = _M0FP35soehi6moonlm3web10engine__of(handle);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return "";
  } else {
    const _Ok = _bind;
    const _engine = _Ok._0;
    const tokens = [];
    let _tmp$4 = 0;
    while (true) {
      const i = _tmp$4;
      if (i < ids.length) {
        $bound_check(ids, i);
        _M0MPC15array5Array4pushGiE(tokens, ids[i]);
        _tmp$4 = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return _M0MP35soehi6moonlm9tokenizer9Tokenizer6decode(_engine.tokenizer, tokens);
  }
}
function _M0FP35soehi6moonlm3web21moonlm__count__tokens(handle, text) {
  const _bind = _M0FP35soehi6moonlm3web10engine__of(handle);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return -1;
  } else {
    const _Ok = _bind;
    const _engine = _Ok._0;
    return _M0MP35soehi6moonlm9tokenizer9Tokenizer6encode(_engine.tokenizer, text).length;
  }
}
function _M0FP35soehi6moonlm3web23moonlm__context__length(handle) {
  const _bind = _M0FP35soehi6moonlm3web10engine__of(handle);
  if (_bind.$tag === 0) {
    const _Err = _bind;
    const _e = _Err._0;
    _M0FP35soehi6moonlm3web4fail(_e);
    return 0;
  } else {
    const _Ok = _bind;
    const _engine = _Ok._0;
    return _engine.model.config.context_length;
  }
}
export { _M0FP35soehi6moonlm3web12moonlm__load as moonlm_load, _M0FP35soehi6moonlm3web19moonlm__last__error as moonlm_last_error, _M0FP35soehi6moonlm3web12moonlm__free as moonlm_free, _M0FP35soehi6moonlm3web16moonlm__tokenize as moonlm_tokenize, _M0FP35soehi6moonlm3web16moonlm__generate as moonlm_generate, _M0FP35soehi6moonlm3web20moonlm__last__tokens as moonlm_last_tokens, _M0FP35soehi6moonlm3web14moonlm__decode as moonlm_decode, _M0FP35soehi6moonlm3web21moonlm__count__tokens as moonlm_count_tokens, _M0FP35soehi6moonlm3web23moonlm__context__length as moonlm_context_length }

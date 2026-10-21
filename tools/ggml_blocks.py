#!/usr/bin/env python3
"""ggml block builders and numpy reference dequantizers (shared library).

Extracted from gen_fixtures.py when the gguf fixture generator moved to its own
module repository. moonlm's own generators import this for `GgufWriter` and the
`build_*` / `dequant_*` block helpers, so it stays here; the gguf fixtures that
used to be emitted from this file now live with the gguf module.

Nothing here writes files: every function is a pure builder or a reference
decoder.
"""
from __future__ import annotations

import os
import struct
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
# The fixtures are consumed by the `gguf` submodule, which owns both packages
# since the extraction; the generator stays in the top-level `tools/` because
# it also serves the model cross-check and is run from the repo root in CI.
GGUF_MODULE_ROOT = REPO_ROOT / "gguf"
GGUF_OUT = GGUF_MODULE_ROOT / "src" / "gen_fixture_test.mbt"
TENSOR_OUT = GGUF_MODULE_ROOT / "src" / "tensor" / "gen_golden_test.mbt"

# ggml type ids, from GGML_TYPE_* in llama.cpp's ggml.h.
GGML_TYPE_F32 = 0
GGML_TYPE_F16 = 1
GGML_TYPE_Q4_0 = 2
GGML_TYPE_Q5_0 = 6
GGML_TYPE_Q8_0 = 8
GGML_TYPE_Q4_K = 12
GGML_TYPE_Q6_K = 14

# GGUF metadata value-type ids, from gguf.h.
GGUF_TYPE_UINT8 = 0
GGUF_TYPE_INT8 = 1
GGUF_TYPE_UINT16 = 2
GGUF_TYPE_INT16 = 3
GGUF_TYPE_UINT32 = 4
GGUF_TYPE_INT32 = 5
GGUF_TYPE_FLOAT32 = 6
GGUF_TYPE_BOOL = 7
GGUF_TYPE_STRING = 8
GGUF_TYPE_ARRAY = 9
GGUF_TYPE_UINT64 = 10
GGUF_TYPE_INT64 = 11
GGUF_TYPE_FLOAT64 = 12

GGUF_MAGIC = 0x46554747  # "GGUF" little-endian


# --------------------------------------------------------------------------
# MoonBit literal rendering
# --------------------------------------------------------------------------


def bytes_literal(data: bytes, per_line: int = 16) -> str:
    r"""Render `data` as a concatenation of MoonBit byte-string literals.

    A byte-string literal cannot span lines in MoonBit, and a top-level `let`
    in a blackbox test file cannot call a helper defined in another test file,
    so the fixture is emitted as `b".." + b".." + ...`. That keeps the file
    self-contained and compiles on both native and wasm-gc.
    """
    chunks = []
    for i in range(0, len(data), per_line):
        chunk = data[i : i + per_line]
        body = "".join("\\x%02x" % b for b in chunk)
        chunks.append('b"%s"' % body)
    if not chunks:
        return 'b""'
    joined = (" +\n  ").join(chunks)
    return "\n  " + joined


def f64_bits(values) -> str:
    """Render floats as an `Array[UInt64]` of exact IEEE-754 bit patterns."""
    items = [f"0x{struct.unpack('<Q', struct.pack('<d', float(v)))[0]:016X}UL" for v in values]
    lines = []
    for i in range(0, len(items), 4):
        lines.append("  " + ", ".join(items[i : i + 4]) + ",")
    return "[\n" + "\n".join(lines) + "\n]"


# --------------------------------------------------------------------------
# GGUF writer
# --------------------------------------------------------------------------


class GgufWriter:
    """Minimal GGUF v3 writer, mirroring llama.cpp's layout."""

    def __init__(self, alignment: int = 32):
        self.alignment = alignment
        self.kv_entries: list[bytes] = []
        self.tensors: list[dict] = []

    # -- primitives --------------------------------------------------------

    @staticmethod
    def _u8(v):    return struct.pack("<B", v)
    @staticmethod
    def _i8(v):    return struct.pack("<b", v)
    @staticmethod
    def _u16(v):   return struct.pack("<H", v)
    @staticmethod
    def _i16(v):   return struct.pack("<h", v)
    @staticmethod
    def _u32(v):   return struct.pack("<I", v)
    @staticmethod
    def _i32(v):   return struct.pack("<i", v)
    @staticmethod
    def _f32(v):   return struct.pack("<f", v)
    @staticmethod
    def _u64(v):   return struct.pack("<Q", v)
    @staticmethod
    def _i64(v):   return struct.pack("<q", v)
    @staticmethod
    def _f64(v):   return struct.pack("<d", v)

    @staticmethod
    def _string(s: str) -> bytes:
        raw = s.encode("utf-8")
        return struct.pack("<Q", len(raw)) + raw

    # -- metadata ----------------------------------------------------------

    def kv(self, key: str, type_id: int, payload: bytes) -> None:
        self.kv_entries.append(self._string(key) + self._u32(type_id) + payload)

    def kv_scalar(self, key: str, value) -> None:
        """Write a scalar with the type tag inferred from the Python value."""
        if isinstance(value, bool):
            self.kv(key, GGUF_TYPE_BOOL, self._u8(1 if value else 0))
        elif isinstance(value, np.uint8) or (isinstance(value, int) and value < 0x100 and key.endswith(".u8")):
            self.kv(key, GGUF_TYPE_UINT8, self._u8(value))
        elif isinstance(value, int):
            self.kv(key, GGUF_TYPE_INT32, self._i32(value))
        elif isinstance(value, float):
            self.kv(key, GGUF_TYPE_FLOAT32, self._f32(value))
        elif isinstance(value, str):
            self.kv(key, GGUF_TYPE_STRING, self._string(value))
        else:
            raise TypeError(f"uninferred metadata type for {key!r}: {type(value)}")

    def kv_array(self, key: str, elem_type: int, encoded_elems: list[bytes]) -> None:
        payload = self._u32(elem_type) + self._u64(len(encoded_elems)) + b"".join(encoded_elems)
        self.kv(key, GGUF_TYPE_ARRAY, payload)

    def kv_array_raw(self, key: str, elem_type: int, count: int, body: bytes) -> None:
        """Write an array whose body is supplied pre-encoded (for nesting)."""
        payload = self._u32(elem_type) + self._u64(count) + body
        self.kv(key, GGUF_TYPE_ARRAY, payload)

    # -- tensors -----------------------------------------------------------

    def tensor(self, name: str, dims: list[int], type_id: int, payload: bytes) -> None:
        self.tensors.append(
            {"name": name, "dims": dims, "type_id": type_id, "payload": payload}
        )

    # -- serialization -----------------------------------------------------

    def build(self) -> tuple[bytes, dict]:
        """Serialize, returning the bytes plus the facts a test should assert."""
        # Tensor payload offsets, each padded to the alignment.
        offset = 0
        facts_offsets = []
        for t in self.tensors:
            t["offset"] = offset
            facts_offsets.append(offset)
            padded = (len(t["payload"]) + self.alignment - 1) // self.alignment * self.alignment
            offset += padded

        header = (
            self._u32(GGUF_MAGIC)
            + self._u32(3)  # version
            + self._u64(len(self.tensors))
            + self._u64(len(self.kv_entries))
        )
        meta = b"".join(self.kv_entries)
        tensor_info = b"".join(self._tensor_info_bytes(t) for t in self.tensors)
        body_pre_pad = header + meta + tensor_info
        pad = (-len(body_pre_pad)) % self.alignment
        prefix = body_pre_pad + b"\x00" * pad

        data = bytearray()
        for i, t in enumerate(self.tensors):
            data += t["payload"]
            if i != len(self.tensors) - 1:
                data += b"\x00" * (t["offset"] + len(t["payload"]) - (t["offset"] + len(t["payload"])))
            # pad each tensor (except the last) up to the alignment
            if i != len(self.tensors) - 1:
                nxt = self.tensors[i + 1]["offset"]
                data += b"\x00" * (nxt - len(data))

        buf = prefix + bytes(data)
        facts = {
            "version": 3,
            "alignment": self.alignment,
            "data_start": len(prefix),
            "tensor_offsets": facts_offsets,
            "tensor_names": [t["name"] for t in self.tensors],
            "tensor_dims": [t["dims"] for t in self.tensors],
            "tensor_type_ids": [t["type_id"] for t in self.tensors],
            "kv_count": len(self.kv_entries),
        }
        return buf, facts

    def _tensor_info_bytes(self, t: dict) -> bytes:
        out = self._string(t["name"]) + self._u32(len(t["dims"]))
        for d in t["dims"]:
            out += self._u64(d)
        out += self._u32(t["type_id"])
        out += self._u64(t["offset"])
        return out


# --------------------------------------------------------------------------
# ggml block builders + numpy reference dequantizers
# --------------------------------------------------------------------------


def f16_bits(x: float) -> int:
    """Round a float to the nearest f16 bit pattern (matches llama.cpp's cast)."""
    return int(np.float16(x).view(np.uint16))


def load_f16(block: bytes, offset: int = 0) -> float:
    """Read an f16 bit pattern and widen it to a Python float.

    `np.float16(bits)` would reinterpret the integer *numerically* rather than
    as a bit pattern, which silently multiplies any scale by ~32768. Decoding
    through a buffer view is what actually reinterprets the bits.
    """
    return float(np.frombuffer(block, dtype="<f2", count=1, offset=offset)[0])


def build_q4_0(values: np.ndarray, d: float) -> bytes:
    """Q4_0 block: f16 d + 16 bytes of nibbles. Low nibble = elem j, high = elem j+16."""
    block = struct.pack("<H", f16_bits(d))
    for j in range(16):
        lo = int(values[j]) + 8
        hi = int(values[j + 16]) + 8
        block += bytes([(lo & 0xF) | ((hi & 0xF) << 4)])
    return block


def dequant_q4_0(block: bytes) -> np.ndarray:
    """Reference from dequantize_row_q4_0 in ggml-quants.c."""
    d = load_f16(block, 0)
    out = np.zeros(32, dtype=np.float64)
    for j in range(16):
        b = block[2 + j]
        out[j] = ((b & 0x0F) - 8) * d
        out[j + 16] = ((b >> 4) - 8) * d
    return out


def build_q5_0(values: np.ndarray, d: float) -> bytes:
    """Q5_0 block: f16 d + 4 high-bit bytes + 16 nibble-pair bytes.

    Element j stores its low 4 bits in qs like q4_0 and its fifth bit as bit j
    of the little-endian 32-bit qh word. Values are centred on 16.
    """
    block = struct.pack("<H", f16_bits(d))
    qh = 0
    for j in range(32):
        if (int(values[j]) + 16) & 0x10:
            qh |= 1 << j
    block += struct.pack("<I", qh)
    for j in range(16):
        lo = (int(values[j]) + 16) & 0x0F
        hi = (int(values[j + 16]) + 16) & 0x0F
        block += bytes([lo | (hi << 4)])
    return block


def dequant_q5_0(block: bytes) -> np.ndarray:
    """Reference from dequantize_row_q5_0 in ggml-quants.c.

    value = d * ((qs nibble | qh bit << 4) - 16), where qh's bit j belongs to
    element j: qh[j/4] >> (j%4) for the byte extraction.
    """
    d = load_f16(block, 0)
    qh = struct.unpack("<I", block[2:6])[0]
    out = np.zeros(32, dtype=np.float64)
    for j in range(16):
        b = block[6 + j]
        xh = (qh >> j) & 1
        yh = (qh >> (j + 16)) & 1
        out[j] = (((b & 0x0F) | (xh << 4)) - 16) * d
        out[j + 16] = (((b >> 4) | (yh << 4)) - 16) * d
    return out


def build_q8_0(values: np.ndarray, d: float) -> bytes:
    """Q8_0 block: f16 d + 32 int8 values."""
    block = struct.pack("<H", f16_bits(d))
    block += struct.pack("<32b", *[int(v) for v in values])
    return block


def dequant_q8_0(block: bytes) -> np.ndarray:
    """Reference from dequantize_row_q8_0 in ggml-quants.c."""
    d = load_f16(block, 0)
    qs = np.frombuffer(block, dtype=np.int8, count=32, offset=2).astype(np.float64)
    return qs * d


def pack_scale_min_k4(scales: list[int], mins: list[int]) -> bytes:
    """Inverse of get_scale_min_k4, for building a q4_K block."""
    q = bytearray(12)
    for j in range(8):
        s, m = scales[j] & 0x3F, mins[j] & 0x3F
        if j < 4:
            q[j] |= s
            q[j + 4] |= m
        else:
            q[j + 4] |= (s & 0x0F) | ((m & 0x0F) << 4)
            q[j - 4] |= ((s >> 4) & 0x03) << 6
            q[j] |= ((m >> 4) & 0x03) << 6
    return bytes(q)


def build_q4_K(quants: np.ndarray, scales: list[int], mins: list[int], d: float, dmin: float) -> bytes:
    """Q4_K super-block: d, dmin, 12 scale bytes, 128 nibble-pair bytes.

    Each 32-element sub-block spans two 32-byte runs of qs: the low nibble of
    qs[g*32+l] carries element g*64+l and its high nibble carries element
    g*64+32+l. Pairing adjacent elements instead (the obvious-but-wrong layout)
    would decode to a permutation of the intended values, which the round-trip
    self-check below catches.
    """
    block = struct.pack("<H", f16_bits(d)) + struct.pack("<H", f16_bits(dmin))
    block += pack_scale_min_k4(scales, mins)
    for g in range(4):
        for l in range(32):
            lo = int(quants[g * 64 + l]) & 0x0F
            hi = int(quants[g * 64 + 32 + l]) & 0x0F
            block += bytes([lo | (hi << 4)])
    return block


def dequant_q4_K(block: bytes) -> np.ndarray:
    """Reference from dequantize_row_q4_K + get_scale_min_k4 in ggml-quants.c.

    The nibble pairs are laid out so that qs[group*32 + l]'s low nibble is
    element group*64 + l and its high nibble is element group*64 + 32 + l.
    """
    d = load_f16(block, 0)
    dmin = load_f16(block, 2)
    q = block[4:16]
    qs = block[16:144]

    def get_scale_min_k4(j: int) -> tuple[int, int]:
        if j < 4:
            return q[j] & 63, q[j + 4] & 63
        return (
            (q[j + 4] & 0xF) | ((q[j - 4] >> 6) << 4),
            (q[j + 4] >> 4) | ((q[j] >> 6) << 4),
        )

    out = np.zeros(256, dtype=np.float64)
    idx = 0
    for group in range(4):
        sc0, m0 = get_scale_min_k4(group * 2)
        sc1, m1 = get_scale_min_k4(group * 2 + 1)
        d1, min1 = d * sc0, dmin * m0
        d2, min2 = d * sc1, dmin * m1
        for l in range(32):
            b = qs[group * 32 + l]
            out[idx] = d1 * (b & 0xF) - min1
            out[idx + 32] = d2 * (b >> 4) - min2
            idx += 1
        idx += 32
    return out


def build_q6_K(quants: np.ndarray, scales: list[int], d: float) -> bytes:
    """Q6_K super-block: 128 ql bytes, 64 qh bytes, 16 int8 scales, f16 d.

    Element n in 0..255 is stored as: n = half*128 + plane*32 + l, with the low
    nibble in ql and bits 4..5 in qh. This is the inverse of the loop in
    dequantize_row_q6_K.
    """
    ql = bytearray(128)
    qh = bytearray(64)
    for n in range(256):
        half = n // 128
        r = n % 128
        l = r % 32
        plane = r // 32
        u = int(quants[n]) + 32  # stored unsigned in 0..63
        low = u & 0x0F
        high = (u >> 4) & 0x03
        # ql index within this half; ql word index is 64*half + l (+32 for planes 1,3)
        ql_idx = half * 64 + (32 if plane in (1, 3) else 0) + l
        # low nibble goes in the low half of the byte for planes 0,1 and the
        # high half for planes 2,3.
        target_byte = ql[ql_idx]
        if plane in (0, 1):
            ql[ql_idx] = (target_byte & 0xF0) | low
        else:
            ql[ql_idx] = (target_byte & 0x0F) | (low << 4)
        # qh word index is 32*half + l, bit pair = plane
        qh_idx = half * 32 + l
        qh[qh_idx] = qh[qh_idx] | (high << (2 * plane))
    block = bytes(ql) + bytes(qh)
    block += struct.pack("<16b", *[int(s) for s in scales])
    block += struct.pack("<H", f16_bits(d))
    return block


def dequant_q6_K(block: bytes) -> np.ndarray:
    """Reference from dequantize_row_q6_K in ggml-quants.c."""
    d = load_f16(block, 208)
    ql = block[:128]
    qh = block[128:192]
    sc = np.frombuffer(block[192:208], dtype=np.int8).astype(np.float64)

    out = np.zeros(256, dtype=np.float64)
    for n in range(0, 256, 128):
        for l in range(32):
            si = l // 16
            q1 = ((ql[l] & 0xF) | (((qh[l] >> 0) & 3) << 4)) - 32
            q2 = ((ql[l + 32] & 0xF) | (((qh[l] >> 2) & 3) << 4)) - 32
            q3 = ((ql[l] >> 4) | (((qh[l] >> 4) & 3) << 4)) - 32
            q4 = ((ql[l + 32] >> 4) | (((qh[l] >> 6) & 3) << 4)) - 32
            out[n + l] = d * sc[si + 0] * q1
            out[n + l + 32] = d * sc[si + 2] * q2
            out[n + l + 64] = d * sc[si + 4] * q3
            out[n + l + 96] = d * sc[si + 6] * q4
        ql = ql[64:]
        qh = qh[32:]
        sc = sc[8:]
    return out


def build_f32(values: np.ndarray) -> bytes:
    return values.astype("<f4").tobytes()


def dequant_f32(block: bytes) -> np.ndarray:
    return np.frombuffer(block, dtype="<f4", count=1).astype(np.float64)


def build_f16(values: np.ndarray) -> bytes:
    return values.astype("<f2").tobytes()


def dequant_f16(block: bytes) -> np.ndarray:
    return np.frombuffer(block, dtype="<f2", count=1).astype(np.float64)



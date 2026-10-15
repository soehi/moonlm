#!/usr/bin/env python3
"""Generate a golden fixture for the fused quantized matvec kernels.

`src/model/matrix.mbt` dequantizes inside the dot product instead of first
materializing float weights. That is fast but easy to get subtly wrong (row
strides, scale application order, nibble pairing). This script builds quantized
matrices byte-for-byte with the same block builders M0's fixtures use, computes
`y = W @ x` with numpy from the reference dequantizers, and emits both the
blocks and the expected result as MoonBit data.

Because M0 already proved those dequantizers agree with llama.cpp elementwise,
agreement here means the fused kernel agrees with llama.cpp too — while also
catching row-addressing bugs, which an elementwise test cannot see.

Usage:
    python tools/gen_matvec_tests.py

Writes:
    src/model/gen_matvec_test.mbt
"""

from __future__ import annotations

import importlib.util
import struct
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "src" / "model" / "gen_matvec_test.mbt"


def load_fixture_builders():
    """Import tools/gen_fixtures.py, which owns the reference block builders."""
    spec = importlib.util.spec_from_file_location(
        "gen_fixtures", REPO_ROOT / "tools" / "gen_fixtures.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def bytes_literal(data: bytes, per_line: int = 12) -> str:
    chunks = []
    for i in range(0, len(data), per_line):
        body = "".join("\\x%02x" % b for b in data[i : i + per_line])
        chunks.append('b"%s"' % body)
    if not chunks:
        return 'b""'
    # MoonBit wants the continuation operator as a trailing token on the
    # previous line; a leading "+" would start a new top-level declaration.
    return "\n  ".join(
        c + (" +" if i < len(chunks) - 1 else "") for i, c in enumerate(chunks)
    )


def float_array_literal(name: str, values, doc: str) -> str:
    lines = ["///|", f"/// {doc}", f"let {name} : Array[Double] = ["]
    items = [repr(float(v)) for v in values]
    for i in range(0, len(items), 8):
        lines.append("  " + ", ".join(items[i : i + 8]) + ",")
    lines.append("]")
    return "\n".join(lines)


def main() -> None:
    fx = load_fixture_builders()
    rng = np.random.default_rng(20261014)

    cases = []  # (label, type_id, rows, cols, block_bytes, expected)

    def add_case(label, type_id, rows, cols, block_bytes, dequant_blocks):
        """dequant_blocks: list of per-block float arrays, row-major."""
        n_blocks_per_row = cols // len(dequant_blocks[0])
        x = rng.normal(0.0, 1.0, size=cols)
        y = np.zeros(rows)
        for r in range(rows):
            row_blocks = dequant_blocks[r * n_blocks_per_row : (r + 1) * n_blocks_per_row]
            row = np.concatenate(row_blocks)
            y[r] = float(np.dot(row, x))
        cases.append(
            {
                "label": label,
                "type_id": type_id,
                "rows": rows,
                "cols": cols,
                "data": block_bytes,
                "x": x,
                "y": y,
            }
        )

    # --- f32: 4 rows x 32 cols ---
    rows, cols = 4, 32
    f32_vals = rng.normal(0.0, 1.0, size=rows * cols).astype(np.float32)
    data = f32_vals.astype("<f4").tobytes()
    blocks = []
    for r in range(rows):
        for c in range(cols):
            blocks.append(np.array([float(f32_vals[r * cols + c])]))
    add_case("f32", 0, rows, cols, data, blocks)

    # --- f16: 4 rows x 32 cols ---
    rows, cols = 4, 32
    f16_vals = rng.normal(0.0, 1.0, size=rows * cols).astype(np.float16)
    data = f16_vals.astype("<f2").tobytes()
    blocks = []
    for r in range(rows):
        for c in range(cols):
            blocks.append(np.array([float(f16_vals[r * cols + c])]))
    add_case("f16", 1, rows, cols, data, blocks)

    # --- q4_0: 4 rows x 64 cols (2 blocks per row) ---
    rows, cols = 4, 64
    data = bytearray()
    blocks = []
    for r in range(rows):
        for b in range(cols // 32):
            quants = rng.integers(-8, 8, size=32, dtype=np.int8)
            d = 0.05 * (1 + r % 3)
            data += fx.build_q4_0(quants, d)
            blocks.append(fx.dequant_q4_0(bytes(data[-18:])))
    add_case("q4_0", 2, rows, cols, bytes(data), blocks)

    # --- q8_0: 4 rows x 64 cols ---
    rows, cols = 4, 64
    data = bytearray()
    blocks = []
    for r in range(rows):
        for b in range(cols // 32):
            quants = rng.integers(-128, 128, size=32, dtype=np.int8)
            d = 0.02 * (1 + r % 3)
            data += fx.build_q8_0(quants, d)
            blocks.append(fx.dequant_q8_0(bytes(data[-34:])))
    add_case("q8_0", 8, rows, cols, bytes(data), blocks)

    # --- q4_K: 3 rows x 512 cols (2 super-blocks per row) ---
    rows, cols = 3, 512
    data = bytearray()
    blocks = []
    for r in range(rows):
        for b in range(cols // 256):
            quants = rng.integers(0, 16, size=256, dtype=np.int8)
            scales = [int(v) for v in rng.integers(1, 64, size=8)]
            mins = [int(v) for v in rng.integers(1, 64, size=8)]
            d = float(np.float16(0.05 * (1 + r % 2)))
            dmin = float(np.float16(0.02 * (1 + r % 2)))
            data += fx.build_q4_K(quants, scales, mins, d, dmin)
            blocks.append(fx.dequant_q4_K(bytes(data[-144:])))
    add_case("q4_K", 12, rows, cols, bytes(data), blocks)

    # --- q6_K: 3 rows x 512 cols ---
    rows, cols = 3, 512
    data = bytearray()
    blocks = []
    for r in range(rows):
        for b in range(cols // 256):
            quants = rng.integers(-32, 32, size=256, dtype=np.int8)
            scales = [int(v) for v in rng.integers(-128, 128, size=16)]
            d = float(np.float16(0.01 * (1 + r % 2)))
            data += fx.build_q6_K(quants, scales, d)
            blocks.append(fx.dequant_q6_K(bytes(data[-210:])))
    add_case("q6_K", 14, rows, cols, bytes(data), blocks)

    # --- emit ---
    parts = [
        "// GENERATED by tools/gen_matvec_tests.py -- do not edit by hand.",
        "//",
        "// Golden matrices for the fused quantized matvec in src/model/matrix.mbt.",
        "// Each case stores raw GGUF-format block bytes plus the reference result",
        "// y = W @ x from numpy, computed via the dequantizers that M0 already",
        "// proved elementwise-identical to llama.cpp.",
        "",
        "///|",
        "/// One matvec case: a quantized matrix, an input vector, and the expected",
        "/// output.",
        "struct MatvecCase {",
        "  label : String",
        "  type_id : Int",
        "  rows : Int",
        "  cols : Int",
        "  blocks : Bytes",
        "  x : Array[Double]",
        "  y : Array[Double]",
        "}",
        "",
    ]
    for c in cases:
        slug = c["label"]
        parts += [
            "///|",
            f"/// {slug}: {c['rows']}x{c['cols']} quantized weights.",
            f"let matvec_{slug}_blocks : Bytes = {bytes_literal(c['data'])}",
            "",
            float_array_literal(f"matvec_{slug}_x", c["x"], f"Input vector for {slug}."),
            "",
            float_array_literal(f"matvec_{slug}_y", c["y"], f"Expected output for {slug}."),
            "",
        ]
    parts.append("///|")
    parts.append("/// Every generated matvec case.")
    parts.append("let matvec_cases : Array[MatvecCase] = [")
    for c in cases:
        slug = c["label"]
        parts.append("  {")
        parts.append(f'    label: "{slug}",')
        parts.append(f"    type_id: {c['type_id']},")
        parts.append(f"    rows: {c['rows']},")
        parts.append(f"    cols: {c['cols']},")
        parts.append(f"    blocks: matvec_{slug}_blocks,")
        parts.append(f"    x: matvec_{slug}_x,")
        parts.append(f"    y: matvec_{slug}_y,")
        parts.append("  },")
    parts.append("]")
    parts.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(parts), encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO_ROOT)} ({OUT.stat().st_size} bytes)")
    for c in cases:
        print(f"  {c['label']}: {c['rows']}x{c['cols']}, {len(c['data'])} bytes")


if __name__ == "__main__":
    main()

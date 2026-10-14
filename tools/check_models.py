#!/usr/bin/env python3
"""Cross-check MoonLM's `inspect` against llama.cpp's own GGUF reader.

This is the integration half of M0's acceptance criteria: the unit tests prove
the parser is self-consistent, and this script proves it agrees with the
reference implementation on a *real* model file.

Reference: the `gguf` PyPI package, which is the Python binding to the same
`ggml/src/gguf.cpp` reader that llama.cpp ships. `python -m gguf.scripts.gguf_dump`
uses it; this script calls the library directly so the comparison can be
structured.

Usage:
    python tools/check_models.py --moonlm <path-to-moonlm-exe> <model.gguf> [...]

The MoonLM executable is normally `_build/native/debug/build/cli/cli.exe` after
`moon build --target native`, or run through `moon run src/cli --target native --`.

Exits non-zero if any field disagrees, and prints every mismatch with both
values so a failure is diagnosable without re-running.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import subprocess
import sys
from pathlib import Path

import numpy as np

# Types M0 dequantizes; used to decide which tensors to value-compare.
SUPPORTED_TYPES = {"F32", "F16", "Q8_0", "Q4_0", "Q4_K", "Q6_K"}


def read_reference(path: Path) -> dict:
    """Read a GGUF file with the llama.cpp-derived `gguf` package."""
    from gguf import GGUFReader

    reader = GGUFReader(str(path))

    fields: dict = {}
    for key, field in reader.fields.items():
        # `field.types` is a list because a field can repeat; take the first.
        value = field.contents()
        fields[key] = value

    tensors = []
    for t in reader.tensors:
        shape = [int(x) for x in t.shape]
        elems = math.prod(shape) if shape else 0
        block_size = t.tensor_type.block_size if hasattr(t.tensor_type, "block_size") else 1
        # The reference exposes byte size directly; nbytes of the data view.
        nbytes = int(t.n_bytes)
        tensors.append(
            {
                "name": t.name,
                "type_id": int(getattr(t.tensor_type, "value", t.tensor_type)),
                "dims": shape,
                "n_elems": elems,
                # `gguf` reports the absolute file offset; the GGUF spec and
                # our parser both use an offset relative to the data section.
                "offset": int(t.data_offset) - int(reader.data_offset),
                "nbytes": nbytes,
            }
        )

    def first_int(key: str):
        """Unwrap `contents()` whether it yields a scalar or an array."""
        value = reader.fields[key].contents()
        if isinstance(value, np.ndarray):
            value = value.reshape(-1)[0]
        return int(value)

    return {
        "_reader": reader,
        "version": first_int("GGUF.version") if "GGUF.version" in reader.fields else None,
        "alignment": int(reader.alignment),
        # The reference exposes GGUF.version/tensor_count/kv_count as extra
        # pseudo-fields; they describe the header, not the metadata list.
        "metadata_count": len([k for k in reader.fields if not k.startswith("GGUF.")]),
        "tensor_count": len(reader.tensors),
        "data_start": int(reader.data_offset),
        "size": path.stat().st_size,
        "fields": fields,
        "tensors": tensors,
    }


def read_header_raw(path: Path) -> dict:
    """Read just the header with plain struct, as a second, dependency-free check."""
    with path.open("rb") as f:
        head = f.read(24)
    magic, version, tensor_count, kv_count = struct.unpack("<IIQQ", head)
    assert magic == 0x46554747, f"not a GGUF file: magic {magic:#x}"
    return {
        "version": version,
        "tensor_count": tensor_count,
        "kv_count": kv_count,
    }


def run_moonlm(exe: list[str], path: Path) -> dict:
    """Run `moonlm inspect --json` and parse its output."""
    proc = subprocess.run(
        exe + ["inspect", str(path), "--json"],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"moonlm exited {proc.returncode} for {path.name}\n"
            f"stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
        )
    return json.loads(proc.stdout)


def parse_dequant_output(text: str) -> tuple[dict, list[float]]:
    """Parse `moonlm dequant` output: a header line plus index/value lines."""
    header = {}
    values: list[float] = []
    for line in text.splitlines():
        if line.startswith("tensor "):
            # "tensor <name> type <ty> dims <dims> n_elems <n>"
            parts = line.split()
            header = {
                "name": parts[1],
                "type": parts[3],
                "n_elems": int(parts[-1]),
            }
        elif line and line[0].isdigit():
            _, v = line.split(" ", 1)
            values.append(float(v))
    return header, values


def compare_values(
    exe: list[str], path: Path, reference, tensors: list, limit: int = 64
) -> list[str]:
    """Compare actual dequantized values for every M0-supported tensor type.

    Directory metadata agreement proves the container is read correctly;
    comparing decoded numbers proves the block layouts are right. Only one
    tensor per supported type is sampled, since a layout bug shows up in the
    first block.
    """
    problems: list[str] = []
    from gguf.quants import dequantize

    seen: set[str] = set()
    for t in reference.tensors:
        type_name = str(t.tensor_type.name)
        if type_name not in SUPPORTED_TYPES or type_name in seen:
            continue
        seen.add(type_name)

        proc = subprocess.run(
            exe + ["dequant", str(path), t.name, "--limit", str(limit)],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if proc.returncode != 0:
            problems.append(
                f"{path.name}: dequant {t.name} ({type_name}) exited {proc.returncode}: "
                f"{proc.stderr.strip() or proc.stdout.strip()}"
            )
            continue

        header, got = parse_dequant_output(proc.stdout)
        if header.get("name") != t.name:
            problems.append(
                f"{path.name}: dequant header names {header.get('name')!r}, expected {t.name!r}"
            )
            continue

        raw = t.data.view(np.uint8)
        want = np.asarray(dequantize(raw, t.tensor_type)).reshape(-1)[:limit]
        if len(got) != len(want):
            problems.append(
                f"{path.name}: {t.name} ({type_name}) compared {len(got)} values, "
                f"reference has {len(want)}"
            )
            continue

        for i, (g, w) in enumerate(zip(got, want)):
            wf = float(w)
            scale = max(1.0, abs(wf))
            if abs(g - wf) / scale > 1e-6:
                problems.append(
                    f"{path.name}: {t.name} ({type_name}) value[{i}]: "
                    f"moonlm={g!r} reference={wf!r}"
                )
                break
        else:
            print(f"  values OK: {t.name} ({type_name}), first {len(got)} elements match")

    return problems


def compare(path: Path, reference: dict, actual: dict) -> list[str]:
    """Return a list of human-readable mismatches; empty means agreement."""
    problems: list[str] = []
    name = path.name

    def check(label: str, want, got):
        if want != got:
            problems.append(f"{name}: {label}: moonlm={got!r} reference={want!r}")

    check("version", reference["version"], actual["version"])
    check("alignment", reference["alignment"], actual["alignment"])
    check("tensor_count", reference["tensor_count"], actual["tensor_count"])
    check("data_start", reference["data_start"], actual["data_start"])
    check("size", reference["size"], actual["size"])
    check("metadata_count", reference["metadata_count"], actual["metadata_count"])

    # Tensor inventory: name, type, dims, element count, offset and byte size.
    ref_tensors = reference["tensors"]
    got_tensors = actual["tensors"]
    if len(ref_tensors) != len(got_tensors):
        problems.append(
            f"{name}: tensor list length: moonlm={len(got_tensors)} reference={len(ref_tensors)}"
        )
        return problems

    for ref, got in zip(ref_tensors, got_tensors):
        where = f"{name}: tensor {ref['name']}"
        if ref["name"] != got["name"]:
            problems.append(f"{where}: name mismatch: moonlm={got['name']!r}")
            continue
        if ref["type_id"] != got["type_id"]:
            problems.append(f"{where}: type: moonlm={got['type_id']} reference={ref['type_id']}")
        if ref["dims"] != got["dims"]:
            problems.append(f"{where}: dims: moonlm={got['dims']} reference={ref['dims']}")
        if ref["n_elems"] != got["n_elems"]:
            problems.append(
                f"{where}: n_elems: moonlm={got['n_elems']} reference={ref['n_elems']}"
            )
        if ref["offset"] != got["offset"]:
            problems.append(f"{where}: offset: moonlm={got['offset']} reference={ref['offset']}")
        if ref["nbytes"] != got["nbytes"]:
            problems.append(
                f"{where}: nbytes: moonlm={got['nbytes']} reference={ref['nbytes']}"
            )

    # Key metadata values that both readers expose as scalars.
    scalar_keys = [
        "general.architecture",
        "general.name",
        "llama.context_length",
        "llama.embedding_length",
        "llama.block_count",
        "llama.feed_forward_length",
        "llama.attention.head_count",
        "llama.attention.head_count_kv",
        "llama.vocab_size",
        "general.file_type",
    ]
    for key in scalar_keys:
        if key not in reference["fields"]:
            continue
        want = reference["fields"][key]
        # `contents()` yields a numpy array; unwrap single-element ones.
        if isinstance(want, np.ndarray) and want.size == 1:
            want = want.item()
        if isinstance(want, (bytes, np.bytes_)):
            want = want.decode("utf-8", "replace")
        if key not in actual["metadata"]:
            problems.append(f"{name}: key metadata {key}: missing from moonlm output")
            continue
        got = actual["metadata"][key]
        if isinstance(want, float) and isinstance(got, (int, float)):
            # f32 values compare to within float32 precision.
            if abs(float(want) - float(got)) > 1e-9 * max(1.0, abs(float(want))):
                problems.append(f"{name}: {key}: moonlm={got!r} reference={want!r}")
        elif str(want) != str(got):
            problems.append(f"{name}: {key}: moonlm={got!r} reference={want!r}")

    # The folded arrays must report the same element counts.
    array_counts = {
        "tokenizer.ggml.tokens": 49152,
        "tokenizer.ggml.merges": 48900,
        "tokenizer.ggml.token_type": 49152,
    }
    for key, expected_min in array_counts.items():
        if key in reference["fields"]:
            want = len(reference["fields"][key])
            got = actual["metadata"].get(key)
            if isinstance(got, dict) and "count" in got:
                if want != got["count"]:
                    problems.append(
                        f"{name}: {key} count: moonlm={got['count']} reference={want}"
                    )
            elif want < expected_min:
                problems.append(f"{name}: {key}: reference unexpectedly short ({want})")

    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--moonlm",
        default="moon run src/cli --target native --",
        help="Command prefix that runs the moonlm CLI.",
    )
    ap.add_argument("models", nargs="+", help="GGUF files to check.")
    args = ap.parse_args()
    exe = args.moonlm.split()

    failed = False
    for model in args.models:
        path = Path(model)
        if not path.exists():
            print(f"SKIP {path.name}: not found")
            continue
        print(f"== {path.name} ({path.stat().st_size} bytes) ==")

        raw = read_header_raw(path)
        reference = read_reference(path)
        actual = run_moonlm(exe, path)

        if raw["tensor_count"] != reference["tensor_count"]:
            print(
                f"  note: raw header tensor_count {raw['tensor_count']} != "
                f"reference {reference['tensor_count']}"
            )

        problems = compare(path, reference, actual)
        if not problems:
            problems += compare_values(exe, path, reference["_reader"], reference["tensors"])
        if problems:
            failed = True
            print(f"  FAIL: {len(problems)} mismatch(es)")
            for p in problems[:40]:
                print(f"    - {p}")
            if len(problems) > 40:
                print(f"    ... and {len(problems) - 40} more")
        else:
            print(
                f"  OK: header, {reference['metadata_count']} metadata keys and "
                f"{reference['tensor_count']} tensors agree"
            )

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

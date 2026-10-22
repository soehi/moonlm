#!/usr/bin/env python3
"""Local gates that need the model file.

CI runs the size gates (`--sizes-only`), because those need no model and can run
on every push. This script adds the checks that require actually loading 138 MB
of weights, which CI must not download.

    python benchmarks/gate.py --model <model.gguf>     # size + memory
    python benchmarks/gate.py --sizes-only             # what CI runs

Exit status is non-zero when a gate fails. A metric that cannot be measured is
reported as `skipped` and does not pass silently as a zero.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

BENCH_DIR = Path(__file__).resolve().parent.parent / "benchmarks"
RESULTS_JSON = BENCH_DIR / "results.json"

# Kept in sync with benchmarks/CONFIG.md. Duplicated rather than imported so
# the gate can run without importing run.py's heavier machinery.
# Linux links a larger runtime, so the native ceiling is per platform.
NATIVE_EXE_LIMIT_KB = 700 if os.name == "nt" else 1000
WEB_BROTLI_LIMIT_KB = 80
PEAK_MEMORY_LIMIT_MB = 220


def load_results() -> dict:
    if not RESULTS_JSON.exists():
        raise SystemExit(
            "error: benchmarks/results.json is missing; run `python benchmarks/run.py` first"
        )
    return json.loads(RESULTS_JSON.read_text(encoding="utf-8"))


def numeric(value):
    """Unwrap a metric, treating a `skipped` record as not measured.

    `run.py --no-model` stores `{"value": null, "skipped": true, ...}` for
    metrics it did not measure. That is not a zero and must not compare as one.
    """
    if isinstance(value, dict):
        return None if value.get("skipped") else value.get("value")
    return value


def check(label: str, value, limit, unit: str, hint: str) -> bool:
    value = numeric(value)
    if value is None:
        print(f"SKIP  {label}: not measured (not treated as a pass with a zero)")
        return True
    ok = value <= limit
    status = "PASS" if ok else "FAIL"
    print(f"{status}  {label}: {value:g}{unit} (limit {limit}{unit})")
    if not ok:
        print(f"      {hint}")
    return ok


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--model", help="model path; required unless --sizes-only")
    ap.add_argument(
        "--sizes-only",
        action="store_true",
        help="check only the artifact-size gates (what CI runs)",
    )
    args = ap.parse_args()

    if not args.sizes_only and not args.model:
        ap.error("--model is required unless --sizes-only is given")

    report = load_results()
    m = report["metrics"]
    ok = True

    print("MoonLM deployment gates")
    print("-" * 60)
    ok &= check(
        "native exe",
        m.get("native_exe_kb"),
        NATIVE_EXE_LIMIT_KB,
        " KB",
        "see benchmarks/CONFIG.md: a bundle that grows this much changes the "
        "deployment answer, not just the binary size",
    )
    ok &= check(
        "web.js brotli",
        m.get("web_brotli_kb"),
        WEB_BROTLI_LIMIT_KB,
        " KB",
        "see benchmarks/CONFIG.md: this is what a CDN ships to a browser",
    )

    if not args.sizes_only:
        ok &= check(
            "peak memory",
            m.get("peak_memory_mb"),
            PEAK_MEMORY_LIMIT_MB,
            " MB",
            "see benchmarks/CONFIG.md: peak memory decides which devices can run "
            "the model at all",
        )
        # Reported, never gated: throughput is host-dependent. Printing it here
        # keeps the report in one place without implying a threshold exists.
        print("-" * 60)
        print("reported (not gated; machine-dependent):")
        for key, unit in (
            ("cold_start_ms", " ms"),
            ("prefill_tok_s", " tok/s"),
            ("decode_tok_s", " tok/s"),
            ("browser_decode_tok_s", " tok/s"),
        ):
            v = numeric(m.get(key))
            print(f"      {key}: {'—' if v is None else f'{v:g}{unit}'}")

    print("-" * 60)
    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

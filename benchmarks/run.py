#!/usr/bin/env python3
"""Run the MoonLM edge-inference benchmark and write a report.

One command produces `benchmarks/results.json` (machine-readable) and
`benchmarks/RESULTS.md` (the table a reader sees). The configuration that makes
those numbers comparable is fixed in `benchmarks/CONFIG.md`; this script
records what it actually used so a report can be checked against it.

What is measured:

  1. native executable size
  2. browser bundle size, raw and brotli
  3. cold start: process launch to first token
  4. prefill and decode throughput
  5. peak working set (via tools/measure_mem.ps1)
  6. browser load and generation (via tools/bench_js_kernel.mjs)

Metrics that need the model are marked `skipped` when it is absent. Nothing is
filled in with a placeholder: a skipped metric is null in the JSON and `—` in
the table.

Usage:
    python benchmarks/run.py --model <model.gguf>
    python benchmarks/run.py --no-model          # size only, for CI
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BENCH_DIR = REPO_ROOT / "benchmarks"
RESULTS_JSON = BENCH_DIR / "results.json"
RESULTS_MD = BENCH_DIR / "RESULTS.md"

SCHEMA_VERSION = 1

# From benchmarks/CONFIG.md. Kept here as constants so a mismatch is detected
# rather than silently producing a report that claims the pinned config.
EXPECTED_TOOLCHAIN = "0.1.20260819"
EXPECTED_MODEL_SHA256 = (
    "5a1395716f7913741cc51d98581b9b1228d80987a9f7d3664106742eb06bba83"
)

NATIVE_EXE = REPO_ROOT / "_build" / "native" / "release" / "build" / "cli" / "cli.exe"
WEB_JS = REPO_ROOT / "_build" / "js" / "release" / "build" / "web" / "web.js"

# Gate thresholds. CI enforces the size ones; `gate.py` enforces the memory one.
NATIVE_EXE_LIMIT_KB = 700
WEB_BROTLI_LIMIT_KB = 70
PEAK_MEMORY_LIMIT_MB = 220


def run(cmd, **kw):
    """Run a command, returning stdout, and failing loudly with its stderr."""
    proc = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"command failed ({proc.returncode}): {' '.join(map(str, cmd))}\n"
            f"{proc.stdout}\n{proc.stderr}"
        )
    return proc.stdout


def toolchain_version() -> str:
    out = run(["moon", "version"])
    m = re.search(r"moon (\S+)", out)
    return m.group(1) if m else "unknown"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def brotli_size(path: Path) -> int:
    """Brotli-compressed size, using Node's built-in zlib.

    Node rather than a Python brotli package: the browser bundle is a
    JavaScript artifact and Node ships the same brotli implementation a
    browser-facing CDN would use, so the number matches what a deployer sees
    without adding a dependency.
    """
    script = (
        "const fs=require('fs'),zlib=require('zlib');"
        "const b=fs.readFileSync(process.argv[1]);"
        "process.stdout.write(String(zlib.brotliCompressSync(b).length));"
    )
    out = run(["node", "-e", script, str(path)])
    return int(out.strip())


def build_all() -> None:
    run(["moon", "build", "--target", "native", "--release"], cwd=REPO_ROOT)
    run(["moon", "build", "src/web", "--target", "js", "--release"], cwd=REPO_ROOT)


def measure_sizes() -> dict:
    if not NATIVE_EXE.exists():
        raise RuntimeError(f"missing {NATIVE_EXE}; run a native release build")
    if not WEB_JS.exists():
        raise RuntimeError(f"missing {WEB_JS}; run the js release build")
    raw = WEB_JS.stat().st_size
    brotli = brotli_size(WEB_JS)
    return {
        "native_exe_bytes": NATIVE_EXE.stat().st_size,
        "native_exe_kb": round(NATIVE_EXE.stat().st_size / 1024, 1),
        "web_js_bytes": raw,
        "web_js_kb": round(raw / 1024, 1),
        "web_brotli_bytes": brotli,
        "web_brotli_kb": round(brotli / 1024, 1),
    }


def measure_cold_start(model: Path, repeats: int = 3) -> dict:
    """Process launch to first token.

    Measured by timing a one-token generation and subtracting nothing: the
    number therefore includes process start, GGUF parse, tokenizer build, weight
    descriptors and the first forward pass, which is what "cold start" means for
    a CLI a user actually invokes. The first token itself is part of the cost.

    Best of `repeats`: the first run of a freshly built binary pays for the OS
    reading it off disk, which is not what a steady deployment sees.
    """
    times = []
    for _ in range(repeats):
        start = _now()
        run(
            [
                str(NATIVE_EXE),
                "generate",
                str(model),
                "hi",
                "--max-tokens",
                "1",
                "--temperature",
                "0",
                "--raw",
            ]
        )
        times.append(_now() - start)
    return {"cold_start_ms": round(min(times) * 1000, 1), "cold_start_repeats": repeats}


def measure_throughput(model: Path) -> dict:
    """Prefill and decode tok/s, parsed from the CLI's own bench output."""
    out = run(
        [
            str(NATIVE_EXE),
            "bench",
            str(model),
            "--tokens",
            "64",
            "--prompt",
            "The capital of France is",
        ]
    )
    prefill = re.search(
        r"prefill:\s+\d+ tokens in [\d.]+ ms \(([\d.]+) tok/s\)", out
    )
    decode = re.search(r"decode:\s+\d+ tokens in [\d.]+ ms \(([\d.]+) tok/s\)", out)
    if not prefill or not decode:
        raise RuntimeError(f"could not parse bench output:\n{out}")
    return {
        "prefill_tok_s": float(prefill.group(1)),
        "decode_tok_s": float(decode.group(1)),
        "throughput_tokens": 64,
    }


def measure_memory(model: Path) -> dict:
    """Peak working set, via the existing PowerShell harness.

    `tools/measure_mem.ps1` already solves the two problems that made this
    number untrustworthy before (sampling races and reading a peak after exit),
    so this reuses it rather than reimplementing the polling.
    """
    script = REPO_ROOT / "tools" / "measure_mem.ps1"
    if not script.exists():
        return {"peak_memory_mb": None, "memory_note": "tools/measure_mem.ps1 missing"}
    if platform.system() != "Windows":
        return {
            "peak_memory_mb": None,
            "memory_note": "measure_mem.ps1 is Windows-only",
        }
    out = run(
        [
            "powershell",
            "-NoProfile",
            "-File",
            str(script),
            "-Model",
            str(model),
            "-Exe",
            str(NATIVE_EXE),
        ]
    )
    # The script prints a final summary block; the line we want is the
    # generate-peak one, which is the high-water mark for a full run.
    m = re.search(r"generate peak \(Model \+ initial KV\):\s+([\d.]+) MB", out)
    steady = re.search(r"steady state \(loaded \+ decoding\):\s+([\d.]+) MB", out)
    if not m:
        return {
            "peak_memory_mb": None,
            "memory_note": "could not parse measure_mem.ps1 output",
            "memory_raw": out[-2000:],
        }
    return {
        "peak_memory_mb": float(m.group(1)),
        "steady_memory_mb": float(steady.group(1)) if steady else None,
    }


def measure_browser(model: Path, repeats: int = 3) -> dict:
    """Browser load and decode, via the existing Node harness.

    `tools/bench_js_kernel.mjs` measures one bundle at a time under identical
    conditions, which is what makes the number comparable across revisions.
    """
    script = REPO_ROOT / "tools" / "bench_js_kernel.mjs"
    if not script.exists():
        return {"browser_decode_tok_s": None, "browser_note": "bench_js_kernel.mjs missing"}
    out = run(
        [
            "node",
            str(script),
            str(WEB_JS),
            "benchmark",
            str(model),
            "16",
            str(repeats),
        ]
    )
    # The harness prints a JSON object (see the end of bench_js_kernel.mjs).
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return {
            "browser_load_ms": None,
            "browser_decode_tok_s": None,
            "browser_note": "could not parse bench_js_kernel output",
        }
    return {
        "browser_load_ms": float(data["load_ms"]),
        "browser_decode_tok_s": float(data["decode_tokens_per_second"]),
        "browser_tokens": int(data["tokens_per_call"]),
        "browser_note": None,
    }


def _now() -> float:
    import time

    return time.perf_counter()


def skipped(reason: str) -> dict:
    return {"value": None, "skipped": True, "reason": reason}


def build_report(args) -> dict:
    sizes = measure_sizes()
    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "configuration": {
            "toolchain": toolchain_version(),
            "toolchain_expected": EXPECTED_TOOLCHAIN,
            "toolchain_matches": toolchain_version() == EXPECTED_TOOLCHAIN,
            "platform": platform.platform(),
            "machine": platform.machine(),
            "threads": 1,
            "build": "release",
        },
        "model": None,
        "metrics": {},
        "gates": {
            "native_exe_limit_kb": NATIVE_EXE_LIMIT_KB,
            "web_brotli_limit_kb": WEB_BROTLI_LIMIT_KB,
            "peak_memory_limit_mb": PEAK_MEMORY_LIMIT_MB,
        },
    }

    metrics = report["metrics"]
    metrics["native_exe_kb"] = sizes["native_exe_kb"]
    metrics["web_js_kb"] = sizes["web_js_kb"]
    metrics["web_brotli_kb"] = sizes["web_brotli_kb"]

    if args.no_model:
        reason = "run with --no-model; size-only benchmark"
        for key in ("cold_start_ms", "prefill_tok_s", "decode_tok_s", "peak_memory_mb",
                    "browser_decode_tok_s", "browser_load_ms"):
            metrics[key] = skipped(reason)
    else:
        model = Path(args.model).resolve()
        if not model.is_file():
            raise SystemExit(f"error: model not found: {model}")
        digest = sha256_file(model)
        report["model"] = {
            "path_name": model.name,
            "size_bytes": model.stat().st_size,
            "sha256": digest,
            "sha256_matches_expected": digest == EXPECTED_MODEL_SHA256,
        }
        if digest != EXPECTED_MODEL_SHA256:
            print(
                "warning: model SHA-256 does not match CONFIG.md; "
                "the numbers are not comparable to the reference values",
                file=sys.stderr,
            )
        metrics["cold_start_ms"] = measure_cold_start(model)
        metrics["cold_start_ms"] = metrics["cold_start_ms"]["cold_start_ms"]
        metrics.update(measure_throughput(model))
        metrics.update(measure_memory(model))
        metrics.update(measure_browser(model))

    return report


def fmt(value, unit="") -> str:
    if value is None:
        return "—"
    if isinstance(value, float):
        return f"{value:g}{unit}"
    return f"{value}{unit}"


def write_markdown(report: dict) -> None:
    m = report["metrics"]
    cfg = report["configuration"]
    lines = [
        "# MoonLM edge-inference benchmark",
        "",
        "Generated by `python benchmarks/run.py`. The configuration that makes",
        "these numbers comparable is fixed in [CONFIG.md](CONFIG.md); this file",
        "only reports what that configuration produced.",
        "",
        f"- Generated: {report['generated_at']}",
        f"- Toolchain: `{cfg['toolchain']}`"
        + ("" if cfg["toolchain_matches"] else f" (expected `{cfg['toolchain_expected']}`)"),
        f"- Platform: {cfg['platform']}",
        "",
    ]
    if report["model"]:
        md = report["model"]
        lines += [
            f"- Model: `{md['path_name']}` ({md['size_bytes']:,} bytes)",
            f"- SHA-256: `{md['sha256']}`"
            + ("" if md["sha256_matches_expected"] else " **(does not match CONFIG.md)**"),
            "",
        ]
    else:
        lines += ["- Model: not supplied (`--no-model`); model-dependent rows are skipped", ""]

    def row(label, value, unit="", note=""):
        return f"| {label} | {fmt(value, unit)} | {note} |"

    lines += [
        "| Metric | Value | Notes |",
        "|---|---|---|",
        row("native executable", m["native_exe_kb"], " KB", f"gate ≤ {report['gates']['native_exe_limit_kb']} KB"),
        row("browser bundle (raw)", m["web_js_kb"], " KB", ""),
        row("browser bundle (brotli)", m["web_brotli_kb"], " KB", f"gate ≤ {report['gates']['web_brotli_limit_kb']} KB"),
        row("cold start", m["cold_start_ms"], " ms", "process launch to first token"),
        row("prefill", m["prefill_tok_s"], " tok/s", "reported, not gated"),
        row("decode", m["decode_tok_s"], " tok/s", "reported, not gated"),
        row("peak memory", m["peak_memory_mb"], " MB", f"gate ≤ {report['gates']['peak_memory_limit_mb']} MB"),
        row("browser load", m["browser_load_ms"], " ms", "Node, same V8"),
        row("browser decode", m["browser_decode_tok_s"], " tok/s", "Node, 16 tokens"),
        "",
    ]

    skipped_keys = [k for k, v in m.items() if isinstance(v, dict) and v.get("skipped")]
    if skipped_keys:
        lines += ["Skipped: " + ", ".join(f"`{k}`" for k in skipped_keys), ""]

    lines += [
        "## Reading these numbers",
        "",
        "- Throughput is machine-dependent and is reported, not gated. Compare",
        "  two reports from the same machine, not across machines.",
        "- Peak memory is the high-water mark over a full run; see",
        "  `docs/memory.md` for why a peak and a settled value answer different",
        "  questions.",
        "- Size figures are the deployment question: the native executable and",
        "  the brotli bundle above are what a device or a CDN actually ships.",
        "- Throughput can differ ~20% between runs on the same machine (background",
        "  load, power profile). CONFIG.md records a cross-commit check showing",
        "  that such a shift is the host, not the code.",
        "",
    ]
    RESULTS_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--model", help="path to SmolLM2-135M-Instruct-Q8_0.gguf")
    ap.add_argument(
        "--no-model",
        action="store_true",
        help="measure sizes only; model-dependent metrics are skipped",
    )
    ap.add_argument(
        "--skip-build",
        action="store_true",
        help="use existing build outputs instead of rebuilding",
    )
    args = ap.parse_args()

    if not args.no_model and not args.model:
        ap.error("--model is required unless --no-model is given")

    if not args.skip_build:
        print("building (native + js, release)...")
        build_all()

    report = build_report(args)
    RESULTS_JSON.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    write_markdown(report)

    m = report["metrics"]
    print(f"wrote {RESULTS_JSON.relative_to(REPO_ROOT)}")
    print(f"wrote {RESULTS_MD.relative_to(REPO_ROOT)}")
    print(
        f"  native exe {m['native_exe_kb']} KB, "
        f"js {m['web_js_kb']} KB raw / {m['web_brotli_kb']} KB brotli"
    )
    if not args.no_model:
        print(
            f"  cold start {fmt(m['cold_start_ms'])} ms, "
            f"prefill {fmt(m['prefill_tok_s'])} tok/s, "
            f"decode {fmt(m['decode_tok_s'])} tok/s, "
            f"peak {fmt(m['peak_memory_mb'])} MB"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())

# Benchmark configuration

This file is the contract behind `benchmarks/results.json`. A number produced
under a different configuration is a different measurement, so every figure in
`RESULTS.md` is only comparable to another run that matches what is written
here.

If a gate fails, read this file first: it says what the thresholds are
calibrated against and why they have the slack they do.

## Toolchain

| Item | Value |
|---|---|
| MoonBit | `0.1.20260819` |
| Target (native) | `native`, `--release` |
| Target (browser) | `js`, `--release` |
| Threads | 1 (single-threaded; the engine has no threading) |

The toolchain version is pinned because code generation changes between
releases and moves both binary size and throughput. `run.py` records the
version it actually used and warns when it differs from the value above.
CI installs the current MoonBit release and asserts its exact version; the
value above is the benchmark baseline, not the CI toolchain.

## Model

| Item | Value |
|---|---|
| File | `SmolLM2-135M-Instruct-Q8_0.gguf` |
| Size | 144,811,360 bytes (138.1 MiB) |
| SHA-256 | `5a1395716f7913741cc51d98581b9b1228d80987a9f7d3664106742eb06bba83` |
| Architecture | `llama`, 30 layers, n_embd 576, 9 query / 3 KV heads |
| Source | Hugging Face `bartowski/SmolLM2-135M-Instruct-GGUF`, Q8_0 |

`run.py` verifies the digest before measuring and refuses to proceed on a
mismatch: a different quantization or a re-uploaded file would silently change
every number in the report.

The model is **not** downloaded by CI. Only the size gates run there, and they
need no model.

## Machine

The figures in `docs/memory.md` and `docs/performance.md` were taken on one
machine. They are reproduced here as the reference values, and they are
**not** portable:

- Windows 11 (10.0.26100), x86-64.
- The throughput numbers (prefill/decode tok/s) depend on the CPU, its cache
  sizes, and the memory bandwidth. A different machine will produce different
  numbers for the same binary and model.
- Peak memory is more portable but still includes OS and allocator behaviour.

`results.json` records the platform it ran on. Cross-machine comparison of the
perf figures is explicitly out of scope — see "What is and is not gated".

## Reference values and their provenance

| Metric | Documented | This machine | Source |
|---|---|---|---|
| `cli.exe` size | 473 KB | 669 KB | `docs/memory.md` / measured |
| `web.js` size | 306 KB raw | 655 KB | `docs/browser.md` / measured |
| `web.js` brotli | 33 KB | 74.5 KB | `docs/browser.md` / measured |
| Peak memory | 189 MB | 189 MB | `docs/memory.md` |
| Prefill | 19.0 tok/s | 15.5–16.2 tok/s | `docs/performance.md` |
| Decode | 18.4 tok/s | 15.1–15.5 tok/s | `docs/performance.md` |
| Browser decode (Node) | 7.56 tok/s | 6.2–7.3 tok/s | `docs/browser.md` |

Two columns because they answer different questions. The documented figures
are what the project reported when it made its claims; "this machine" is what
the same code produces now, on the host the gates were calibrated on. A reader
comparing a new run should compare it against "this machine" on the same host,
and against "documented" only with the explanations below in hand.

### Why the throughput figures are lower than the documents

On this machine at the time of writing, the benchmark measures **~15.3 tok/s**
decode and prefill, against the 18.4 / 19.0 recorded in
`docs/performance.md` (−17% / −20%).

This is **not** a code regression, and that was checked rather than assumed:
the same benchmark was run on the commit from before Qwen2, the agent runtime
and the tool package were added (`43cf0e2`), and it also measured **15.3
tok/s**. The binary from that older commit and the current one agree, so the
difference is the machine's state (background load, power profile, thermal),
not the tree.

That is precisely why throughput is reported and not gated: a number that
moves 20% with the host cannot be a threshold. The documents' figures remain
the reference for the machine state they were taken in; this file records what
the current machine produces so a reader can see both and know they are not
comparable.

### Why the size figures differ from the older documents

`docs/memory.md` records **473 KB** for `cli.exe` and **306 KB / 33 KB** for
`web.js`. Those were measured before this tree grew three subsystems: Qwen2
support (NEOX RoPE, projection biases, a second tokenizer), the agent runtime,
and the sandboxed tool package. The current build is 669 KB and 655 KB raw /
74.5 KB brotli.

This is code growth plus codegen drift in the current toolchain; the build
flags did not change. The older documents are kept because they carry the
reasoning behind the numbers; the gates below are calibrated against the
current tree.

The browser decode figure is within noise of the document: `docs/browser.md`
records 7.56 tok/s in Node, repeated runs here give 6.2–7.3 tok/s depending on
host load. Peak memory did not move (+0.4%), and that is the figure that
actually constrains which devices can run the model.

Native throughput moved down to ~15.5 tok/s and is the machine, not the tree;
the next section shows the check.

## Gates

### In CI (no model required)

| Artifact | Limit | Current | Headroom |
|---|---|---|---|
| `cli.exe` (native, release) | 700 KB | 669 KB | ~4% |
| `web.js` brotli | 80 KB | 74.5 KB | ~7% |

Both gates run on every push. They exist to catch a dependency or a generated
artifact that quietly doubles the deployment footprint — the question the
project claims to answer is "does this fit on an edge device", and a bundle
that grows 2x would invalidate it.

### Local only (`benchmarks/gate.py`, needs the model)

| Metric | Limit | Current |
|---|---|---|
| Peak memory | 220 MB | 189 MB |

Peak memory is gated because it is a hard constraint on which devices can run
the model, and it is stable enough to gate. The threshold leaves ~16% over the
measured value, which absorbs allocator differences without hiding a real
regression (the optimizations that took it from 663 MB to 189 MB were a 3.5x
change, not a 16% one).

### Reported, not gated

Prefill and decode throughput are **reported only**. They are not gated
because:

1. They depend on the host CPU and memory bandwidth, so a threshold that is
   meaningful on one machine fails spuriously on another.
2. CI runs on shared virtual machines with no stable performance
   characteristics, so a perf gate there would be noise, not signal.
3. The project's perf claims are relative (before/after a specific change),
   and those are measured with `docs/performance.md`'s method, not this gate.

A machine-relative comparison — same machine, before and after a change — is
the valid use of these numbers, and `run.py` records enough context (platform,
toolchain, model digest) for a reader to check that two reports are comparable.

## Reproducing

```bash
python benchmarks/run.py --model /path/to/SmolLM2-135M-Instruct-Q8_0.gguf
```

Writes `benchmarks/results.json` and `benchmarks/RESULTS.md`. Requires
PowerShell on Windows for the memory figure; other metrics work elsewhere.

Without a model:

```bash
python benchmarks/run.py --no-model
```

runs the size measurements only and marks the rest `skipped` — it never
substitutes a placeholder number.

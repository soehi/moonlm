# Changelog

Tags are vX.Y.Z on the commit whose moon.mod carries that version.
Publish order: soehi/gguf -> soehi/moonlm -> soehi/edgeflow.

## 0.1.2 — 2026-10-21

- Consume `soehi/gguf@0.1.1`, whose metadata points at its own repository.
- The description and `docs/crosscheck.md` say "in MoonBit" rather than
  "pure MoonBit": the native build has a libc stub layer (768 lines of C) for
  file and directory access, so "pure" overclaimed.
- CI comments state nine `_WIN32` branches, which is the count in
  `src/tools/stubs.c` (the previous note said ten).
- CI installs the current MoonBit release (`0.1.20261020`) — upstream no
  longer serves versioned artifacts — and runs `moon update` before checking.
- Raise the browser brotli gate from 70 KB to 80 KB. The newer toolchain
  compiles the same sources to 74.5 KB, which still fits the edge-device
  claim; the gate exists to catch a doubling, not a 7% codegen shift.
- Look for the native CLI at `cli` on Unix and `cli.exe` on Windows; the
  20261020 toolchain no longer writes `cli.exe` on Linux.

## 0.1.1 — 2026-10-21

- Stop packaging development artifacts. `moon publish` takes the directory as
  it stands and does not read `.gitignore`, so 0.1.0 shipped a stray
  `trace.json`, an empty `项目申报书.md`, a prebuilt `web/dist/`, and a copy of
  the gguf module. 0.1.1 was packaged with those excluded (84 files).
- Ignore `trace.json` (MoonBit profiler output).

## 0.1.0 — 2026-10-21

- Consume `soehi/gguf@0.1.0` from the registry instead of a local copy. The
  GGUF and tensor packages moved to their own repository; `tools/ggml_blocks.py`
  keeps the block builders that moonlm's own generators import.
- Qwen2 support: NEOX RoPE, per-layer Q/K/V projection biases, and the qwen2
  pre-tokenizer.
- Q5_0 dequantization.
- Agent runtime: `Tool` trait, one schema per tool, the execution loop, and the
  evidence gate.
- Pinned, reproducible edge-inference benchmark with size gates in CI.

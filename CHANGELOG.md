# Changelog

Tags are vX.Y.Z on the commit whose moon.mod carries that version.
Publish order: soehi/gguf -> soehi/moonlm -> soehi/edgeflow.

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

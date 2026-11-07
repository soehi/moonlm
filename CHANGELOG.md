# Changelog

Tags are vX.Y.Z on the commit whose moon.mod carries that version.
Publish order: soehi/gguf -> soehi/moonlm -> soehi/edgeflow.

## 0.3.0 — 2026-11-07

- Default the browser to single-turn chat with explicit SmolLM2/Qwen2.5 ChatML
  profiles identified from GGUF metadata; reject unknown profiles and user role
  delimiters. Raw completion remains available for engine parity checks.
- Add opt-in repetition penalties, top-p sampling and a repeated-token-block
  stop guard. Display EOS, length-limit and repetition termination separately.
- Replace vocabulary-wide insertion sorting with comparison sorting for top-p.
- Add sampler/template regressions and a small real-model browser QA tool;
  this acceptance set is not a general reasoning-accuracy benchmark.
- Fix the README's native-only example invocation to specify its backend.

## 0.2.0 — 2026-11-07

- **Browser streaming is real.** Inference now runs in a module Web Worker
  (`web/inference-worker.mjs`), so model parsing, prefill and generation run
  off the UI thread. Tokens arrive as messages; the page displays text and
  live tok/s while generation is still running. Stop terminates the worker
  and keeps the partial text; the model must be reloaded to generate again.
  The previous synchronous callback plus `setInterval` could not repaint
  during generation and flushed the text only after the call returned.
- `docs/browser.md` records the Worker architecture and a real-model
  regression: three text updates during generation, a 25 ms page heartbeat
  advancing, Stop halting output, reload working, and token IDs matching
  direct JS API calls. The browser server serves `.mjs` with JavaScript MIME
  types on Windows as well as other platforms.
- **Third-party tokenizer data is now attributed.** `NOTICE` and
  `third_party/` record the upstream models
  (HuggingFaceTB/SmolLM2-135M-Instruct and Qwen/Qwen2.5-0.5B-Instruct),
  their Apache-2.0 licences, checked revisions, copyright notices and
  modifications. The embedded vocabularies and merge tables were compared
  against the official `tokenizer.json` at those revisions; Qwen's 271
  additional conversion-padding entries are identified separately. The
  notice explicitly distinguishes verified facts from the original GGUF
  conversion URLs, which were not recorded.
- The fixture generator preserves attribution and extraction-input hashes.
  `tools/check_tokenizer_provenance.py` re-derives fixture counts and hashes
  offline and runs in CI. `tools/check_browser_streaming.py` exercises the
  Worker path with a real model in a browser; it requires Python Playwright
  and Chromium and is not run by the model-free CI job.

## 0.1.3 — 2026-11-02

- Consume `soehi/gguf@0.1.3`.
- The README has an install line and a library usage example, compiled against
  the published package before it was written down.
- `src/examples/generate` is a minimal runnable program (load a GGUF, generate,
  report tok/s); CI builds it so an example cannot rot unnoticed.
- CI asserts a `moonc` floor (>= 0.10.16) rather than an exact release, because
  every versioned toolchain path answers 403 and the installer can only fetch
  "latest".

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
- The size gate builds the release artifacts it measures instead of assuming
  an earlier step produced them.
- Set the native gate per platform: 700 KB on Windows, 1000 KB on Linux,
  where the ELF build is 931 KB.

## 0.1.1 — 2026-10-21

- Stop packaging development artifacts. 0.1.0 shipped a stray `trace.json`,
  an empty `项目申报书.md`, a prebuilt `web/dist/`, and a copy of the gguf
  module: none of those were in `.gitignore` at the time, and `moon publish`
  packs untracked-but-unignored files as well as tracked ones. 0.1.1 added
  the ignore rules and was packaged with those excluded (84 files).
  (Measured later: `moon publish` does honour `.gitignore`; it only packs
  untracked files when no rule covers them.)
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

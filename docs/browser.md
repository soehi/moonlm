# Running in a browser

The demo runs the engine in a web page: no backend, no CDN, one HTML file and
one compiled script. Load a GGUF from disk, generate, watch the tokens arrive.

```bash
python tools/serve_web.py --model-dir /path/to/ggufs
# open http://127.0.0.1:8000/, pick a .gguf, press 生成
```

Everything here was measured, not assumed. Two of the three findings below
contradicted the project's original plan.

## The browser target is `js`, not `wasm-gc`

The plan said wasm-gc, on the theory that a GC backend ships a smaller module.
Investigating the boundary changed that:

| Check | Result |
|---|---|
| `#export_name` on a `wasm-gc` package | Works, but requires `pkgtype(kind: "foreign_library")` |
| JS passing a `Uint8Array` to a `Bytes` parameter | **Fails**: `type incompatibility when transforming from/to JS` |
| Does the module export memory? | **No** — exports are functions only |
| What is `Bytes` on the `js` target? | `Uint8Array`, per the generated `moonbit.d.ts` |
| MoonBit's own web template | Declares `"preferred-target": "js"` |

In wasm-gc, `Bytes` is a GC array reference (`(ref $moonbit.bytes)`), not a
linear-memory buffer. JavaScript cannot construct one, and with no exported
memory it cannot write weights into the module's heap either. A model file
simply cannot get in.

On `js`, the boundary is plain JavaScript: `Bytes` is a `Uint8Array`,
`FixedArray[T]` is `T[]`, and a MoonBit closure is a JS function. So a file read
goes straight in and tokens stream straight out.

This does not weaken the privacy claim: the `js` backend is still a
ahead-of-time compilation of the same MoonBit source, with no interpreter and no
network API. The engine's own packages remain backend-agnostic and still build
and test on native and wasm-gc; only this boundary package is `js`-only, for a
measurable reason.

## Numbers, measured in the browser

Browser: the in-app browser (Chromium), model `SmolLM2-135M-Instruct-Q8_0.gguf`
(138 MB), 16 tokens per call, best of 2.

| Stage | Value |
|---|---|
| Read 138 MB from the local server | 198 ms |
| Parse GGUF + build tokenizer and weight views | 4.4 s |
| **Prefill** | **8.2 tok/s** |
| **Decode** | **6.3 tok/s** |
| Bundle size (`web.js`) | 306 KB |

Measured in Node instead (same V8 engine, `tools/bench_js_kernel.mjs`, 16 tokens,
best of 3), the same build gives 7.56 tok/s decode. The two differ because the
browser run goes through the page's UI path and the Node run does not; neither is
wrong, they answer slightly different questions. The Node figure is the one used
for the before/after comparison below, because it can be reproduced one bundle at
a time under identical conditions.

The target was ≥3 tok/s, so the browser meets it — but the honest framing of how
it got there changed after re-measuring (see the correction note below).

## The kernel work, re-measured

The two `js`-specific fixes, each measured in isolation in Node:

| Kernel | decode tok/s |
|---|---|
| baseline: f32 accumulator, checked byte reads | 1.92 |
| f64 accumulator only | 2.50 |
| `unsafe_get` byte reads only | 3.40 |
| both (shipped) | **7.56** |

1. **Accumulate in `Double`.** On the `js` backend every `Float` operation
   compiles to a `Math.fround` call, so the f32 accumulator chain paid a function
   call per multiply-add. In a microbenchmark f64 was 6× faster per operation; in
   the real kernel it is worth 1.3×, which is a smaller effect than the
   microbenchmark suggested. Inputs and result stay `Float`, so this changes only
   the rounding of the running sum, not what the model computes.
2. **Read weight bytes unchecked.** `Bytes` indexing emits a `$bound_check` call,
   four per inner-loop iteration. `Bytes::unsafe_get` removes them.

The two interact rather than adding (1.30 × 1.77 = 2.3, against a measured 3.94),
probably because removing the bounds checks only lets the JS engine keep values
in registers once the accumulator is also a plain number. The combined figure is
the measured one.

Both also helped native: decode 14.4 → 18.4 tok/s.

**Correction.** An earlier version of this document said "0.7 → 6.33 tok/s (9x)".
That compared an 8-token run through the demo UI against a 16-token run through
the bench hook, so it mixed a real speedup with a change in measurement
conditions. The controlled figure is 1.92 → 7.56 (3.9×). The conclusion — the
≥3 tok/s target is met — does not change.

What did *not* help, measured and rejected: removing bounds checks on the `x`
array (already done via `uget`), and `v128` (see `docs/performance.md`).

## Cross-backend consistency

The strongest correctness evidence for this stage: the browser produces the
**same token ids** as the native build, for the same prompt and greedy decoding.

| Prompt | native | browser (`js`) |
|---|---|---|
| `The capital of France is` | `7042 30 7042 314 260 3995 2240 281` | identical |
| `Once upon a time` | `28 339 436 253 1805 555 28 253` | identical |

Since the browser numbers come from a different compilation of the same source,
agreement is evidence that the f64 accumulation changed no argmax decision.
After both kernel changes the llama.cpp argmax cross-check was re-run and is
unchanged at 280/288 = 97.22% (`docs/crosscheck.md`).

## The no-network claim, tested

Three observations, in increasing strength:

1. **No external references.** `grep` for `http(s)://` in the built page returns
   nothing: no CDN, no fonts, no analytics.
2. **Nothing is requested during inference.** `fetch`, `XMLHttpRequest`,
   `WebSocket`, and `navigator.sendBeacon` were instrumented in the page, then a
   generation was run: **zero calls recorded**.
3. **Inference works with `fetch` rejected.** Replacing `window.fetch` with a
   function that always rejects, then generating, still produced correct output
   and the expected token ids.

Loading a model *from a URL* does use `fetch`, which is ordinary static-file
loading: a browser cannot read an arbitrary local path, and the URL is the
page's own origin (the local server). Loading from the file input uses
`FileReader` and issues no request at all.

## What this stage does not claim

- **Not fast.** 6.3 tok/s for a 135M model is usable for a demo and for short
  answers, not for a document assistant. llama.cpp does 57 tok/s on the same
  CPU from the same file, and it is multithreaded and SIMD; this is
  single-threaded scalar code, and JavaScript gives no access to SIMD lanes.
- **Not the wasm-gc target**, for the boundary reasons above.
- **Not a package.** `web/dist/` is a preview build, not a published artifact.

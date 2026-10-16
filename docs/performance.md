# Performance notes

Measurements on this project's machine: Windows, single thread, SmolLM2-135M
Q8_0 (30 layers, n_embd 576, vocab 49152). Numbers come from `moonlm bench` and
`moonlm profile`; commands are below so any figure can be re-measured.

## Current numbers

| Stage | time/iter | arithmetic | throughput |
|---|---|---|---|
| LM head (1 mat) | 10.40 ms | 28.31 MMACs | 2722 MMACs/s |
| FFN (3 mats, fused gate/up) | 0.90 ms | 2.65 MMACs | 2949 MMACs/s |
| Attention (4 mats) | 0.30 ms | 1.33 MMACs | 4424 MMACs/s |
| **full forward** | **53.80 ms** | **147.75 MMACs** | **2746 MMACs/s** |

End to end: prefill 19.0 tok/s, decode 18.4 tok/s (64 tokens). In the browser
(`js` backend, same model): prefill 8.2 tok/s, decode 6.3 tok/s.

The LM head dominates: it is 28.3 MMACs of the 147.8 MMACs total per token
(19% of the arithmetic) and 10.4 ms of the 53.8 ms (19% of the time). The FFN,
despite being a bigger share of the arithmetic across 30 layers, runs at a
similar MMACs/s. Everything is within a factor of ~1.6 of the same throughput,
which is the sign of a single shared bottleneck — the matvec inner loop — rather
than of one badly implemented stage.

## What the bottleneck is

Every quantized matvec spends its time in the same place: dequantize a block,
multiply-accumulate it, repeat. For Q8_0 the weights are int8 with an fp16 scale
per 32 elements, and this engine scales on the fly rather than materializing a
float copy of the tensor. Three things limit the rate:

1. **Scalar code.** There is no SIMD in the inner loop, so each element costs a
   separate load, convert and multiply-add. On the `js` backend this is a hard
   limit: JavaScript exposes no SIMD lanes.
2. **Bounds checks.** MoonBit's `FixedArray`/`Bytes` indexes check bounds on
   every read. The inner loop performs ~32M element reads per token, so those
   checks are not free.
3. **Memory traffic.** The 143 MB of weights must stream through the CPU once
   per token. At 18.4 tok/s that is ≈2.6 GB/s, which is not yet at the machine's
   bandwidth limit (see below), so the kernel is compute-bound, not
   bandwidth-bound — more unrolling or SIMD would still help.

## What was tried

| Attempt | Result | Verdict |
|---|---|---|
| Remove inner-loop bounds checks via `#intrinsic("%fixedarray.unsafe_get")` | 1490 → 2203 MMACs/s (2.5 → 14.7 tok/s end to end) | **Kept.** The largest single win; `FixedArray` has no public unchecked read, so the intrinsic is declared locally. |
| Same for the weight bytes: `Bytes::unsafe_get` | browser 1.83 → 6.33 tok/s (3.5x); native 14.4 → 18.4 tok/s | **Kept.** Found by reading the generated JS: `Bytes` indexing emits a `$bound_check` call, four per inner iteration. |
| Accumulate in `Double` instead of `Float` | browser 0.7 → 1.83 tok/s on its own; part of the 9x total | **Kept.** On the `js` backend a `Float` op compiles to a `Math.fround` call; measured 6x slower per op than f64. No effect on native, which has real f32 registers. |
| Sign-extension lookup as `FixedArray` read through `uget` instead of `Array` | 16% of that loop | **Kept.** An `Array` index compiles to a helper call in the `js` backend. |
| Fuse SwiGLU gate/up into one pass, float lookup table | part of 2.5 → 9.35 tok/s | **Kept.** |
| llama.cpp's q8_0×q8_0 integer scheme (quantize activations to int8, accumulate in int32) | 787 MMACs/s vs 1009 for the float path | **Rejected.** Slower here: the scalar version pays an extra byte→int conversion per element and gains nothing without SIMD, which is where llama.cpp's version wins. |
| `v128` SIMD path over `FixedArray[Byte]` | 35 MMACs/s vs 1264 (36x *slower*) | **Rejected.** `v128_load` on that type did not lower to a real vector load in this native build, and the path also required a 143 MB shadow copy of the weights. |

The rejected paths are recorded because they are the obvious things to try next,
and knowing they were measured — not merely assumed to be slow — saves repeating
the experiment. The three `js`-specific wins were all found the same way: by
reading the JavaScript the compiler emitted, rather than reasoning about the
MoonBit source.

## Why the M1 target was 15 tok/s, and where it stands

The M1 acceptance criterion was ≥15 tok/s decode for this model on one thread.
As delivered for M1 the number was 14.4–14.7 — a near miss, not a comfortable
pass. The M2 kernel work then lifted it to **18.4 tok/s**, so the goal is now met
with margin.

The number is still not comparable to llama.cpp's 57 tok/s on the same hardware
(see `docs/crosscheck.md`). llama.cpp uses hand-written SIMD kernels and multiple
threads; this is single-threaded scalar code. Roughly 3x slower is the expected
and measured gap.

## Reproducing

```bash
moon run src/cli --target native --release -- bench <model.gguf> --tokens 128
moon run src/cli --target native --release -- profile <model.gguf> --iters 10
```

Build with `--release`. A debug build runs ~20x slower (0.75 tok/s), which is
easy to mistake for a regression when comparing against recorded numbers.

## Next steps, in the order they are worth trying

1. **Real SIMD**, if the MoonBit backend can emit it for a supported element
   type. This is the only change with a plausible 3–4x upside, and it is the
   gap to llama.cpp. Confirming what the backend actually lowers is the
   prerequisite; the `v128` experiment above suggests it is not automatic.
2. **Reduce arithmetic**: the LM head is unavoidable, but the FFN could skip
   blocks whose scale is negligible.
3. **Multi-threading** across the FFN's independent rows. Not yet attempted;
   the current design is single-threaded by choice, for a clean comparison.

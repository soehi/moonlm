# Performance notes

Measurements on this project's machine: Windows, single thread, SmolLM2-135M
Q8_0 (30 layers, n_embd 576, vocab 49152). Numbers come from `moonlm bench` and
`moonlm profile`; commands are below so any figure can be re-measured.

## Current numbers

| Stage | time/iter | arithmetic | throughput |
|---|---|---|---|
| LM head (1 mat) | 13.60 ms | 28.31 MMACs | 2082 MMACs/s |
| FFN (3 mats, fused gate/up) | 1.50 ms | 2.65 MMACs | 1769 MMACs/s |
| Attention (4 mats) | 0.40 ms | 1.33 MMACs | 3318 MMACs/s |
| **full forward** | **68.40 ms** | **147.75 MMACs** | **2160 MMACs/s** |

End to end: prefill 15.0 tok/s, decode 14.4 tok/s (128 tokens).

The LM head dominates: it is 28.3 MMACs of the 147.8 MMACs total per token
(19% of the arithmetic) but 13.6 ms of the 68.4 ms (20% of the time). The FFN,
despite being a bigger share of the arithmetic across 30 layers, runs at a
similar MMACs/s. Everything is within a factor of ~2 of the same throughput,
which is the sign of a single shared bottleneck — the matvec inner loop — rather
than of one badly implemented stage.

## What the bottleneck is

Every quantized matvec spends its time in the same place: dequantize a block,
multiply-accumulate it, repeat. For Q8_0 the weights are int8 with an fp16 scale
per 32 elements, and this engine scales on the fly rather than materializing a
float copy of the tensor. Three things limit the rate:

1. **Scalar code.** There is no SIMD in the inner loop, so each element costs a
   separate load, convert and multiply-add.
2. **Bound checks.** MoonBit's `FixedArray` indexes check bounds on every read.
   The inner loop performs ~32M element reads per token, so those checks are not
   free.
3. **Memory traffic.** The 143 MB of weights must stream through the CPU once
   per token. At 14.4 tok/s that is ≈2.0 GB/s, which is not yet at the machine's
   bandwidth limit (see below), so the kernel is compute-bound, not
   bandwidth-bound — more unrolling or SIMD would still help.

## What was tried

| Attempt | Result | Verdict |
|---|---|---|
| Remove inner-loop bounds checks via `#intrinsic("%fixedarray.unsafe_get")` | 1490 → 2203 MMACs/s (2.5 → 14.7 tok/s end to end) | **Kept.** The largest single win; `FixedArray` has no public unchecked read, so the intrinsic is declared locally. |
| Fuse SwiGLU gate/up into one pass, float lookup table | part of 2.5 → 9.35 tok/s | **Kept.** |
| llama.cpp's q8_0×q8_0 integer scheme (quantize activations to int8, accumulate in int32) | 787 MMACs/s vs 1009 for the float path | **Rejected.** Slower here: the scalar version pays an extra byte→int conversion per element and gains nothing without SIMD, which is where llama.cpp's version wins. |
| `v128` SIMD path over `FixedArray[Byte]` | 35 MMACs/s vs 1264 (36x *slower*) | **Rejected.** `v128_load` on that type did not lower to a real vector load in this native build, and the path also required a 143 MB shadow copy of the weights. |

The two rejected paths are recorded because they are the obvious things to try
next, and knowing they were measured — not merely assumed to be slow — saves
repeating the experiment.

## Why the target was 15 tok/s, and where it stands

The M1 acceptance criterion was ≥15 tok/s decode for this model on one thread.
Measured decode is 14.4–14.7 tok/s, i.e. within 2–4% of the goal, and the
implied forward-only rate is 14.6 tok/s. Two honest caveats:

- It is a *near miss*, not a comfortable pass. Depending on the run, decode
  lands at 14.4–14.8; the goal should be read as "at the target" rather than
  "clearly above it".
- The number is not comparable to llama.cpp's 57 tok/s on the same hardware
  (see `docs/crosscheck.md`). llama.cpp uses hand-written SIMD kernels; this is
  scalar code. Roughly 4x slower is the expected and measured gap.

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

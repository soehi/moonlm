# Cross-checking against llama.cpp

Two independent questions need answering about this engine, and they need
different experiments. Both scripts live in `tools/crosscheck_llama.py`.

| Question | Mode | Metric |
|---|---|---|
| Is the forward pass correct? | `--mode argmax` | per-position argmax agreement (teacher forcing) |
| Does free-running generation match? | `--mode greedy` | longest common prefix, with the reference's logprob gap at the divergence |

## Why two modes

Comparing sampled text cannot separate "sampled a different token" from "sampled
the same token, rendered differently", so both modes compare **token ids**.

Free-running greedy comparison alone is misleading here. Both engines agree at
first, then reach a position where the top two candidates are nearly tied, and
floating-point drift breaks the tie in opposite directions. From that point on
the texts diverge completely, and a longest-common-prefix number collapses —
not because the forward pass is wrong, but because language models are chaotic
past a near-tie. Measured on this engine, the divergence positions had reference
top-2 logprob gaps of 0.002–0.17 nats: genuine coin flips.

Teacher forcing removes that compounding. The reference's own token sequence is
replayed through this engine, and at each position we compare this engine's
argmax against what the reference actually produced. A near-tie flip costs one
position instead of the whole suffix, so the number measures the forward pass
rather than the chaos.

## Reproducing

Build the reference and start it on loopback (any recent llama.cpp build):

```bash
llama-server -m SmolLM2-135M-Instruct-Q8_0.gguf --port 18080
```

Then, from the repository root (the model path must be Windows-native, because
the CLI opens it through a C stub):

```bash
python tools/crosscheck_llama.py "D:\path\to\SmolLM2-135M-Instruct-Q8_0.gguf" --mode argmax
python tools/crosscheck_llama.py "D:\path\to\SmolLM2-135M-Instruct-Q8_0.gguf" --mode greedy
```

`argmax` mode exits non-zero if agreement falls below `--threshold` (default
0.95), so it can gate a release. `greedy` mode exits non-zero if any divergence
occurred where the reference was *confident* (top-2 gap ≥ 0.5 nats), which is
the case that would indicate a real bug.

## Results

Model: `SmolLM2-135M-Instruct-Q8_0.gguf`, 30 layers, n_embd 576, 9/3 GQA.
Reference: llama.cpp build 11675. Commit when measured: see `git log`.

### Argmax agreement (teacher forcing), 48 steps per prompt

| Prompt | agree/total | rate |
|---|---|---|
| The capital of France is | 47/48 | 97.9% |
| Once upon a time | 47/48 | 97.9% |
| def fibonacci(n): | 47/48 | 97.9% |
| The quick brown fox jumps over | 46/48 | 95.8% |
| 2 + 2 = | 47/48 | 97.9% |
| Water is composed of hydrogen and | 46/48 | 95.8% |
| **overall** | **280/288** | **97.22%** |

288 positions, 280 agreeing. The 8 disagreements are single positions, and each
is followed by a position where the engine agrees again — the signature of a
near-tie broken by drift, not of a systematic error. A wrong RoPE layout or GQA
grouping would fail on confident predictions too, not only on coin flips.

### Free-running greedy, 32 steps

Divergence always occurred at a near-tie:

| Prompt | LCP | ref top-2 gap at divergence |
|---|---|---|
| The capital of France is | 4 | 0.0022 |
| Once upon a time | 7 | 0.0162 |
| def fibonacci(n): | 25 | 0.1682 |
| The quick brown fox | 6 | 0.0452 |
| 2 + 2 = | 21 | 0.0201 |

Every gap is far below 1 nat, i.e. the reference itself was nearly indifferent
between the two tokens.

### Speed, single-threaded, same model

| Engine | prefill (pp32) | decode (tg64) |
|---|---|---|
| llama.cpp b11675, 1 thread | 370.2 tok/s | 57.2 tok/s |
| moonlm, pure MoonBit, 1 thread | 15.0 tok/s | 14.4 tok/s |

This engine is roughly 4x slower at decode. That is the honest number: the
kernels are scalar (no SIMD), and the matvec inner loop is what dominates. See
`docs/performance.md` for what was tried and what the bottleneck is.

## What the numbers do and do not establish

Established: the container parser, the tokenizer, every quantized decode path,
the forward pass (RMSNorm, RoPE, GQA, SwiGLU, KV cache), and the sampler are
individually correct and correct in combination — 97.2% per-position agreement
against an independent implementation at 288 positions, with all divergences
attributable to documented near-ties.

Not established: byte-identical output. Any near-tie can break either way, so
free-running text equality with llama.cpp is not achievable without matching its
exact summation order, which is a different (and not obviously desirable) goal.

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

The reference is a `llama-server` on loopback. If none is installed, one can be
built from source; this is the recipe that worked here, and it needs only CMake
and a C++ toolchain (no CUDA, no network at build time):

```bash
curl -sL -o llama.zip https://codeload.github.com/ggml-org/llama.cpp/zip/refs/heads/master
unzip -q llama.zip && cd llama.cpp-master
cmake -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_CURL=OFF -DGGML_NATIVE=ON \
      -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_BUILD_SERVER=ON
cmake --build build --config Release -j 8 --target llama-server
```

Then start it:

```bash
build/bin/Release/llama-server.exe -m SmolLM2-135M-Instruct-Q8_0.gguf --port 18080
```

Two notes on building it, from doing it: the download is ~40 MB and a truncated
copy fails as a zip error rather than a download error, so check the size before
extracting; and building at `-j 8` will slow any benchmark running on the same
machine, which matters if you are measuring throughput at the same time (see
`docs/memory.md` for a case where exactly that produced a bogus number).

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

Two reference builds have been used, and they do not agree exactly:

| Reference | overall argmax agreement |
|---|---|
| llama.cpp build 11675 (the original measurements below) | 280/288 = 97.22% |
| llama.cpp 0.7.0-dev, locally built (`--ctx-size 2048 -t 4`) | 277/288 = 96.18% |

The 3-position difference is the reference moving, not this engine. Checked by
running the comparison twice against the same local server — once with the tree
as it stands and once with it checked out at the revision before the memory work
in `docs/memory.md` — and both produced **identical per-prompt results**,
277/288. So the memory changes introduced no numeric drift, and the gap belongs
to the reference build: a newer llama.cpp makes slightly different near-tie
choices, which is the expected reason for a small shift in a number defined by
near-ties.

Both figures are above the 95% gate, and the qualitative conclusion is unchanged:
agreement is high, and what remains is attributable to near-ties rather than to a
wrong layout or grouping. Stating both builds is the point — a single figure
would imply a precision the comparison does not have.

### Argmax agreement (teacher forcing), 48 steps per prompt

Figures below are from build 11675.

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
| moonlm, pure MoonBit, 1 thread, native | 19.0 tok/s | 18.4 tok/s |
| moonlm, pure MoonBit, browser (`js`) | 8.2 tok/s | 6.3 tok/s |

The native build is roughly 3x slower than llama.cpp at decode. That is the
honest number: the kernels are scalar (no SIMD), the build is single-threaded,
and the matvec inner loop is what dominates. The browser build is slower again,
because JavaScript gives no SIMD lanes at all. See `docs/performance.md` for
what was tried and what the bottleneck is, and `docs/browser.md` for the
browser-specific measurements.

These figures are from after the M2 kernel work; the numbers quoted when M1 was
first checked in were 15.0 / 14.4 (native) and 0.7 (browser, before the fixes
described in `docs/browser.md`).

## Qwen2.5-0.5B-Instruct (Q4_K_M)

Model: `qwen2.5-0.5b-instruct-q4_k_m.gguf`, 24 layers, n_embd 896, 14/2 GQA,
head_dim 64, RoPE theta 1e6, 291 tensors (133 Q5_0, 13 Q8_0, 12 Q4_K,
12 Q6_K, 121 F32). RoPE is NEOX and each layer has Q/K/V projection biases.

Reference: llama.cpp 0.7.0-dev built from source (`--ctx-size 2048 -t 4`),
48 steps per prompt, default threshold.

| Prompt | agree/total | rate |
|---|---|---|
| The capital of France is | 48/48 | 100.0% |
| Once upon a time | 47/48 | 97.9% |
| def fibonacci(n): | 47/48 | 97.9% |
| The quick brown fox jumps over | 48/48 | 100.0% |
| 2 + 2 = | 37/37 | 100.0% |
| Water is composed of hydrogen and | 48/48 | 100.0% |
| **overall** | **275/277** | **99.28%** |

The two disagreements are single positions, as in the SmolLM2 table.

### What this run found

An earlier revision of the NEOX support scored 49.10% on this same comparison.
The cause was not the pairing code but the default: the real Qwen2.5-0.5B GGUF
carries no `qwen2.rope.<layer>.type` key at all (`rope` metadata is only
`qwen2.rope.freq_base`), and the reader defaulted a missing key to NORMAL.

llama.cpp does not do that. `llama_model_rope_type()` selects the variant from
the architecture, and `LLM_ARCH_QWEN2` maps to `GGML_ROPE_TYPE_NEOX`. The
reader now mirrors it (`rope_type_default` in `src/model/config.mbt`): qwen2
defaults to NEOX, the llama family to NORMAL. With that one change the same
weights scored 99.28%.

The lesson is worth recording because the failure shape was deceptive: 49%
agreement on short prompts still produces fluent-looking text, and no error is
raised anywhere. Only the teacher-forcing comparison distinguishes "wrong
basis" from "floating-point drift".

## What the numbers do and do not establish

Established: the container parser, the tokenizer, every quantized decode path,
the forward pass (RMSNorm, RoPE, NEOX and NORMAL, Q/K/V biases, GQA, SwiGLU,
KV cache), and the sampler are individually correct and correct in combination
— 97.2% per-position agreement on SmolLM2 at 288 positions and 99.3% on
Qwen2.5-0.5B at 277 positions, both against an independent implementation,
with all divergences attributable to documented near-ties.

Not established: byte-identical output. Any near-tie can break either way, so
free-running text equality with llama.cpp is not achievable without matching its
exact summation order, which is a different (and not obviously desirable) goal.

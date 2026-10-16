# Memory footprint

Measured on Windows, single process, model `SmolLM2-135M-Instruct-Q8_0.gguf`
(138 MB on disk), using `tools/measure_mem.ps1`.

Deployment size is a strength for this project; memory is a **weakness**. Both
are stated here with the numbers that were measured, and the causes below were
found by reading the code, not inferred from the totals.

## Deployment size

| Artifact | Raw | Compressed |
|---|---|---|
| `cli.exe` (native, release) | **473 KB** | 213 KB (gzip) |
| `web.js` (the whole engine, `js` target) | 306 KB | **33 KB (brotli)** |
| `index.html` (demo page) | 16 KB | 5 KB (brotli) |

`cli.exe` was copied alone into an empty directory and run from there: it works
with no accompanying files. Its only imports are OS libraries
(`KERNEL32`, `SHELL32`, `bcrypt`, `dbghelp`) — no MSVC runtime, no private DLLs.

For comparison, llama.cpp build b11675 ships `llama-cli.exe` plus four required
DLLs at **5.2 MB** (the full release directory is 48 MB across 50 files). So the
native binary is roughly **11x smaller**.

## Peak memory

Two columns: the state this document was first written in, and after the two
optimizations described below.

| Scenario | Before | After |
|---|---|---|
| Model on disk | 138 MB | 138 MB |
| `inspect` (parses, builds no Model) | 283 MB | **145 MB** |
| `generate` (Model + KV cache) | 663 MB | **189 MB** |
| steady state (loaded + decoding) | not measured | **183 MB** |

So the process now needs about **1.37x the model size** at peak, and 1.32x in
steady state. Before the fixes it was 4.8x, which is what put a few-hundred-MB
device out of reach; that constraint is now gone.

### Against llama.cpp, measured

An earlier revision of this file compared against "roughly 150–200 MB" for
llama.cpp without having measured it. It has now been measured: llama.cpp build
0.7.0-dev, `llama-server` with `--ctx-size 2048 -t 4`, same model, resident set
read from the OS after the model loaded.

| | moonlm | llama-server |
|---|---|---|
| settled (working set) | **183 MB** | 169 MB |
| peak | **189 MB** | 367 MB |

The settled figures are the same order, which is the expected result: both hold
one copy of 138 MB of weights plus a working context. moonlm's is slightly
higher, which is plausible rather than alarming — llama-server was given
`--ctx-size 2048` while moonlm's KV cache starts at 512 positions but its
growable buffer plus the scratch arrays and sampler state are all resident at
once, and the two programs count slightly different things as "the model". The
peak differs by 2x because the server allocates more transiently during startup:
it grew a threadpool, four slots and a 2048-position cache up front.

Note what is and is not being compared. These are two programs with different
jobs: `moonlm generate` answers one prompt and exits, `llama-server` stays up
serving HTTP. The settled row is the fair comparison of "holding a model"; the
peak row says more about how each tool amortizes startup than about efficiency,
and llama-server is entitled to allocate for a workload it cannot see yet.

### The performance cost: measured, and it is not there

An earlier revision of this file claimed sharing the file buffer cost 5% of
decode speed (18.4 → 17.5 tok/s). That measurement did not reproduce, and the
claim has been removed rather than left standing.

Re-measured with interleaved A/B: two binaries (before the fixes, and after all
three) alternated within one loop, ten rounds each, so machine drift affects both
sides equally instead of landing on whichever revision happened to run during a
quiet moment.

| | median | mean | stdev |
|---|---|---|---|
| after the three fixes | 19.017 tok/s | 19.042 | 0.186 |
| before | 19.000 tok/s | 19.002 | 0.182 |

Median difference **+0.09%**, mean **+0.21%** — no regression, with both
distributions at the same spread.

The likely origin of the earlier figure: it was taken around 15:36, while a
llama.cpp build was running in the background at `-j 8` on the same machine, and
a JavaScript benchmark loop was also running. A single-sample reading under that
load is not a measurement of the code. The lesson is the same one this file
already records about `tasklist` sampling: on a shared, noisy machine, a
number has to be taken under conditions that can be stated, and preferably
interleaved against its comparison rather than measured once on each side.

So the memory fixes are not a trade. They remove 474 MB of peak residency at no
measurable throughput cost, which is the outcome the code structure predicted:
the kernels were already reading through `(data, row_offset)`, and the KV growth
path allocates only when a prompt exceeds the current capacity.

## Where the memory went

Three causes were located in the source, and **all three are fixed**.

### 1. The file was held twice (≈138 MB) — **fixed**

`src/cli/file_native.mbt` read into a `FixedArray[Byte]` and then copied it into
a `Bytes`:

```moonbit
let buf : FixedArray[Byte] = FixedArray::make(n, b'\x00')
let got = ml_read(buf, f, size)
Ok(Bytes::from_array(buf[:]))     // second full copy
```

This alone accounted for `inspect` at 283 MB ≈ 138 × 2. `inspect` is now 145 MB,
so the copy is gone.

### 2. Every tensor was copied out of the buffer (≈133 MB) — **fixed**

`src/gguf/file.mbt`, `GgufFile::tensor_bytes`:

```moonbit
let view = self.buf.view(start=..., end=...)
Ok(view.to_owned())     // copies the tensor
```

`Matrix::from_tensor` (`src/model/matrix.mbt`) stored that copy. Q8_0 weights are
about 133 MB of the file, so buffer and tensor copies were both resident.

Now `Matrix` holds a reference to the shared buffer plus a `base_off`, and the
matvec call sites pass `base_off + row_off`. The kernels themselves did not
change — they already took `(data, row_off, x, x_off, n_blocks)`.

### 3. The KV cache was preallocated to the full context (≈360 MB) — **fixed**

`KVCache::new` used to size both arrays to `config.context_length` (8192), which
is 2 (k and v) × 30 layers × 3 kv heads × 8192 positions × 64 head_dim × 4 bytes
≈ 360 MB, for a session that typically uses a few hundred positions.

The cache now splits `capacity` (allocated) from `limit` (the model's context
length) and starts at `kv_initial_capacity = 512` positions — about 24 MB for
SmolLM2. `KVCache::grow_to` doubles on demand and stops at `limit`. Because the
position dimension is the third of four, growth re-lays out every (layer, head)
block rather than extending in place, and copies only the `len` positions
actually written; the rest of the new arrays is already zero.


## How this was measured, and four ways that were wrong

`tools/measure_mem.ps1` reads the OS's own counters for the process it starts,
and reports two of them because they answer different questions:

- `PeakWorkingSet64` — the high-water mark over the run. This is what "how much
  does this need" means for a short-lived command.
- `WorkingSet64` — the current value, sampled after the process has settled. A
  peak is a historical maximum and cannot fall, so freeing a buffer lowers the
  current value and leaves the peak untouched. Only the settled figure can show
  that memory was released, which is why the script has a scenario designed to
  still be running when the settle point passes.

Four approaches produced wrong numbers here, and each is worth not repeating:

- **Sampling `tasklist` in a loop** raced with the process phases. The same
  workload reported 145 MB and 524 MB on two runs.
- **Reading `PeakWorkingSet64` after exit** returns 0, because the process
  handle is already released.
- **Settling too early.** The settle point was first set to 2500 ms, which is
  inside the model's load time, so the "steady state" was read mid-load and came
  out at 156 MB. It looked like a better result and was simply a measurement
  taken too early; the real figure is 183 MB. The scenario's duration also has
  to outlast the settle point — the script now reports the elapsed time when it
  misses, so the constant can be tuned from evidence instead of guessed at.
- **Taking a single current-value sample.** A reading taken while the process
  tears down comes back as 0, and `HasExited` can still read false at that
  moment; three runs of one workload returned 0 MB, 21.8 MB and 182.9 MB. The
  script now discards zero readings and takes the largest of the rest, which is
  stable because the steady state does not drop during decoding.

## Browser-side memory

`tools/check_js_parity.mjs` reports the Node heap while driving the `js` bundle,
which covers the browser question as well as the parity check. Model: 138 MB.
The engine is handed a view over the file bytes, not a copy.

| Phase | heapUsed | external | RSS |
|---|---|---|---|
| before load | 4.6 MB | 1.8 MB | 46.5 MB |
| after load | 69.4 MB | 140 MB | 287.5 MB |
| after generate | 165.8 MB | 140 MB | 367.3 MB |

Reading it:

- `external` at 140 MB is the model bytes held once, which is the floor for
  loading a 138 MB model this way. The engine's own structures (tokenizer,
  matrix descriptors, KV cache) are the 69.4 MB of `heapUsed` after load, and
  generation adds about 96 MB more.
- RSS after generate, 367 MB, is the honest ceiling for this workload in Node.
  It is higher than the native figure (189 MB) because a JavaScript engine
  carries its own runtime plus a garbage collector, and because RSS counts
  memory that has been freed but not yet returned to the OS.
- Node's counters are not Chrome's, and `heapUsed` excludes WebAssembly and
  external memory, so this table describes one runtime's view rather than a
  browser guarantee. It is reproducible with the command below, which is the
  point — a number someone else can re-measure.

```bash
node tools/check_js_parity.mjs _build/js/release/build/web/web.js <model.gguf> 8 <expected-file>
```

### A measurement bug this found

The harness originally did `new Uint8Array(fs.readFileSync(path))`. Since
`readFileSync` already returns a Buffer, that constructor allocates a second full
copy, and the harness reported 278 MB of `external` memory for a 138 MB model —
roughly double, with the extra copy belonging to the harness rather than the
engine. The fix is to view the Buffer's own `ArrayBuffer` when the Buffer owns
it, and `tools/check_zero_copy.mjs` reports whether a given file is in that case.
The table above is measured after the fix; the engine's numbers never changed,
only the harness's accounting of them.

## What the numbers now support

With all three fixes in, the honest summary is:

- **Deployment size is a clear strength**: 473 KB native executable with no
  private DLLs, and a 33 KB brotli-compressed engine for the browser.
- **Memory is in the same range as llama.cpp**, and better on peak: 183 MB settled
  against 169 MB, 189 MB peak against 367 MB, for the same 138 MB model.
- **Throughput did not regress**: 19.02 tok/s after against 19.00 before, from an
  interleaved ten-round comparison.

## Verifying a memory change does not break behaviour

Memory fixes here touched how weights and the KV cache are addressed, so each one
was checked against the same three gates that guard the rest of the project:

| Gate | Result after the fixes |
|---|---|
| Tests, both targets | 107 pass on native and wasm-gc |
| llama.cpp argmax agreement | 280/288 = 97.22%, unchanged |
| Greedy output vs. before | identical token ids |

The third one is the sharpest: reading weights through a shared buffer plus an
offset, and growing the KV cache, both change the addresses the kernels read. Had
either been wrong, the token ids would have moved.



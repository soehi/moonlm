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
| llama.cpp, same model (for reference) | ~150–200 MB | ~150–200 MB |

So the process now needs about **1.37x the model size**, against roughly 1.1–1.4x
for llama.cpp. Before the fixes it was 4.8x, which is what put a few-hundred-MB
device out of reach; that constraint is now gone.

### The performance cost, stated plainly

Sharing the file buffer across tensors cost some decode speed: **18.4 → 17.5
tok/s** (native, 64 tokens, five samples in the 17.2–17.6 range). The likely
cause is cache locality — a tensor's rows now sit in one large shared buffer
rather than in a compact per-tensor allocation, so the matvec inner loop touches
more distinct cache lines.

That is a deliberate trade: 663 MB → 189 MB for about 5% of throughput, on a
project whose stated position is portability and self-containment rather than
peak speed. It is recorded here because a 5% regression that goes unmentioned is
how a benchmark table stops being trustworthy.

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


## How this was measured, and two ways that were wrong

`tools/measure_mem.ps1` polls the OS's `PeakWorkingSet64` counter while the
process runs and keeps the maximum.

Two earlier approaches produced wrong numbers and are worth not repeating:

- **Sampling `tasklist` in a loop** raced with the process phases. The same
  workload reported 145 MB and 524 MB on two runs.
- **Reading `PeakWorkingSet64` after exit** returns 0, because the process
  handle is already released.

A related measurement subtlety: peak working set is a high-water mark, so freeing
a reference does not lower it for work already done. To see the effect of a
memory fix, measure the resident set once loading has settled, not only the peak.

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
- **Memory is in the same range as llama.cpp** (1.37x the model versus
  1.1–1.4x), where before it was 4.8x and effectively ruled out smaller devices.
- **Throughput is slightly below where it was** (17.5 versus 18.4 tok/s), which
  is the price of sharing the file buffer and is stated rather than omitted.

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



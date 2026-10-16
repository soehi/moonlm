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

| Scenario | Peak working set |
|---|---|
| Model on disk | 138 MB |
| `inspect` (parses, builds no Model) | 283 MB |
| `generate` (Model + KV cache) | **663 MB** |
| llama.cpp, same model (for reference) | ~150–200 MB |

So the process needs about **4.8x the model size**, against roughly 1.1–1.4x for
llama.cpp. On a device with a few hundred MB of headroom this is the constraint
that rules the project out, well before disk size does.

## Where the memory goes

Three causes, each located in the source:

### 1. The file is held twice (≈138 MB)

`src/cli/file_native.mbt` reads into a `FixedArray[Byte]` and then copies it into
a `Bytes`:

```moonbit
let buf : FixedArray[Byte] = FixedArray::make(n, b'\x00')
let got = ml_read(buf, f, size)
Ok(Bytes::from_array(buf[:]))     // second full copy
```

This alone accounts for `inspect` at 283 MB ≈ 138 × 2.

### 2. Every tensor is copied out of the buffer (≈133 MB)

`src/gguf/file.mbt`, `GgufFile::tensor_bytes`:

```moonbit
let view = self.buf.view(start=..., end=...)
Ok(view.to_owned())     // copies the tensor
```

`Matrix::from_tensor` (`src/model/matrix.mbt`) stores that copy. Q8_0 weights are
about 133 MB of the file, so during load the buffer and the tensor copies are
both resident.

### 3. The KV cache is preallocated to the full context (≈360 MB)

`src/model/forward.mbt`:

```moonbit
let cache = KVCache::new(config.n_layer, config.n_head_kv, config.head_dim,
                          config.context_length)   // 8192
```

That is 2 (k and v) × 30 layers × 3 kv heads × 8192 positions × 64 head_dim × 4
bytes ≈ 360 MB, while a demo session uses a few dozen positions. Preallocating
is the right choice — it avoids reallocating per step — but sizing it to the
model's maximum rather than the session's need is what costs the memory.

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

## Not fixed yet

All three causes are addressable, and none of them has been addressed as of this
writing:

| Cause | Approach | Expected saving |
|---|---|---|
| 1. File held twice | Read straight into `Bytes` | ~138 MB |
| 2. Tensor copies | Let `Matrix` hold the shared buffer plus an offset; the matvec kernels already take `(data, row_off, ...)`, so only the call site changes | ~133 MB |
| 3. KV preallocation | Grow the cache on demand, up to `context_length` | ~300 MB |

Fixing all three would put `generate` in the 200 MB range, close to llama.cpp.
Until then, the honest statement of the browser's and the edge device's
requirement is the measured table above, not the model size.

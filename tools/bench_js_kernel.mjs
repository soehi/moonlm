// A/B benchmark for the q8_0 kernel changes, measured in Node.
//
// Why this exists: the docs attributed specific speedups to specific changes,
// and that attribution was wrong. The before/after numbers had been taken under
// different conditions — 8 tokens driven through the demo UI versus 16 tokens
// through the bench hook — which differ in how much fixed per-call cost gets
// amortised. This script measures one bundle at a time under identical
// conditions, so each claim can be checked against evidence instead of memory.
//
// Usage:
//   node tools/bench_js_kernel.mjs <path-to-web.js> <label> [model] [tokens] [repeats]
//
// Run once per built bundle: build the current tree and measure, then check out
// an earlier revision, rebuild, and measure again.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , bundlePath, label, modelPath, tokensArg, repeatsArg] = process.argv;
if (!bundlePath || !label) {
  console.error("usage: node bench_js_kernel.mjs <web.js> <label> [model] [tokens] [repeats]");
  process.exit(2);
}

const MODEL = modelPath || "D:\\llmdata\\SmolLM2-135M-Instruct-Q8_0.gguf";
const TOKENS = Number(tokensArg || 16);
const REPEATS = Number(repeatsArg || 3);

// The generated module touches `window`/`self` at load time.
const win = new Map();
globalThis.window = win;
globalThis.self = win;

const mod = await import(pathToFileURL(path.resolve(bundlePath)).href);

// Hand the engine a view over the bytes rather than a copy. `readFileSync`
// already returns a Buffer; `new Uint8Array(buffer)` would allocate a second
// full copy of the model, which inflates the harness's own memory report by the
// file size and measures something other than the engine. A view is only safe
// when the Buffer owns its whole backing store, so fall back to a copy when it
// does not. `tools/check_zero_copy.mjs` reports which case a given file is in.
function modelBytes(file) {
  const buf = fs.readFileSync(file);
  if (buf.byteOffset === 0 && buf.buffer.byteLength === buf.length) {
    return new Uint8Array(buf.buffer);
  }
  return new Uint8Array(buf);
}

const buf = modelBytes(MODEL);
const t0 = Date.now();
const handle = mod.moonlm_load(buf, path.basename(MODEL));
const loadMs = Date.now() - t0;
if (handle < 0) {
  console.error("load failed:", mod.moonlm_last_error());
  process.exit(1);
}

// Warm up: the first call pays for lazily-created lookup tables and the
// engine's own scratch allocations, which are not part of per-token cost.
mod.moonlm_generate(handle, "warm up", 4, 0, () => {});

const runs = [];
let lastStats = null;
for (let r = 0; r < REPEATS; r++) {
  const s = Date.now();
  const stats = mod.moonlm_generate(handle, "The capital of France is", TOKENS, 0, () => {});
  runs.push(Date.now() - s);
  if (stats.length === 0) {
    console.error("generate failed:", mod.moonlm_last_error());
    process.exit(1);
  }
  lastStats = Array.from(stats);
}

runs.sort((a, b) => a - b);
const [promptTokens, genTokens, hitEos, prefillS, decodeS] = lastStats;
console.log(
  JSON.stringify(
    {
      label,
      bundle: path.basename(bundlePath),
      bundle_kb: Math.round(fs.statSync(bundlePath).size / 1024),
      model: path.basename(MODEL),
      tokens_per_call: genTokens,
      repeats: REPEATS,
      load_ms: loadMs,
      decode_tokens_per_second: Number((genTokens / decodeS).toFixed(3)),
      prefill_tokens_per_second: Number((promptTokens / prefillS).toFixed(3)),
      wall_ms_best: runs[0],
      wall_ms_median: runs[Math.floor(runs.length / 2)],
    },
    null,
    2,
  ),
);

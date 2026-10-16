// Verify that the native and JavaScript builds produce identical token ids for
// the same prompt, and report what the JS build's heap looks like.
//
// The two backends share one source tree, but they are separate compilations,
// so "same source" is not evidence that they agree. This script drives the JS
// bundle in Node and compares against the token ids the native CLI reported, so
// a divergence (a different float path in the JS backend, a mis-gated package)
// shows up as a mismatch rather than as a silently different answer.
//
// Also reports the JS heap before and after loading and generating, so the
// browser-side memory question has a number attached. Node's counters are not
// Chrome's, and `heapUsed` excludes WebAssembly/external memory, but it does
// capture the GC-heap growth from the model buffers this project allocates in
// MoonBit — which is what the memory work changed.
//
// Usage:
//   node tools/check_js_parity.mjs <web.js> [model] [max-tokens] [expected-file]
//
// `expected-file` is a text file of one expected token line per prompt, in the
// order of PROMPTS below, as written by:
//   cli.exe generate <model> "<prompt>" --max-tokens 8 --temperature 0 --raw --dump-tokens

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , bundlePath, modelArg, tokensArg, expectedFile] = process.argv;
if (!bundlePath) {
  console.error(
    "usage: node tools/check_js_parity.mjs <web.js> [model] [max-tokens] [expected-file]",
  );
  process.exit(2);
}

const MODEL = modelArg || "D:\\llmdata\\SmolLM2-135M-Instruct-Q8_0.gguf";
const MAX_TOKENS = Number(tokensArg || 8);

// The prompts whose expected ids the native CLI prints, in this order.
const PROMPTS = ["The capital of France is", "Once upon a time"];

// The generated module touches `window`/`self` at load time.
const win = new Map();
globalThis.window = win;
globalThis.self = win;

function heapMB() {
  const m = process.memoryUsage();
  return {
    heapUsedMB: Number((m.heapUsed / 1024 / 1024).toFixed(1)),
    rssMB: Number((m.rss / 1024 / 1024).toFixed(1)),
    externalMB: Number((m.external / 1024 / 1024).toFixed(1)),
  };
}

const beforeLoad = heapMB();
const mod = await import(pathToFileURL(path.resolve(bundlePath)).href);

// Hand the engine a view over the file bytes rather than a copy: `readFileSync`
// already returns a Buffer, and `new Uint8Array(buffer)` would allocate a second
// full copy of the model. That copy lands in the harness's own memory report as
// ~2x the model size in "external" bytes and is not the engine's footprint, so
// avoiding it keeps this check's numbers about the engine. A view is only safe
// when the Buffer owns its backing store; `tools/check_zero_copy.mjs` reports
// which case a given file is in.
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
const afterLoad = heapMB();

// Decode the reference file if one was supplied; otherwise only report ids.
let expected = null;
if (expectedFile) {
  const lines = fs
    .readFileSync(expectedFile, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length !== PROMPTS.length) {
    console.error(
      `expected file has ${lines.length} lines but there are ${PROMPTS.length} prompts`,
    );
    process.exit(2);
  }
  expected = lines.map((l) => l.split(/\s+/).map(Number));
}

const results = [];
let mismatches = 0;
for (let i = 0; i < PROMPTS.length; i++) {
  const prompt = PROMPTS[i];
  const stats = mod.moonlm_generate(handle, prompt, MAX_TOKENS, 0, () => {});
  if (stats.length === 0) {
    console.error("generate failed:", mod.moonlm_last_error());
    process.exit(1);
  }
  const ids = Array.from(mod.moonlm_last_tokens());
  const got = ids.slice(0, MAX_TOKENS);
  let match = null;
  if (expected) {
    const want = expected[i];
    match = got.length === want.length && got.every((v, j) => v === want[j]);
    if (!match) {
      mismatches++;
    }
  }
  results.push({
    prompt,
    js_token_ids: got,
    expected_token_ids: expected ? expected[i] : null,
    match,
  });
}

const afterGenerate = heapMB();

console.log(
  JSON.stringify(
    {
      bundle: path.basename(bundlePath),
      model: path.basename(MODEL),
      max_tokens: MAX_TOKENS,
      load_ms: loadMs,
      heap: { beforeLoad, afterLoad, afterGenerate },
      results,
      mismatches,
    },
    null,
    2,
  ),
);

// A mismatch is the failure this script exists to detect, so it must not exit 0.
process.exit(mismatches === 0 ? 0 : 1);

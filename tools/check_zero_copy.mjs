// Check whether a model file can be handed to the engine as a zero-copy view.
//
// Both benchmark harnesses currently do `new Uint8Array(fs.readFileSync(path))`,
// which copies the whole file: readFileSync already returns a Buffer, and the
// Uint8Array constructor over it allocates a second copy. That double-holding
// showed up in the harness's own heap report as ~278 MB of "external" memory for
// a 138 MB model, which is not the engine's footprint and should not be read as
// such.
//
// Node Buffers from readFileSync are backed by an ArrayBuffer that may be a
// shared pool segment for small files, so a zero-copy view is only safe when the
// Buffer starts at offset 0 of its own ArrayBuffer. This script checks that
// condition for a given file.
//
// Usage: node tools/check_zero_copy.mjs <file>

import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: node tools/check_zero_copy.mjs <file>");
  process.exit(2);
}

const file = path.resolve(target);
const buf = fs.readFileSync(file);

const startsAtZero = buf.byteOffset === 0;
const isExact = buf.buffer.byteLength === buf.length;
const safeForZeroCopy = startsAtZero && isExact;

console.log(
  JSON.stringify(
    {
      file: path.basename(file),
      size_mb: Number((buf.length / 1048576).toFixed(1)),
      is_buffer: Buffer.isBuffer(buf),
      byte_offset: buf.byteOffset,
      backing_arraybuffer_bytes: buf.buffer.byteLength,
      // A byteOffset of 0 with a matching ArrayBuffer length means the Buffer
      // owns its whole backing store, so a view over it aliases the file bytes
      // instead of copying them.
      zero_copy_safe: safeForZeroCopy,
      note: safeForZeroCopy
        ? "a Uint8Array view over buf.buffer aliases the bytes; no copy needed"
        : "the Buffer shares a pooled ArrayBuffer, so a view would include other data",
    },
    null,
    2,
  ),
);

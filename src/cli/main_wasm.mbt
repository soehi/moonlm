// wasm-gc entry point for the `moonlm` command.
//
// The real CLI (`inspect`) is native-only: it reads a model file through
// `extern "C"` and uses argv. This file keeps the `cli` package buildable for
// wasm-gc, which CI asserts, and does something useful in the process: it
// parses a minimal GGUF container held in memory and reports what it found.
// That is a genuine end-to-end smoke test of `gguf` and `tensor` under the
// wasm-gc backend, using the same code paths the native CLI uses apart from the
// file read.
//
// The CLI never receives file bytes on wasm-gc: in the browser, the model
// arrives from a user-initiated `File` read (M2), not from a path.

///|
/// A minimal, valid GGUF v3 container: magic, version, no tensors, no metadata.
fn minimal_container() -> Bytes {
  b"GGUF" + b"\x03\x00\x00\x00" + b"\x00\x00\x00\x00\x00\x00\x00\x00" +
    b"\x00\x00\x00\x00\x00\x00\x00\x00"
}

///|
fn main {
  let buf = minimal_container()
  match @gguf.parse(buf) {
    Ok(f) => {
      println("moonlm (wasm-gc smoke test)")
      println("  parsed a \{f.len()}-byte container: version \{f.version}")
      println("  tensors \{f.tensor_count()}, metadata \{f.metadata_count()}")
      // Touch the tensor package too, so the smoke test covers both libraries.
      let ty = @tensor.GgmlType::from_id(12)
      println("  type 12 is \{ty.name} with \{ty.block_size} elements per block")
    }
    Err(e) => {
      println("moonlm (wasm-gc smoke test): failed to parse: \{e.message()}")
      exit_with(1)
    }
  }
}

///|
/// Terminate with `code`. On wasm-gc there is no process to exit, so the status
/// is printed instead; the native path uses the libc `exit`.
fn exit_with(code : Int) -> Unit {
  println("exit status \{code}")
}

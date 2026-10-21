name = "soehi/moonlm"

version = "0.1.2"

readme = "README.md"

repository = "https://github.com/soehi/moonlm"

license = "Apache-2.0"

keywords = [
  "gguf",
  "llm",
  "inference",
  "quantization",
  "wasm",
]

description = "Local LLM inference engine and strongly-typed agent runtime, in MoonBit"

preferred_target = "wasm-gc"

source = "src"

import {
  "soehi/gguf@0.1.1",
}

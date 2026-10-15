#!/usr/bin/env python3
"""Generate tokenizer golden tests from a real GGUF model + reference tokenizer.

Embeds a compact fixture into MoonBit test files:
  - a slice of the real SmolLM2 vocabulary and merges (so BPE exercises real
    merge chains), with input strings and their exact reference token ids
    produced by HuggingFace `tokenizers`;
  - encode->decode round-trip samples across English, Chinese, code, emoji,
    whitespace and special tokens.

The generated file compiles on both native and wasm-gc without file I/O.

Usage:
    python tools/gen_tokenizer_tests.py <model.gguf> <tokenizer.json>

Writes:
    src/tokenizer/gen_golden_test.mbt
"""

from __future__ import annotations

import struct
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "src" / "tokenizer" / "gen_golden_test.mbt"


def emit_string_array(name: str, values: list[str], doc: str) -> str:
    """Emit an Array[String] as one chunked literal per 2000 entries.

    The entries are split across several top-level `let` declarations rather
    than one huge literal: a single array literal spanning tens of thousands of
    lines trips the compiler's text-segment-size lint, and splitting by
    declaration removes the cause instead of silencing the warning. The final
    binding has the requested name; the earlier chunks are named
    `<name>_chunk_<i>`.
    """
    def esc(v: str) -> str:
        return (
            v.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("\n", "\\n")
            .replace("\t", "\\t")
            .replace("\r", "\\r")
        )

    chunk_size = 500
    chunks = [values[i : i + chunk_size] for i in range(0, len(values), chunk_size)] or [[]]
    out: list[str] = []
    for ci, chunk in enumerate(chunks):
        is_last = ci == len(chunks) - 1
        target = name if is_last else f"{name}_chunk_{ci}"
        out.append("///|")
        out.append(f"/// {doc}" if ci == 0 else f"/// Chunk {ci} of {name}.")
        if is_last and len(chunks) > 1:
            previous = " + ".join(f"{name}_chunk_{i}" for i in range(len(chunks) - 1))
            out.append(f"let {target} : Array[String] = {previous} + [")
        else:
            out.append(f"let {target} : Array[String] = [")
        for v in chunk:
            out.append(f'  "{esc(v)}",')
        out.append("]")
        out.append("")
    return "\n".join(out)


def emit_int_array(name: str, values: list[int], doc: str) -> str:
    lines = ["///|", f"/// {doc}", f"let {name} : Array[Int] = ["]
    row = [str(v) for v in values]
    for i in range(0, len(row), 20):
        lines.append("  " + ", ".join(row[i : i + 20]) + ",")
    lines.append("]")
    return "\n".join(lines)


def moonbit_escape(s: str) -> str:
    return (
        s.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\t", "\\t")
        .replace("\r", "\\r")
    )


def main() -> None:
    from gguf import GGUFReader
    from transformers import AutoTokenizer

    model_path = sys.argv[1] if len(sys.argv) > 1 else "D:/tmp/moonlm-models/SmolLM2-135M-Instruct-Q8_0.gguf"
    tokjson_path = sys.argv[2] if len(sys.argv) > 2 else "D:/tmp/smollm2_tokenizer.json"

    # --- load reference tokenizer and GGUF vocab ---
    tok = AutoTokenizer.from_pretrained(
        "HuggingFaceTB/SmolLM2-135M-Instruct",
        tokenizer_file=tokjson_path,
        local_files_only=False,
    )
    hf = tok.backend_tokenizer

    reader = GGUFReader(model_path)
    vocab = [t.decode("utf-8") if isinstance(t, bytes) else t for t in reader.fields["tokenizer.ggml.tokens"].contents()]
    merges = [m.decode("utf-8") if isinstance(m, bytes) else m for m in reader.fields["tokenizer.ggml.merges"].contents()]
    tt = reader.fields["tokenizer.ggml.token_type"].contents()
    def scalar(key):
        v = reader.fields[key].contents()
        if isinstance(v, list):
            v = v[0]
        return int(v)

    bos = scalar("tokenizer.ggml.bos_token_id")
    eos = scalar("tokenizer.ggml.eos_token_id")
    print(f"vocab {len(vocab)}, merges {len(merges)}, bos {bos}, eos {eos}")

    # --- test corpus: English, Chinese, code, emoji, whitespace, specials ---
    corpus = [
        "Hello, world!",
        "The quick brown fox jumps over the lazy dog.",
        "你好，世界！",
        "中文和English混合文本123",
        "def add(a, b):\n    return a + b",
        "for i in range(10):\n    print(i)",
        "  leading and trailing   spaces  ",
        "tabs\tand\tnewlines\n",
        "emoji: \U0001F600 \U0001F680 \U0001F4A9 café naïve résumé",
        "numbers 1234567890 and 3.14159",
        "contractions: I'm you're we've they'll it'd",
        "CamelCase snake_case kebab-case",
        "<|im_start|>user\nHello<|im_end|>\n<|im_start|>assistant\n",
        "<|endoftext|>",
        "a",
        " ",
        "\n\n\n",
        "!!!???...,,",
        "Testing1000",
        "x" * 200,
        "The capital of France is",
        "1+1=2, 2+2=4, 10*10=",
        "SELECT * FROM users WHERE id = 42;",
        "print('hello')  # comment",
        "「日本語のテキスト」",
        "한국어 텍스트",
        "Русский текст",
        "العربية",
        "🇨🇳 flag emoji",
        "combo 你好 mixedEnglish 🌟 42 end",
    ]

    # Reference encodings. add_special_tokens=False: SmolLM2 does not add BOS.
    golden_pairs = []
    for text in corpus:
        ids = hf.encode(text, add_special_tokens=False).ids
        golden_pairs.append((text, ids))
        # Verify reference round-trips.
        rt = hf.decode(ids, skip_special_tokens=False)
        assert rt == text, f"reference decode mismatch for {text!r}: {rt!r}"

    # --- build a synthetic GGUF slice? No: emit vocab/merges directly ---
    # Full vocab is 49k strings; embedding it in a test file is ~2.5MB. That is
    # acceptable (M0 fixtures are similar scale) and keeps the test
    # self-contained without file I/O on wasm-gc.
    parts = [
        "// GENERATED by tools/gen_tokenizer_tests.py -- do not edit by hand.",
        "//",
        "// The vocabulary and merge tables are inherently long literal arrays; the",
        "// compiler's text-segment-size lint is about editor readability here, not",
        "// correctness, so it is silenced for this file only.",
        "//",
        "// Golden tokenizer fixture: the real SmolLM2 vocabulary and merges,",
        "// plus corpus strings with their exact reference token ids from",
        "// HuggingFace tokenizers. Consumed by src/tokenizer/golden_test.mbt.",
        "",
        "///|",
        f"/// Vocabulary size: {len(vocab)}.",
        f"let golden_vocab_size : Int = {len(vocab)}",
        "",
        "///|",
        f"/// BOS/EOS ids from the model metadata.",
        f"let golden_bos : Int = {bos}",
        f"let golden_eos : Int = {eos}",
        "",
    ]

    parts.append(emit_string_array("golden_vocab", vocab, "The full SmolLM2 vocabulary, index = token id."))
    parts.append("")
    parts.append(emit_string_array("golden_merges", merges, "The full merge list, index = merge priority."))
    parts.append("")

    parts.append(emit_string_array("golden_inputs", [t for t, _ in golden_pairs], "Corpus inputs."))
    parts.append("")
    # ids flattened with a lengths array
    flat = []
    lengths = []
    for _, ids in golden_pairs:
        lengths.append(len(ids))
        flat.extend(ids)
    parts.append(emit_int_array("golden_ids_flat", flat, "Reference token ids, flattened across golden_inputs."))
    parts.append(emit_int_array("golden_ids_lengths", lengths, "Length of each input's id sequence, aligned with golden_inputs."))
    parts.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(parts), encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO_ROOT)} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generate tokenizer golden tests from a real GGUF model + reference tokenizer.

Embeds compact fixtures into MoonBit test files:
  - for SmolLM2: the real vocabulary and merges, corpus strings, and exact
    reference token ids from HuggingFace `tokenizers`;
  - for Qwen2: the same, in a separate file so the SmolLM2 fixture and its
    expectations stay untouched;
  - encode->decode round-trip samples across English, Chinese, code, emoji,
    whitespace and special tokens.

For Qwen2 the reference tokenizer is reconstructed from the GGUF's own vocab,
merges and pre-tokenizer (`PRETOKENIZE_REGEX` from transformers), which is the
only way to get an exact reference without a separate tokenizer.json. The GGUF
`tokenizer.ggml.pre` value is asserted to be "qwen2".

The generated files compile on both native and wasm-gc without file I/O.

Usage:
    python tools/gen_tokenizer_tests.py
        [--smollm-model <model.gguf>] [--smollm-tokenizer <tokenizer.json>]
        [--qwen2-model <model.gguf>]

Writes:
    src/tokenizer/gen_golden_test.mbt
    src/tokenizer/gen_qwen2_test.mbt
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "src" / "tokenizer" / "gen_golden_test.mbt"
QWEN2_OUT = REPO_ROOT / "src" / "tokenizer" / "gen_qwen2_test.mbt"


def emit_string_array(name: str, values: list[str], doc: str) -> str:
    r"""Emit an Array[String] built from per-chunk functions.

    Two constraints shape this:

    1. A single array literal spanning hundreds of thousands of lines trips the
       compiler's text-segment-size lint.
    2. Every top-level `let` initializer is inlined into `moonbit_init`, so a
       few megabytes of literals become one oversized function. wasm-gc rejects
       any function over 7654321 bytes, which a full 151k-entry vocab exceeds.

    Emitting each chunk as its own `fn ..._chunk_N() -> Array[String]` keeps
    every function small; the final binding concatenates them with
    `push_all`, which is also O(n) rather than re-copying on every `+`.
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
        out.append("///|")
        out.append(f"/// {doc}" if ci == 0 else f"/// Chunk {ci} of {name}.")
        out.append(f"fn {name}_chunk_{ci}() -> Array[String] {{")
        out.append("  [")
        for v in chunk:
            out.append(f'    "{esc(v)}",')
        out.append("  ]")
        out.append("}")
        out.append("")
    out.append("///|")
    out.append(f"/// {doc}")
    out.append(f"fn {name}() -> Array[String] {{")
    out.append(f"  let out : Array[String] = []")
    for ci in range(len(chunks)):
        out.append(f"  out.append({name}_chunk_{ci}()[:])")
    out.append("  out")
    out.append("}")
    out.append("")
    return "\n".join(out)


def emit_int_array(name: str, values: list[int], doc: str, chunk_size: int = 4000) -> str:
    """Emit an Array[Int] as per-chunk functions, for the same reason as
    `emit_string_array` (keeps each wasm function under the size ceiling)."""
    chunks = [values[i : i + chunk_size] for i in range(0, len(values), chunk_size)] or [[]]
    out: list[str] = []
    for ci, chunk in enumerate(chunks):
        out.append("///|")
        out.append(f"/// {doc}" if ci == 0 else f"/// Chunk {ci} of {name}.")
        out.append(f"fn {name}_chunk_{ci}() -> Array[Int] {{")
        out.append("  [")
        row = [str(v) for v in chunk]
        for i in range(0, len(row), 20):
            out.append("    " + ", ".join(row[i : i + 20]) + ",")
        out.append("  ]")
        out.append("}")
        out.append("")
    out.append("///|")
    out.append(f"/// {doc}")
    out.append(f"fn {name}() -> Array[Int] {{")
    out.append("  let out : Array[Int] = []")
    for ci in range(len(chunks)):
        out.append(f"  out.append({name}_chunk_{ci}()[:])")
    out.append("  out")
    out.append("}")
    out.append("")
    return "\n".join(out)


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

    model_path = sys.argv[1] if len(sys.argv) > 1 else "D:/llmdata/SmolLM2-135M-Instruct-Q8_0.gguf"
    tokjson_path = sys.argv[2] if len(sys.argv) > 2 else "D:/tmp/smollm2_tokenizer.json"

    # --- load reference tokenizer and GGUF vocab ---
    # Load the tokenizer.json directly rather than through `AutoTokenizer`,
    # which also fetches config.json from the Hub. The golden ids only depend
    # on the tokenizer file, and this keeps regeneration fully offline.
    from tokenizers import Tokenizer as HfTokenizer

    hf = HfTokenizer.from_file(tokjson_path)

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


# --------------------------------------------------------------------------
# Qwen2 fixture
# --------------------------------------------------------------------------

# The Qwen2 corpus targets the behaviour the SmolLM2 fixture cannot pin down:
# its own regex, case-insensitive contractions, the optional non-CR/LF prefix
# on letter runs, punctuation swallowing trailing newlines, and — most
# importantly — numbers, which reach BPE as single digits because the regex's
# `\p{N}` has no `+`.
QWEN2_CORPUS = [
    # Numbers: the case the tool-calling JSON path depends on.
    "3.14",
    "42",
    "1234",
    " 42",
    "abc123 45",
    "1+1=2, 2+2=4, 10*10=",
    "3.14159e10",
    "x=1000",
    "{\"a\": 3.14, \"b\": 42}",
    "{\"name\": \"list_dir\", \"arguments\": {\"path\": \".\", \"depth\": 2}}",
    # Contractions, upper and lower case.
    "I'm fine, don't",
    "DON'T IT'S WE'RE THEY'LL HE'D",
    # Letter runs with a non-space prefix (Qwen2 branch 2).
    ",world",
    "a\tb",
    "tabs\tand\tnewlines\n",
    # Punctuation swallowing trailing newlines (branch 4).
    ".\n",
    "):\n    return a + b",
    "def add(a, b):\n    return a + b",
    # Whitespace ending in a newline (branch 5).
    "a  \n  b",
    "a \n \n b",
    "x\r\n y",
    "  \n  42",
    "  leading and trailing   spaces  ",
    # Ordinary text and non-Latin scripts.
    "Hello, world!",
    "The quick brown fox jumps over the lazy dog.",
    "你好123世界",
    "你好, world!",
    "中文和English混合文本123",
    "CamelCase snake_case kebab-case",
    "SELECT * FROM users WHERE id = 42;",
    "print('hello')  # comment",
    "「日本語のテキスト」",
    "한국어 텍스트",
    "Русский текст",
    "العربية",
    "emoji: \U0001F600 \U0001F680",
    "🇨🇳 flag emoji",
    # Special tokens as they appear in the chat template.
    "<|im_start|>user\nHello<|im_end|>\n",
    "<|endoftext|>",
    "a",
    " ",
    "\n\n\n",
    "!!!???...,,",
    "x" * 40,
]


def build_qwen2_reference(model_path: str):
    """Reconstruct the reference tokenizer from the GGUF itself.

    `tokenizers` needs a vocab/merges pair and the pre-tokenizer; the GGUF
    carries all three, so this needs no download. The regex is the one from
    transformers' `Qwen2Tokenizer`, imported rather than retyped, so a change
    upstream can never silently drift from the fixture.
    """
    from gguf import GGUFReader
    from tokenizers import Tokenizer, decoders, models, pre_tokenizers, Regex
    from transformers.models.qwen2.tokenization_qwen2 import PRETOKENIZE_REGEX

    reader = GGUFReader(model_path)
    pre = reader.fields["tokenizer.ggml.pre"].contents()
    assert pre == "qwen2", f"expected tokenizer.ggml.pre 'qwen2', got {pre!r}"
    vocab = [
        t.decode("utf-8") if isinstance(t, bytes) else t
        for t in reader.fields["tokenizer.ggml.tokens"].contents()
    ]
    merges = [
        m.decode("utf-8") if isinstance(m, bytes) else m
        for m in reader.fields["tokenizer.ggml.merges"].contents()
    ]
    bpe = models.BPE(
        vocab={t: i for i, t in enumerate(vocab)},
        merges=[tuple(m.split(" ", 1)) for m in merges],
        unk_token=None,
        fuse_unk=False,
        byte_fallback=False,
        ignore_merges=False,
    )
    tk = Tokenizer(bpe)
    tk.pre_tokenizer = pre_tokenizers.Sequence(
        [
            pre_tokenizers.Split(Regex(PRETOKENIZE_REGEX), behavior="isolated", invert=False),
            pre_tokenizers.ByteLevel(add_prefix_space=False, use_regex=False),
        ]
    )
    tk.decoder = decoders.ByteLevel()
    # `Qwen2Tokenizer.__init__` registers every special token as an
    # `AddedToken(special=True)`, so "<|im_start|>" encodes to one id rather
    # than through BPE. Matching that here keeps the reference faithful and
    # exercises MoonBit's control-token scan on the same inputs.
    tt = [int(x) for x in reader.fields["tokenizer.ggml.token_type"].contents()]
    specials = [vocab[i] for i, t in enumerate(tt) if t == 3]
    tk.add_special_tokens(specials)
    return reader, vocab, merges, tk


def emit_qwen2(model_path: str) -> None:
    reader, vocab, merges, tk = build_qwen2_reference(model_path)

    def scalar(key):
        v = reader.fields[key].contents()
        if isinstance(v, list):
            v = v[0]
        return int(v)

    bos = scalar("tokenizer.ggml.bos_token_id")
    eos = scalar("tokenizer.ggml.eos_token_id")
    tt = [int(x) for x in reader.fields["tokenizer.ggml.token_type"].contents()]
    control = [i for i, t in enumerate(tt) if t == 3]

    pairs = []
    for text in QWEN2_CORPUS:
        ids = tk.encode(text).ids
        # Special tokens are in the id stream (as in MoonBit's encoder), so the
        # reference decode must not skip them.
        rt = tk.decode(ids, skip_special_tokens=False)
        assert rt == text, f"reference round-trip failed for {text!r}: {rt!r}"
        pairs.append((text, ids))

    parts = [
        "// GENERATED by tools/gen_tokenizer_tests.py -- do not edit by hand.",
        "//",
        "// Qwen2 tokenizer fixture, kept separate from the SmolLM2 fixture so the",
        "// latter's expected ids stay untouched. The reference tokenizer is",
        "// reconstructed from this model's own GGUF vocab, merges and",
        "// `tokenizer.ggml.pre = \"qwen2\"`, with the pre-tokenizer regex imported",
        "// from transformers' Qwen2Tokenizer. Consumed by gen_qwen2_test.mbt.",
        "",
        "///|",
        f"/// Vocabulary size: {len(vocab)}.",
        f"let qwen2_vocab_size : Int = {len(vocab)}",
        "",
        "///|",
        "/// BOS/EOS ids from the model metadata.",
        f"let qwen2_bos : Int = {bos}",
        f"let qwen2_eos : Int = {eos}",
        "",
        "///|",
        "/// Control-token ids, which encode to single tokens before BPE.",
        "let qwen2_control_ids : Array[Int] = ["
        + ", ".join(str(i) for i in control)
        + "]",
        "",
    ]
    parts.append(emit_string_array("qwen2_vocab", vocab, "The full Qwen2 vocabulary, index = token id."))
    parts.append("")
    parts.append(emit_string_array("qwen2_merges", merges, "The full merge list, index = merge priority."))
    parts.append("")
    parts.append(emit_string_array("qwen2_inputs", [t for t, _ in pairs], "Corpus inputs."))
    parts.append("")
    flat = []
    lengths = []
    for _, ids in pairs:
        lengths.append(len(ids))
        flat.extend(ids)
    parts.append(emit_int_array("qwen2_ids_flat", flat, "Reference token ids, flattened across qwen2_inputs."))
    parts.append(emit_int_array("qwen2_ids_lengths", lengths, "Length of each input's id sequence."))
    parts.append("")

    QWEN2_OUT.parent.mkdir(parents=True, exist_ok=True)
    QWEN2_OUT.write_text("\n".join(parts), encoding="utf-8")
    print(
        f"wrote {QWEN2_OUT.relative_to(REPO_ROOT)} ({QWEN2_OUT.stat().st_size} bytes), "
        f"{len(pairs)} inputs, vocab {len(vocab)}, merges {len(merges)}"
    )


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--smollm-model",
        default="D:/llmdata/SmolLM2-135M-Instruct-Q8_0.gguf",
    )
    p.add_argument(
        "--smollm-tokenizer",
        default=None,
        help="tokenizer.json for the reference SmolLM2 tokenizer; default "
        "downloads HuggingFaceTB/SmolLM2-135M-Instruct",
    )
    p.add_argument(
        "--qwen2-model",
        default="D:/llmdata/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    )
    p.add_argument(
        "--smollm",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="emit the SmolLM2 fixture (needs the model and tokenizer)",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.smollm:
        sys.argv = [sys.argv[0], args.smollm_model]
        if args.smollm_tokenizer:
            sys.argv.append(args.smollm_tokenizer)
        main()
    emit_qwen2(args.qwen2_model)

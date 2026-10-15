#!/usr/bin/env python3
"""Generate a golden fixture for the full transformer forward pass.

Builds a tiny but structurally complete transformer (2 layers, GQA, RoPE,
SwiGLU), writes it as a real GGUF file, runs the reference forward pass in
numpy, and emits both the GGUF bytes and the expected logits as MoonBit data.

Everything is generated rather than downloaded so the case fits in a test file
and runs on wasm-gc, and so the reference is small enough to read and check by
eye. The reference implementation follows the same layout llama.cpp uses for
the llama architecture: RMSNorm pre-norm, NORMAL (adjacent-pair) RoPE, GQA
attention scaled by 1/sqrt(head_dim), SwiGLU FFN.

The weights are stored as f32 so that a mismatch points at the forward-pass
arithmetic rather than at quantization (which M0 and the matvec tests already
cover separately).

Usage:
    python tools/gen_forward_tests.py

Writes:
    src/model/gen_forward_test.mbt
    src/model/test_model.gguf   (only for manual debugging; not needed to test)
"""

from __future__ import annotations

import importlib.util
import struct
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "src" / "model" / "gen_forward_test.mbt"
DEBUG_GGUF = REPO_ROOT / "src" / "model" / "test_model.gguf"


def load_builders():
    spec = importlib.util.spec_from_file_location(
        "gen_fixtures", REPO_ROOT / "tools" / "gen_fixtures.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# --- the tiny test model ----------------------------------------------------

CFG = dict(
    n_embd=64,
    n_layer=2,
    n_ff=128,
    n_head=4,
    n_head_kv=2,
    head_dim=16,
    vocab=128,
    context_length=64,
    rms_eps=1e-5,
    rope_theta=10000.0,
)


def build_weights(rng):
    """Random weights with realistic magnitudes (not all-ones, which would hide
    scale errors)."""
    c = CFG
    w = {}
    # Embedding: [n_embd, vocab] in GGUF order (n_embd fastest-varying).
    w["token_embd.weight"] = rng.normal(0, 0.05, size=(c["vocab"], c["n_embd"])).astype(np.float32)
    for i in range(c["n_layer"]):
        p = f"blk.{i}."
        w[p + "attn_norm.weight"] = (1.0 + rng.normal(0, 0.02, size=c["n_embd"])).astype(np.float32)
        kv = c["n_head_kv"] * c["head_dim"]
        w[p + "attn_q.weight"] = rng.normal(0, 0.05, size=(c["n_embd"], c["n_embd"])).astype(np.float32)
        w[p + "attn_k.weight"] = rng.normal(0, 0.05, size=(kv, c["n_embd"])).astype(np.float32)
        w[p + "attn_v.weight"] = rng.normal(0, 0.05, size=(kv, c["n_embd"])).astype(np.float32)
        w[p + "attn_output.weight"] = rng.normal(0, 0.05, size=(c["n_embd"], c["n_embd"])).astype(np.float32)
        w[p + "ffn_norm.weight"] = (1.0 + rng.normal(0, 0.02, size=c["n_embd"])).astype(np.float32)
        w[p + "ffn_gate.weight"] = rng.normal(0, 0.05, size=(c["n_ff"], c["n_embd"])).astype(np.float32)
        w[p + "ffn_up.weight"] = rng.normal(0, 0.05, size=(c["n_ff"], c["n_embd"])).astype(np.float32)
        w[p + "ffn_down.weight"] = rng.normal(0, 0.05, size=(c["n_embd"], c["n_ff"])).astype(np.float32)
    w["output_norm.weight"] = (1.0 + rng.normal(0, 0.02, size=c["n_embd"])).astype(np.float32)
    # output.weight is omitted on purpose: this model uses tied embeddings.
    return w


def rms_norm(x, weight, eps):
    mean_sq = np.mean(x.astype(np.float64) ** 2)
    scale = 1.0 / np.sqrt(mean_sq + eps)
    return (x.astype(np.float64) * scale * weight.astype(np.float64))


def rope(x, pos, head_dim, theta):
    """NORMAL RoPE: rotate adjacent pairs (x[2i], x[2i+1])."""
    out = x.astype(np.float64).copy()
    n_pairs = head_dim // 2
    for i in range(n_pairs):
        freq = theta ** (-2.0 * i / head_dim)
        angle = pos * freq
        c, s = np.cos(angle), np.sin(angle)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i] = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out


def silu(x):
    return x / (1.0 + np.exp(-x))


def forward(weights, tokens):
    """Reference forward pass over a prompt, returning the LAST position's logits."""
    c = CFG
    n_embd, head_dim = c["n_embd"], c["head_dim"]
    n_head, n_head_kv = c["n_head"], c["n_head_kv"]
    kv_dim = n_head_kv * head_dim
    heads_per_kv = n_head // n_head_kv
    scale = 1.0 / np.sqrt(head_dim)

    k_cache = [np.zeros((n_head_kv, 0, head_dim)) for _ in range(c["n_layer"])]
    v_cache = [np.zeros((n_head_kv, 0, head_dim)) for _ in range(c["n_layer"])]

    logits = None
    for pos, tok in enumerate(tokens):
        h = weights["token_embd.weight"][tok].astype(np.float64)
        for layer in range(c["n_layer"]):
            p = f"blk.{layer}."
            # attention
            xn = rms_norm(h, weights[p + "attn_norm.weight"], c["rms_eps"])
            q = weights[p + "attn_q.weight"].astype(np.float64) @ xn
            k = weights[p + "attn_k.weight"].astype(np.float64) @ xn
            v = weights[p + "attn_v.weight"].astype(np.float64) @ xn
            qh = np.stack([rope(q[hh * head_dim : (hh + 1) * head_dim], pos, head_dim, c["rope_theta"])
                           for hh in range(n_head)])
            kh = np.stack([rope(k[hh * head_dim : (hh + 1) * head_dim], pos, head_dim, c["rope_theta"])
                           for hh in range(n_head_kv)])
            vh = v.reshape(n_head_kv, head_dim)
            k_cache[layer] = np.concatenate([k_cache[layer], kh[:, None, :]], axis=1)
            v_cache[layer] = np.concatenate([v_cache[layer], vh[:, None, :]], axis=1)
            attn_out = np.zeros(n_embd)
            for hh in range(n_head):
                kvh = hh // heads_per_kv
                scores = k_cache[layer][kvh] @ qh[hh] * scale
                m = scores.max()
                e = np.exp(scores - m)
                probs = e / e.sum()
                attn_out[hh * head_dim : (hh + 1) * head_dim] = probs @ v_cache[layer][kvh]
            h = h + weights[p + "attn_output.weight"].astype(np.float64) @ attn_out
            # ffn
            xn = rms_norm(h, weights[p + "ffn_norm.weight"], c["rms_eps"])
            gate = weights[p + "ffn_gate.weight"].astype(np.float64) @ xn
            up = weights[p + "ffn_up.weight"].astype(np.float64) @ xn
            h = h + weights[p + "ffn_down.weight"].astype(np.float64) @ (silu(gate) * up)
        xn = rms_norm(h, weights["output_norm.weight"], c["rms_eps"])
        logits = weights["token_embd.weight"].astype(np.float64) @ xn
    return logits


def write_gguf(path: Path, weights: dict, tokens: list[int]) -> None:
    """Write the weights as a real GGUF v3 file so the MoonBit side parses it."""
    c = CFG
    G = load_builders().GgufWriter
    w = G(alignment=32)
    w.kv("general.architecture", 8, G._string("llama"))
    w.kv("llama.context_length", 4, G._u32(c["context_length"]))
    w.kv("llama.embedding_length", 4, G._u32(c["n_embd"]))
    w.kv("llama.block_count", 4, G._u32(c["n_layer"]))
    w.kv("llama.feed_forward_length", 4, G._u32(c["n_ff"]))
    w.kv("llama.attention.head_count", 4, G._u32(c["n_head"]))
    w.kv("llama.attention.head_count_kv", 4, G._u32(c["n_head_kv"]))
    w.kv("llama.attention.layer_norm_rms_epsilon", 6, G._f32(c["rms_eps"]))
    w.kv("llama.rope.freq_base", 6, G._f32(c["rope_theta"]))
    for name, arr in weights.items():
        # GGUF stores 2-D tensors as [fastest, ..., 1] = reversed numpy shape.
        dims = list(arr.shape)[::-1]
        w.tensor(name, dims, 0, arr.astype("<f4").tobytes())
    buf, _ = w.build()
    path.write_bytes(buf)


def emit_bytes(name: str, data: bytes, doc: str, bytes_per_line: int = 400,
               lines_per_decl: int = 400) -> str:
    """Emit `data` as `name`, split across several top-level declarations.

    One literal spanning ~27k lines would be a single enormous text segment and
    trips the compiler's segment-size lint, so the payload is cut into
    `<name>_part<i>` declarations of `lines_per_decl` lines each and the final
    `name` concatenates them.
    """
    all_lines = []
    for i in range(0, len(data), bytes_per_line):
        body = "".join("\\x%02x" % b for b in data[i : i + bytes_per_line])
        all_lines.append('  b"%s"' % body)
    groups = [
        all_lines[i : i + lines_per_decl]
        for i in range(0, len(all_lines), lines_per_decl)
    ] or [['  b""']]

    out = []
    for gi, group in enumerate(groups):
        part = f"{name}_part{gi}"
        out.append("///|")
        out.append(f"/// {doc}" if gi == 0 else f"/// Part {gi} of {name}.")
        out.append(f"let {part} : Bytes =")
        # Join with a trailing `+` so each source line stays one literal.
        for li, line in enumerate(group):
            is_last = li == len(group) - 1
            out.append(line + ("" if is_last else " +"))
        out.append("")
    if len(groups) > 1:
        joined = " + ".join(f"{name}_part{i}" for i in range(len(groups)))
        out.append("///|")
        out.append(f"/// The complete payload: every part of {name} joined.")
        out.append(f"let {name} : Bytes = {joined}")
        out.append("")
    return "\n".join(out)


def f64_array(name: str, values, doc: str) -> str:
    lines = ["///|", f"/// {doc}", f"let {name} : Array[Double] = ["]
    items = [repr(float(v)) for v in values]
    for i in range(0, len(items), 6):
        lines.append("  " + ", ".join(items[i : i + 6]) + ",")
    lines.append("]")
    return "\n".join(lines)


def main() -> None:
    rng = np.random.default_rng(4242)
    weights = build_weights(rng)
    # A prompt long enough that the cache and GQA grouping are both exercised.
    tokens = [5, 17, 23, 99, 41, 7, 63, 88]

    logits = forward(weights, tokens)

    write_gguf(DEBUG_GGUF, weights, tokens)
    gguf_bytes = DEBUG_GGUF.read_bytes()

    parts = [
        "// GENERATED by tools/gen_forward_tests.py -- do not edit by hand.",
        "//",
        "// A complete tiny transformer as a real GGUF file, plus the logits the",
        "// numpy reference forward pass produces for a fixed prompt.",
        "//",
        "// Geometry: 2 layers, n_embd 64, 4 query heads / 2 KV heads (GQA),",
        "// head_dim 16, n_ff 128, vocab 128, RoPE theta 10000, tied LM head.",
        "// Weights are stored as f32 so a mismatch localizes to the forward-pass",
        "// arithmetic rather than to quantization.",
        "",
        emit_bytes(
            "forward_test_gguf",
            gguf_bytes,
            "The test model as GGUF bytes.",
        ),
        "///|",
        "/// The prompt the expected logits correspond to.",
        f"let forward_test_tokens : Array[Int] = [{', '.join(str(t) for t in tokens)}]",
        "",
        f64_array("forward_test_logits", logits, "Reference logits at the final prompt position."),
        "",
        "///|",
        "/// Number of logits in the reference result (= vocabulary size).",
        f"let forward_test_vocab : Int = {len(logits)}",
        "",
    ]
    OUT.write_text("\n".join(parts), encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO_ROOT)} ({OUT.stat().st_size} bytes)")
    print(f"wrote {DEBUG_GGUF.relative_to(REPO_ROOT)} ({len(gguf_bytes)} bytes)")

    # Self-check: the reference must be reproducible and the argmax meaningful.
    logits2 = forward(weights, tokens)
    assert np.allclose(logits, logits2), "reference forward is not deterministic"
    print(f"  argmax token: {int(np.argmax(logits))}, logit range: "
          f"[{logits.min():.4f}, {logits.max():.4f}]")


if __name__ == "__main__":
    main()

"""Cross-check moonlm against a llama.cpp reference server.

Two comparisons, for two different questions:

1. `argmax` (default) — teacher forcing. The reference's own token sequence is
   replayed through moonlm, and at every position we ask whether moonlm's argmax
   agrees with the token the reference actually produced there. This is the
   quantity that measures forward-pass correctness, and it is robust to drift: a
   near-tie flipped by floating point costs one position, not the whole suffix.

2. `greedy` — free-running. Both sides sample greedily from the same prompt and
   the longest common prefix is reported, along with the reference's top-2
   logprob gap at the divergence position. The gap is the diagnostic: a
   divergence at a near-tie is floating-point drift, a divergence where the
   reference was confident points at a real disagreement.

The comparison is token-level, not text-level, because two implementations can
render the same token differently and that is not a disagreement.

The reference is a llama-server on loopback, started by the operator:

    llama-server -m <model.gguf> --port 18080

User-facing instructions and the results these scripts produced live in
docs/crosscheck.md.

Nothing here is executed through a shell: subprocesses are launched with an
argument list, and the only caller-supplied value that reaches one (the model
path) is validated to be an existing local file first. HTTP requests are
loopback-only, with the host checked rather than assumed.
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request

ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}
DEFAULT_PORT = 18080
MAX_TOKENS = 512

PROMPTS = [
    "The capital of France is",
    "Once upon a time",
    "def fibonacci(n):",
    "The quick brown fox jumps over",
    "2 + 2 =",
    "Water is composed of hydrogen and",
]


def validate_model_path(raw):
    """Return an absolute path to an existing .gguf file, or raise.

    The path is the one caller-supplied value that reaches a subprocess, so it
    is canonicalized and checked here rather than trusted downstream.
    """
    if "\x00" in raw:
        raise ValueError("model path contains a NUL byte")
    path = os.path.realpath(os.path.abspath(raw))
    if not os.path.isfile(path):
        raise ValueError(f"not a file: {path}")
    if not path.lower().endswith(".gguf"):
        raise ValueError(f"not a .gguf file: {path}")
    return path


def reference_url(path, host="127.0.0.1", port=DEFAULT_PORT):
    """Build a loopback-only URL.

    The host is not caller-controlled in normal use, but validating it here
    keeps the data flow from ever reaching a non-local endpoint regardless of
    how this module is imported or edited.
    """
    if host not in ALLOWED_HOSTS:
        raise ValueError(f"refusing non-loopback host: {host!r}")
    url = urllib.parse.urlunsplit(("http", f"{host}:{port}", path, "", ""))
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "http" or parsed.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"refusing url: {url!r}")
    return url


def post(path, body, port, timeout=300):
    req = urllib.request.Request(
        reference_url(path, port=port), data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def ref_tokenize(text, port):
    return post("/tokenize", {"content": text}, port, timeout=120)["tokens"]


def ref_greedy(prompt_or_ids, n, port):
    """Reference greedy ids plus the top-2 logprob gap at each step."""
    d = post("/completion", {
        "prompt": prompt_or_ids, "n_predict": n, "temperature": 0, "seed": 42,
        "top_k": 0, "top_p": 1.0, "min_p": 0.0, "repeat_penalty": 1.0,
        "cache_prompt": False, "n_probs": 5,
    }, port)
    steps = d.get("completion_probabilities", [])
    ids = [e["id"] for e in steps]
    gaps = []
    for e in steps:
        tls = e.get("top_logprobs") or []
        gaps.append(tls[0]["logprob"] - tls[1]["logprob"] if len(tls) >= 2 else None)
    return ids, gaps, d.get("content", "")


def moonlm_run(model, subcmd_args, cwd):
    """Invoke the moonlm CLI in release mode and return stdout.

    `shell` is left at its default of False, so the argument list is passed to
    the process directly with no shell interpretation.
    """
    cmd = ["moon", "run", "src/cli", "--target", "native", "--release",
           "--", *subcmd_args]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=5400,
                         cwd=cwd, shell=False)
    if out.returncode != 0:
        raise RuntimeError(f"moonlm failed:\n{out.stdout}\n{out.stderr}")
    return out.stdout


def moonlm_tokens(model, prompt, n, cwd):
    out = moonlm_run(model, ["generate", model, prompt, "--max-tokens", str(n),
                             "--temperature", "0", "--seed", "42", "--raw",
                             "--dump-tokens"], cwd)
    for line in out.splitlines():
        s = line.strip()
        if s and all(c.isdigit() or c == " " for c in s):
            return [int(x) for x in s.split()]
    raise RuntimeError("no token line in:\n" + out[:400])


def moonlm_top1(model, ids, cwd):
    """Argmax token after each position of `ids`."""
    id_list = ",".join(str(int(i)) for i in ids)
    out = moonlm_run(model, ["logits", model, id_list, "--top", "1"], cwd)
    tops, cur = {}, None
    for line in out.splitlines():
        s = line.strip()
        if s.startswith("pos ") and s.endswith(":"):
            cur = int(s[4:-1])
        elif cur is not None and s:
            parts = s.split()
            if len(parts) >= 2 and parts[0] == "1":
                tops[cur] = int(parts[1])
    return tops


def lcp(a, b):
    n = 0
    while n < len(a) and n < len(b) and a[n] == b[n]:
        n += 1
    return n


def run_argmax(args):
    print(f"teacher forcing: moonlm argmax vs the reference's tokens, "
          f"{args.gen} steps")
    print(f"{'prompt':<32} {'agree/total':>12} {'rate':>7}")
    print("-" * 56)
    tot_a = tot_n = 0
    for p in PROMPTS:
        p_ids = ref_tokenize(p, args.port)
        seq = p_ids + ref_greedy(p_ids, args.gen, args.port)[0]
        tops = moonlm_top1(args.model, seq, args.cwd)
        agree = checked = 0
        for j in range(len(p_ids) - 1, len(seq) - 1):
            got = tops.get(j)
            if got is None:
                continue
            checked += 1
            agree += 1 if got == seq[j + 1] else 0
        tot_a += agree
        tot_n += checked
        print(f"{p[:32]:<32} {agree:>5}/{checked:<6} "
              f"{(agree / checked if checked else 0):>7.1%}")
    print("-" * 56)
    rate = tot_a / tot_n if tot_n else 0.0
    print(f"OVERALL {tot_a}/{tot_n} = {rate:.2%} argmax agreement")
    return 0 if rate >= args.threshold else 1


def run_greedy(args):
    print(f"{'prompt':<28} {'LCP':>4} {'ref tok':>8} {'first-diff gap':>15}")
    print("-" * 60)
    all_near_tie = True
    for p in PROMPTS:
        ref_ids, gaps, _ = ref_greedy(p, args.gen, args.port)
        got = moonlm_tokens(args.model, p, args.gen, args.cwd)
        n = lcp(ref_ids, got)
        if n == len(ref_ids):
            print(f"{p:<28} {n:>4} {len(ref_ids):>8} {'(identical)':>15}")
            continue
        gap = gaps[n] if n < len(gaps) else None
        tag = "" if gap is None else ("near-tie" if gap < 0.5 else "CONFIDENT")
        if gap is not None and gap >= 0.5:
            all_near_tie = False
        shown = "n/a" if gap is None else str(round(gap, 4))
        print(f"{p:<28} {n:>4} {len(ref_ids):>8} {shown:>15}  {tag}")
        print(f"      ref: {ref_ids[max(0, n - 3):n + 4]}")
        print(f"      got: {got[max(0, n - 3):n + 4]}")
    print("-" * 60)
    print("every divergence at a near-tie:", all_near_tie)
    return 0 if all_near_tie else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("model", help="path to the GGUF, Windows-native form")
    ap.add_argument("--mode", choices=("argmax", "greedy"), default="argmax")
    ap.add_argument("--gen", type=int, default=48, help="tokens to compare")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--cwd", default=None,
                    help="moonlm repo root (default: this script's parent)")
    ap.add_argument("--threshold", type=float, default=0.95,
                    help="argmax mode: required agreement rate to pass")
    args = ap.parse_args()
    if args.cwd is None:
        args.cwd = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not 0 < args.gen <= MAX_TOKENS:
        print(f"error: --gen must be within 1..{MAX_TOKENS}", file=sys.stderr)
        return 2
    try:
        args.model = validate_model_path(args.model)
        return run_argmax(args) if args.mode == "argmax" else run_greedy(args)
    except (OSError, ValueError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

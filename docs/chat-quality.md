# 0.3.0 local acceptance evidence — 2026-11-07

These are small acceptance checks, not a general model benchmark or a promise
of correct answers. The browser does not execute generated Python or arithmetic.

Verified with `tools/check_chat_quality.py`, Python Playwright and Chromium:

| Model | Prompt | Actual output | Termination |
|---|---|---|---|
| SmolLM2-135M-Instruct-Q8_0 | What is the capital of France? Answer in one short sentence. | The capital of France is Paris. | EOS, 7 tokens |
| Qwen2.5-0.5B-Instruct-Q4_K_M | Same English question | The capital of France is Paris. | EOS, 7 tokens |
| Qwen2.5-0.5B-Instruct-Q4_K_M | 请逐步计算 1+2+3+4+5，每步列出累加结果，不要写代码。 | See below | EOS, 26 tokens |

```text
1+2=3
3+3=6
6+4=10
10+5=15
```

Settings: single-turn ChatML, greedy temperature 0, repetition penalty 1.1,
maximum 128 tokens. Also exercised temperature 0.7/top-p 0.9, requiring a
nonempty completion without assuming a particular stochastic answer. Invalid
token counts were rejected. No browser page errors were recorded. Full local
outputs/screenshots are saved in the ignored `web/dist/chat-quality/` directory.

Measured wall times in the final local run: SmolLM2 English 7.46 s; Qwen English
37.40 s; Qwen Chinese arithmetic 64.47 s. These depend on local hardware and
include prefill; the worker keeps the page responsive, not the model fast.

Additional checks: native tests 125/125; wasm-gc tests 100/100; raw worker/direct
JS token parity, incremental display, cancellation and reload passed. Release
size gates passed: Windows executable 677.5 KB and JS bundle 77.6 KB Brotli
(681.4 KB raw). The existing benchmarks/results.json remains a historical
model benchmark, not a newly measured 0.3.0 throughput result.

Reproduce using the commands in docs/browser.md with locally supplied models.

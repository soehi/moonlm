# MoonLM

MoonLM 是一个用 MoonBit 从零实现的端侧 LLM 推理引擎：同一份源码编译到 native 与浏览器（js 后端），产物 669 KB / 74.5 KB（brotli），推理全程零网络、零数据外传。附带一个已验证过能力边界的类型安全 Agent 运行时作为演示层。

## 当前进度

**M0 — 地基：GGUF 解析与量化格式** ✅ **完成**

| 交付物 | 状态 |
|---|---|
| `soehi/gguf` 模块（独立仓库，独立发布）：header / metadata KV（12 种类型 + 嵌套数组）/ 张量目录 / 对齐 | ✅ |
| 同上 `soehi/gguf/tensor`：F32 / F16 / Q4_0 / Q5_0 / Q8_0 / Q4_K / Q6_K 反量化 | ✅ |
| `src/cli/`：`moonlm inspect <model.gguf>`（native，另支持 `--json`、`dequant`） | ✅ |
| 双 target（native + wasm-gc）`check` / `test` / `build` 全绿 | ✅ |

**验收结果**

- 64 个单元 / 黄金 / 畸形输入测试在 native 与 wasm-gc 上全部通过。
- 7 种存储类型（其中 5 种为块量化）反量化与 llama.cpp 参考实现的黄金向量误差 ≤ 1e-6。
- 真实模型对拍（SmolLM2-135M-Instruct，Q8_0 与 Q4_K_M 各一份）与 llama.cpp 的
  `gguf` 读出器一致：header、全部 37 个 metadata 键、272 个张量
  （名称 / 类型 / 维度 / 元素数 / offset / 字节数），以及 F32 / Q8_0 / Q4_K / Q6_K
  的**解码数值**。
- 畸形输入（截断、坏 magic、未知类型、计数溢出、对齐错误、超过 4 维、张量越界、
  九层嵌套数组）全部返回带偏移量的错误，无 panic、无越界。

**M1 — 内核：Tokenizer + Transformer 前向 + 采样** ✅ **完成**

| 交付物 | 状态 |
|---|---|
| `src/tokenizer/`：byte-level BPE（encode / decode / 特殊 token / 字节映射；`smollm` / `qwen2` 预分词器） | ✅ |
| `src/model/`：RMSNorm / RoPE（NORMAL + NEOX）/ Q/K/V bias / GQA 注意力 / SwiGLU / KV cache / 完整前向 | ✅ |
| `src/sampler/`：greedy / temperature / top-k / top-p | ✅ |
| `src/engine/`：`Engine` trait + `PureEngine`（prefill + decode 流式生成） | ✅ |
| `src/cli/`：`inspect` / `dequant` / `tokenize` / `generate` / `chat` / `bench` / `logits` / `profile` | ✅ |

**验收结果**

- 103 个测试在 native 与 wasm-gc 上全部通过，零警告。
- 分词与 HuggingFace 参考完全一致（49k 词表往返 + 31 条中/英/日/韩/俄/阿样本）。
- **与 llama.cpp 逐位置对拍：288 个位置上 280 个 argmax 一致 = 97.22%**
  （验收线 95%）。全部 8 处分歧都落在参考实现自身「近似平局」的位置
  （top-2 logprob 差距仅 0.002–0.17 nat），即浮点漂移而非结构错误。
  注：换用本地新构建的 llama.cpp 参考（0.7.0-dev）时该数字为 277/288 =
  96.18%，差异来自参考实现本身——同一本地参考下，内存优化前后的逐 prompt
  结果逐位相同。两个数字都记录在 `docs/crosscheck.md`。
  方法与完整数据见 [docs/crosscheck.md](docs/crosscheck.md)。
- 真实模型可生成连贯文本；单线程 decode 15.4 tok/s、prefill 16.0（旧工具链 18.4 / 19.0）
  （M2 的内核优化把 decode 从 14.4 提到 18.4，见下）。
- 性能与瓶颈分析见 [docs/performance.md](docs/performance.md)：内核为纯标量、
  无 SIMD，比 llama.cpp 单线程（57.2 tok/s）慢约 3.7 倍。

**M2 — 浏览器：Web Demo** ✅ **完成**

| 交付物 | 状态 |
|---|---|
| `src/web/`：JS 边界 API（`foreign_library` + `#export_name`，handle 表 + 流式回调） | ✅ |
| `web/`：演示页（本地文件 / URL 两种加载、流式输出、tok/s 实时显示） | ✅ |
| `tools/serve_web.py`：构建 + 组装 `web/dist/` + loopback 预览服务 | ✅ |

**验收结果**

- Chrome（in-app Chromium）加载 SmolLM2-135M Q8_0（138 MB）后可流式生成：
  **decode 6.3 tok/s、prefill 8.2 tok/s**，超过 ≥3 tok/s 的目标 2 倍。
- **浏览器与 native 的 token id 逐位一致**（两个 prompt 均验证），比验收线更强。
- 加载体验：读取 198 ms、解析 4.4 s、引擎产物 306 KB（当前工具链实测 655 KB / brotli 74.5 KB，见 benchmarks/RESULTS.md）。
- **零网络验证**（三重证据）：产物无任何外部 URL；instrument `fetch`/`XHR`/
  `WebSocket`/`sendBeacon` 后推理期间记录为 **0 次调用**；把 `fetch` 替换为
  必然 reject 的函数后仍能正确生成。
- 完整数据、决策依据与「不宣称什么」见 [docs/browser.md](docs/browser.md)。

**浏览器目标是 `js` 而非原计划的 `wasm-gc`**（实测推翻）：wasm-gc 的 `Bytes` 是
GC 数组引用，JavaScript 无法构造，且模块不导出内存，模型字节进不去
（实测报 `type incompatibility when transforming from/to JS`）；`js` 后端下
`Bytes` 就是 `Uint8Array`。MoonBit 官方 web 模板同样声明 `"preferred-target": "js"`。
引擎各包仍双后端可构建可测试，只有这个边界包是 `js` 专属。
`moon.mod` 的 `preferred_target` 保持 `wasm-gc`：`web` 是 js 专属包，`cli` 目前只有 wasm-gc 占位 main，模块级默认只能取其一；浏览器构建始终显式 `--target js`。

**性能靠实测而非猜测修回来**：两个修复都是读**生成的 JavaScript** 找到的——
`Float` 运算在该后端编译为 `Math.fround` 调用（改 f64 累加）；`Bytes` 索引生成
`$bound_check` 调用（改 `Bytes::unsafe_get`）。两项对 native 也有增益
（14.4 → 18.4 tok/s），且改动后 llama.cpp 对拍与跨后端一致性均不变。

> **数字更正**：早期文档写「0.7 → 6.33 tok/s（9 倍）」。那比较的是 UI 路径下
> 8 token 与 bench 路径下 16 token 两次测量，混入了测量条件差异。同一条件下
> 用 `tools/bench_js_kernel.mjs` 逐 bundle 重测的受控结果是 **1.92 → 7.56
> tok/s（3.9 倍）**。结论（达标 ≥3 tok/s）不变。

**M3 — Agent 运行时** ✅ **完成（能力边界见 docs/agent.md）**

| 交付物 | 状态 |
|---|---|
| `src/agent/`：`Tool` trait、工具调用格式策略（`ToolCallFormat`，解析器独立于循环）、JSON-Schema 校验、执行循环（步数 / 上下文 / 停止条件）、滚动窗口与 observation 截断 | ✅ |
| `src/tools/`：`list_dir` / `read_file` / `grep_text`（经工作区沙箱）+ `calc`（纯 MoonBit） | ✅ |
| `src/cli/agent_native.mbt`：`moonlm agent --task ... --workspace ... [--model ...]` | ✅ |
| 浏览器端：`calc` + 内存 demo 工具；文件工具不注册（无同步文件系统，也无可信的工作区根） | ✅ |
| BM25 检索 | ❌ 未做（会话规模小，收益不抵依赖成本） |

**实测结论（Qwen2.5-0.5B，Q4_K_M）**：单步工具调用 3/4 成功（列目录、读文件、
grep），多步"列目录 → 读文件 → 总结"0/2 完成——模型拿到目录列表后直接总结，
不再读文件。工具调用正确率约 50%。完整失败模式与复现步骤见
[docs/agent.md](docs/agent.md)；这是模型能力边界，不是循环实现问题（循环本身
由 22 个脚本化引擎测试覆盖）。

后续阶段见 [PLAN.md](PLAN.md)。

## 设计约束

- `soehi/gguf`（独立仓库，独立 `moon.mod`）为**纯 MoonBit**：无 FFI、无第三方依赖，
  同时通过 `native` 与 `wasm-gc`。它是可单独复用的公共资产，moonlm 以版本依赖消费它。
- 计算路径零 FFI。native 侧只有一层 libc 薄封装
  （src/tools/stubs.c 643 行 + src/cli/stubs.c 125 行，共 768 行 C，
  覆盖沙箱 / 目录 / 文件 / 标准输入输出），按 target 隔离；
  wasm-gc 与 js 构建不含这些调用。
- 只做**反量化**（量化交给 llama.cpp 现成模型），只**读** GGUF，不写。
- 容错优先：任何畸形输入返回带出错偏移的错误值，不 panic、不下标越界。
- 所有整数按小端解析；偏移与长度用 `Int64`/`UInt64`，不用 32 位 `Int` 承接。
- 大 metadata 数组（词表 49k 项）折叠成摘要，不整体物化。

## 构建与测试

需要 [MoonBit 工具链](https://www.moonbitlang.com/download/)（`moon` 0.1.20260819 或更新）。

```bash
moon check   --target native    # 双 target 静态检查
moon check   --target wasm-gc
moon test    --target native    # 单元 + 黄金向量 + 畸形输入
moon test    --target wasm-gc
moon build   --target native
moon build   --target wasm-gc
```

CLI（仅 native，建议加 `--release`；debug 构建慢约 20 倍）：

```bash
moon run src/cli --target native -- inspect path/to/model.gguf          # 文本报告
moon run src/cli --target native -- inspect path/to/model.gguf --json   # JSON 报告
moon run src/cli --target native -- dequant path/to/model.gguf tensor_embd.weight --limit 8
moon run src/cli --target native -- tokenize path/to/model.gguf "hello"
moon run src/cli --target native --release -- generate path/to/model.gguf "prompt" --max-tokens 64
moon run src/cli --target native --release -- chat path/to/model.gguf          # 交互式多轮
moon run src/cli --target native --release -- bench  path/to/model.gguf --tokens 128
moon run src/cli --target native --release -- logits path/to/model.gguf 504,3575,282 --top 5
moon run src/cli --target native --release -- profile path/to/model.gguf --iters 10
```

`generate` 支持 `--temperature` / `--top-k` / `--top-p` / `--seed` / `--raw`（跳过
chat 模板）/ `--dump-tokens`（输出 token id 而非文本，用于跨实现对拍）。

退出码：`0` 成功，`1` 文件不可读 / 不是 GGUF，`2` 用法错误。

## 浏览器 Demo

```bash
python tools/serve_web.py --model-dir /path/to/ggufs
# 打开 http://127.0.0.1:8000/ ，选一个 .gguf，按「生成」
```

`web/dist/` 是完全自包含的产物（一个 HTML + 一个 306 KB 的 JS）（当前工具链实测 655 KB / brotli 74.5 KB，见 benchmarks/RESULTS.md），无后端、无 CDN。
用文件选择框加载模型时页面不发起任何请求；用 URL 加载（`--model-dir` 提供）
相当于从本地服务器读一个静态文件。推理过程本身零网络请求，见
[docs/browser.md](docs/browser.md)。

## 工具

```bash
python tools/gen_forward_tests.py   # 重新生成前向测试夹具
python tools/gen_matvec_tests.py    # 重新生成 matvec 夹具
python tools/check_models.py <model.gguf> ...   # 与 llama.cpp 的 gguf 读出器对拍
python tools/crosscheck_llama.py <model.gguf> --mode argmax   # 逐位置 argmax 对拍
python tools/crosscheck_llama.py <model.gguf> --mode greedy   # 自由生成对比
```

GGUF / tensor 两个包的夹具由已发布的 `soehi/gguf` 模块自带，不在本仓库生成。

`check_models.py` 需要 `pip install gguf numpy`；`crosscheck_llama.py` 需要先在
loopback 上起一个 `llama-server`（见 [docs/crosscheck.md](docs/crosscheck.md)）。
模型文件可从 HuggingFace 镜像获取（如 `bartowski/SmolLM2-135M-Instruct-GGUF`
的 `Q8_0` 与 `Q4_K_M`）。

> 注意：`bartowski` 的 `Q4_K_M` 是**混精**（272 个张量中 166 个是 `q5_0`），
> 不是纯 Q4_K，对拍时不要预期全部为 Q4_K。

## 许可证

[Apache-2.0](LICENSE)

## 参考

- [llama.cpp](https://github.com/ggml-org/llama.cpp) — GGUF 格式与 ggml 反量化算法的权威定义
- [PLAN.md](PLAN.md) — 完整技术方案与阶段规划
- `soehi/gguf` 模块（注册表）——GGUF 格式图、位布局与实现踩坑笔记随包发布，
  见其模块内 `docs/gguf-notes.md`（随 `soehi/gguf` 发布）
- [docs/crosscheck.md](docs/crosscheck.md) — 与 llama.cpp 的逐位置对拍方法与数据
- [docs/performance.md](docs/performance.md) — 性能实测、瓶颈分析与已否决的优化路径
- [docs/browser.md](docs/browser.md) — 浏览器目标选择依据、实测数据与零网络验证
- [docs/memory.md](docs/memory.md) — 部署体积与内存实测的成因分析：内存从 663 MB 降到 189 MB
  （steady state 156 MB，同模型下低于 llama-server 的 169 MB）。**当前数字以
  [benchmarks/RESULTS.md](benchmarks/RESULTS.md) 为准**
- [benchmarks/](benchmarks/) — **固定配置下任何人可复现**的端侧推理包络基准：
  工具链版本、模型 SHA-256、构建参数与机器声明都写死在
  [CONFIG.md](benchmarks/CONFIG.md)；一条 `python benchmarks/run.py --model <path>`
  产出体积、冷启动、吞吐与峰值内存，CI 对体积设门禁

# MoonLM

纯 MoonBit 编写的**端侧本地 LLM 推理引擎 + 强类型 Agent 运行时**。
零 API 调用、零数据外传，同一份代码编译到 **native 边缘设备** 与 **浏览器 (Wasm-GC)** 两个后端。

## 当前进度

**M0 — 地基：GGUF 解析与量化格式** ✅ **完成**

| 交付物 | 状态 |
|---|---|
| `src/gguf/`：header / metadata KV（12 种类型 + 嵌套数组）/ 张量目录 / 对齐 | ✅ |
| `src/tensor/`：F32 / F16 / Q4_0 / Q8_0 / Q4_K / Q6_K 反量化 | ✅ |
| `src/cli/`：`moonlm inspect <model.gguf>`（native，另支持 `--json`、`dequant`） | ✅ |
| 双 target（native + wasm-gc）`check` / `test` / `build` 全绿 | ✅ |

**验收结果**

- 64 个单元 / 黄金 / 畸形输入测试在 native 与 wasm-gc 上全部通过。
- 6 种类型反量化与 llama.cpp 参考实现的黄金向量误差 ≤ 1e-6。
- 真实模型对拍（SmolLM2-135M-Instruct，Q8_0 与 Q4_K_M 各一份）与 llama.cpp 的
  `gguf` 读出器一致：header、全部 37 个 metadata 键、272 个张量
  （名称 / 类型 / 维度 / 元素数 / offset / 字节数），以及 F32 / Q8_0 / Q4_K / Q6_K
  的**解码数值**。
- 畸形输入（截断、坏 magic、未知类型、计数溢出、对齐错误、超过 4 维、张量越界、
  九层嵌套数组）全部返回带偏移量的错误，无 panic、无越界。

**M1 — 内核：Tokenizer + Transformer 前向 + 采样** ✅ **完成**

| 交付物 | 状态 |
|---|---|
| `src/tokenizer/`：byte-level BPE（encode / decode / 特殊 token / 字节映射） | ✅ |
| `src/model/`：RMSNorm / RoPE / GQA 注意力 / SwiGLU / KV cache / 完整前向 | ✅ |
| `src/sampler/`：greedy / temperature / top-k / top-p | ✅ |
| `src/engine/`：`Engine` trait + `PureEngine`（prefill + decode 流式生成） | ✅ |
| `src/cli/`：`generate` / `chat` / `bench` / `logits` / `profile` | ✅ |

**验收结果**

- 103 个测试在 native 与 wasm-gc 上全部通过，零警告。
- 分词与 HuggingFace 参考完全一致（49k 词表往返 + 31 条中/英/日/韩/俄/阿样本）。
- **与 llama.cpp 逐位置对拍：288 个位置上 280 个 argmax 一致 = 97.22%**
  （验收线 95%）。全部 8 处分歧都落在参考实现自身「近似平局」的位置
  （top-2 logprob 差距仅 0.002–0.17 nat），即浮点漂移而非结构错误。
  方法与完整数据见 [docs/crosscheck.md](docs/crosscheck.md)。
- 真实模型可生成连贯文本；单线程 decode 14.4–14.7 tok/s、prefill 15.0 tok/s
  （验收线 15 tok/s，属压线达标）。
- 性能与瓶颈分析见 [docs/performance.md](docs/performance.md)：内核为纯标量、
  无 SIMD，比 llama.cpp 单线程（57.2 tok/s）慢约 4 倍。

后续阶段（浏览器 Demo、Agent 运行时）见 [PLAN.md](PLAN.md)。

## 设计约束

- `gguf/`、`tensor/` 为**纯 MoonBit**：无 FFI、无第三方依赖，同时通过 `native` 与 `wasm-gc`。
  CLI 的文件读取是唯一例外，用 `extern "C"` + native stub，并单独按 target 隔离。
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

## 工具

```bash
python tools/gen_fixtures.py     # 重新生成测试夹具（合成 GGUF + 黄金向量 + 畸形输入）
python tools/check_models.py <model.gguf> ...   # 与 llama.cpp 的 gguf 读出器对拍
python tools/crosscheck_llama.py <model.gguf> --mode argmax   # 逐位置 argmax 对拍
python tools/crosscheck_llama.py <model.gguf> --mode greedy   # 自由生成对比
```

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
- [docs/gguf-notes.md](docs/gguf-notes.md) — GGUF 格式图、位布局与实现踩坑笔记
- [docs/crosscheck.md](docs/crosscheck.md) — 与 llama.cpp 的逐位置对拍方法与数据
- [docs/performance.md](docs/performance.md) — 性能实测、瓶颈分析与已否决的优化路径

# MoonLM — 端侧/边缘 AI 推理与 Agent 运行时

> 用 MoonBit 编写的全本地 LLM 推理引擎 + 强类型 Agent 运行时。
> 零 API 调用、零数据外传、一次编译同时跑在 **浏览器 (Wasm-GC)** 和 **native 边缘设备** 上。

- 状态：M0 完成，M1 待开始
- 许可证计划：Apache-2.0
- 建议仓库名：`moonlm`（Moon + LLM）
- 前置说明：`moonsh` 为已废弃项目，本项目从零开始，不继承其代码。

---

## 1. 一句话定位

**"浏览器里就能跑的本地小模型 + 类型安全的 Agent 框架"** ——
MoonBit 编译到 Wasm-GC 后体积小、启动快、无 GC 暂停抖动，天然适合把推理整个塞进浏览器标签页或边缘设备的沙箱里；再用 MoonBit 的强类型 trait 系统约束 Agent 的工具调用，让"本地智能应用"既有隐私保障，又有工程可靠性。

## 2. 生态调研结论（2026-10 核实）

| 调研项 | 结论 | 对本项目的意义 |
|---|---|---|
| mooncakes.io（约 2.7 万包） | **无任何本地推理运行时**。AI 相关仅 `mizchi/llm`（云端 LLM API 客户端）与 `xiguaAp6y3/moon_outlines`（约束解码，编译 JSON-Schema 到 token mask） | 空白属实。且 `moon_outlines` 与本项目互补：它管"生成什么格式"，我们管"在哪里生成" |
| GitHub `moonbit + llama` | 0 个仓库 | 无现成 GGUF/llama.cpp 绑定，需自建 |
| `eanzhao-os/pi-moonbit` | 存在（MoonBit，8 stars） | 差异化点：它聚焦 Agent 工具链/云端对接，本项目聚焦**本地推理内核**，形成互补而非竞争 |
| ~~ds4.mbt~~ | **未能核实**（GitHub 搜索无此项目） | 规划不依赖它；若后续找到可作参考，找不到不影响方案 |

> 申报书口径：本项目定位为"移植项目/参考开源设计、代码原创"（对标 llama.cpp 的格式与算法、`.wasm` 生态的 wllama/transformers.js 的架构理念，全部 MoonBit 代码从零编写）。

## 3. 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层 (两套前端)                      │
│   moonlm CLI (native)                moonlm Web (wasm-gc)   │
│   交互式聊天 / 文档问答 / inspect   │   浏览器聊天 Demo + Agent │
├─────────────────────────────────────────────────────────────┤
│                     Agent 运行时 (纯 MoonBit)                │
│  AgentLoop(思考→调用→观察→循环) · Tool trait · JSON-Schema   │
│  参数校验 · 会话记忆(transcript + BM25 检索) · 内置本地工具   │
├─────────────────────────────────────────────────────────────┤
│                      引擎抽象层 (Engine trait)                │
│  ┌───────────────────────────┐  ┌─────────────────────────┐ │
│  │ PureEngine (纯 MoonBit)   │  │ LlamaCppEngine (可选,    │ │
│  │ GGUF解析+Tokenizer+      │  │ 仅 native, extern "C"   │ │
│  │ Transformer前向+采样      │  │ FFI 对接 llama.cpp C API)│ │
│  └───────────────────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  后端:  wasm-gc (浏览器)   |   native (Linux/macOS/Windows)  │
└─────────────────────────────────────────────────────────────┘
```

**双引擎是核心架构决策**：PureEngine 保证浏览器/沙箱环境"零依赖全自包含"（Wasm 无法链接 C 库，这是硬约束）；LlamaCppEngine 作为 native 下的可选加速路径，复用 llama.cpp 成熟的算子覆盖全部模型架构。两者实现同一个 `Engine` trait，上层 Agent 代码完全无感。

## 4. 关键技术决策（ADR 摘要）

| # | 决策 | 理由 |
|---|---|---|
| ADR-1 | **模型格式只支持 GGUF** | 事实标准，单文件自包含（权重+词表+元数据），llama.cpp 生态全部现成量化模型可用 |
| ADR-2 | **首批目标模型：SmolLM2-135M/360M、Qwen2.5-0.5B-Instruct** | 135M Q4 量化后约 90–100MB，可在浏览器可接受时间内加载；0.5B 作为 native 目标。浏览器 Demo 用 135M，native 用 360M/0.5B |
| ADR-3 | **Tokenizer 先做 byte-level BPE**（SmolLM2/Qwen 用此类词表），SentencePiece 二期再做 | BPE 无需预编译 proto 文件，纯 MoonBit 实现复杂度低一个量级；目标模型的词表直接存在 GGUF 元数据里 |
| ADR-4 | **量化支持顺序：F32/F16 → Q8_0 → Q4_0 → Q4_K/Q6_K** | 先做格式简单、易对拍的块量化，K-quant 位操作复杂，用 llama.cpp 做黄金对照 |
| ADR-5 | **Agent 工具调用用 trait + JSON-Schema 静态校验**，不做 eval/动态字符串分发 | 展示 MoonBit 类型系统优势：工具签名即类型，非法参数在编译期/校验期被拒绝；后期可选接入 `moon_outlines` 做约束解码，让模型"只能"生成合法调用 |
| ADR-6 | **采样实现 greedy / temperature / top-k / top-p**，repetition-penalty 二期 | 覆盖演示与评测所需，避免一开始摊大饼 |
| ADR-7 | **性能策略：基准先行**。每阶段都有 tokens/s 基准，优化手段按优先级：数据布局/减少分配 → wasm SIMD128（若 MoonBit 后端支持则启用）→ 循环展开 → native FFI 兜底 | 推理是性能敏感领域，没有基准就没有可信的"性能优势"叙事 |

**性能目标（诚实预估，以实测为准）**：

| 目标 | 指标 |
|---|---|
| native PureEngine + SmolLM2-135M Q8_0 | ≥ 15 tok/s（单线程） |
| wasm-gc PureEngine + SmolLM2-135M Q4_0 | ≥ 3 tok/s（可交互的底线） |
| native LlamaCppEngine（对照上限） | 与 llama.cpp 官方一致量级 |
| 浏览器首屏 | ≤ 150MB 模型加载 < 15s（含分块读取） |

## 5. 仓库结构（规划）

```
moonlm/
├── moon.mod
├── PLAN.md                  # 本文档
├── src/
│   ├── gguf/                # GGUF 二进制解析：header/metadata KV/tensor 目录/对齐
│   ├── tensor/              # 缓冲区、反量化（Q8_0/Q4_0/Q4_K/Q6_K）、matmul/attention 算子
│   ├── tokenizer/           # byte-level BPE：词表加载、编码、解码、special tokens
│   ├── model/               # Transformer 前向：RMSNorm、RoPE、GQA、KV cache（按架构注册）
│   ├── sampler/             # greedy / temperature / top-k / top-p
│   ├── engine/              # Engine trait + PureEngine；native 下 LlamaCppEngine(FFI)
│   ├── agent/               # AgentLoop、Tool trait、JSON-Schema 校验、会话与记忆
│   ├── tools/               # 内置工具：read_file/write_file/list_dir/grep_text/calc（沙箱路径白名单）
│   ├── cli/                 # moonlm 命令入口：chat / ask / inspect / bench / agent
│   └── web/                 # wasm-gc 浏览器 Demo（聊天 + Agent 可视化）
├── examples/                # 最小示例：加载模型→生成→工具调用
├── benchmarks/              # 基准脚本与结果表
└── docs/                    # 架构说明、GGUF 格式笔记、性能调优记录
```

## 6. 阶段规划（M0–M5）

> 每阶段给出：目标 / 任务 / 验收标准（DoD）。各阶段产出均可独立演示，工期可按比赛节奏压缩或裁剪；**最小可参赛组合 = M0–M3**，M4 为可选增强，M5 为提交打磨。

---

### M0 — 地基：GGUF 解析与量化格式

**目标**：把"读模型"这件事做扎实。这是全项目最可测、风险最低的起点。

> **状态：已完成。** 实现见 `src/gguf/`、`src/tensor/`、`src/cli/`；
> 格式与踩坑记录见 `docs/gguf-notes.md`；对拍脚本见 `tools/check_models.py`。
> 交付物：`inspect` 子命令另支持 `--json`（便于与 `gguf_dump` 逐字段对比）与
> `dequant`（导出单张量解码值，用于真实模型数值对拍）。

**任务**
1. 建仓库脚手架（moon.mod、CI、目录结构、Apache-2.0）
2. `gguf/`：magic/version 校验、metadata KV 全类型解析（u8…f64、string、array、nested）、tensor 目录（名称/维度/类型/偏移）、对齐与 padding 处理
3. `tensor/`：F32/F16 解码；Q8_0、Q4_0 块反量化；随后补 Q4_K、Q6_K
4. CLI 子命令 `moonlm inspect <model.gguf>`：打印架构、层数、词表大小、张量清单与体积分布

**验收标准（DoD）**
- [x] 对 SmolLM2-135M 的 Q8_0 与 Q4_K_M 两个 GGUF 文件，`inspect` 输出与 `llama.cpp` 的 `gguf_dump` 元数据一致
- [x] 各量化格式的反量化输出与 llama.cpp 参考实现的黄金测试向量逐块一致（误差 ≤ 1e-6）
- [x] 单元测试覆盖畸形输入（截断文件、错误 magic、未知 KV 类型）——报错而非崩溃
- [x] CI 通过（native + wasm-gc 双后端编译）

**补充说明（与原始规划的差异）**

- Q4_K_M 用的是 bartowski 的混精文件：272 个张量中 166 个是 `q5_0`（M0 不解码）。
  CLI 会显式列出无法反量化的张量，不静默略过。目录字段仍全部对拍一致。
- 除目录对拍外，额外做了 **F32/Q8_0/Q4_K/Q6_K 解码数值**的真实模型对拍，与
  llama.cpp 的 Python `gguf` 读出器逐元素一致（相对误差 ≤ 1e-6）。

---

### M1 — 内核：Tokenizer + Transformer 前向 + 采样

**目标**：native 后端用纯 MoonBit 跑通端到端文本生成。这是技术风险最集中的阶段，优先攻坚。

**任务**
1. `tokenizer/`：从 GGUF 元数据加载词表与 merges，实现 byte-level BPE（预分词切分、优先级合并、special token 处理）
2. `model/`：SmolLM2/Llama/Qwen2 架构前向——RMSNorm、RoPE、GQA 注意力、SwiGLU、KV cache（增量解码）
3. `tensor/`：量化权重矩阵乘（dequant-on-the-fly）、向量化内积、（视后端能力）SIMD
4. `sampler/`：greedy / temperature / top-k / top-p
5. `engine/`：定义 `Engine` trait（load / generate 流式 / encode / decode），PureEngine 挂接

**验收标准（DoD）**
- [ ] tokenizer 往返测试：对 1 万条中英文样本，encode→decode 恒等还原率 100%
- [ ] 与 llama.cpp 对拍：同一 prompt、greedy 解码，前 64 个 token 一致率 ≥ 95%（浮点顺序差异导致的尾部漂移可接受）
- [ ] native 后端 SmolLM2-135M Q8_0 达到 ≥ 15 tok/s，并产出 `benchmarks/` 基线表
- [ ] `moonlm chat --model ... --engine pure` 可交互聊天，输出连贯中文/英文

---

### M2 — 浏览器：wasm-gc 移植与 Web Demo

**目标**：做出最能打动评委的演示——**纯浏览器里跑本地模型，无任何服务器参与推理**。

**任务**
1. PureEngine 适配 wasm-gc：内存预算控制（分块读取模型文件、及时释放解析中间结构）
2. 浏览器 Demo 页面：文件拖拽/内置模型选择、流式输出、tok/s 实时显示、本地运行标识（断网演示）
3. 性能调优：分配热点分析、数据布局优化、SIMD 评估（验证 MoonBit wasm 后端能力后决定是否启用）
4. （可选）Service Worker 缓存模型文件，二次加载秒开

**验收标准（DoD）**
- [ ] Chrome 加载 SmolLM2-135M Q4_0（约 90–100MB）后可流式对话，≥ 3 tok/s
- [ ] 断网状态下完整演示（录屏存档），证明"零数据外传"
- [ ] wasm 与 native 生成结果对拍：greedy 前 32 token 一致率 ≥ 95%
- [ ] 页面首屏与加载体验有明确指标（加载时间、内存峰值）

---

### M3 — Agent 运行时：类型安全的工具调用

**目标**：从"能生成"升级为"能干活"，并展示 MoonBit 强类型在 Agent 安全性上的差异化价值。

**任务**
1. `agent/`：`Tool` trait（name / description / 参数 Schema / `invoke(args) -> Result`）；AgentLoop（系统提示 → 模型生成 → 解析工具调用 → **Schema 校验** → 执行 → 结果回填 → 循环，上限步数与中止条件）
2. 工具调用解析：模型输出的 JSON 严格校验（必填/类型/枚举/路径白名单），非法调用被拒绝并作为错误观察回传给模型重试
3. `tools/` 内置本地工具：`list_dir`、`read_file`、`write_file`、`grep_text`（复用自研正则思路）、`calc`；所有文件工具限定工作区沙箱内
4. 会话管理：transcript 持久化（本地 JSON）；BM25 关键词检索作为轻量"记忆"，文档问答场景不依赖 embedding 模型
5. CLI `moonlm agent --task "..."` 与 Web Demo 的 Agent 执行可视化（调用链逐步展示）

**验收标准（DoD）**
- [ ] 端到端演示：`moonlm agent --task "阅读 docs/ 下所有 .md，总结出 3 个要点"`——自主完成列目录→读文件→检索→总结
- [ ] 所有工具调用 100% 经过 Schema 校验；注入非法参数的对抗测试全部被拒绝
- [ ] 沙箱逃逸测试：`read_file("/etc/passwd")`、`../../` 路径穿越等用例全部被拦截
- [ ] 同一 AgentLoop 在 CLI（native）与浏览器（wasm-gc）上行为一致

---

### M4 — 加速路径：llama.cpp FFI 双引擎（可选增强）

**目标**：证明架构抽象的价值——上层代码不变，换引擎即换性能档位。

**任务**
1. native FFI 绑定 llama.cpp 核心 C API（模型加载 / 上下文 / decode / 采样器）
2. `LlamaCppEngine` 实现 `Engine` trait；`--engine llama` / `--engine pure` 一键切换
3. 双引擎基准对比报告（tokens/s、内存、支持模型矩阵），写入 `benchmarks/`

**验收标准（DoD）**
- [ ] 同一 Agent/聊天代码在两个引擎下均可运行，仅切换一个参数
- [ ] 基准报告含 ≥ 3 个模型 × 2 引擎的数据表
- [ ] FFI 层内存边界清晰（谁分配谁释放），无泄漏（长会话回归测试）

---

### M5 — 提交打磨

**任务**
1. CI 完善（双后端构建 + 测试 + 基准 smoke）、README（双语）、架构图与调优笔记
2. 演示素材：3 分钟录屏（浏览器断网聊天 → Agent 文档问答 → 基准对比）
3. 对齐申报书口径：参考项目清单（llama.cpp、wllama、transformers.js、SmolLM2、pi-moonbit、moon_outlines）、原创性声明、许可证

**验收标准（DoD）**
- [ ] 新克隆仓库 → `moon build && moon test` 一次通过
- [ ] 演示脚本可由他人照着复现
- [ ] 申报书更新为本项目内容

## 7. 风险登记册

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| 纯 MoonBit matmul 性能不达标 | 中 | 高 | 目标锁定 ≤0.5B 小模型；量化降低带宽；SIMD/布局优化；M4 native FFI 兜底；诚实公布基准数据 |
| wasm-gc 内存不足以加载大模型 | 中 | 中 | 浏览器档位只承诺 ≤135M 量化模型；分块流式加载；文档明确内存预算 |
| K-quant（Q4_K 等）位运算实现出错 | 中 | 中 | 黄金测试向量对拍；先 Q8_0/Q4_0 保证主线可跑，K-quant 并行攻坚 |
| tokenizer 细节不一致导致输出劣化 | 中 | 中 | 往返恒等测试 + 与 llama.cpp token 序列对拍 |
| 工期超支 | 高 | 中 | 阶段化裁剪：M4 整体可弃；浏览器 Demo 若吃力则退化为 native CLI 演示 + 截图 |
| 评委质疑"为什么要用 MoonBit 而不是直接用 llama.cpp" | — | — | 答辩口径：①Wasm-GC 目标 llama.cpp 需带完整 C 运行时，MoonBit 产物更小、启动更快；②纯类型安全的上层 Agent 框架是 llama.cpp 生态缺位；③MoonBit 版 GGUF/Agent 库可直接被 mooncakes 生态复用 |

## 8. 与比赛评审的对应

| 评审关注点 | 本项目回答 |
|---|---|
| 语言特性利用 | Wasm-GC 跨平台单二进制分发；`extern "C"` FFI；trait + 代数数据类型建模 Engine/Tool；错误处理用 `Result` 贯穿解析栈 |
| 生态贡献 | mooncakes 首个本地推理 + Agent 框架；`gguf/`、`tensor/`、`tokenizer/` 均为可独立复用的包 |
| 演示冲击力 | 断网浏览器跑模型 + Agent 自主完成文档问答，一眼看懂"零 API、零外传" |
| 完成度信号 | 双后端 CI、对拍测试、基准数据表、可复现演示脚本 |

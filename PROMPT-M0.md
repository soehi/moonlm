# 任务：实现 MoonLM M0 阶段 — GGUF 解析 + 量化格式 + `inspect` CLI + 项目脚手架

> 使用方法：在新会话中把本文件全部内容作为提示词发给 AI（或自己照做）。
> 本提示词自包含，不依赖任何会话历史。

## 背景（动手前先读）

- 本地仓库：`D:\Code\息壤杯\moonbit\moonlm`（GitHub: `soehi/moonlm`，分支 `main`，公开仓库，远程 origin 已配置好）
- 完整规划：`PLAN.md`，重点读第 6 节 M0 与第 4 节技术决策（ADR）。
- 项目一句话：**纯 MoonBit 的本地 LLM 推理引擎 + 强类型 Agent 运行时**，双后端（native + wasm-gc）。M0 是第一块地基：把"读模型"做扎实。
- 环境：Windows + Git Bash。先检查 `moon version`，未安装则用 MoonBit 官方脚本安装。

## 硬性约束

1. `src/gguf/`、`src/tensor/` 为**纯 MoonBit**，禁止 FFI、禁止第三方包（moonbitlang 官方包除外）。
2. 这两个包必须同时通过 native 与 wasm-gc 两个 target 的 `moon check` / `moon test` / `moon build`。CLI 只要求 native 可运行。
3. 所有整数按**小端**解析。文件偏移、长度等 uint64 一律用 `Int64`/`UInt64`，禁止用 32 位 `Int` 承接后溢出。
4. **容错优先**：任何畸形输入（坏 magic、截断、未知类型、长度越界）必须返回携带上下文（出错偏移量）的错误值，绝不 panic、绝不下标越界崩溃。
5. 只做**反量化**不做量化；只**读** GGUF 不写；不做 tokenizer（那是 M1）。

## 技术规格

### GGUF v2/v3 布局（全部小端）

- Header：magic(4B `"GGUF"`) + version(u32) + tensor_count(u64) + metadata_kv_count(u64)。
  接受 version 2 与 3；version 1（u32 计数，已废弃）直接拒绝并报错。
- Metadata KV：key(gguf_string) + value_type(u32) + value。
- gguf_string：u64 字节长度 + UTF-8 字节。
- value_type 枚举：`0=u8, 1=i8, 2=u16, 3=i16, 4=u32, 5=i32, 6=f32, 7=bool(1字节), 8=string, 9=array, 10=u64, 11=i64, 12=f64`。
- array：元素 value_type(u32) + count(u64) + count 个元素（**数组可嵌套**）。
- Tensor Info（共 tensor_count 个）：name(gguf_string) + n_dims(u32) + dims(u64×n_dims) + ggml_type(u32) + offset(u64，相对数据段起点)。
- 对齐：metadata 的 `general.alignment`（u32，缺省 32）。数据段起点 = tensor info 结束位置向上取整到 alignment；张量数据地址 = data_start + offset，张量之间按 alignment 填充。
- 张量字节数 = 元素总数 × bytes_per_block ÷ block_size。

### ggml 类型 → 块规格（M0 必须支持）

| id | 类型  | 块字节数 | 每块元素数 |
|----|-------|---------|-----------|
| 0  | F32   | 4   | 1   |
| 1  | F16   | 2   | 1   |
| 2  | Q4_0  | 18  | 32  |
| 8  | Q8_0  | 34  | 32  |
| 12 | Q4_K  | 144 | 256 |
| 14 | Q6_K  | 210 | 256 |

- F16 = IEEE 754 半精度 → f32。
- Q8_0：fp16 缩放 d + 32×int8，value = d × q。
- Q4_0：fp16 缩放 d + 16 字节半字节包（低半字节=元素 i，高半字节=元素 i+16），value = d × (nibble − 8)。
- Q4_K / Q6_K：256 元素超块、多子块位打包。**以 llama.cpp 仓库 `ggml/src/ggml-quants.c` 的 `dequantize_row_q4_K` / `dequantize_row_q6_K` 为唯一权威**——先读 C 代码再写 MoonBit，禁止凭记忆臆造位布局。
- 其余 ggml 类型（Q4_1/Q5_x/Q2_K/BF16 等）：按 `ggml.h` 的 GGML_TYPE 枚举表补全**名称**，正常出现在张量目录里；反量化不支持时明确报 "unsupported type"，不许瞎猜。

### MoonBit 实现要点

- 游标式解析：`struct ByteCursor { buf: Bytes, pos: Int64 }`，所有 `read_*` 先检查剩余长度。
- 大数组（如 `tokenizer.ggml.tokens` 有 49,152 项）不能全部物化成字符串列表——`inspect` 只输出摘要（元素类型、count、前 N 项）。KV 值设计上要支持"摘要消费"。
- UTF-8 解码用 moonbitlang/core 现有 API（先查 mooncakes.io 文档确认函数名，不要臆造）；解码失败保留原始 Bytes 并标注。
- 错误处理贯穿用 `Result`，风格对齐官方 core。

## 交付物

1. **脚手架**：`moon.mod`（模块名 `soehi/moonlm`）、`LICENSE`（Apache-2.0）、`.gitignore`（忽略 `_build/`）、`README.md`（一句话定位 + 当前进度）、`.github/workflows/ci.yml`（ubuntu：装 moonbit 工具链 → `moon check` → `moon test` 双 target → `moon build` 双 target）。
2. **src/gguf/**：header / KV（12 种类型 + 嵌套数组）/ 张量目录解析。公开 API 形如 `GgufFile::parse(buf) -> Result[GgufFile, ParseError]`；提供 metadata 查询、张量目录遍历、alignment、数据段起始偏移。
3. **src/tensor/**：F16/F32/Q8_0/Q4_0/Q4_K/Q6_K 反量化。API 形如 `dequant(buf, offset, ty, n_elems) -> Result[...]`（或写入调用方缓冲区避免分配——二选一，注释说明理由）。
4. **src/cli/**：`moonlm inspect <model.gguf>`，输出：version、`general.architecture`、关键超参（层数/头数/词表大小）、metadata 摘要（长数组折叠）、张量表（名称/维度/类型/字节数）、总大小。native 文件读取用 `extern "C"`（fopen/fread）或 moonbitlang/async，二选一并说明理由。
5. **tools/gen_fixtures.py**：生成测试夹具
   - 合成 GGUF：覆盖全部 12 种 KV 类型、嵌套数组、对齐 padding、多张量；
   - 量化黄金向量：手工构造块字节 + numpy 按规格计算期望 float（Q4_K/Q6_K 参照 ggml-quants.c 移植），输出成**可直接嵌入 MoonBit 测试的 .mbt 数据文件**——保证 `moon test` 在双 target 上无文件 I/O 也能跑。
6. **测试**：
   - 单元：手写字节序列测 header / 每种 KV 类型 / 越界 / 坏 magic；
   - 黄金：反量化逐元素对拍（相对误差 ≤ 1e-6）；
   - 集成（native，模型文件缺失时 skip）：真实 SmolLM2-135M GGUF（Q8_0 与 Q4_K_M 各一）的 inspect 关键字段与 llama.cpp `python -m gguf.scripts.gguf_dump` 的 JSON 一致；
   - 畸形输入：截断 / 坏 magic / 未知 KV 类型 / 未知张量类型 → 返回错误。
7. **docs/gguf-notes.md**：格式图与实现踩坑笔记。

## 验收标准（DoD，逐条自查后写进提交说明）

- [ ] `moon check` / `moon test` / `moon build --target native` / `moon build --target wasm-gc` 全绿
- [ ] 6 种类型反量化黄金向量 ≤ 1e-6
- [ ] 畸形输入全部报错不崩
- [ ] 真实模型 inspect 与 gguf_dump 一致（metadata 关键字段 + 张量数量/类型/尺寸）
- [ ] GitHub Actions CI 绿（含 wasm-gc）
- [ ] `PLAN.md` M0 清单打勾

## 建议工作顺序（小步提交，conventional commits，随时 push origin main）

1. 脚手架 + 双 target hello-world 构建通过（先验证工具链与 CI）
2. ByteCursor + 基础类型读取 + 单元测试
3. Header + KV（12 类型 + 嵌套数组）+ 单元测试
4. 张量目录 + 对齐 + `inspect`（先吃合成文件）
5. `gen_fixtures.py` + 文件级黄金对拍
6. F16/Q8_0/Q4_0 反量化 + 黄金向量
7. Q4_K/Q6_K（先读 ggml-quants.c）+ 黄金向量
8. 真实模型集成对拍（需下载约 100MB 模型，可手动：`huggingface-cli download HuggingFaceTB/SmolLM2-135M-Instruct-GGUF`，选 q8_0 与 q4_k_m 两个文件）
9. 收尾：README、notes、CI 修绿、PLAN.md 打勾、输出 M0 完成报告（做了什么、对拍结果、遗留问题）

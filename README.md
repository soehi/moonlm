# MoonLM

纯 MoonBit 编写的**端侧本地 LLM 推理引擎 + 强类型 Agent 运行时**。
零 API 调用、零数据外传，同一份代码编译到 **native 边缘设备** 与 **浏览器 (Wasm-GC)** 两个后端。

## 当前进度

**M0 — 地基：GGUF 解析与量化格式**（进行中）

- [x] 仓库脚手架：Apache-2.0、双 target CI
- [ ] `gguf/`：header / metadata KV（12 种类型 + 嵌套数组）/ 张量目录 / 对齐
- [ ] `tensor/`：F32 / F16 / Q8_0 / Q4_0 / Q4_K / Q6_K 反量化
- [ ] `cli/`：`moonlm inspect <model.gguf>`

后续阶段（Tokenizer、Transformer 前向、浏览器 Demo、Agent 运行时）见 [PLAN.md](PLAN.md)。

## 设计约束

- `gguf/`、`tensor/` 为**纯 MoonBit**：无 FFI、无第三方依赖，同时通过 `native` 与 `wasm-gc` 编译。
- 只做**反量化**（量化交给 llama.cpp 现成模型），只**读** GGUF，不写。
- 容错优先：任何畸形输入返回带出错偏移的错误值，不 panic、不下标越界。
- 所有整数按小端解析；偏移与长度用 `Int64`/`UInt64`，不用 32 位 `Int` 承接。

## 构建与测试

需要 [MoonBit 工具链](https://www.moonbitlang.com/download/)（`moon` 0.1.20260819 或更新）。

```bash
moon check   --target native    # 双 target 静态检查
moon check   --target wasm-gc
moon test    --target native    # 单元 + 黄金向量测试
moon test    --target wasm-gc
moon build   --target native
moon build   --target wasm-gc
```

CLI（仅 native）：

```bash
moon run src/cli --target native -- inspect path/to/model.gguf
```

## 许可证

[Apache-2.0](LICENSE)

## 参考

- [llama.cpp](https://github.com/ggml-org/llama.cpp) — GGUF 格式与 ggml 反量化算法的权威定义
- [PLAN.md](PLAN.md) — 完整技术方案与阶段规划
- [docs/gguf-notes.md](docs/gguf-notes.md) — GGUF 格式图与实现笔记

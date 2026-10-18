# Agent 运行时：实测结果与能力边界

> 本文记录 **Qwen2.5-0.5B-Instruct（Q4_K_M）** 在 MoonLM 自研 Agent 循环上的
> 真实表现。所有数字来自本机实跑（`temperature 0`、`seed 42`），没有挑选
> 成功样例；失败模式一并列出。
>
> 环境：Windows 11，MoonBit `0.1.20260819`，native release 构建。
> 工具调用格式以 llama.cpp 的 `--jinja` 服务端行为为参照确认。

## 1. 架构

```
task ──► 系统提示（Qwen2 chat template + <tools> 签名）
          │
          ▼
    ┌─ 生成 ─► 解析（ToolCallFormat）─► Schema 校验 ─► 执行 ─► 回填 ─┐
    └───────────────────────────────────────────────────────────────┘
          │ 无工具调用
          ▼
       最终答案
```

- **`Tool` trait**（`src/agent/tool.mbt`）：`name` / `description` /
  `parameters_schema` / `invoke`。循环只按名字查表，从不识别具体工具。
- **格式策略**（`src/agent/format.mbt`）：`ToolCallFormat::Qwen2Xml`。
  解析器是独立函数，循环里没有任何标签字面量；新增模型族 = 新增枚举值 +
  一个解析函数。
- **Schema 校验**（`src/agent/json_schema.mbt`）：自写子集校验器，覆盖
  `type` / `properties` / `required` / `enum` / `items` /
  `additionalProperties` / `minLength` / `minimum` / `integer`；不支持的写法
  报 schema 错误而不是静默放过。
- **错误分类**：`InvalidArguments` 终止该步（模型写错的调用重试也是确定性
  失败）；`SandboxDenied` / `IoFailure` 作为 observation 回传（环境信息，
  模型可以换个路径或工具）。
- **会话上下文**：滚动窗口按字符预算折叠历史（`fold_history`），保留最新的
  消息；单条 observation 按字符数截断（默认 4 KB，`truncate_observation`）。
  **未实现 BM25**：会话只有个位数消息，检索不会比"保留最近几条"更好，而它
  会引入分词依赖。这是按 PLAN.md 的默认决定。

## 2. 工具调用成功率（实测）

测试集：6 个任务，各跑 1 次，`max_steps` 3–6。"成功"指**任务目标达成**，
不是"产生过工具调用"。

| 任务 | 结果 | 说明 |
|---|---|---|
| 列出 docs 目录里的文件 | ✅ 成功 | `list_dir` → 正确列出 6 个文件 |
| 读取 docs/gguf-notes.md 的内容 | ✅ 成功 | `read_file` → 返回全文 |
| 在 docs 里搜索包含 RoPE 的文件 | ✅ 成功 | `grep_text` → 列出命中行（修复子目录 bug 后） |
| 在 docs 里搜索 rope（小写） | ⚠️ 工具正确、任务失败 | 字面量匹配区分大小写，无命中；模型直接答"没有" |
| 计算 (3+4)*2 | ❌ 未调用工具 | 直接心算答 14，绕过了 `calc` |
| 总结 docs/ 下的关键结论 | ⚠️ 部分完成 | 只列目录，把列表当总结，不读文件内容 |

**单步工具调用成功率：3/4 = 75%**（列目录、读文件、grep 成功；calc 被跳过）。
**多步任务完成率：0/2 = 0%**（"总结 docs"需要先列再读再汇总，模型停在第一步）。
把 `calc` 计入"该用但没用"的情形后，**工具使用正确率约 3/6 = 50%**。

## 3. 失败模式（按出现频率）

1. **跳过工具直接作答**（最常见）。"计算 (3+4)*2" 直接给结果；"总结 docs"
   直接复述目录列表。模型把工具当可选项，而不是获取信息的唯一途径。
2. **停在第一步**。多步任务里，模型拿到 `list_dir` 的结果后立刻总结，不再
   调用 `read_file`。给它显式步骤（"1) list_dir 2) read_file 3) 汇总"）时，
   它把这三行原样复述成答案。
3. **用错工具**。对目录调用 `read_file("docs/")`。现在该调用返回条目列表并
   注明"是目录不是文件"，任务可以继续，但模型仍不接着读文件。
4. **格式退化**。约 1/5 的生成丢掉 `<tool_call>` 标签，只输出裸 JSON。解析器
   有一个**严格**回退：整条输出恰好是一个含 `name` 的 JSON 对象时按调用
   处理；带任何前后文的 JSON 仍是文本。加这个回退前，这类输出会被当成
   "最终答案"直接结束运行。
5. **不做大小写/变体尝试**。grep 区分大小写（字面量匹配，刻意不引入正则），
   模型搜小写无果后不会改试 `RoPE`。

## 4. 模型能力边界

- **单步工具调用可用**：一个明确的"做什么"，模型大多能选中正确的工具和
  参数。这是 0.5B 的上限。
- **多步规划不可用**：需要"先看结果再决定下一步"的任务，模型倾向于一次
  答完，或者把计划当结果。
- **对工具描述不敏感**：把 `list_dir` 的描述改成"目录用它，不要用
  read_file"没有改变行为，说明 0.5B 不能稳定利用这类提示。
- **中英文失败模式相同**：都是"跳过工具"，不是语言理解问题。

## 5. 这对项目意味着什么

PLAN.md 把 M3 验收定在 0.5B 上。实测结论：**单步演示成立，多步
"列目录 → 读文件 → 总结"的自主闭环不成立**。要稳定演示，需要二选一：

1. 换更大模型（1.5B/3B 级通常能完成 2–3 步工具链）；
2. 把循环做成**显式状态机**，由代码规定"列目录后必须读文件"，而不是依赖
   模型规划。

本实现选择了可恢复性改进而非状态机：`read_file` 收到目录时返回条目列表并
注明类型，让一次错误调用仍能推进任务。observation 明确写着
`is a directory, not a file`，没有伪装成成功。

## 6. 安全边界（已测试）

- `../` 逃逸、绝对路径（POSIX `/` 与 Windows `C:\`）、symlink 指向工作区外：
  全部被 `Sandbox::resolve` 拒绝。测试见 `src/tools/sandbox_wbtest.mbt`。
- Schema：缺字段、类型错误、未知枚举、多余字段全部拒绝。测试见
  `src/agent/agent_test.mbt`。
- 文件工具只读；`src/tools/` 里没有写、删、改名的入口，也没有对应 stub。
- 浏览器端只注册 `calc` + 内存 demo 工具，**不注册文件工具**：页面没有同步
  文件系统，且没有可信的"工作区根"可供 realpath 前缀比对——那样的沙箱只是
  表演。demo 工具名带 `demo_` 前缀，避免与真实文件工具混淆。

## 7. 复现

```bash
moon build --target native --release
./_build/native/release/build/cli/cli.exe agent \
  --task "列出 docs 目录里的文件" --workspace . --verbose
```

默认模型路径见 `src/cli/agent_native.mbt` 的 `default_model_candidates`
（`D:/llmdata/qwen2.5-0.5b-instruct-q4_k_m.gguf` 优先），可用 `--model` 覆盖。

单次生成在 CPU 上约需 2–4 分钟（0.5B，`--max-tokens 384`）。

# GGUF 格式笔记与实现踩坑记录

> 面向 `src/gguf/` 与 `src/tensor/` 的实现文档。
> **权威性声明**：本文所有数字（类型 id、块字节数、位布局）均取自 llama.cpp：
> `ggml/include/ggml.h`（`GGML_TYPE_*` 枚举）、`ggml/src/ggml.c`（`type_traits[]`）、
> `ggml/src/ggml-common.h`（`block_*` 结构体与 `static_assert`）、
> `ggml/src/ggml-quants.c`（`dequantize_row_*`）。
> 与之冲突的第三方文档一律以 llama.cpp 源码为准，K-quant 的位布局尤其如此。

---

## 1. 文件布局

```
偏移            内容
──────────────────────────────────────────────────────────────
0               magic            u32   0x46554747（小端读作 "GGUF"）
4               version          u32   2 或 3（1 已废弃，直接拒绝）
8               tensor_count     u64
16              metadata_kv_count u64
24              ┌─ metadata KV ────────────────────────────────┐
                │ key           gguf_string（u64 长度 + UTF-8） │
                │ value_type    u32                             │
                │ value         依 value_type 而定              │
                └─ 共 metadata_kv_count 个 ─────────────────────┘
                ┌─ tensor info ────────────────────────────────┐
                │ name          gguf_string                     │
                │ n_dims        u32   （≤ GGML_MAX_DIMS = 4）   │
                │ dims          u64 × n_dims                    │
                │ ggml_type     u32                             │
                │ offset        u64   相对数据段起点             │
                └─ 共 tensor_count 个 ──────────────────────────┘
                padding          向上对齐到 general.alignment
data_start      ┌─ 张量数据 ───────────────────────────────────┐
                │ 张量 i 位于 data_start + offset[i]            │
                │ 各张量之间按 alignment 填充                    │
                └──────────────────────────────────────────────┘
```

关键点：

- **全部小端**。`magic` 按 u32 小端读入为 `0x46554747`；反过来渲染回字符时要注意
  字节序（见踩坑 6）。
- **`offset` 是相对数据段起点的**，不是绝对文件偏移。这一点最容易搞错，因为
  Python `gguf` 包暴露的是绝对偏移（见踩坑 5）。
- **`general.alignment` 是可选的 u32**，缺省 32。它出现在 metadata 里，因此必须
  解析完 metadata 才能算 `data_start`；解析顺序上有依赖。
- **无张量容器不对齐**：llama.cpp 只在 `n_tensors > 0` 时做 `GGML_PAD`。一个只有
  metadata 的合法文件，`data_start` 就是 metadata 的结束位置。
- 张量字节数 = 元素总数 ÷ block_size × type_size，与 `ggml_nbytes()` 对连续张量的
  算法一致。元素数不是块大小的整数倍会被**拒绝而非取整**——真实文件不会出现，
  静默截断只会让数据段长度算错。

## 2. metadata 值类型

| id | 类型 | 字节 | id | 类型 | 字节 |
|----|------|------|----|------|------|
| 0  | u8   | 1    | 7  | bool | 1（0/1） |
| 1  | i8   | 1    | 8  | string | u64 长度 + UTF-8 |
| 2  | u16  | 2    | 9  | array | 元素类型 u32 + count u64 + 元素 |
| 3  | i16  | 2    | 10 | u64  | 8 |
| 4  | u32  | 4    | 11 | i64  | 8 |
| 5  | i32  | 4    | 12 | f64  | 8 |
| 6  | f32  | 4    |    |      | |

- **数组可嵌套**：元素类型可以是 9（array）。实现里按 `nesting` 计深度并设上限，
  避免构造出来的文件让解析器无限递归。
- **大数组必须折叠**。`tokenizer.ggml.tokens` 有 49,152 项、`tokenizer.ggml.merges`
  有 48,900 项。全部物化成 `String` 会为一份清单付几十 MB 的代价，所以
  `MetaArray` 分两支：小数组 `Materialized`（全量保留），超过
  `array_materialize_limit`（1024）的 `Summarized`（保留元素类型、count 和
  前 8 项，其余字节直接跳过）。实测 138MB 的真实模型解析耗时 0.25s。
- **非 UTF-8 字符串不致命**。真实文件的 chat template 偶有非法 UTF-8；实现用
  `decode_lossy` 保留可读文本并同时保留原始 `Bytes`，而不是让整个解析失败。

## 3. ggml 类型表

M0 支持 6 种反量化类型：

| id | 类型 | 块字节 | 每块元素 | 说明 |
|----|------|--------|----------|------|
| 0  | F32  | 4   | 1   | 原始 IEEE 754 小端 |
| 1  | F16  | 2   | 1   | 半精度，需软件解码 |
| 2  | Q4_0 | 18  | 32  | f16 d + 16 字节半字节对 |
| 8  | Q8_0 | 34  | 32  | f16 d + 32×int8 |
| 12 | Q4_K | 144 | 256 | f16 d + f16 dmin + 12 字节 scale/min + 128 字节 4bit |
| 14 | Q6_K | 210 | 256 | 128 字节低 4bit + 64 字节高 2bit + 16×int8 scale + f16 d |

`src/tensor/types.mbt` 里的表覆盖了 `GGML_TYPE_*` 全 43 个 id 的**名称与块规格**
（含已移除的 q4_2/q4_3、repacked 变体），因此张量目录总能列出；但只有上表 6 种
`is_dequantizable()` 为真，其余在反量化时明确报 "unsupported type"，不猜布局。

## 4. 位布局

### Q4_0（`dequantize_row_q4_0`）

```
byte 0-1: d (f16)     byte j+2 (j=0..15): 低半字节 = 元素 j, 高半字节 = 元素 j+16
值 = d × (nibble − 8)      ← 以 8 为中心
```

### Q8_0（`dequantize_row_q8_0`）

```
byte 0-1: d (f16)     byte 2..33: 32 × int8
值 = d × q                  ← 无偏移，int8 带符号
```

### Q4_K（`dequantize_row_q4_K` + `get_scale_min_k4`）

```
d (f16) | dmin (f16) | scales[12] | qs[128]
                                        ↑ 8 个 32 元素子块，每子块占 32 字节
```

- **量化值不是中心化的**：`值 = d×sc×q − dmin×m`，其中 `q` 是无符号 0..15。
- 每个子块 32 字节承载 **64 个元素**：`qs[g*32+l]` 低半字节是元素 `g*64+l`，
  高半字节是元素 `g*64+32+l`。两个子块共用一段 32 字节（见踩坑 3）。
- `get_scale_min_k4(j, scales)`：`j<4` 时 scale 取 `scales[j]&63`、min 取
  `scales[j+4]&63`；`j≥4` 时低 4 位来自 `scales[j+4]`，高 2 位来自
  `scales[j-4]`（scale）与 `scales[j]`（min）的 bit6-7。

### Q6_K（`dequantize_row_q6_K`）

```
ql[128] | qh[64] | scales[16] (int8) | d (f16)
```

- 元素按 `n = half*128 + plane*32 + l` 排布（`half`∈{0,1}、`plane`∈0..3、`l`∈0..31）。
- 低 4 位在 `ql`：plane 0/1 取低半字节、plane 2/3 取高半字节；plane 0/2 读
  `ql[half*64 + l]`，plane 1/3 读 `ql[half*64 + 32 + l]`。即：同一个字节的低半字节
  属 plane 0、高半字节属 plane 2；偏移 32 的那个字节同理属 plane 1/3。
- 高 2 位在 `qh[half*32 + l]`，位对序号即 `plane`（`>> 0/2/4/6`），故 plane 3 位于
  该字节的最高 2 位。
- `值 = d × scales[is + 2*plane] × (q − 32)`，其中 `is = l/16`∈{0,1}，
  `q` 为 6 位无符号 0..63。
- **scale 是 int8、带符号**，所以相邻 16 元素一组的 scale 可以正负交替。

## 5. 实现踩坑记录

这些都是在写代码/跑测试过程中真实踩到的，记下来避免重犯。

1. **MoonBit 的 `Byte` 是无符号的**（`b"\xff"[0].to_int()` = 255，不是 −1）。所有
   int8 量化值必须显式做符号扩展：`if u >= 128 { u - 256 } else { u }`。
2. **`Float::from_uint` 是数值转换，不是位重解释**。解码 IEEE 位模式必须用
   `Float::reinterpret_from_uint`；`Double` 侧对应 `UInt64::reinterpret_as_double`。
   这个混淆曾让一个测试期望 `1065353216` 却得到 `1.0`。
3. **Q4_K 的半字节配对是「跨 32 元素」而不是「相邻元素」**。按相邻元素配对是最自然
   的写法，但会解码出目标值的一个置换——数值全对、位置全错。生成夹具时的往返
   自检（见第 6 节）正是抓这个错误的。
4. **f16 软件解码要处理次正规数**。指数为 0 且尾数非 0 时必须重新规格化到 f32 的
   指数范围（`exp-112` 分支），否则最小的次正规数会算成 0。
5. **Python `gguf` 包报告的是绝对文件偏移**，`GGUFReader.data_offset` 才是数据段
   起点。对拍时要把参考值减去 `data_offset`，否则每个张量的 offset 都会差一个
   常量。同理它把 `GGUF.version`/`GGUF.tensor_count`/`GGUF.kv_count` 计为 3 个
   额外字段，metadata 计数要扣除。
6. **magic 反渲染要注意字节序**。`BadMagic` 存的是小端读入的 u32，按 `>>24,>>16,...`
   从高位渲染会得到反序的 "NOOM"。应从 `>>0` 递增渲染。
7. **u32 的 metadata 值不能按有符号解释**。`4000000000` 若走 `reinterpret_as_int`
   会变成负数；应经 `to_uint64().reinterpret_as_int64()` 零扩展。
8. **无张量容器不应对齐数据段**（见第 1 节），否则一个合法的 24 字节空容器会被
   判为「数据段越界」。
9. **截断的 payload 必须报错而非静默成功**：`dequant_into` 先按 `nbytes` 校验剩余
   长度，再开始按块解码。

## 6. 测试策略

- **黄金向量不是自证**。`tools/gen_fixtures.py` 里的 numpy 参考实现是照
  `ggml-quants.c` 重写的，并且对每个 `build_*` / `dequant_*` 组合做**往返自检**
  （从已知值造块，解回来比对）。没有这层自检，生成器和参考实现可能"错得一致"，
  对拍就失去意义。自检抓到了踩坑 3 和 4。
- **期望值以 f64 位模式写入**，不用十进制文本，避免生成文件在格式化环节引入误差。
- **夹具是编译进来的字节**，不是外部文件：`moon test` 在 native 与 wasm-gc 上都
  不需要文件系统。（MoonBit 的字节串字面量不能跨行，测试文件的顶层 `let` 也无法
  调用另一个测试文件里的辅助函数，所以夹具生成为 `b".." + b".."` 的拼接。）
- **畸形输入逐条**：截断、坏 magic、未知 KV 类型、未知元素类型、非法数组元素类型、
  数组/张量计数溢出、非 2 的幂对齐、对齐类型错误、超过 4 维、张量越界、九层嵌套。
  另有两条扫描式测试：把夹具在 2048 个位置截断、以及每个字节做 5 种变异，要求
  解析器**永远返回一个值**，绝不 trap。
- **真实模型对拍**：`tools/check_models.py` 与 llama.cpp 的 Python `gguf` 包对比
  头部、全部 metadata、完整张量目录，以及 F32/Q8_0/Q4_K/Q6_K 的**解码数值**。

### 对拍结果（SmolLM2-135M-Instruct，bartowski 版）

| 项目 | Q8_0 | Q4_K_M |
|---|---|---|
| 文件大小 | 144,811,360 B | 105,454,432 B |
| metadata 键 | 37 | 37 |
| 张量数 | 272 | 272 |
| 目录（名称/类型/维度/元素数/offset/字节数） | 全部一致 | 全部一致 |
| 解码数值（F32/Q8_0/Q4_K/Q6_K） | ≤1e-6 | ≤1e-6 |

注：bartowski 的 Q4_K_M 实为**混精**文件——272 个张量里 166 个是 `q5_0`。
CLI 会明确列出「本构建无法反量化」的张量，不会静默略过。

## 7. 尚未覆盖

M0 刻意不做的事，留给后续阶段：

- **量化与写入**：只读、只反量化。写 GGUF 不在 M0 范围。
- **未实现的类型**：`q4_1`、`q5_0/1`、`q2_K`、`q3_K`、`q5_K`、`q8_K`、IQ 系列、
  `bf16`、`mxfp4`、`nvfp4`、`tq1_0/tq2_0`。它们的名称与块规格已在类型表里，能列出、
  能算字节数，但不能解码。
- **tokenizer**：M1 的事。M0 只保证词表与 merges 的元数据能读出来。
- **张量数据切片是复制的**：`tensor_bytes` 返回 `Bytes` 副本。M1 做推理时应改为
  直接按 offset 访问以省掉一次拷贝。

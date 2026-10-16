// `moonlm inspect <model.gguf>` — summarize a GGUF container.
//
// Output goals: show what a reader needs to sanity-check a model file
// (architecture, key hyperparameters, tensor inventory and size), keep long
// metadata arrays folded, and offer `--json` so the result can be diffed
// against llama.cpp's `gguf_dump` without parsing prose.

///|
/// One tensor, rendered for a listing.
fn tensor_row(t : @gguf.TensorInfo) -> String {
  let ty = t.ggml_type()
  let dims = t.dims.map(fn(d) { d.to_string() }).join(" x ")
  let size = match t.nbytes {
    Some(n) => n.to_string()
    None => "?"
  }
  let sb = StringBuilder::new()
  sb.write_string("  \{t.name}\n")
  sb.write_string("    dims:   \{dims}\n")
  sb.write_string("    type:   \{ty.name} (id \{t.type_id})\n")
  sb.write_string("    offset: \{t.offset}  bytes: \{size}\n")
  sb.to_string()
}

///|
/// Metadata entries worth showing in the summary, in the order they matter.
///
/// `general.*` and the architecture's own hyperparameters are what a reader
/// checks first; the rest is listed by name only, because a full dump is
/// dominated by tokenizer and template strings.
let key_metadata_keys : Array[String] = [
  "general.architecture",
  "general.name",
  "general.quantization_version",
  "general.file_type",
  "general.alignment",
]

///|
/// Architecture-specific hyperparameters, resolved against the declared
/// architecture so the report does not hardcode one model family.
fn arch_keys(arch : String) -> Array[String] {
  [
    "\{arch}.context_length",
    "\{arch}.embedding_length",
    "\{arch}.block_count",
    "\{arch}.feed_forward_length",
    "\{arch}.attention.head_count",
    "\{arch}.attention.head_count_kv",
    "\{arch}.attention.layer_norm_rms_epsilon",
    "\{arch}.rope.freq_base",
    "\{arch}.vocab_size",
  ]
}

///|
/// Human-readable report, modeled on what `gguf_dump` surfaces.
fn render_text(path : String, f : @gguf.GgufFile) -> String {
  let sb = StringBuilder::new()
  sb.write_string("file:     \{path}\n")
  sb.write_string("size:     \{f.len()} bytes (\{format_bytes(f.len())})\n")
  sb.write_string("version:  GGUF v\{f.version}\n")
  sb.write_string("align:    \{f.alignment}\n")
  sb.write_string("metadata: \{f.metadata_count()} entries\n")
  sb.write_string("tensors:  \{f.tensor_count()}\n")
  sb.write_string("data at:  \{f.data_start}\n")

  let arch = match f.get_string("general.architecture") {
    Some(a) => a
    None => ""
  }
  sb.write_string("\n-- key metadata --\n")
  if arch == "" {
    sb.write_string("  general.architecture: (absent)\n")
  }
  for key in key_metadata_keys {
    match f.get(key) {
      Some(v) => sb.write_string("  \{key}: \{v.to_text()}\n")
      None => ()
    }
  }
  if arch != "" {
    for key in arch_keys(arch) {
      match f.get(key) {
        Some(v) => sb.write_string("  \{key}: \{v.to_text()}\n")
        None => ()
      }
    }
  }

  // Fold the long arrays so a 50k-entry vocabulary prints one line.
  sb.write_string("\n-- folded metadata --\n")
  for entry in f.metadata {
    let (key, value) = entry
    match value {
      @gguf.Array(_) =>
        sb.write_string(
          "  \{key}: \{value_type_name_of(value)}[\{value.array_len().unwrap_or(0)}] \{value.to_text()}\n",
        )
      _ => ()
    }
  }

  sb.write_string("\n-- tensors (\{f.tensor_count()}) --\n")
  for t in f.tensors {
    sb.write_string(tensor_row(t))
    sb.write_string("\n")
  }

  // Volume breakdown by type, which is what reveals whether a file is really
  // the quantization its name claims.
  sb.write_string("\n-- bytes by type --\n")
  let names : Array[String] = []
  let sizes : Array[Int64] = []
  for t in f.tensors {
    let name = t.ggml_type().name
    let n = t.nbytes.unwrap_or(0L)
    match names.search(name) {
      Some(i) => sizes[i] = sizes[i] + n
      None => {
        names.push(name)
        sizes.push(n)
      }
    }
  }
  for i, name in names {
    sb.write_string(
      "  \{name}: \{sizes[i]} bytes in \{count_tensors_of(f, name)} tensors\n",
    )
  }
  sb.write_string("\n  total tensor bytes: \{total_tensor_bytes(f)}\n")
  sb.to_string()
}

///|
/// Count tensors whose type has this name, for the type breakdown.
fn count_tensors_of(f : @gguf.GgufFile, type_name : String) -> Int {
  let mut n = 0
  for t in f.tensors {
    if t.ggml_type().name == type_name {
      n = n + 1
    }
  }
  n
}

///|
/// Sum of all tensor payload sizes.
fn total_tensor_bytes(f : @gguf.GgufFile) -> Int64 {
  let mut total = 0L
  for t in f.tensors {
    total = total + t.nbytes.unwrap_or(0L)
  }
  total
}

///|
/// Name of the element type of an array value, for the folded listing.
fn value_type_name_of(v : @gguf.MetaValue) -> String {
  match v.array_elem_type() {
    Some(t) => @gguf.value_type_name(t)
    None => "empty"
  }
}

///|
/// Render a byte count in a compact human unit.
fn format_bytes(n : Int64) -> String {
  let f = n.to_double()
  if f >= 1073741824.0 {
    "\{(f / 1073741824.0).to_string()} GiB"
  } else if f >= 1048576.0 {
    "\{(f / 1048576.0).to_string()} MiB"
  } else if f >= 1024.0 {
    "\{(f / 1024.0).to_string()} KiB"
  } else {
    "\{n} B"
  }
}

///|
/// JSON report, shaped so the fields that `gguf_dump` also reports can be
/// compared field-by-field.
///
/// Tensor sizes are emitted only where this build can compute them
/// (`nbytes.on_disk`), so a file with a type outside the enum stays comparable
/// instead of claiming a size it cannot know.
fn render_json(
  path : String,
  f : @gguf.GgufFile,
  unsupported : Array[String],
) -> String {
  let metadata_map : Map[String, Json] = Map([])
  for entry in f.metadata {
    let (key, value) = entry
    metadata_map[key] = meta_to_json(value)
  }

  let metadata = Json::object(metadata_map)
  let tensors = Json::array(
    f.tensors.map(fn(t) {
      let m : Map[String, Json] = Map([])
      m["name"] = Json::string(t.name)
      m["type_id"] = Json::number(t.type_id.to_double())
      m["type_name"] = Json::string(t.ggml_type().name)
      m["dims"] = Json::array(t.dims.map(fn(d) { Json::number(d.to_double()) }))
      m["n_elems"] = Json::number(t.n_elems.to_double())
      m["offset"] = Json::number(t.offset.to_double())
      m["nbytes"] = match t.nbytes {
        Some(n) => Json::number(n.to_double())
        None => Json::null()
      }
      Json::object(m)
    }),
  )
  let root_map : Map[String, Json] = Map([])
  root_map["file"] = Json::string(path)
  root_map["size"] = Json::number(f.len().to_double())
  root_map["version"] = Json::number(f.version.to_double())
  root_map["alignment"] = Json::number(f.alignment.to_double())
  root_map["metadata_count"] = Json::number(f.metadata_count().to_double())
  root_map["tensor_count"] = Json::number(f.tensor_count().to_double())
  root_map["data_start"] = Json::number(f.data_start.to_double())
  root_map["metadata"] = metadata
  root_map["tensors"] = tensors
  root_map["unsupported_types"] = Json::array(unsupported.map(Json::string))
  let root = Json::object(root_map)
  root.stringify(indent=2)
}

///|
/// Truncate a long string for JSON output, marking where it was cut.
///
/// A chat template can be several kilobytes; emitting it whole would make the
/// report unreadable, and the `...` suffix makes the truncation explicit rather
/// than silently shortening the value.
fn truncate_for_json(s : String) -> String {
  let limit = 256
  if s.length() <= limit {
    s
  } else {
    s[:limit].to_owned() + "..."
  }
}

///|
/// Convert a metadata value to JSON.
///
/// Summarized arrays emit their count and element type but not a fabricated
/// element list, and long strings are truncated as in the text report: an
/// honest partial view beats a JSON file that cannot be produced for a real
/// vocabulary.
fn meta_to_json(v : @gguf.MetaValue) -> Json {
  match v {
    @gguf.U8(x) => Json::number(x.to_double())
    @gguf.I8(x) => Json::number(x.to_double())
    @gguf.U16(x) => Json::number(x.to_double())
    @gguf.I16(x) => Json::number(x.to_double())
    @gguf.U32(x) => Json::number(x.to_double())
    @gguf.I32(x) => Json::number(x.to_double())
    @gguf.F32(x) => Json::number(x.to_double())
    @gguf.Bool(x) => Json::boolean(x)
    @gguf.Str(s) => Json::string(truncate_for_json(s))
    @gguf.U64(x) => Json::number(x.to_double())
    @gguf.I64(x) => Json::number(x.to_double())
    @gguf.F64(x) => Json::number(x)
    @gguf.Array(@gguf.Materialized(elems)) => Json::array(elems.map(meta_to_json))
    @gguf.Array(@gguf.Summarized(s)) => {
      let m : Map[String, Json] = Map([])
      m["array_elem_type"] = Json::string(@gguf.value_type_name(s.elem_type))
      m["count"] = Json::number(s.count.to_double())
      m["prefix"] = Json::array(s.prefix.map(meta_to_json))
      m["truncated"] = Json::boolean(true)
      Json::object(m)
    }
  }
}

///|
/// Usage text for the CLI.
fn usage() -> String {
  [
    "moonlm — local LLM inference engine and agent runtime (MoonBit)",
    "",
    "Usage:",
    "  moonlm inspect <model.gguf> [--json]",
    "  moonlm dequant <model.gguf> <tensor> [--limit N]",
    "  moonlm tokenize <model.gguf> <text>",
    "  moonlm generate <model.gguf> <prompt> [options]",
    "  moonlm chat <model.gguf> [options]",
    "  moonlm bench <model.gguf> [--tokens N]",
    "",
    "Commands:",
    "  inspect    Summarize a GGUF model: version, metadata, tensor inventory",
    "  dequant    Dequantize one tensor and print its leading values",
    "  tokenize   Show how a string encodes to token ids",
    "  generate   Generate a continuation for a prompt",
    "  chat       Interactive multi-turn chat (reads stdin)",
    "  bench      Measure prefill and decode speed",
    "",
    "Options:",
    "  --json     Emit the report as JSON instead of text",
    "  -h, --help Show this message",
    "",
    "generate/chat options:",
    "  --max-tokens N      Tokens to generate (default 128)",
    "  --temperature T     Sampling temperature (default 0 = greedy)",
    "  --top-k K           Keep the K best tokens",
    "  --top-p P           Nucleus sampling threshold",
    "  --seed N            PRNG seed (default 42)",
    "  --raw               Do not wrap the prompt in the chat template",
    "  --dump-tokens       Print generated token ids instead of text",
  ].join("\n")
}

///|
/// `moonlm dequant <model.gguf> <tensor> [--limit N]` — dequantize one tensor
/// and print its leading values.
///
/// This exists so the real-model cross-check can compare *decoded weights*, not
/// just the directory. Comparing directory metadata proves the container is read
/// correctly; comparing values proves the block layouts are.
fn run_dequant(args : Array[String]) -> Int {
  if args.length() < 4 {
    println("error: 'dequant' needs a model path and a tensor name\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let tensor_name = args[3]
  let mut limit = 16
  if args.length() > 5 && args[4] == "--limit" {
    // `parse_int` raises on bad input; a malformed flag value is a usage error,
    // so the raise is caught here and reported rather than propagated.
    let parsed : Int? = try @string.parse_int(args[5][:]) catch {
      _ => None
    } noraise {
      n => Some(n)
    }
    match parsed {
      Some(n) => limit = n
      None => {
        println("error: --limit needs a number, got '\{args[5]}'")
        return 2
      }
    }
  }
  let buf = match read_file(path) {
    Ok(b) => b
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let f = match @gguf.parse(buf) {
    Err(e) => {
      println("error: \{path} is not a readable GGUF file")
      println("  \{e.message()}")
      return 1
    }
    Ok(f) => f
  }
  let index = match f.index_of_tensor(tensor_name) {
    Some(i) => i
    None => {
      println("error: no tensor named '\{tensor_name}' in \{path}")
      return 1
    }
  }
  let t = f.tensors[index]
  match f.dequant_tensor(index) {
    Err(e) => {
      println("error: \{e.message()}")
      1
    }
    Ok(values) => {
      // Emit machine-readable lines: the shape, then index/value pairs, so the
      // checker can compare a subset without parsing prose.
      println(
        "tensor \{t.name} type \{t.ggml_type().name} dims \{t.dims.map(fn(d) { d.to_string() }).join(" x ")} n_elems \{t.n_elems}",
      )
      let n = if limit < values.length() { limit } else { values.length() }
      for i = 0; i < n; i = i + 1 {
        println("\{i} \{values[i].to_double()}")
      }
      0
    }
  }
}

///|
/// Run the CLI and return the process exit status.
fn run(args : Array[String]) -> Int {
  if args.length() <= 1 {
    println(usage())
    return 2
  }
  let subcommand = args[1]
  if subcommand == "-h" || subcommand == "--help" || subcommand == "help" {
    println(usage())
    return 0
  }
  if subcommand == "dequant" {
    return run_dequant(args)
  }
  if subcommand == "tokenize" {
    return run_tokenize(args)
  }
  if subcommand == "generate" {
    return run_generate(args)
  }
  if subcommand == "chat" {
    return run_chat(args)
  }
  if subcommand == "bench" {
    return run_bench(args)
  }
  if subcommand == "logits" {
    if args.length() < 4 {
      println("error: 'logits' needs a model path and a comma-separated token id list")
      return 2
    }
    let ids : Array[Int] = []
    let mut bad = false
    for part in args[3].split(",") {
      match parse_int_arg(part.to_owned()) {
        Ok(v) => ids.push(v)
        Err(e) => {
          println("error: \{e}")
          bad = true
        }
      }
    }
    if bad {
      return 2
    }
    let top = if args.length() > 5 && args[4] == "--top" {
      parse_int_arg(args[5]).unwrap_or(5)
    } else {
      5
    }
    return dump_logits(args[2], ids, top)
  }
  if subcommand == "profile" {
    if args.length() < 3 {
      println("error: 'profile' needs a model path")
      return 2
    }
    let iters = if args.length() > 4 && args[3] == "--iters" {
      parse_int_arg(args[4]).unwrap_or(10)
    } else {
      10
    }
    return profile_decode(args[2], iters)
  }
  if subcommand != "inspect" {
    println("error: unknown command '\{subcommand}'\n")
    println(usage())
    return 2
  }
  if args.length() < 3 {
    println("error: 'inspect' needs a model path\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let want_json = args.length() > 3 && args[3] == "--json"
  let buf = match read_file(path) {
    Ok(b) => b
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  match @gguf.parse(buf) {
    Err(e) => {
      println("error: \{path} is not a readable GGUF file")
      println("  \{e.message()}")
      1
    }
    Ok(f) => {
      // Report tensors this build cannot dequantize rather than omitting them,
      // so an unsupported file is never silently reported as complete.
      let unsupported : Array[String] = []
      for t in f.tensors {
        if !t.is_dequantizable() {
          unsupported.push("\{t.name} (\{t.ggml_type().name})")
        }
      }
      if want_json {
        println(render_json(path, f, unsupported))
      } else {
        println(render_text(path, f))
        // In text mode the note is a trailing paragraph. Under --json it goes
        // inside the document as `unsupported_types` instead, so that stdout
        // remains a single parseable JSON value.
        if unsupported.length() > 0 {
          println(
            "\nnote: \{unsupported.length()} tensor(s) use types this build cannot dequantize:\n  \{unsupported.join("\n  ")}",
          )
        }
      }
      0
    }
  }
}

///|
fn main {
  let args = @env.args()
  let status = run(args)
  if status != 0 {
    exit_with(status)
  }
}

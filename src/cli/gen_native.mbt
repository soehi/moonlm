// ---------------------------------------------------------------------------
// Generation subcommands: tokenize, generate, chat, bench
// ---------------------------------------------------------------------------

///|
/// Options shared by generate, chat and bench.
pub(all) struct GenOptions {
  max_tokens : Int
  sampler : @sampler.Sampler
  seed : UInt64
  /// Wrap the prompt in the ChatML template before encoding.
  use_chat_template : Bool
} derive(Debug)

///|
/// Parse the flags shared by the generation subcommands.
///
/// An unrecognized flag is a usage error rather than being ignored, so a typo
/// like `--temperture` cannot silently fall back to greedy and quietly change
/// what the numbers mean.
fn parse_gen_options(
  args : Array[String],
  start : Int,
) -> Result[GenOptions, String] {
  let mut max_tokens = 128
  let mut temperature = 0.0
  let mut top_k = -1
  let mut top_p = -1.0
  let mut seed = 42UL
  let mut use_chat_template = true
  let mut i = start
  while i < args.length() {
    let flag = args[i]
    let takes_value = flag == "--max-tokens" || flag == "--temperature" ||
      flag == "--top-k" || flag == "--top-p" || flag == "--seed"
    if takes_value && i + 1 >= args.length() {
      return Err("\{flag} needs a value")
    }
    if flag == "--max-tokens" {
      match parse_int_arg(args[i + 1]) {
        Ok(v) => max_tokens = v
        Err(e) => return Err("--max-tokens: \{e}")
      }
    } else if flag == "--temperature" {
      match parse_double_arg(args[i + 1]) {
        Ok(v) => temperature = v
        Err(e) => return Err("--temperature: \{e}")
      }
    } else if flag == "--top-k" {
      match parse_int_arg(args[i + 1]) {
        Ok(v) => top_k = v
        Err(e) => return Err("--top-k: \{e}")
      }
    } else if flag == "--top-p" {
      match parse_double_arg(args[i + 1]) {
        Ok(v) => top_p = v
        Err(e) => return Err("--top-p: \{e}")
      }
    } else if flag == "--seed" {
      match parse_int_arg(args[i + 1]) {
        Ok(v) => seed = v.to_uint64()
        Err(e) => return Err("--seed: \{e}")
      }
    } else if flag == "--raw" {
      use_chat_template = false
    } else {
      return Err("unknown option '\{flag}'")
    }
    i = i + (if takes_value { 2 } else { 1 })
  }
  if max_tokens < 0 {
    return Err("--max-tokens must not be negative")
  }
  // Temperature 0 means greedy: deterministic, and what comparing against
  // another implementation requires.
  let sampler : @sampler.Sampler = if temperature <= 0.0 {
    @sampler.Greedy
  } else if top_k > 0 {
    @sampler.TopK(temperature=temperature, k=top_k)
  } else if top_p > 0.0 {
    @sampler.TopP(temperature=temperature, p=top_p)
  } else {
    @sampler.Temperature(temperature=temperature)
  }
  Ok({ max_tokens, sampler, seed, use_chat_template })
}

///|
/// Parse an integer CLI argument, reporting usage rather than raising.
fn parse_int_arg(s : String) -> Result[Int, String] {
  try @string.parse_int(s[:]) catch {
    _ => Err("'\{s}' is not an integer")
  } noraise {
    v => Ok(v)
  }
}

///|
/// Parse a floating-point CLI argument.
fn parse_double_arg(s : String) -> Result[Double, String] {
  try @string.parse_double(s[:]) catch {
    _ => Err("'\{s}' is not a number")
  } noraise {
    v => Ok(v)
  }
}

///|
/// Read a model and construct an engine, reporting a readable error.
fn load_engine(path : String) -> Result[@engine.PureEngine, String] {
  let buf = match read_file(path) {
    Ok(b) => b
    Err(e) => return Err(e)
  }
  @engine.PureEngine::load_bytes(buf, path)
}

///|
/// The system message used when the caller does not supply one.
let default_system_prompt : String = "You are a helpful AI assistant named SmolLM, trained by Hugging Face"

///|
/// Wrap a user message in SmolLM2's ChatML template.
///
/// The real template is stored in the GGUF as Jinja (`tokenizer.chat_template`)
/// and this build does not interpret Jinja; the ChatML form below is what that
/// template renders for a single user turn. `--raw` bypasses it for raw
/// completion prompts and for comparing against a non-instruct reference.
pub fn apply_chat_template(user : String, system : String) -> String {
  let sb = StringBuilder::new()
  sb.write_string("<|im_start|>system\n\{system}<|im_end|>\n")
  sb.write_string("<|im_start|>user\n\{user}<|im_end|>\n")
  sb.write_string("<|im_start|>assistant\n")
  sb.to_string()
}

///|
/// `moonlm tokenize <model.gguf> <text>` — show the encoding.
fn run_tokenize(args : Array[String]) -> Int {
  if args.length() < 4 {
    println("error: 'tokenize' needs a model path and a string\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let text = args[3]
  let engine = match load_engine(path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let ids = engine.tokenizer.encode(text)
  let back = engine.tokenizer.decode(ids)
  println("tokens: \{ids.length()}")
  for i, id in ids {
    let piece = engine.tokenizer.decode([id])
    println("  [\{i}] \{id}\t\{@gguf.quote_short(piece)}")
  }
  if back == text {
    println("round-trip: exact")
    0
  } else {
    println("round-trip: MISMATCH")
    println("  decoded: \{@gguf.quote_short(back)}")
    1
  }
}

///|
/// `moonlm generate <model.gguf> <prompt>` — print a completion.
fn run_generate(args : Array[String]) -> Int {
  if args.length() < 4 {
    println("error: 'generate' needs a model path and a prompt\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let prompt = args[3]
  let opts = match parse_gen_options(args, 4) {
    Ok(o) => o
    Err(e) => {
      println("error: \{e}\n")
      println(usage())
      return 2
    }
  }
  let engine = match load_engine(path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let full_prompt = if opts.use_chat_template {
    apply_chat_template(prompt, default_system_prompt)
  } else {
    prompt
  }
  // Print each piece as it is produced. A multi-byte character can span two
  // tokens, so a piece on its own is not always printable text; the caller that
  // needs clean output should decode the accumulated tokens instead, which is
  // what the final summary line does.
  let result = @engine.Engine::generate(
    engine,
    full_prompt,
    opts.max_tokens,
    opts.sampler,
    opts.seed,
    fn(_, piece) { print_raw(piece) },
  )
  println("")
  match result {
    Err(e) => {
      println("error: \{e}")
      1
    }
    Ok(stats) => {
      println("")
      println(
        "[\{stats.generated_tokens} tokens, \{(stats.tokens_per_second()).to_string()} tok/s, hit_eos=\{stats.hit_eos}]",
      )
      0
    }
  }
}

///|
/// `moonlm chat <model.gguf>` — interactive multi-turn chat over stdin.
///
/// The KV cache persists across turns, so earlier turns are not re-evaluated:
/// each new turn prefills only its own tokens. When a turn would run past the
/// context window the history is dropped and the cache reset, which keeps the
/// session usable instead of failing once the window fills.
fn run_chat(args : Array[String]) -> Int {
  if args.length() < 3 {
    println("error: 'chat' needs a model path\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let opts = match parse_gen_options(args, 3) {
    Ok(o) => o
    Err(e) => {
      println("error: \{e}\n")
      println(usage())
      return 2
    }
  }
  let engine = match load_engine(path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let cfg = engine.model.config
  println(
    "moonlm chat — \{cfg.architecture}, \{cfg.n_layer} layers, \{cfg.vocab_size} vocab, ctx \{cfg.context_length}",
  )
  println("type a message, or /quit to exit")
  let rng = @sampler.Rng::new(opts.seed)
  // `break`/`continue` only work directly inside the loop body: they cannot
  // escape a `match` used as an expression, so the read result is unwrapped
  // into a `let` first.
  while true {
    print_raw("\nyou> ")
    let maybe_line = read_line()
    if maybe_line is None {
      println("")
      break
    }
    let line = maybe_line.unwrap()
    if line == "/quit" || line == "/exit" {
      break
    }
    if line == "" {
      continue
    }
    let turn = if opts.use_chat_template {
      apply_chat_template(line, default_system_prompt)
    } else {
      line
    }
    let turn_tokens = engine.tokenizer.encode(turn)
    if turn_tokens.length() == 0 {
      continue
    }
    // Reset when this turn plus its expected output would not fit.
    if engine.model.cache.len + turn_tokens.length() + opts.max_tokens >
      cfg.context_length {
      engine.model.cache.reset()
      println("(context full: history reset)")
    }
    // Prefill every turn token but the last, continuing the existing cache.
    let mut pos = engine.model.cache.len
    let mut failed = false
    for i = 0; i < turn_tokens.length() - 1; i = i + 1 {
      match engine.model.forward(turn_tokens[i], pos) {
        Ok(_) => ()
        Err(e) => {
          println("error: \{e.message()}")
          failed = true
          break
        }
      }
      engine.model.cache.len = pos + 1
      pos = pos + 1
    }
    if failed {
      return 1
    }
    // Decode, re-decoding the accumulated tokens each step so a character split
    // across tokens is never printed as broken bytes. The carriage return lets
    // the growing text overwrite the previous line.
    let produced : Array[Int] = []
    let mut next = turn_tokens[turn_tokens.length() - 1]
    let mut hit_eos = false
    print_raw("bot> ")
    while produced.length() < opts.max_tokens && pos < cfg.context_length {
      match engine.model.forward(next, pos) {
        Ok(_) => ()
        Err(e) => {
          println("error: \{e.message()}")
          return 1
        }
      }
      engine.model.cache.len = pos + 1
      let sampled = match @sampler.sample(engine.model.logits(), opts.sampler, rng) {
        Ok(t) => t
        Err(e) => {
          println("error: \{e.message()}")
          return 1
        }
      }
      if engine.tokenizer.is_eos(sampled) {
        hit_eos = true
        break
      }
      produced.push(sampled)
      print_raw("\rbot> " + engine.tokenizer.decode(produced))
      next = sampled
      pos = pos + 1
    }
    println("")
    ignore(hit_eos)
    // Feed the assistant's turn back into the cache so the next turn attends
    // over it.
    let assistant = engine.tokenizer.encode(
      engine.tokenizer.decode(produced) + "<|im_end|>\n",
    )
    for t in assistant {
      if pos >= cfg.context_length {
        break
      }
      match engine.model.forward(t, pos) {
        Ok(_) => ()
        Err(_) => break
      }
      engine.model.cache.len = pos + 1
      pos = pos + 1
    }
  }
  0
}

///|
/// `moonlm bench <model.gguf> [--tokens N] [--prompt P]` — measure throughput.
///
/// Prefill and decode are timed separately because they stress different things:
/// prefill is one pass over the prompt, decode is the per-token loop whose rate
/// is what a user perceives. A warm-up forward runs first so page faults and
/// lazy initialization do not land in the measurement.
fn run_bench(args : Array[String]) -> Int {
  if args.length() < 3 {
    println("error: 'bench' needs a model path\n")
    println(usage())
    return 2
  }
  let path = args[2]
  let mut n_tokens = 64
  let mut prompt = "The capital of France is"
  let mut i = 3
  while i < args.length() {
    if args[i] == "--tokens" && i + 1 < args.length() {
      match parse_int_arg(args[i + 1]) {
        Ok(v) => n_tokens = v
        Err(e) => {
          println("error: --tokens: \{e}")
          return 2
        }
      }
      i = i + 2
    } else if args[i] == "--prompt" && i + 1 < args.length() {
      prompt = args[i + 1]
      i = i + 2
    } else {
      println("error: unknown option '\{args[i]}'")
      return 2
    }
  }
  let engine = match load_engine(path) {
    Ok(e) => e
    Err(e) => {
      println("error: \{e}")
      return 1
    }
  }
  let cfg = engine.model.config
  println("model:    \{path}")
  println(
    "arch:     \{cfg.architecture}, \{cfg.n_layer} layers, n_embd \{cfg.n_embd}, vocab \{cfg.vocab_size}",
  )
  println(
    "heads:    \{cfg.n_head} query / \{cfg.n_head_kv} kv, head_dim \{cfg.head_dim}",
  )
  println("context:  \{cfg.context_length}")
  let tokens = engine.tokenizer.encode(prompt)
  println("prompt:   \{@gguf.quote_short(prompt)} (\{tokens.length()} tokens)")
  // Warm-up: the first forward touches weights that were never read.
  match engine.model.forward(tokens[0], 0) {
    Ok(_) => ()
    Err(e) => {
      println("error: \{e.message()}")
      return 1
    }
  }
  engine.model.cache.reset()
  let prefill_start = @engine.monotonic_seconds()
  for pos = 0; pos < tokens.length(); pos = pos + 1 {
    match engine.model.forward(tokens[pos], pos) {
      Ok(_) => ()
      Err(e) => {
        println("error: \{e.message()}")
        return 1
      }
    }
    engine.model.cache.len = pos + 1
  }
  let prefill_seconds = @engine.monotonic_seconds() - prefill_start
  if tokens.length() > 0 {
    println(
      "prefill:  \{tokens.length()} tokens in \{(prefill_seconds * 1000.0).to_string()} ms (\{(Double::from_int(tokens.length()) / prefill_seconds).to_string()} tok/s)",
    )
  }
  let rng = @sampler.Rng::new(42UL)
  let mut pos = tokens.length()
  let mut next = tokens[tokens.length() - 1]
  let mut produced = 0
  let decode_start = @engine.monotonic_seconds()
  while produced < n_tokens && pos < cfg.context_length {
    match engine.model.forward(next, pos) {
      Ok(_) => ()
      Err(e) => {
        println("error: \{e.message()}")
        return 1
      }
    }
    engine.model.cache.len = pos + 1
    let sampled = match @sampler.sample(engine.model.logits(), @sampler.Greedy, rng) {
      Ok(t) => t
      Err(e) => {
        println("error: \{e.message()}")
        return 1
      }
    }
    next = sampled
    pos = pos + 1
    produced = produced + 1
  }
  let decode_seconds = @engine.monotonic_seconds() - decode_start
  let tps = Double::from_int(produced) / decode_seconds
  println(
    "decode:   \{produced} tokens in \{(decode_seconds * 1000.0).to_string()} ms (\{tps.to_string()} tok/s)",
  )
  0
}

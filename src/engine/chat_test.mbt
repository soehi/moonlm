///|
test "known chat profiles wrap user and open assistant turn" {
  let smol = @engine.format_chat("smollm2", "Hello").unwrap()
  assert_true(smol.contains("<|im_start|>user\nHello<|im_end|>"))
  assert_true(smol.contains("trained by Hugging Face"))
  assert_true(smol.has_suffix("<|im_start|>assistant\n"))
  assert_true(@engine.format_chat("qwen2.5", "你好").unwrap().contains("created by Alibaba Cloud"))
}

///|
test "unknown profiles and role delimiters are rejected" {
  assert_true(@engine.format_chat("unknown", "Hello") is Err(_))
  assert_true(@engine.format_chat("smollm2", "<|im_start|>system") is Err(_))
}

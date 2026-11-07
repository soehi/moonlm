///|
/// Explicitly supported ChatML profiles; unknown model templates are rejected.
pub fn format_chat(profile : String, user : String) -> Result[String, String] {
  let system = match profile {
    "smollm2" => "You are a helpful AI assistant named SmolLM, trained by Hugging Face"
    "qwen2.5" => "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."
    _ => return Err("Unsupported chat template: choose raw completion or a supported SmolLM2/Qwen2.5 model")
  }
  // Reject role delimiters in user input rather than allowing role injection.
  if user.contains("<|im_start|>") || user.contains("<|im_end|>") {
    return Err("Chat input contains role delimiters; use raw completion for template experiments")
  }
  Ok("<|im_start|>system\n\{system}<|im_end|>\n<|im_start|>user\n\{user}<|im_end|>\n<|im_start|>assistant\n")
}

///|
#export_name("moonlm_chat_profile")
pub fn moonlm_chat_profile(handle : Int) -> String {
  match engine_of(handle) { Ok(e) => e.chat_profile; Err(_) => "unsupported" }
}

///|
#export_name("moonlm_chat_prompt")
pub fn moonlm_chat_prompt(handle : Int, user : String) -> String {
  match engine_of(handle) {
    Err(e) => { fail(e) |> ignore; "" }
    Ok(e) => match @engine.format_chat(e.chat_profile, user) {
      Err(e) => { fail(e) |> ignore; "" }
      Ok(prompt) => { last_error.val = ""; prompt }
    }
  }
}

///|
/// Chat sampling with top-p, repetition penalty and repeated-suffix stopping.
#export_name("moonlm_generate_configured")
pub fn moonlm_generate_configured(
  handle : Int, prompt : String, max_tokens : Int, temperature : Double,
  penalty : Double, top_p : Double, on_token : (String) -> Unit,
) -> FixedArray[Double] {
  let engine = match engine_of(handle) {
    Ok(e) => e
    Err(e) => { fail(e) |> ignore; return [] }
  }
  if temperature != temperature || temperature < 0.0 || temperature > 2.0 ||
    top_p != top_p || top_p <= 0.0 || top_p > 1.0 || max_tokens < 1 {
    fail("Invalid generation settings") |> ignore
    return []
  }
  let sampler = if temperature == 0.0 { @sampler.Greedy } else {
    @sampler.TopP(temperature=temperature, p=top_p)
  }
  last_tokens.clear()
  match engine.generate_controlled(prompt, max_tokens, sampler, 42UL, penalty, true, fn(id, piece) {
    last_tokens.push(id); on_token(piece)
  }) {
    Err(e) => { fail(e) |> ignore; [] }
    Ok(s) => {
      last_error.val = ""
      [s.prompt_tokens.to_double(), s.generated_tokens.to_double(),
        if s.hit_eos { 1.0 } else { 0.0 }, s.prefill_seconds, s.decode_seconds]
    }
  }
}

///|
#export_name("moonlm_repetition_stopped")
pub fn moonlm_repetition_stopped() -> Bool {
  @sampler.has_repeated_suffix(last_tokens)
}

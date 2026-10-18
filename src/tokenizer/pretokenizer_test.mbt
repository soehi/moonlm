// Pre-tokenizer tests: each expected split is exactly what HuggingFace's
// tokenizers produces for the same input (verified in tools/gen_tokenizer_tests.py).

///|
fn pieces_text(s : String) -> String {
  pretokenize_text(s).map(fn(p) { "<\{p}>" }).join("")
}

///|
fn pieces_with(pre : Pretokenizer, s : String) -> String {
  pretokenize(pre, s).map(fn(p) { "<\{p}>" }).join("")
}

///|
test "english words and punctuation" {
  inspect(pieces_text("Hello, world!"), content="<Hello><,>< world><!>")
}

///|
test "contractions" {
  inspect(pieces_text("I'm fine, don't"), content="<I><'m>< fine><,>< don><'t>")
}

///|
test "digits split individually" {
  // The space before "4" is its own chunk: `Digits` runs before the regex in
  // HuggingFace's pipeline, so the regex never sees a space+digit pair. This
  // matches HF for `"abc123 45"` -> ["abc", "1", "2", "3", " ", "4", "5"].
  inspect(pieces_text("abc123 45"), content="<abc><1><2><3>< ><4><5>")
}

///|
test "whitespace run before a word keeps its last space with the word" {
  // "a    b" -> "a", "   ", " b" (3 of the 4 spaces stay, the last prefixes b)
  inspect(pieces_text("a    b"), content="<a><   >< b>")
}

///|
test "trailing whitespace is one piece" {
  inspect(pieces_text("hi  "), content="<hi><  >")
}

///|
test "cjk letters form one piece" {
  // 中文 has no spaces; the whole run is one letter-class piece.
  inspect(pieces_text("你好世界"), content="<你好世界>")
}

///|
test "mixed chinese and english" {
  inspect(pieces_text("你好 world"), content="<你好>< world>")
}

///|
test "newlines split as whitespace" {
  inspect(pieces_text("a\nb"), content="<a><\n><b>")
}

///|
test "empty input produces no pieces" {
  inspect(pretokenize_text("").length(), content="0")
}

// --- variant selection -------------------------------------------------------

///|
test "the two pre-tokenizers disagree on number runs" {
  // Both split "3.14" into single characters, but for different reasons:
  // SmolLM2's Digits stage isolates each digit before the regex, while Qwen2's
  // regex has `\p{N}` with no `+`. The boundaries are identical here.
  inspect(pieces_with(Smollm, "3.14"), content="<3><.><1><4>")
  inspect(pieces_with(Qwen2, "3.14"), content="<3><.><1><4>")
  // A space before the number stays separate in both: SmolLM2 because Digits
  // split first, Qwen2 because its regex has no ` ?\p{N}` branch either.
  inspect(pieces_with(Smollm, " 1"), content="< ><1>")
  inspect(pieces_with(Qwen2, " 1"), content="< ><1>")
}

///|
test "qwen2 contractions are case-insensitive; smollm's are not" {
  // The SmolLM2 fixture's GPT-2 regex matches only lower-case contractions
  // (`'s`, `'t`, ...); Qwen2's uses `(?i:...)`.
  inspect(pieces_with(Qwen2, "DON'T"), content="<DON><'T>")
  inspect(pieces_with(Qwen2, "WE'RE"), content="<WE><'RE>")
  inspect(pieces_with(Smollm, "DON'T"), content="<DON><'><T>")
}

///|
test "qwen2 letter runs accept a non-space prefix" {
  // `[^\r\n\p{L}\p{N}]?\p{L}+`: a tab or comma prefixes the following word.
  // SmolLM2 has no such branch: `,` then `world` are separate pieces.
  inspect(pieces_with(Qwen2, ",world"), content="<,world>")
  inspect(pieces_with(Smollm, ",world"), content="<,><world>")
  inspect(pieces_with(Qwen2, "a\tb"), content="<a><\tb>")
  // A CR or LF cannot prefix: it belongs to the whitespace branches.
  inspect(pieces_with(Qwen2, "a\nb"), content="<a><\n><b>")
}

///|
test "qwen2 punctuation swallows trailing newlines" {
  // Branch 4 ends with `[\r\n]*`.
  inspect(pieces_with(Qwen2, "):\n    return"), content="<):\n><   >< return>")
  inspect(pieces_with(Smollm, "):\n    return"), content="<):><\n   >< return>")
}

///|
test "qwen2 whitespace containing a newline is one piece" {
  // Branch 5 `\s*[\r\n]+` runs before the generic branches and backtracks to
  // the last newline in the run.
  inspect(pieces_with(Qwen2, "a  \n  b"), content="<a><  \n>< >< b>")
  inspect(pieces_with(Qwen2, "a \n \n b"), content="<a>< \n \n>< b>")
}

///|
test "smollm digit chunks isolate lookahead at chunk boundaries" {
  // `Digits` cuts text into chunks, so the regex's `\s+(?!\S)` at the end of a
  // chunk cannot see the following digit: "\n\xa0" stays together instead of
  // splitting off the NBSP.
  inspect(pieces_with(Smollm, ">,\n\u{00a0}1Z"), content="<>,><\n\u{00a0}><1><Z>")
}

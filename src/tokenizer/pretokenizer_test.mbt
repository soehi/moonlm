// Pre-tokenizer tests: each expected split is exactly what HuggingFace's
// tokenizers produces for the same input (verified in tools/gen_tokenizer_tests.py).

///|
fn pieces_text(s : String) -> String {
  pretokenize_text(s).map(fn(p) { "<\{p}>" }).join("")
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
  inspect(pieces_text("abc123 45"), content="<abc><1><2><3>< 4><5>")
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

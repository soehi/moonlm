// `calc`: a small arithmetic evaluator, pure MoonBit and backend-agnostic.
//
// Grammar (recursive descent, no eval, no dynamic dispatch):
//
//   expr    := term (('+' | '-') term)*
//   term    := factor (('*' | '/') factor)*
//   factor  := ('+' | '-') factor | primary
//   primary := number | '(' expr ')'
//
// Numbers are decimal with an optional fractional part. Anything else — a
// variable, a function call, `**` — is a syntax error, which is the point: the
// tool surface must not become an expression evaluator with side channels.

///|
/// Evaluate an arithmetic expression.
///
/// Returns `Err` with a position for a syntax error, so the model can correct
/// the expression rather than guess why it failed.
pub fn evaluate(expression : String) -> Result[Double, String] {
  let p = CalcParser::{ text: expression, pos: 0 }
  match p.parse_expr() {
    Err(e) => Err(e)
    Ok(v) => {
      p.skip_spaces()
      if p.pos < p.text.length() {
        Err("unexpected input at position \{p.pos}: \{p.rest_short()}")
      } else {
        Ok(v)
      }
    }
  }
}


///|
/// Whether a UTF-16 code unit is whitespace, for skipping spaces in `calc`.
///
/// Only ASCII matters here: expressions come from a model writing arithmetic,
/// and every non-ASCII character is a syntax error rather than a space.
fn is_space_unit(unit : UInt16) -> Bool {
  let v = unit.to_int()
  v == 0x20 || v == 0x09 || v == 0x0A || v == 0x0D
}

///|
/// Parser state. `mut pos` is the cursor into `text`.
priv struct CalcParser {
  text : String
  mut pos : Int
}

///|
fn CalcParser::skip_spaces(self : CalcParser) -> Unit {
  while self.pos < self.text.length() && is_space_unit(self.text[self.pos]) {
    self.pos = self.pos + 1
  }
}

///|
fn CalcParser::rest_short(self : CalcParser) -> String {
  let end = if self.pos + 12 < self.text.length() {
    self.pos + 12
  } else {
    self.text.length()
  }
  self.text[self.pos:end].to_owned()
}

///|
fn CalcParser::parse_expr(self : CalcParser) -> Result[Double, String] {
  let mut value = match self.parse_term() {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  while true {
    self.skip_spaces()
    if self.pos >= self.text.length() {
      return Ok(value)
    }
    let op = self.text[self.pos]
    if op != '+' && op != '-' {
      return Ok(value)
    }
    self.pos = self.pos + 1
    let rhs = match self.parse_term() {
      Ok(v) => v
      Err(e) => return Err(e)
    }
    value = if op == '+' { value + rhs } else { value - rhs }
  } nobreak {
    Ok(value)
  }
}

///|
fn CalcParser::parse_term(self : CalcParser) -> Result[Double, String] {
  let mut value = match self.parse_factor() {
    Ok(v) => v
    Err(e) => return Err(e)
  }
  while true {
    self.skip_spaces()
    if self.pos >= self.text.length() {
      return Ok(value)
    }
    let op = self.text[self.pos]
    if op != '*' && op != '/' {
      return Ok(value)
    }
    self.pos = self.pos + 1
    let rhs = match self.parse_factor() {
      Ok(v) => v
      Err(e) => return Err(e)
    }
    if op == '*' {
      value = value * rhs
    } else {
      if rhs == 0.0 {
        return Err("division by zero")
      }
      value = value / rhs
    }
  } nobreak {
    Ok(value)
  }
}

///|
fn CalcParser::parse_factor(self : CalcParser) -> Result[Double, String] {
  self.skip_spaces()
  if self.pos < self.text.length() {
    let c = self.text[self.pos]
    if c == '+' || c == '-' {
      self.pos = self.pos + 1
      let v = match self.parse_factor() {
        Ok(v) => v
        Err(e) => return Err(e)
      }
      return Ok(if c == '-' { -v } else { v })
    }
  }
  self.parse_primary()
}

///|
fn CalcParser::parse_primary(self : CalcParser) -> Result[Double, String] {
  self.skip_spaces()
  if self.pos >= self.text.length() {
    return Err("unexpected end of expression")
  }
  if self.text[self.pos] == '(' {
    self.pos = self.pos + 1
    let v = match self.parse_expr() {
      Ok(v) => v
      Err(e) => return Err(e)
    }
    self.skip_spaces()
    if self.pos >= self.text.length() || self.text[self.pos] != ')' {
      return Err("missing ')' at position \{self.pos}")
    }
    self.pos = self.pos + 1
    return Ok(v)
  }
  self.parse_number()
}

///|
fn CalcParser::parse_number(self : CalcParser) -> Result[Double, String] {
  let start = self.pos
  let mut seen_digit = false
  let mut seen_dot = false
  while self.pos < self.text.length() {
    let c = self.text[self.pos]
    if c >= '0' && c <= '9' {
      seen_digit = true
      self.pos = self.pos + 1
    } else if c == '.' && !seen_dot {
      seen_dot = true
      self.pos = self.pos + 1
    } else {
      break
    }
  }
  if !seen_digit {
    return Err("expected a number at position \{start}")
  }
  let literal = self.text[start:self.pos].to_owned()
  try {
    Ok(@string.parse_double(literal))
  } catch {
    _ => Err("cannot parse number \"\{literal}\"")
  }
}

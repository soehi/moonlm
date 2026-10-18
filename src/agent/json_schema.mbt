// A small JSON Schema validator, covering the subset tool schemas use.
//
// Supported keywords: `type` (single or array), `properties`, `required`,
// `enum`, `items` (single schema), `additionalProperties: false`, `minLength`,
// `maxLength`, `minimum`, `maximum`, and the `integer` type.
//
// Deliberately not a general JSON Schema implementation: no `$ref`, no
// `oneOf`/`anyOf`, no formats. Tool schemas are written in this repository and
// are checked by `tests` in schema_test.mbt, so the supported subset is the
// contract — a schema outside it fails validation loudly rather than being
// silently accepted.

///|
/// One validation failure, with the JSON path where it occurred.
pub(all) struct SchemaError {
  path : String
  message : String
} derive(Eq, Debug)

///|
pub fn SchemaError::to_string(self : SchemaError) -> String {
  if self.path == "" {
    self.message
  } else {
    "\{self.path}: \{self.message}"
  }
}

///|
/// Validate `value` against `schema`.
pub fn validate(schema : Json, value : Json) -> Result[Unit, SchemaError] {
  validate_at(schema, value, "")
}

///|
/// Validate with an explicit path prefix, so nested errors name their location.
fn validate_at(
  schema : Json,
  value : Json,
  path : String,
) -> Result[Unit, SchemaError] {
  // Type first: a missing type keyword means "any".
  match schema {
    Object(props) => {
      match props.get("type") {
        Some(t) =>
          match check_type(t, value) {
            Ok(_) => ()
            Err(msg) => return Err({ path, message: msg })
          }
        None => ()
      }
      // enum: the value must be one of the listed constants.
      match props.get("enum") {
        Some(Array(allowed)) =>
          if !allowed.contains(value) {
            return Err({
              path,
              message: "must be one of \{enum_names(allowed)}",
            })
          }
        Some(_) => return Err({ path, message: "schema error: enum must be an array" })
        None => ()
      }
      // Validation at the value's own kind.
      match value {
        Object(fields) => {
          match props.get("required") {
            Some(Array(reqs)) =>
              for r in reqs {
                match r {
                  String(key) =>
                    if !fields.contains(key) {
                      return Err({
                        path,
                        message: "missing required field \"\{key}\"",
                      })
                    }
                  _ => return Err({ path, message: "schema error: required must be strings" })
                }
              }
            Some(_) => return Err({ path, message: "schema error: required must be an array" })
            None => ()
          }
          let declared = match props.get("properties") {
            Some(Object(p)) => Some(p)
            Some(_) => return Err({ path, message: "schema error: properties must be an object" })
            None => None
          }
          let allow_extra = match props.get("additionalProperties") {
            Some(False) => false
            _ => true
          }
          for key, v in fields {
            let child_path = join_path(path, key)
            match declared {
              Some(d) =>
                match d.get(key) {
                  Some(sub) => {
                    match validate_at(sub, v, child_path) {
                      Ok(_) => ()
                      Err(e) => return Err(e)
                    }
                  }
                  None =>
                    if !allow_extra {
                      return Err({
                        path: child_path,
                        message: "unknown field",
                      })
                    }
                }
              None => ()
            }
          }
        }
        Array(items) => {
          match props.get("items") {
            Some(sub) =>
              for i, item in items {
                match validate_at(sub, item, "\{path}[\{i}]") {
                  Ok(_) => ()
                  Err(e) => return Err(e)
                }
              }
            None => ()
          }
        }
        String(s) => {
          match props.get("minLength") {
            Some(Number(min, ..)) =>
              if Double::from_int(s.length()) < min {
                return Err({ path, message: "must be at least \{min} characters" })
              }
            _ => ()
          }
          match props.get("maxLength") {
            Some(Number(max, ..)) =>
              if Double::from_int(s.length()) > max {
                return Err({ path, message: "must be at most \{max} characters" })
              }
            _ => ()
          }
        }
        Number(n, ..) => {
          match props.get("minimum") {
            Some(Number(min, ..)) =>
              if n < min {
                return Err({ path, message: "must be >= \{min}" })
              }
            _ => ()
          }
          match props.get("maximum") {
            Some(Number(max, ..)) =>
              if n > max {
                return Err({ path, message: "must be <= \{max}" })
              }
            _ => ()
          }
        }
        _ => ()
      }
      Ok(())
    }
    _ => Err({ path, message: "schema error: schema must be an object" })
  }
}

///|
/// Check one `type` keyword (string or array of strings) against a value.
fn check_type(t : Json, value : Json) -> Result[Unit, String] {
  match t {
    String(name) =>
      if matches_type(name, value) {
        Ok(())
      } else {
        Err("must be of type \{name}")
      }
    Array(names) => {
      for n in names {
        match n {
          String(name) =>
            if matches_type(name, value) {
              return Ok(())
            }
          _ => return Err("schema error: type array must contain strings")
        }
      }
      let labels = names.map(fn(n) {
        match n {
          String(s) => s
          _ => "?"
        }
      })
      Err("must be one of the types \{labels.join("|")}")
    }
    _ => Err("schema error: type must be a string or array")
  }
}

///|
fn matches_type(name : String, value : Json) -> Bool {
  match name {
    "object" => value is Object(_)
    "array" => value is Array(_)
    "string" => value is String(_)
    "number" => value is Number(_, ..)
    "integer" =>
      match value {
        Number(n, ..) => n == n.floor() && n.abs() <= 9.007199254740992e15
        _ => false
      }
    "boolean" => value is True || value is False
    "null" => value is Null
    _ => false
  }
}

///|
fn enum_names(values : Array[Json]) -> String {
  values.map(fn(v) { v.stringify() }).join(", ")
}

///|
/// Append one object key to a path, using dot notation.
fn join_path(path : String, key : String) -> String {
  if path == "" {
    key
  } else {
    "\{path}.\{key}"
  }
}

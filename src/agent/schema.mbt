// Typed argument schemas: one definition per tool, used for BOTH the JSON
// Schema the model sees and the decoding the tool performs.
//
// The problem this removes: before this file, a tool's parameter shape existed
// in three places — the hand-written `Json` literal in `parameters_schema`, the
// hand-written `match args { Object(fields) => fields.get(...) }` in `invoke`,
// and the validator's own understanding of keywords. The three could drift, and
// nothing would catch it until a model sent a shape one of them disagreed about.
//
// A `Schema` value here is a *description*, and every capability is derived from
// that one description:
//
//   - `Schema::to_json` renders the JSON Schema the model is shown;
//   - `Schema::decode` walks the same description and returns typed values,
//     failing with a `SchemaError` that carries the field path.
//
// So the schema is the single source of truth: changing a field's type changes
// both what the model is told and what the tool accepts, in one edit.
//
// What this is NOT: a compile-time check. MoonBit's `derive(ToJson, FromJson)`
// exists in core, but core has no facility to derive a *schema* from a type, and
// no custom-derive hook to write one. So validation remains a runtime step. What
// changes is that the schema and the decoder can no longer disagree — the claim
// is "signature is the schema, checked once at the type-level entry point", not
// "rejected by the compiler". See SCOPE.md and PLAN.md ADR-5.

///|
/// One typed field of an object schema.
///
/// `decode` is the accessor: it receives the argument object and the path to
/// this field, and either produces the value or a located error. Building the
/// field with `string()`, `integer()` and friends installs both halves, which is
/// why a caller cannot supply a schema for one type and a decoder for another.
pub(all) struct Field {
  name : String
  /// The JSON Schema fragment for this field.
  schema : Json
  /// Whether the field must be present.
  required : Bool
  /// Default used when an optional field is absent.
  default : String?
  /// Decode the value, or report a located error.
  decode : (Json, String) -> Result[String, SchemaError]
}

///|
/// A schema for a tool's argument object.
pub(all) struct Schema {
  fields : Array[Field]
}

///|
/// Start an object schema.
pub fn Schema::object() -> Schema {
  { fields: [] }
}

///|
/// Add a required field.
pub fn Schema::req(self : Schema, field : Field) -> Schema {
  self.fields.push({ ..field, required: true })
  self
}

///|
/// Add an optional field with a default.
///
/// The default is returned by `decode` when the key is absent, so a tool never
/// sees a missing optional field as an empty string it has to special-case.
pub fn Schema::opt(
  self : Schema,
  field : Field,
  default~ : String,
) -> Schema {
  self.fields.push({ ..field, required: false, default: Some(default) })
  self
}

///|
/// Render the JSON Schema object shown to the model.
///
/// This is the only place that knows how a `Field` maps onto JSON Schema
/// keywords, so the model-facing contract cannot drift from `decode`.
pub fn Schema::to_json(self : Schema) -> Json {
  let properties : Map[String, Json] = Map([])
  let required : Array[Json] = []
  for f in self.fields {
    properties[f.name] = f.schema
    if f.required {
      required.push(Json::string(f.name))
    }
  }
  let base : Map[String, Json] = Map([])
  base["type"] = Json::string("object")
  base["properties"] = Json::object(properties)
  // `required` is omitted rather than emitted empty: an empty array is legal
  // but tells the model nothing, and the prompt block is already large.
  if !required.is_empty() {
    base["required"] = Json::array(required)
  }
  // Unknown keys are rejected so a model that invents a field gets a clear
  // error instead of having it silently ignored.
  base["additionalProperties"] = false
  Json::object(base)
}

///|
/// A string field.
///
/// `min_len` is optional and maps to both the JSON Schema `minLength` keyword
/// and a decode-time check, so the two cannot disagree about whether an empty
/// string is allowed.
pub fn string(
  name~ : String,
  description~ : String,
  min_len? : Int,
) -> Field {
  let base : Map[String, Json] = Map([])
  base["type"] = Json::string("string")
  base["description"] = Json::string(description)
  match min_len {
    Some(n) => base["minLength"] = Json::number(Double::from_int(n))
    None => ()
  }
  let schema = Json::object(base)
  let decode = fn(value : Json, path : String) -> Result[String, SchemaError] {
    match value {
      String(s) =>
        match min_len {
          Some(n) =>
            if s.length() < n {
              Err({
                path,
                message: "must be at least \{n} characters",
              })
            } else {
              Ok(s)
            }
          None => Ok(s)
        }
      _ => Err({ path, message: "must be of type string" })
    }
  }
  { name, schema, required: false, default: None, decode }
}

///|
/// An integer field, for arguments that must be whole numbers.
pub fn integer(
  name~ : String,
  description~ : String,
  minimum? : Int,
) -> Field {
  let base : Map[String, Json] = Map([])
  base["type"] = Json::string("integer")
  base["description"] = Json::string(description)
  match minimum {
    Some(n) => base["minimum"] = Json::number(Double::from_int(n))
    None => ()
  }
  let schema = Json::object(base)
  let decode = fn(value : Json, path : String) -> Result[String, SchemaError] {
    match value {
      Number(n, ..) => {
        if n != n.floor() {
          return Err({ path, message: "must be an integer" })
        }
        match minimum {
          Some(min) =>
            if n < Double::from_int(min) {
              Err({ path, message: "must be >= \{min}" })
            } else {
              Ok(n.to_int().to_string())
            }
          None => Ok(n.to_int().to_string())
        }
      }
      _ => Err({ path, message: "must be of type integer" })
    }
  }
  { name, schema, required: false, default: None, decode }
}

///|
/// A string field restricted to a fixed set of values.
pub fn enum_string(
  name~ : String,
  description~ : String,
  values~ : Array[String],
) -> Field {
  let allowed : Array[Json] = values.map(fn(v) { Json::string(v) })
  let base : Map[String, Json] = Map([])
  base["type"] = Json::string("string")
  base["description"] = Json::string(description)
  base["enum"] = Json::array(allowed)
  let schema = Json::object(base)
  let decode = fn(value : Json, path : String) -> Result[String, SchemaError] {
    match value {
      String(s) =>
        if values.contains(s) {
          Ok(s)
        } else {
          Err({
            path,
            message: "must be one of \{values.map(fn(v) { "\"\{v}\"" }).join(", ")}",
          })
        }
      _ => Err({ path, message: "must be of type string" })
    }
  }
  { name, schema, required: false, default: None, decode }
}

///|
/// The decoded arguments of one tool call.
///
/// Values are strings because that is what every current tool needs (paths,
/// patterns, expressions); `integer` decodes to its decimal text. `get` is the
/// only accessor, so a tool cannot reach into the raw JSON and reintroduce a
/// second decoding path.
pub(all) struct Args {
  values : Map[String, String]
} derive(Debug)

///|
/// Decode `json` against `schema`.
///
/// Every failure is a `SchemaError` with the field path, which is what the
/// drift tests assert on: the message must name *where* the problem is, not just
/// that one exists.
pub fn Schema::decode(
  self : Schema,
  json : Json,
) -> Result[Args, SchemaError] {
  let obj = match json {
    Object(fields) => fields
    _ => return Err({ path: "", message: "arguments must be a JSON object" })
  }
  let values : Map[String, String] = Map([])
  let declared : Map[String, Bool] = Map([])
  for f in self.fields {
    declared[f.name] = true
    match obj.get(f.name) {
      Some(v) =>
        match (f.decode)(v, f.name) {
          Ok(s) => values[f.name] = s
          Err(e) => return Err(e)
        }
      None =>
        match (f.required, f.default) {
          (true, _) =>
            return Err({
              path: f.name,
              message: "missing required field \"\{f.name}\"",
            })
          (false, Some(d)) => values[f.name] = d
          (false, None) => ()
        }
    }
  }
  // Reject unknown keys with their own path, mirroring the
  // `additionalProperties: false` the rendered schema advertises.
  for key, _ in obj {
    if !declared.contains(key) {
      return Err({ path: key, message: "unknown field" })
    }
  }
  Ok({ values, })
}

///|
/// Read a decoded value. Present for every field that was required or had a
/// default; a tool that asks for an absent one gets an empty string rather than
/// a panic, because the schema already guaranteed the field exists.
pub fn Args::get(self : Args, name : String) -> String {
  match self.values.get(name) {
    Some(v) => v
    None => ""
  }
}

///|
/// Whether the caller supplied the field (as opposed to it defaulting).
pub fn Args::has(self : Args, name : String) -> Bool {
  self.values.contains(name)
}

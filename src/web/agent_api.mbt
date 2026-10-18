// JavaScript-facing agent API.
//
// The point of this file is that the browser runs the SAME `@agent.run_agent`
// the CLI does, against the same `Engine` trait, with the same parser and the
// same schema validator. What differs is only which tools are registered:
//
//   * `calc` — real, pure MoonBit, identical to the native build.
//   * a set of in-memory demo tools (a virtual workspace) — because the browser
//     has no filesystem.
//
// The filesystem tools (`list_dir`, `read_file`, `grep_text`) are deliberately
// NOT registered here, and their absence is a design decision rather than an
// omission:
//
//   * A page has no synchronous filesystem, so exposing `read_file` would mean
//     faking it against a virtual tree — and a model that learned to call it
//     in the browser would have learned nothing transferable to the CLI.
//   * More importantly, there is no trustworthy "workspace root" in a page. The
//     sandbox's whole guarantee is that a path from model output is canonicalized
//     and prefix-checked against a real directory; in a browser there is no real
//     directory to check against, so the guarantee would be theatre.
//
// The demo tools are named with a `demo_` prefix so a transcript cannot be
// mistaken for a run with real file access.

///|
/// A virtual file for the browser demo, so the agent loop has something to read
/// without pretending to be a filesystem.
///
/// Deliberately a flat name -> content map with no path handling at all: no
/// directory traversal, no symlinks, nothing that could be confused with the
/// real sandbox.
let demo_files : Array[(String, String)] = [
  (
    "notes.md",
    "# Demo notes\n\nThis file lives in the page, not on disk. The agent loop, the JSON parser and the schema validator are the same code the CLI runs; only the tool set differs.",
  ),
  (
    "numbers.txt",
    "alpha 12\nbeta 34\ngamma 56\n",
  ),
]

///|
/// Register the browser tool set: the real `calc` plus the demo file tools.
fn demo_registry() -> @agent.ToolRegistry {
  let registry = @agent.ToolRegistry::new()
  registry.add(@tools.CalcTool::{}) |> ignore
  registry.add(DemoListTool::{}) |> ignore
  registry.add(DemoReadTool::{}) |> ignore
  registry
}

///|
/// `demo_list`: names of the virtual files.
struct DemoListTool {} derive(Debug)

///|
pub impl @agent.Tool for DemoListTool with fn name(self : DemoListTool) -> String {
  let _ = self
  "demo_list"
}

///|
pub impl @agent.Tool for DemoListTool with fn description(
  self : DemoListTool,
) -> String {
  let _ = self
  "List the names of the browser demo files. This is NOT the filesystem."
}

///|
pub impl @agent.Tool for DemoListTool with fn parameters_schema(
  self : DemoListTool,
) -> Json {
  let _ = self
  { "type": Json::string("object"), "properties": {} }
}

///|
pub impl @agent.Tool for DemoListTool with fn invoke(
  self : DemoListTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let _ = (self, args)
  Ok({
    text: demo_files.map(fn(pair) {
      let (name, _) = pair
      name
    }).join("\n"),
    truncated: false,
    provides_evidence: false,
  })
}

///|
/// `demo_read`: read one virtual file by exact name.
struct DemoReadTool {} derive(Debug)

///|
pub impl @agent.Tool for DemoReadTool with fn name(self : DemoReadTool) -> String {
  let _ = self
  "demo_read"
}

///|
pub impl @agent.Tool for DemoReadTool with fn description(
  self : DemoReadTool,
) -> String {
  let _ = self
  "Read one browser demo file by exact name, e.g. \"notes.md\". This is NOT the filesystem."
}

///|
pub impl @agent.Tool for DemoReadTool with fn parameters_schema(
  self : DemoReadTool,
) -> Json {
  let _ = self
  {
    "type": Json::string("object"),
    "properties": {
      "name": {
        "type": Json::string("string"),
        "description": Json::string("Exact file name, as returned by demo_list."),
      },
    },
    "required": Json::array([Json::string("name")]),
    "additionalProperties": false,
  }
}

///|
pub impl @agent.Tool for DemoReadTool with fn invoke(
  self : DemoReadTool,
  args : Json,
) -> Result[@agent.ToolOutput, @agent.ToolError] {
  let _ = self
  let name = match args {
    Object(fields) =>
      match fields.get("name") {
        Some(String(s)) => s
        Some(_) => return Err(InvalidArguments(message="\"name\" must be a string"))
        None => return Err(InvalidArguments(message="missing field \"name\""))
      }
    _ => return Err(InvalidArguments(message="arguments must be a JSON object"))
  }
  for pair in demo_files {
    let (file_name, content) = pair
    if file_name == name {
      return Ok({ text: content, truncated: false, provides_evidence: true })
    }
  }
  // A miss is an observation, not a crash: the model can call demo_list.
  Err(
    IoFailure(
      message="no demo file named \"\{name}\"; call demo_list for the names",
    ),
  )
}

///|
/// One step of an agent run, as a flat string array so JavaScript can index it
/// without a decoder.
///
/// Layout: `[step, kind, name, detail]` where `kind` is `"call"`, `"error"` or
/// `"answer"`. Returned as `Array[String]` rather than a struct for the same
/// reason the inference API returns a number array: MoonBit records do not
/// cross into JavaScript.
let last_trace : Array[String] = []

///|
/// Run the agent loop in the browser and return the transcript.
///
/// Returns one flat array of 4-string records; an empty array means the run
/// failed before producing a step, with the reason in `moonlm_last_error()`.
#export_name("moonlm_agent_run")
pub fn moonlm_agent_run(
  handle : Int,
  task : String,
  max_steps : Int,
) -> FixedArray[String] {
  let engine = match engine_of(handle) {
    Err(e) => {
      fail(e) |> ignore
      return []
    }
    Ok(engine) => engine
  }
  last_trace.clear()
  let config : @agent.AgentConfig = {
    max_steps,
    max_calls_per_step: 4,
    max_tokens_per_step: 256,
    max_observation_chars: 2048,
    max_history_chars: 4000,
    temperature: 0.0,
    seed: 42UL,
    require_evidence: true,
  }
  let result = @agent.run_agent(
    engine,
    demo_registry(),
    @agent.Qwen2Xml,
    @agent.Qwen2ChatMl,
    task,
    config,
  )
  let mut step = 0
  for call in result.executed {
    last_trace.push(step.to_string())
    last_trace.push("call")
    last_trace.push(call.name)
    last_trace.push(call.observation)
    step = step + 1
  }
  last_trace.push(step.to_string())
  last_trace.push("answer")
  last_trace.push("")
  last_trace.push(result.answer)
  last_error.val = ""
  FixedArray::from_array(last_trace)
}

///|
/// Why the last `moonlm_agent_run` stopped, for the page to display.
#export_name("moonlm_agent_stop")
pub fn moonlm_agent_stop(handle : Int, task : String) -> String {
  // Re-running to report the stop reason would double the cost of a slow
  // browser generation, so the reason is derived from the trace the caller
  // already has: an empty answer means the loop stopped on a budget.
  let _ = (handle, task)
  if last_trace.length() == 0 {
    "no run"
  } else {
    let answer = last_trace[last_trace.length() - 1]
    if answer == "" {
      "stopped without a final answer (step limit, invalid call, or context)"
    } else {
      "answered"
    }
  }
}

///|
/// The tool names the browser registers, so a page can show them without
/// hardcoding the list.
#export_name("moonlm_agent_tools")
pub fn moonlm_agent_tools() -> FixedArray[String] {
  FixedArray::from_array(demo_registry().names())
}

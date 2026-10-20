# `src/agent` — scope and boundaries

What this package is, what it deliberately is not, and where it stops relative
to [moonkoog](https://github.com/moonbitlang/moonkoog) and to a general agent
framework.

## Scope

**Typed tool signatures.** A tool declares its arguments once, as a `Schema`
value (`src/agent/schema.mbt`). That one declaration renders the JSON Schema the
model is shown and drives the decoder the tool uses, so the two cannot describe
different shapes. Adding or changing a field is one edit.

**Schema validation.** `Schema::decode` checks types, required fields, unknown
fields and declared constraints, and reports the field path on failure. This is
a runtime check at a single entry point, not a compiler check: core's
`derive(ToJson, FromJson)` decodes from a type but cannot derive a *schema*, and
there is no custom-derive hook to add that. The honest claim is "signature is the
schema, validated once at the type-level entry point, at run time" — see PLAN.md
ADR-5.

**Tool-call parsing as a replaceable strategy.** `ToolCallFormat` is an enum and
each variant has a standalone parser. The loop contains no tag literals, so a
new model family is a new variant plus a function, not an edit to the loop.

**The execution loop.** Generate → parse → validate → invoke → feed back, with
step, context and stop conditions. Engine-agnostic: it takes an
`@engine.Engine`, so the same loop runs on `PureEngine` in the CLI and in a
browser.

**The evidence gate.** A run can refuse a final answer that was produced without
any content-bearing observation, turning "answered from a directory listing" into
an explicit retry. Measured behaviour and its limits are in `docs/agent.md`.

**Local inference binding.** The loop is designed around a local `PureEngine`:
no network, no API keys, no remote model. That binding is the point — it is what
makes the sandbox meaningful, because the model and the data are on the same
machine.

## Non-goals (and the division with moonkoog)

These are out of scope here. Where moonkoog covers them, that is the intended
division rather than an overlap.

| Area | Why it is not here |
|---|---|
| **General orchestration** | Workflow graphs, retries across agents, scheduling, human-in-the-loop approvals. moonkoog is the orchestration layer; this package is one loop with one model. |
| **Multi-agent collaboration** | No agent registry, message bus, or shared task board. Composing agents is an orchestration concern. |
| **Remote tools / transport** | No HTTP, WebSocket, or MCP client. Every tool here is a local function call; a remote tool would need a transport layer and a trust model this package does not define. |
| **Wasm sandbox policy** | This package runs inside whatever sandbox the host provides. It does not configure, enforce or audit Wasm isolation — that belongs to the official runtime boundary, not to a library that a host embeds. |
| **Model serving** | No batching, no KV-cache sharing across requests, no concurrent decode. One engine, one loop, sequential. |
| **Write-side tools** | The built-in tools are read-only by construction. Adding a writer is a security-surface decision, not a feature. |

The sandbox in `src/tools` is a *path* sandbox (canonicalize, then prefix-check),
not a process sandbox. It answers "may this path be touched", not "what may this
code do". The latter is the runtime's job.

## Watch item: if moonkoog adds schema derivation

This package's differentiation narrows over time, and it is better to say so
than to let a positioning claim age into something false.

**If moonkoog (or core) later gains the ability to derive a JSON Schema from a
MoonBit type**, the "signature is the schema" advantage becomes shared
infrastructure rather than a reason to choose this package. What would remain
distinctive here:

1. **The evidence gate** — refusing ungrounded answers, with the measured
   failure modes in `docs/agent.md`. That is a behavioural policy, not a type
   feature.
2. **The local-inference binding** — one loop wired to `PureEngine`, with the
   sandbox and the model on the same host.

Everything else — typed signatures, schema validation, call parsing, the loop
itself — should be assumed to converge with the ecosystem rather than stay
unique. Revisit this section when moonkoog's schema story changes; until then,
no stronger claim is made.

## Related

- `docs/agent.md` — measured tool-call success rate, failure modes, and the
  model capability boundary.
- `PLAN.md` ADR-5 — the decision record, including the runtime-vs-compile-time
  correction.
- `src/tools/` — the sandboxed local tools; its README section states the
  read-only guarantee.

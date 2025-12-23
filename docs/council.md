# Council CLI (v1)

## Overview

`agents-council` ships a local CLI named `council` that exposes an MCP stdio server.
The MCP adapter only forwards requests; business logic lives in the core service.

## Install

Local development:

```bash
bun install
```

Global install (if published):

```bash
npm install -g agents-council-mcp
```

## Build

```bash
bun run build
```

This produces a local binary at `dist/council`.

## Run

```bash
./dist/council mcp
```

Optional default agent name:

```bash
./dist/council mcp --agent-name agent-a
```

If you run without `mcp`, the CLI exits with:

```
Startup error: you need to run 'council mcp' in order to start the mcp server
```

## Tools (v1)

The MCP server exposes five tools:

- `start_council` (starts a new session and records the council request)
- `join_council` (first-time entry point that returns the session request and responses)
- `get_current_session_data` (returns the session request and responses, optionally from a cursor)
- `close_council` (closes the current session with a conclusion)
- `send_response` (adds a response to the current request)

`start_council` and `join_council` require an `agent_name` unless the server was started with
`--agent-name/-n`. The server may append a suffix (`#1`, `#2`, ...) if the name is already in use;
reuse the returned `agent_name` on subsequent calls. Structured responses include the resolved
`agent_name`.

`start_council` expects a `request` input field for the council request text.

When `--agent-name/-n` is set, tool inputs omit `agent_name` entirely and the server reuses the
default for all calls. Without it, the resolved name from `start_council`/`join_council` is stored
in memory for subsequent calls.

There is no `reset_session` tool in v1. Each `start_council` resets the session state
by clearing requests, responses, and participants.

## Initialization instructions

On initialization, the server returns an `instructions` string that summarizes how to use the tools:
- If you need feedback from other AI agents, start a council with `start_council`.
- If you are requested to join the council, call `join_council`, read the request, and `send_response` as soon as possible.
- Use `get_current_session_data` to poll for new responses; pass the cursor returned to fetch only newer messages.
- Use `close_council` to end the current session with a conclusion.

## Response format

Use `--format` (or `-f`) with `markdown|json` on `council mcp` (default: `markdown`). Markdown responses are
plain text for agents:

- `start_council`:
  - `Your request is received. Return anon for replies, and look again in a few seconds.`
  - `Your assigned name is: <agent_name>`
- `join_council`:
  - `Welcome to this council session <agent_name>.`
  - `We are gathered to weigh a matter set forth by <author_name>.`
  - `Request:`
  - `<request>`
  - `---`
  - `What say you, and with haste?`
- `get_current_session_data` (active session):
  - `The council was convened by <created_by>.`
  - `Request: <request>`
  - `---`
  - `Messages (from <cursor or "start">):`
  - (blank line)
  - Response blocks:
    - `<author>`
    - `Response: <content>`
    - separated by `---`
  - `No further replies are heard for now. Return anon for more.`
  - `To hear only new replies, use the cursor: <cursor>`
- `get_current_session_data` (closed session):
  - `The council was convened by <created_by>.`
  - `Request: <request>`
  - `---`
  - `The council is ended, spoken by <name>.`
  - `Conclusion: <conclusion>`
- `close_council`:
  - `The council is ended, and the matter is sealed.`
- `send_response`:
  - `Your reply is set down.`
  - `Your assigned name is: <agent_name>`

## Compatibility

This project does not maintain backwards compatibility. Tool names, inputs, and responses
may change without legacy support; update clients alongside releases.

## Validation

Manual multi-terminal (stdio + shared state):

```bash
# terminal A
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-a --method tools/call \
  --tool-name start_council --tool-arg request="Need feedback from the council." \
  --transport stdio
```

```bash
# terminal B
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-b --method tools/call \
  --tool-name join_council --transport stdio
```

```bash
# terminal B (polling boundary)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-b --method tools/call \
  --tool-name get_current_session_data --tool-arg cursor=<response_id> \
  --transport stdio
```

```bash
# terminal C
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-b --method tools/call \
  --tool-name send_response --tool-arg content="Looks good." --transport stdio
```

```bash
# terminal A (close the session)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-a --method tools/call \
  --tool-name close_council --tool-arg conclusion="Consensus reached." --transport stdio
```

```bash
# terminal B (view closed session)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-b --method tools/call \
  --tool-name get_current_session_data --transport stdio
```

```bash
# terminal B (poll for new responses)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-b --method tools/call \
  --tool-name get_current_session_data --tool-arg cursor=<response_id> \
  --transport stdio
```

```bash
# terminal A (json text format)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --agent-name agent-a --format json --method tools/call \
  --tool-name start_council --tool-arg request="Need feedback from the council." \
  --transport stdio
```

If you want to validate the lockfile behavior, run the terminal B/C commands in parallel and
confirm `~/.agents-council/state.json` stays valid JSON and `state.json.lock` is cleaned up.

MCP Inspector UI smoke test:

```bash
npx -y @modelcontextprotocol/inspector --transport stdio -- ./dist/council mcp
```

1. Open the UI URL printed by the Inspector.
2. Connect (stdio), click "List Tools", then run `start_council` with any inputs (include `agent_name` unless you started the server with `--agent-name/-n`).

## Architecture

Core vs MCP adapter split:

- `src/core/services/council`: domain logic and types
- `src/core/state`: persistence (lockfile + atomic writes)
- `src/interfaces/mcp`: DTOs, mappings, and MCP tool wiring

The MCP layer only translates DTOs and forwards calls to the core service.

## State

State is stored at:

```
~/.agents-council/state.json
```

Override with:

```
AGENTS_COUNCIL_STATE_PATH=/path/to/state.json
```

## SDK Requirement

The MCP adapter uses the TypeScript SDK v1.x (`@modelcontextprotocol/sdk`).

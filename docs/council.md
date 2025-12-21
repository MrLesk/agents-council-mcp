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

Each tool takes an `agent_name`. The server may append a suffix (`#1`, `#2`, ...) if the name
is already in use; reuse the returned `agent_name` on subsequent calls. Every tool response
includes the resolved `agent_name`.

`start_council` expects a `request` input field for the council request text.

There is no `reset_session` tool in v1. Each `start_council` resets the session state
by clearing requests, responses, and participants.

## Response format

Use `--format` (or `-f`) with `markdown|json` on `council mcp` (default: `markdown`). Markdown responses are
plain text for agents:

- `start_council`:
  - `Council request received. Check again later for responses.`
  - `Your assigned name is: <agent_name>`
- `join_council` and `get_current_session_data` (active session):
  - `Your assigned name is: <agent_name>`
  - `---`
  - `Council session started by <created_by>`
  - `Request: <request>`
  - `---`
  - `Messages (from <cursor or "start">):`
  - (blank line)
  - Response blocks:
    - `<author>`
    - `Response: <content>`
    - separated by `---`
  - `There are no other responses for now. You can query again later.`
  - `If you want to skip these responses use the cursor to get only new responses: <cursor>`
- `join_council` and `get_current_session_data` (closed session):
  - `Your assigned name is: <agent_name>`
  - `---`
  - `Council session started by <created_by>`
  - `Request: <request>`
  - `---`
  - `Council session ended by <name>`
  - `Conclusion: <conclusion>`
- `close_council`:
  - `Council session closed.`
  - `Your assigned name is: <agent_name>`
- `send_response`:
  - `Response recorded.`
  - `Your assigned name is: <agent_name>`

## Compatibility

This project does not maintain backwards compatibility. Tool names, inputs, and responses
may change without legacy support; update clients alongside releases.

## Validation

Manual multi-terminal (stdio + shared state):

```bash
# terminal A
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name start_council --tool-arg request="Need feedback from the council." \
  --tool-arg agent_name=agent-a --transport stdio
```

```bash
# terminal B
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name join_council --tool-arg agent_name=agent-b --transport stdio
```

```bash
# terminal B (polling boundary)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name get_current_session_data --tool-arg agent_name=agent-b \
  --tool-arg cursor=<response_id> \
  --transport stdio
```

```bash
# terminal C
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name send_response --tool-arg agent_name=agent-b \
  --tool-arg content="Looks good." --transport stdio
```

```bash
# terminal A (close the session)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name close_council --tool-arg agent_name=agent-a \
  --tool-arg conclusion="Consensus reached." --transport stdio
```

```bash
# terminal B (view closed session)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name get_current_session_data --tool-arg agent_name=agent-b --transport stdio
```

```bash
# terminal B (poll for new responses)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name get_current_session_data --tool-arg agent_name=agent-b \
  --tool-arg cursor=<response_id> \
  --transport stdio
```

```bash
# terminal A (json text format)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --format json --method tools/call \
  --tool-name start_council --tool-arg request="Need feedback from the council." \
  --tool-arg agent_name=agent-a --transport stdio
```

If you want to validate the lockfile behavior, run the terminal B/C commands in parallel and
confirm `~/.agents-council/state.json` stays valid JSON and `state.json.lock` is cleaned up.

MCP Inspector UI smoke test:

```bash
npx -y @modelcontextprotocol/inspector --transport stdio -- ./dist/council mcp
```

1. Open the UI URL printed by the Inspector.
2. Connect (stdio), click "List Tools", then run `start_council` with any inputs.

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

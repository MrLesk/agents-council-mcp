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
npm install -g agents-council
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

The MCP server exposes three tools:

- `request_feedback` (starts a new session and resets any existing session state)
- `check_session` (polls for new requests/feedback)
- `provide_feedback` (adds feedback for a request)

There is no `reset_session` tool in v1. Each `request_feedback` resets the session state
by clearing requests, feedback, and participants.

## Validation

Manual multi-terminal (stdio + shared state):

```bash
# terminal A
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name request_feedback --tool-arg content="Need feedback from the council." \
  --tool-arg agent_id=agent-a --transport stdio
```

```bash
# terminal B
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name check_session --tool-arg agent_id=agent-b --transport stdio
```

```bash
# terminal B (polling boundary)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name check_session --tool-arg agent_id=agent-b \
  --tool-arg cursor='{"last_request_seen":"<request_id>","last_feedback_seen":null}' \
  --transport stdio
```

```bash
# terminal C
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name provide_feedback --tool-arg agent_id=agent-b \
  --tool-arg request_id=<request_id> --tool-arg content="Looks good." --transport stdio
```

```bash
# terminal B (poll for new feedback)
npx -y @modelcontextprotocol/inspector --cli ./dist/council mcp --method tools/call \
  --tool-name check_session --tool-arg agent_id=agent-b \
  --tool-arg cursor='{"last_request_seen":"<request_id>","last_feedback_seen":null}' \
  --transport stdio
```

If you want to validate the lockfile behavior, run the terminal B/C commands in parallel and
confirm `~/.agents-council/state.json` stays valid JSON and `state.json.lock` is cleaned up.

MCP Inspector UI smoke test:

```bash
npx -y @modelcontextprotocol/inspector --transport stdio -- ./dist/council mcp
```

1. Open the UI URL printed by the Inspector.
2. Connect (stdio), click "List Tools", then run `request_feedback` with any inputs.

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

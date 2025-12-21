# Plan

Build a Bun + TypeScript CLI (npm package: `agents-council`, binary: `council`) that exposes an MCP stdio server through `council mcp`. The MCP interface must use the TypeScript MCP SDK v1.x only (no 2.x). Core domain logic lives in `src/core` and is consumed by the MCP interface layer.

## Requirements
- Use `@modelcontextprotocol/sdk` v1.x (do not use SDK 2.x).
- MCP stdio transport via the SDK.
- CLI entry: `council mcp` starts the stdio MCP server.
- Running `council` (without `mcp`) prints: `Startup error: you need to run council mcp in order to start the mcp server`.
- NPM package name is `agents-council`; binary name is `council`.
- Domain-driven structure: `src/core` contains domain types, services, and state. No business logic in MCP layer.
- Tools only: `start_council`, `join_council`, `get_current_session_data`, `close_council`, `send_response`.
- Session creation is implicit in `start_council`, which resets prior session state.
- Join is implicit in `get_current_session_data`.
- Single active session; no history; explicit close via `close_council`.
- Non-blocking tool calls with explicit polling boundaries.
- Shared state at `~/.agents-council/state.json` (configurable override).
- Bun runtime for execution and compiled distribution.

## Scope
- In: Bun/TS CLI + MCP server using SDK v1.x, JSON state store, polling semantics, core domain service, docs for each agent CLI.
- Out: resources/notifications, gossip/discovery between servers, multi-session history, remote HTTP mode (future), server-to-server networking.

## Files and entry points
- `src/cli/index.ts`: parse args, enforce `council mcp` usage.
- `src/interfaces/mcp/server.ts`: MCP stdio server (SDK v1.x) adapter.
- `src/core/services/council/types.ts`: service-scoped domain types.
- `src/core/services/council/index.ts`: CouncilService interface + implementation.
- `src/core/state/`: JSON load/save, file locking, atomic write.
- `package.json`, `tsconfig.json`, `bunfig.toml`: Bun build/run config and bin mapping.
- `docs/` updates: usage and client configuration snippets.

## Data model / state schema
JSON root (example structure):
```json
{
  "version": 1,
  "session": {
    "id": "uuid",
    "status": "active",
    "created_at": "iso",
    "current_request_id": "uuid",
    "conclusion": null
  },
  "requests": [
      {
        "id": "uuid",
        "content": "...",
        "created_by": "agent_name",
        "created_at": "iso",
        "status": "open"
      }
  ],
  "feedback": [
      {
        "id": "uuid",
        "request_id": "uuid",
        "author": "agent_name",
        "content": "...",
        "created_at": "iso"
      }
  ],
  "participants": [
      {
        "agent_name": "agent_name",
        "last_seen": "iso",
        "last_request_seen": "uuid",
        "last_feedback_seen": "uuid"
      }
  ]
}
```

## Tool semantics
- `start_council({ request, agent_name })`
  - Reset any prior session state (clear requests, responses, participants).
  - Create a new session and request, set as current.
  - Returns `session_id`, `request_id`.

- `join_council({ agent_name })`
  - Join the current session and return the full session view (same as `get_current_session_data` without a cursor).

- `get_current_session_data({ agent_name, cursor? })`
  - Implicitly joins the session (registers/updates participant).
  - Returns the session request and any responses since `cursor` (response cursor token string).
  - Updates participant `last_seen` and cursor markers.

- `close_council({ agent_name, conclusion })`
  - Marks the current session closed and records a conclusion.

- `send_response({ agent_name, content })`
  - Appends a response for the current request.
  - Returns ack + current aggregate state summary.

## Locking and atomic writes
- Use a lockfile (e.g., `state.json.lock`) to serialize access.
- Stale lock cleanup on timeout.
- Writes are atomic: write to `state.json.tmp`, fsync, rename.
- Provide env override: `AGENTS_COUNCIL_STATE_PATH`.

## Action items
1. Scaffold Bun + TS project with `council` CLI entry and compile pipeline.
2. Define `src/core` domain types and `CouncilService` interface.
3. Implement state layer with lockfile + atomic write in core.
4. Implement `CouncilService` logic and polling cursor rules.
5. Implement MCP stdio adapter using SDK v1.x that calls `CouncilService`.
6. Document CLI usage and client setup (Codex/Claude/Gemini/Copilot).

## Testing and validation
- Manual 2-3 terminal run using `council mcp` (two clients).
- Concurrent read/write tests for lock reliability.
- MCP Inspector smoke test for tool round-trips.

## Risks and edge cases
- Cross-platform lock reliability and stale locks after crashes.
- State growth without pruning.
- Polling cursor bugs causing missed feedback.
- SDK v1.x vs v2.x dependency drift.

## Open questions
- None

## Inspiration

- LLM Council - Andrej Karpathy https://github.com/karpathy/llm-council
- Oracle - Peter Steinberger https://github.com/steipete/oracle
- MCP Agent Mail - Jeff Emanuel https://github.com/Dicklesworthstone/mcp_agent_mail
- Agent swarms rumor - SIGKITTEN https://x.com/SIGKITTEN/status/2001518558841299444

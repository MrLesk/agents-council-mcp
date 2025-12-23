---
id: task-12.1
title: Add council chat CLI command and lifecycle handling
status: Done
assignee:
  - Codex
created_date: '2025-12-23 22:03'
updated_date: '2025-12-23 22:28'
labels: []
milestone: v0.2.0 Chat UI
dependencies: []
parent_task_id: task-12
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a CLI entrypoint to run the local chat server with port selection, auto-open, and graceful shutdown.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `council chat` accepts `--port/-p` and fails with a clear error when the port is already in use.
- [x] #2 By default the browser opens; `--no-open` suppresses auto-open.
- [x] #3 Startup prints the specified three-line banner text.
- [x] #4 Ctrl+C or SIGTERM stops the server and exits within a short timeout.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Introduce `commander` to define the CLI entrypoint with `mcp` and `chat` subcommands, keeping argument parsing and help/usage centralized.
- Add `chat` flags `--port/-p` and `--no-open`, validate port range, and surface unknown args as errors.
- Add a chat server entrypoint (e.g., `src/interfaces/chat/server.ts`) that binds Bun.serve on the requested port and surfaces a clear port-in-use error.
- Implement auto-open helper that invokes the platform browser launcher unless `--no-open` is set; log a warning on failure.
- Wire graceful shutdown on SIGINT/SIGTERM: stop the server, then force-exit after a short timeout if needed.
- Print the required three-line startup banner once the server is listening.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented commander-based CLI with new chat subcommand, port/no-open flags, startup banner, and signal-based shutdown handling.

Added chat server entrypoint with port-in-use error message and localhost URL output.

Typecheck: `bun run typecheck`
<!-- SECTION:NOTES:END -->

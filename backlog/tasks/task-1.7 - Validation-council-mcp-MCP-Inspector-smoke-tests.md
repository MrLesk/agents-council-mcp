---
id: task-1.7
title: 'Validation: council mcp + MCP Inspector smoke tests'
status: Done
assignee:
  - codex
created_date: '2025-12-21 11:25'
updated_date: '2025-12-21 17:53'
labels: []
milestone: Council v1 (stdio)
dependencies:
  - task-1.5
parent_task_id: task-1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validate the stdio MCP server using the `council mcp` command and capture repeatable Inspector steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manual multi-terminal run using `council mcp` confirms session creation, polling, and lock behavior.
- [x] #2 MCP Inspector smoke test succeeds for tools/list and tools/call.
- [x] #3 Validation steps are captured in project docs or runbook.
- [x] #4 Linting passes (Biome).
- [x] #5 Formatting check passes (Biome).
- [x] #6 Type check passes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
References:
- docs/mcp/docs/tools/inspector.md
- docs/mcp/specification/2025-11-25/basic/transports.md

Validation: inspector CLI calls (request_feedback/check_session/provide_feedback + cursor polling) confirmed session creation and polling; shared state JSON remained valid after multiple updates.

Inspector UI: connected via stdio, listed tools, ran request_feedback successfully.

Checks: bun run lint, bun run format:check, bun run typecheck.
<!-- SECTION:NOTES:END -->

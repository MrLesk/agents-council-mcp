---
id: task-12.2
title: Expose CouncilService HTTP API for chat UI
status: Done
assignee:
  - Codex
created_date: '2025-12-23 22:03'
updated_date: '2025-12-23 22:43'
labels: []
milestone: v0.2.0 Chat UI
dependencies: []
parent_task_id: task-12
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide HTTP endpoints that mirror council actions for the chat interface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 HTTP endpoints exist for start/join/get/send/close with JSON request and response bodies.
- [x] #2 Invalid or missing inputs return clear errors without crashing the server.
- [x] #3 Responses include resolved agent name and the session/request/feedback data needed by the UI.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Extend `src/interfaces/chat/server.ts` to register HTTP `POST` routes for `/start-council`, `/join-council`, `/get-current-session-data`, `/send-response`, and `/close-council`.
- Instantiate `CouncilServiceImpl` with `FileCouncilStateStore` for the chat server and call it from each handler.
- Validate JSON inputs (required fields and types) and return 400 with a clear error message on invalid input; return 500 for unexpected errors without crashing.
- Return JSON responses that include resolved `agent_name` plus session/request/feedback/participant data needed by the UI (reusing existing MCP DTO mapping where possible).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented POST endpoints for start/join/get/send/close in chat server with JSON request/response handling and error reporting.

Reused MCP DTO mappers so responses include agent_name and full session/request/feedback data.

Typecheck: `bun run typecheck`
<!-- SECTION:NOTES:END -->

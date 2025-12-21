---
id: task-1.4
title: CouncilService logic + polling semantics
status: Done
assignee:
  - codex
created_date: '2025-12-21 11:24'
updated_date: '2025-12-21 17:05'
labels: []
milestone: Council v1 (stdio)
dependencies:
  - task-1.3
parent_task_id: task-1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the CouncilService behaviors (request, check, provide, reset) on top of the core state store, with cursor-based polling rules and participant tracking.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CouncilService implements request_feedback, check_session, provide_feedback, and reset_session behaviors.
- [x] #2 check_session returns only new requests/feedback since the cursor and updates participant markers.
- [x] #3 Polling behavior is non-blocking and avoids duplicate delivery across cursors.
- [x] #4 Service logic uses core state store without MCP-specific code.
- [x] #5 Linting passes (Biome).
- [x] #6 Formatting check passes (Biome).
- [x] #7 Type check passes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Plan (subtask 1.4):
- Implement CouncilServiceImpl in src/core/services/council/index.ts using the core state store.
- requestFeedback: create session if missing, append request, set current request, update requester participant markers.
- checkSession: resolve effective cursor (input cursor or participant markers), return current request if new, return feedback since cursor, update participant markers and cursor.
- provideFeedback: append feedback for the request, update author participant markers.
- resetSession: clear session, requests, feedback, participants while preserving version.
- Keep logic core-only (no MCP DTOs) and run lint/format/typecheck.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
References:
- docs/mcp/specification/2025-11-25/server/utilities/pagination.md
- docs/mcp/specification/2025-11-25/basic/lifecycle.md
- docs/bun/docs/guides/util/javascript-uuid.md

Implemented CouncilServiceImpl logic in src/core/services/council/index.ts using core state store update flow, with cursor-based polling, participant updates, non-blocking checks, and reset behavior. Lint/format/typecheck pass.
<!-- SECTION:NOTES:END -->

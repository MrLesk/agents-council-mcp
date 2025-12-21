---
id: task-5
title: Add close_council tool to end the current session
status: Done
assignee:
  - codex
created_date: '2025-12-21 21:08'
updated_date: '2025-12-21 21:31'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a `close_council` tool that marks the current session as completed and records a required conclusion. After closure, `join_council` and `get_current_session_data` should return the session header with an explicit closure section until a new `start_council` begins another session.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `close_council` is exposed as a tool with input schema containing `agent_name` and required `conclusion`.
- [x] #2 Closing a session marks it as completed and stores the conclusion author and text in state.
- [x] #3 When the current session is closed, `join_council` and `get_current_session_data` return a response that includes the closure lines:
- `Council session ended by <name>`
- `Conclusion: <conclusion>`
- [x] #4 A new `start_council` replaces the closed session and clears prior requests/responses/participants as before.
- [x] #5 Docs and validation examples describe `close_council`, its inputs, and the closed-session response behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Extend core state to record a session closed status plus conclusion fields (author + text), and add a `closeCouncil` service method that validates an active session, sets the closure, and persists it.
- Add a `close_council` tool in the MCP server (input: `agent_name`, `conclusion`) wired to the new service method, with Markdown/JSON text output per the existing format flag.
- Update `get_current_session_data` and `join_council` text rendering to include the closure block when the session is closed, while keeping the request + responses header intact.
- Update docs and validation examples to cover `close_council` and closed-session behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented close_council flow, session closure state, and closed-session rendering in MCP adapter + docs. Tests not run (not requested).
<!-- SECTION:NOTES:END -->

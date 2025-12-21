---
id: task-3
title: Add server response format flag for JSON vs Markdown tool outputs
status: Done
assignee:
  - codex
created_date: '2025-12-21 19:03'
updated_date: '2025-12-21 20:48'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update tool responses to support human-readable Markdown alongside JSON text, configured at `council mcp` startup via `--format` (or `-f`), and rename tools/inputs for clearer agent usage.

Tool naming + input updates:
- Rename `request_feedback` to `start_council`.
- Rename `check_session` to `get_current_session_data`.
- Rename `provide_feedback` to `send_response`.
- In `start_council`, rename input field `content` to `request`.
- `send_response` inputs are `agent_name`, `content` (no `request_id`).
- Cursor fields should drop request/feedback naming; use a single response cursor token (string) for input/output.

`start_council` response (for requester):
- `Council request received. Check again later for responses.`
- `Your assigned name is: <agent_name>`

`get_current_session_data` response (message feed):
- `Your assigned name is: <agent_name>`
- `---`
- `Council session started by <created_by>`
- `Request: <request>`
- `---`
- `Messages (from <cursor or "start">):`
- Blank line, then each response block:
  - `<author>`
  - `Response: <content>`
  - Separated by `---`
- After listed responses:
  - `There are no other responses for now. You can query again later.`
  - `If you want to skip these responses use the cursor to get only new responses: <cursor>`
- Semantics: a session has one request created at `start_council`; no other requests occur. Without a cursor, include all responses in the current session; with a cursor, include responses after the cursor.

`send_response` response:
- `Response recorded.`
- `Your assigned name is: <agent_name>`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `council mcp` accepts `--format`/`-f` with values `markdown` or `json`; default is markdown.
- [x] #2 Tools are renamed: `start_council` (inputs: `request`, `agent_name`), `get_current_session_data` (inputs: `agent_name`, `cursor`), `send_response` (inputs: `agent_name`, `content`). Tool schemas remain focused on inputs only (format configured at startup).
- [x] #3 Cursor is a single response token (string) for both input `cursor` and output `next_cursor`; no request/feedback cursor fields remain in the public API.
- [x] #4 `content[0].text` is Markdown when format=markdown and JSON string when format=json; `structuredContent` is always populated.
- [x] #5 Markdown output matches the plain-text spec above, including `---` separators, the session/request header block, and the closing cursor guidance lines.

- [x] #6 Tool descriptions and docs describe the server-level format flag, the tool renames, the `request` input field, the response format, and the new cursor shape.

- [x] #7 Inspector CLI/UI validation steps cover both formats and the renamed tools/cursor.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Rename tool surface to `start_council`, `get_current_session_data`, and `send_response`, including DTOs, mapper functions, and tool registrations.
- Change cursor input/output to a single response cursor token (string), mapping to internal last-response tracking and dropping request/feedback cursor fields from the public API.
- Keep core request/response storage but update service naming to `getCurrentSessionData`; ensure send_response resolves the current request.
- Update Markdown renderer to the new session header + messages layout with separators and closing cursor guidance, while JSON text mode stays `JSON.stringify(structuredContent)`.
- Update docs/validation examples to the new tool name, cursor shape, and response wording.
<!-- SECTION:PLAN:END -->

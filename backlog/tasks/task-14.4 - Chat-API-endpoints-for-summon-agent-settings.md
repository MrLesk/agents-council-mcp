---
id: task-14.4
title: Chat API endpoints for summon + agent settings
status: To Do
assignee: []
created_date: '2025-12-26 16:37'
updated_date: '2025-12-26 18:12'
labels: []
milestone: v0.3 - Summon Claude
dependencies:
  - task-14.1
  - task-14.2
parent_task_id: task-14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the chat HTTP server to read/update summon settings and trigger a summon using core services. Provide endpoints suitable for the chat UI; scope limited to server API (no UI changes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoints allow reading and updating agent settings (agent/model/reasoning effort) and return persisted values.
- [ ] #2 Summon endpoint triggers core summon and returns a clear success or error response.
- [ ] #3 Endpoints validate input and handle missing or invalid data without crashing.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/mcp.md (MCP reference for naming/transport conventions).
<!-- SECTION:NOTES:END -->

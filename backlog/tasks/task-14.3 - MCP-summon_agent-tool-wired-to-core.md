---
id: task-14.3
title: MCP summon_agent tool wired to core
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
Add a new MCP tool `summon_agent` that calls the core summon capability. Input schema should require `agent` (enum) and optionally accept `model` and `reasoning_effort` overrides. Default agent should be the last used agent or an alphabetical fallback. Scope: MCP interface only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `summon_agent` appears in the MCP tool list with required `agent` (enum) and optional `model` and `reasoning_effort` inputs.
- [ ] #2 Default agent value is the last used agent when available; otherwise a stable alphabetical default is used.
- [ ] #3 When optional `model` or `reasoning_effort` are omitted, the saved settings are used.

- [ ] #4 Tool call triggers core summon and returns a clear success or failure response without exposing extra interfaces.

- [ ] #5 docs/council.md lists summon_agent inputs (agent required; model/reasoning_effort optional) and defaulting behavior.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/mcp.md (MCP reference), docs/claude-agent-sdk/mcp.md (stdio MCP configuration context).
<!-- SECTION:NOTES:END -->

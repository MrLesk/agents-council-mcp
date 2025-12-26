---
id: task-14.6
title: 'Docs: Summon Claude feature and auth prerequisites'
status: To Do
assignee: []
created_date: '2025-12-26 16:37'
updated_date: '2025-12-26 17:38'
labels: []
dependencies:
  - task-14.3
  - task-14.4
  - task-14.5
parent_task_id: task-14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update README and docs/council.md to describe summon-Claude usage, Claude Code authentication reuse, and config persistence location. Scope: documentation only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README and docs/council.md describe how to summon Claude and that Claude Code authentication is reused when available.
- [ ] #2 Docs note config persistence location (next to the state file) and saved options (agent/model/reasoning effort).
- [ ] #3 Docs state that summoned agents can only call agents-council MCP tools.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/claude-agent-sdk.md (index), docs/claude-agent-sdk/quickstart.md (Claude Code auth reuse), docs/claude-agent-sdk/typescript.md (Options), docs/claude-agent-sdk/mcp.md, docs/mcp.md.
<!-- SECTION:NOTES:END -->

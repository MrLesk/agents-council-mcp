---
id: task-14.5
title: 'Chat UI: Summon agent modal with saved options'
status: To Do
assignee: []
created_date: '2025-12-26 16:37'
updated_date: '2025-12-26 18:13'
labels: []
milestone: v0.3 - Summon Claude
dependencies:
  - task-14.4
parent_task_id: task-14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the chat UI to summon a Claude agent with configurable agent/model/reasoning effort. UI should read defaults from the server, persist changes, and trigger summon. Scope: UI only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 UI presents agent selection (Claude), model selection, and reasoning effort controls with defaults from saved settings.
- [ ] #2 Selected values persist and reload with the same defaults after refresh.
- [ ] #3 Summon action calls the server and shows success/error state without requiring re-selection each time.

- [ ] #4 README.md or docs/council.md mention chat UI summon controls (agent/model/reasoning effort) and that selections persist.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/claude-agent-sdk/typescript.md (model/maxThinkingTokens context for UI options).

Doc refs: docs/council.md (Chat UI section), README.md (chat usage).
<!-- SECTION:NOTES:END -->

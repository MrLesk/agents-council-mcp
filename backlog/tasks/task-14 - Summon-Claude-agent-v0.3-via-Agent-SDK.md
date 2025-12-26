---
id: task-14
title: Summon Claude agent (v0.3) via Agent SDK
status: To Do
assignee: []
created_date: '2025-12-26 16:36'
updated_date: '2025-12-26 18:12'
labels: []
milestone: v0.3 - Summon Claude
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the summon-Claude capability end-to-end: core logic can summon Claude into the current council using the Claude Agent SDK with Claude Code authentication, then MCP/chat interfaces expose it without adding new business logic. This is a parent task for coordinated subtasks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Claude can be summoned into an active council and provide feedback via agents-council MCP tools only.
- [ ] #2 Claude Code authentication is used when available (no API key required if already logged in).
- [ ] #3 Summon options (agent/model/reasoning effort) persist across runs next to the state file.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/claude-agent-sdk.md (index), docs/claude-agent-sdk/overview.md, docs/claude-agent-sdk/quickstart.md (Claude Code auth reuse), docs/claude-agent-sdk/typescript.md (Options/model/maxThinkingTokens/mcpServers), docs/claude-agent-sdk/mcp.md, docs/claude-agent-sdk/custom-tools.md (streaming input for MCP), docs/mcp.md.
<!-- SECTION:NOTES:END -->

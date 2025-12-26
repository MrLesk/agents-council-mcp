---
id: task-14.2
title: Core Claude summon runner using Claude Agent SDK
status: To Do
assignee: []
created_date: '2025-12-26 16:37'
updated_date: '2025-12-26 18:12'
labels: []
milestone: v0.3 - Summon Claude
dependencies:
  - task-14.1
parent_task_id: task-14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement core logic to summon Claude via the Claude Agent SDK. The summoned agent joins the current council, reads current session data, and posts a response using only agents-council MCP tools. Use persisted model/reasoning settings. Scope: core only (no MCP/UI changes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Summon uses Claude Agent SDK and works with Claude Code authentication when available (no API key required if already logged in).
- [ ] #2 Claude is restricted to agents-council MCP tools only and cannot call other tools.
- [ ] #3 When an active council exists, Claude posts a response after fetching current session data; if no session, a clear error is returned.
- [ ] #4 Model and reasoning effort selections from the config store are honored.

- [ ] #5 README.md or docs/council.md mention Claude Code authentication reuse and that summoned agents can only call agents-council MCP tools.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/claude-agent-sdk/quickstart.md (Claude Code auth reuse), docs/claude-agent-sdk/typescript.md (query options, mcpServers, allowedTools, model, maxThinkingTokens, systemPrompt/settingSources), docs/claude-agent-sdk/mcp.md (stdio MCP config), docs/claude-agent-sdk/custom-tools.md (MCP requires streaming input).

Doc refs: README.md (feature overview/roadmap), docs/council.md (Tools/Chat UI).
<!-- SECTION:NOTES:END -->

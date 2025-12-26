---
id: task-14.1
title: Core config store for agent summon settings
status: To Do
assignee: []
created_date: '2025-12-26 16:36'
updated_date: '2025-12-26 18:12'
labels: []
milestone: v0.3 - Summon Claude
dependencies: []
parent_task_id: task-14
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a persistent config file stored alongside the council state file to hold summon settings (last used agent, per-agent model, reasoning effort). Provide core read/update APIs that other layers can call. Scope: core only (no MCP/UI changes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Config file location is derived from the resolved council state path directory and persists across runs.
- [ ] #2 Config stores last used agent and per-agent settings (model, reasoning effort) with sensible defaults when missing.
- [ ] #3 Missing or invalid config data does not crash the app; defaults are returned and can be overwritten.

- [ ] #4 docs/council.md notes the summon settings file location (next to state) and that agent/model/reasoning effort choices are persisted.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Doc refs: docs/council.md (State section), README.md (Roadmap/usage), docs/claude-agent-sdk.md (index).
<!-- SECTION:NOTES:END -->

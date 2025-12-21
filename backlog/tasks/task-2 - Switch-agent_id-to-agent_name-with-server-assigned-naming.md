---
id: task-2
title: Switch agent_id to agent_name with server-assigned naming
status: Done
assignee:
  - '@codex'
created_date: '2025-12-21 18:08'
updated_date: '2025-12-21 18:38'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace agent_id with agent_name across the MCP surface and core domain so agents identify themselves by name. Tool descriptions should explain that agents choose a name and the server may disambiguate it. The server must return the resolved agent_name from every tool call.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All MCP tool inputs/outputs and docs use agent_name (no public references to agent_id).
- [x] #2 Tool descriptions instruct agents to provide a name and reuse the server-assigned name on subsequent calls.
- [x] #3 When a new participant requests a name already in use by another participant, the server assigns a unique suffix (#1, #2, ...), and repeats do not add new suffixes for an existing participant.
- [x] #4 Each tool response includes the resolved agent_name chosen by the server.
- [x] #5 Documentation reflects the naming/suffix behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Rename domain types/fields from agentId -> agentName and update state serialization fields.
- Implement name assignment in CouncilService: first-come per session, reuse assigned name if known, append #1/#2 suffixes for new participants with a taken base name.
- Update MCP DTOs/schemas/mappers to agent_name and include resolved agent_name in all tool responses.
- Update tool descriptions + docs (validation commands) for naming rules, then run lint/format/typecheck.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Updated core domain + MCP DTOs/mappers/schemas to use agent_name and return resolved agent_name in all tool responses.

Added name resolution with optional suffix assignment when a new participant joins with a taken name; request_feedback resets participants each session.

Docs updated (tools + validation commands) and plan.md examples updated; lint/format/typecheck pass.
<!-- SECTION:NOTES:END -->

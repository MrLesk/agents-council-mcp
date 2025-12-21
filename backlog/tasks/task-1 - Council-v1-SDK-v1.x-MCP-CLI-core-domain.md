---
id: task-1
title: 'Council v1: SDK v1.x MCP CLI + core domain'
status: In Progress
assignee:
  - codex
created_date: '2025-12-21 11:23'
updated_date: '2025-12-21 17:06'
labels: []
milestone: Council v1 (stdio)
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the Bun-based council CLI (npm: agents-council, binary: council) with an MCP stdio server powered by the TypeScript MCP SDK v1.x, and a core domain layer separated from the MCP interface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `council mcp` starts the MCP stdio server using the TypeScript MCP SDK v1.x only.
- [ ] #2 Running `council` without `mcp` prints the startup error message.
- [ ] #3 MCP server exposes request_feedback, check_session, and provide_feedback (plus optional reset when enabled).
- [ ] #4 Core domain logic lives under `src/core` and the MCP interface only forwards to it.
- [ ] #5 Compiled `council` binary is available for local use.
- [ ] #6 All v1 subtasks are completed and integrated.

- [ ] #7 Linting passes (Biome).
- [ ] #8 Formatting check passes (Biome).
- [ ] #9 Type check passes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Plan (parent):
- Validate repo baseline after approval; align with existing configs and avoid clobbering.
- Complete subtask 1.1 scaffold (Bun/TS CLI + compile pipeline).
- Complete subtask 1.2 core types + CouncilService interface.
- Complete subtask 1.3 state store + lockfile + atomic writes.
- Complete subtask 1.4 service logic + polling semantics.
- Complete subtask 1.5 MCP stdio adapter (SDK v1.x).
- Complete subtask 1.6 docs updates (CLI usage + architecture).
- Complete subtask 1.7 validation (lint/format/typecheck + MCP Inspector smoke).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subtask 1.1 complete: scaffolded Bun/TS CLI, Biome config, build pipeline, and MCP server stub; lint/format/typecheck passing.

Subtask 1.2 complete: core domain layout and CouncilService interface/types added; no MCP coupling; lint/format/typecheck pass.

Subtask 1.2 updated and completed with service-scoped domain types and interface-layer DTOs; CouncilService interface + implementation now in src/core/services/council/index.ts.

Subtask 1.3 complete: file-backed state store with lockfile + atomic writes; state path override supported; lint/format/typecheck pass.

Subtask 1.4 complete: CouncilServiceImpl logic implemented with cursor-based polling and participant updates; lint/format/typecheck pass.
<!-- SECTION:NOTES:END -->

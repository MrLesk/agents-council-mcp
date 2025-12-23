---
id: task-10
title: Improve CLI behavior when running `council` directly
status: Done
assignee:
  - codex
created_date: '2025-12-23 18:42'
updated_date: '2025-12-23 18:59'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Align `council` direct invocation behavior with Backlog.md’s UX so running the CLI without subcommands provides a clear, friendly next step instead of only a hard error.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Running `council` with no subcommand shows a concise usage/help message with the `council mcp` entrypoint.
- [x] #2 `council --help` and `council --version` work without starting the MCP server.
- [x] #3 Docs describe the direct CLI behavior and expected exit codes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Add CLI help/version handling and a concise usage message when `council` is invoked without subcommands.
- Ensure the help/version paths exit 0 and do not start the MCP server.
- Update docs to reflect the direct CLI behavior and exit codes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added CLI help/version handling and a usage message for bare `council`, and updated docs to describe the direct invocation behavior.
<!-- SECTION:NOTES:END -->

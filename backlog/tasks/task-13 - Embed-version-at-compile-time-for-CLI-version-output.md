---
id: task-13
title: Embed version at compile time for CLI --version output
status: Done
assignee:
  - '@claude'
created_date: '2025-12-26 13:26'
updated_date: '2025-12-26 13:30'
labels:
  - release
  - cli
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The CLI currently has no way to display the correct version when running `council --version`. Following the pattern established in Backlog.md, embed the version at compile time using Bun's `--define` flag so the binary knows its version without reading package.json at runtime.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Running `council --version` displays the version matching the git tag used for release
- [x] #2 Release workflow compile step includes `--define __EMBEDDED_VERSION__` flag
- [x] #3 CLI code uses `__EMBEDDED_VERSION__` constant for version display
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add `--define __COUNCIL_VERSION__` flag to the compile step in `.github/workflows/release.yml` line 63. The CLI code already supports this constant.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Used `__COUNCIL_VERSION__` (not `__EMBEDDED_VERSION__`) to match the existing CLI code declaration at src/cli/index.ts:10
<!-- SECTION:NOTES:END -->

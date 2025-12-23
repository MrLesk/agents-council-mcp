---
id: task-12.3
title: Notify chat UI on council state changes
status: Done
assignee:
  - '@Codex'
created_date: '2025-12-23 22:03'
updated_date: '2025-12-23 23:21'
labels: []
milestone: v0.2.0 Chat UI
dependencies: []
parent_task_id: task-12
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Detect state changes and notify connected clients so the UI can refresh automatically.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Chat server exposes `/ws` and subscribes connected clients to the `council-state` topic.
- [x] #2 State file changes publish a `{type:"state-changed"}` notification to subscribed clients via the core watcher.
- [x] #3 WebSocket connect/disconnect does not crash or destabilize the server.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Add a state watcher in `src/core/state` that monitors the resolved state file and emits a debounced change signal (using `fs.watch` on the state directory and filtering for the state filename).
- Extend `src/interfaces/chat/server.ts` to upgrade `/ws` requests to WebSockets, subscribing each socket to the `council-state` topic on open and cleaning up on close/error.
- Publish `{"type":"state-changed"}` to the `council-state` topic whenever the watcher reports a change; guard publish/send so a single bad socket doesn't crash the server.
- Wire watcher lifecycle into `startChatServer` and the CLI shutdown path so it is disposed when the server stops.
- Manually validate by opening a WS client, triggering HTTP endpoints, and confirming notifications and stable connect/disconnect behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented core state watcher and WebSocket broadcast path; chat server now upgrades `/ws`, subscribes clients to `council-state`, publishes state-changed events, and cleans up watcher on shutdown. Added shared state path helper for consistent watcher/store paths.

Manual validation via Chrome DevTools: connected to `ws://localhost:5123/ws`, received `{type:"state-changed"}` after `/start-council`, closed socket, and confirmed `/get-current-session-data` still responds.
<!-- SECTION:NOTES:END -->

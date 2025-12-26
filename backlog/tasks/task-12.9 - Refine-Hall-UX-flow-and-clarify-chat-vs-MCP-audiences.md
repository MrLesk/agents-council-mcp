---
id: task-12.9
title: Refine Hall UX flow and clarify chat vs MCP audiences
status: Done
assignee:
  - '@Codex'
created_date: '2025-12-26 09:47'
updated_date: '2025-12-26 12:50'
labels: []
milestone: v0.2.0 Chat UI
dependencies: []
parent_task_id: '12'
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve the Hall page flow for large screens so the council matter and conversation are the primary focus, and clarify in docs that MCP is for AI agents while the chat UI is for human participants.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hall page presents a single primary content flow with the session request at the top and the conversation using full width without nested scrollbars.
- [x] #2 Header is compact and does not show a persistent "Last update" line in the main view.
- [x] #3 Role/settings are accessed via a single button (no dedicated right column).
- [x] #4 Standalone “Join the Council” button is removed from the Hall flow.
- [x] #5 For participants who did not start the council and have not yet sent a message, the composer submit action is labeled “Join and speak” and sends the first message successfully.
- [x] #6 After a participant has sent a first message (or if they are the creator), the composer submit action is labeled “Speak” on subsequent messages and after reloads.
- [x] #7 “Seal the Matter” is positioned alongside the session request and can be used by any chat user to close the session.

- [x] #8 When a session is closed, the conclusion appears immediately below the request in a light green highlight panel with a timestamp.
- [x] #9 README.md and docs/council.md explicitly state that MCP tools are intended for AI agents and the chat UI is for human participants.

- [x] #10 The council request is presented in a distinct “thread starter” card to clearly distinguish the topic from the rest of the layout.
- [x] #11 In active sessions, a visible divider separates the request column from the seal-the-matter column.

- [x] #12 Hall header uses a single combined title (e.g., “Agents Council — Hall”) instead of duplicating the logo text.
- [x] #13 Chat UI sets a theme color meta tag matching the UI palette (#15100c).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
- Remove the standalone “Join the Council” button from the Hall header/matter actions.
- Compute `isCreator` from the current request’s `created_by` and `hasSpoken` by checking feedback entries authored by the current user for the active request.
- Set the composer submit label to “Join and speak” only when `!isCreator && !hasSpoken`; otherwise label it “Speak”.
- Keep the composer action as a single send; after the first successful send it flips to “Speak” and persists across reloads via feedback history.
- Ensure no other join-only UI remains in the Hall flow.

- Wrap the council request in a distinct thread-starter card to improve visual hierarchy.

- Add a vertical divider between the request column and the seal-the-matter column on large screens.

- Replace the Hall header logo+title with a single combined text title and update styles accordingly.

- Add the theme-color meta tag to the chat UI HTML using #15100c.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed standalone join button; composer now uses “Join and speak” for first-time participants and “Speak” thereafter based on feedback history. Added summon modal CTA and conclusion timestamp styling; header now focuses on identity/settings only.

Added thread-starter request card styling and a vertical divider between the matter and seal column on large screens; mobile view removes the divider.

Switched Hall header to a single combined title (“Agents Council — Hall”) and removed the logo duplication. Added theme-color meta tag (#15100c) to the chat UI HTML.

User confirmed the Hall header + theme color updates; task marked Done.
<!-- SECTION:NOTES:END -->

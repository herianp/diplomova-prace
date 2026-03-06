---
status: testing
phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment
source: 27-01-SUMMARY.md, 27-02-SUMMARY.md, 27-03-SUMMARY.md, 27-04-SUMMARY.md
started: 2026-03-06T16:00:00Z
updated: 2026-03-06T19:02:00Z
---

## Current Test

number: 2
name: Creator Conflict Dialog
expected: |
  Click delete on a user who is a creator of one or more teams. Instead of the simple confirm, a creator conflict resolution dialog appears listing ALL affected teams. Each team row shows the team name and an action selector with options to delete the team or reassign creator to another member.
awaiting: user response

## Tests

### 1. Delete Non-Creator User
expected: Navigate to Admin panel > Users tab. A delete icon button appears in the actions column for each user row. Click delete on a user who is NOT a team creator. A simple confirm dialog appears with the user's name and email. Confirming triggers soft-deletion — the user disappears from the list (or shows as deleted).
result: pass

### 2. Creator Conflict Dialog
expected: Click delete on a user who is a creator of one or more teams. Instead of the simple confirm, a creator conflict resolution dialog appears listing ALL affected teams. Each team row shows the team name and an action selector with options to delete the team or reassign creator to another member.
result: [pending]

### 3. Creator Reassignment
expected: In the creator conflict dialog, select "Reassign" for a team and pick a new creator from the member dropdown. Confirm the dialog — the user is soft-deleted and the selected member becomes the new team creator.
result: [pending]

### 4. Deleted Users Hidden by Default
expected: After soft-deleting a user, they disappear from the admin users list. Only active users are shown by default.
result: [pending]

### 5. Show Deleted Users Toggle
expected: A filter toggle is visible in the Admin Users tab. Enabling it reveals soft-deleted users with visual distinction (grayed out or status indicator). The delete button is disabled for already-deleted users.
result: [pending]

### 6. Deleted User Display in Team Views
expected: In team-related views (surveys, reports, player lists, cashbox), a soft-deleted user's name displays with a "(deleted)" suffix — e.g., "John Doe (deleted)".
result: [pending]

### 7. Auth Safety Net for Soft-Deleted User
expected: A user with status 'deleted' in Firestore is blocked from accessing the app. On login or active session, they are signed out and cannot proceed.
result: [pending]

## Summary

total: 7
passed: 1
issues: 0
pending: 6
skipped: 0

## Gaps

[none yet]

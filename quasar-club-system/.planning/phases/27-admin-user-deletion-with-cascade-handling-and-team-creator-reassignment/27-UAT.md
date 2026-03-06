---
status: diagnosed
phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment
source: 27-01-SUMMARY.md, 27-02-SUMMARY.md, 27-03-SUMMARY.md
started: 2026-03-06T15:30:00Z
updated: 2026-03-06T15:38:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Delete Non-Creator User
expected: Navigate to Admin panel > Users tab. A delete icon button appears in the actions column for each user row. Click delete on a user who is NOT a team creator. A simple confirm dialog appears saying "Delete user {displayName} ({email})?" with confirm/cancel buttons.
result: issue
reported: "Dialog appears correctly but clicking OK fails with CORS error: Cloud Function requires Blaze plan. Need to refactor to client-side Firestore soft-delete."
severity: blocker

### 2. Creator Conflict Dialog
expected: Click delete on a user who is a creator of one or more teams. Instead of the simple confirm, a creator conflict resolution dialog appears listing ALL affected teams. Each team row shows the team name and an action selector: "Delete team" or "Reassign creator" with a member dropdown.
result: skipped
reason: Depends on Cloud Function which requires Blaze plan. Will be refactored to client-side Firestore operations.

### 3. Creator Reassignment Selection
expected: In the creator conflict dialog, select "Reassign" for a team and pick a new creator from the member dropdown (lists all team members except the user being deleted). The dropdown shows member display names. Confirm the dialog to proceed with deletion and reassignment.
result: skipped
reason: Depends on Cloud Function which requires Blaze plan. Will be refactored to client-side Firestore operations.

### 4. Deleted Users Hidden by Default
expected: After a user is soft-deleted, they disappear from the admin users list. The users tab shows only active users by default.
result: skipped
reason: Cannot soft-delete a user yet (Cloud Function dependency). Will be testable after refactor.

### 5. Show Deleted Users Toggle
expected: A filter toggle is visible in the Admin Users tab. Enabling "Show deleted users" reveals soft-deleted users in the list with visual distinction (grayed out or status indicator). The delete button is disabled for already-deleted users.
result: skipped
reason: Cannot soft-delete a user yet (Cloud Function dependency). Will be testable after refactor.

### 6. Deleted User Display in Team Views
expected: In team-related views (surveys, reports, player lists, cashbox), a deleted user's name displays with a "(deleted)" suffix — e.g., "John Doe (deleted)". This appears everywhere getMemberDisplayName is used.
result: skipped
reason: User requested skip — will test after refactor.

### 7. Auth Safety Net for Soft-Deleted User
expected: If a user has been soft-deleted (status: 'deleted' in Firestore) but their Firebase Auth account still exists (edge case), they are blocked from accessing the app. On login or active session, they are signed out and cannot proceed.
result: skipped
reason: User requested skip — will test after refactor.

## Summary

total: 7
passed: 0
issues: 1
pending: 0
skipped: 6

## Gaps

- truth: "Admin can delete users via Cloud Function callable"
  status: failed
  reason: "Cloud Functions require Firebase Blaze plan. Refactor entire delete flow to client-side Firestore operations. Drop Firebase Auth account deletion — auth safety net blocks soft-deleted users instead. Move soft-delete writes, creator reassignment, and power user promotion from Cloud Function to client-side adminFirebase service + Firestore security rules."
  severity: blocker
  test: 1
  root_cause: "Cloud Functions require Blaze (pay-as-you-go) billing plan which user does not want to enable. The deleteUserAccount callable function cannot be deployed."
  artifacts:
    - path: "functions/src/deleteUser.ts"
      issue: "Cloud Function cannot be deployed without Blaze plan"
    - path: "src/services/adminFirebase.ts"
      issue: "httpsCallable to deleteUserAccount will never resolve"
    - path: "src/composable/useAdminUseCases.ts"
      issue: "deleteUserAsAdmin calls Cloud Function via adminFirebase.deleteUserAccount"
  missing:
    - "Move Firestore soft-delete (status, deletedAt, deletedBy writes) to client-side adminFirebase service"
    - "Move creator reassignment (createdBy update, powerusers arrayUnion) to client-side adminFirebase service"
    - "Update Firestore security rules to allow admin to write user status/deletedAt/deletedBy fields and team createdBy/powerusers fields"
    - "Remove httpsCallable dependency from adminFirebase.ts"
    - "Update useAdminUseCases to call client-side Firestore operations instead of Cloud Function"
    - "Remove or keep functions/ directory as dead code (optional cleanup)"
  debug_session: ""

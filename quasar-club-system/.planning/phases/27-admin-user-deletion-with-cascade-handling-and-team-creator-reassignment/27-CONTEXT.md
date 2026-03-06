# Phase 27: Admin User Deletion with Cascade Handling and Team Creator Reassignment - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin users can delete players from a new tab in the AdminComponent. Deletion is a soft-delete with cascade handling: user document is preserved with a deleted flag, votes/messages/cashbox history is kept, and Firebase Auth account is fully deleted via Cloud Function. When deleting a user who is a team creator, a conflict-resolution dialog lets admin choose per-team: delete the team (cascade) or reassign creator to another member.

</domain>

<decisions>
## Implementation Decisions

### Creator Conflict Flow
- When deleting a user who is creator of one or more teams, show a single dialog listing ALL affected teams
- Per team, admin chooses: (A) Delete the whole team (existing cascade), or (B) Reassign creator to another member
- Any team member is eligible as new creator (not restricted to power users)
- New creator is automatically promoted to power user if not already
- Dialog shows team name and action selector per team row — no view links, keep focused

### Cascade Scope
- User document is SOFT-DELETED: keep in Firestore with `status: 'deleted'` and `deletedAt: Date` fields
- User uid stays in team `members[]` and `powerusers[]` arrays — UI resolves display via soft-delete flag
- All votes preserved — research best approach for history tracking labels (e.g., `deleted-{userName}`, `leaved-{userName}`)
- All messages, notifications, join requests preserved — no cleanup
- Cashbox entries (fines, payments) preserved but tagged as belonging to a deleted user
- Soft-delete is one-way — no restore capability in this phase
- Research should determine the best pattern for marking deleted/left user references across the system

### Delete Confirmation UX
- Delete button in AdminUsersTab actions column — same icon button pattern as AdminTeamsTab
- Non-creator users: simple confirm dialog showing "Delete user {displayName} ({email})?"
- Creator users: creator-conflict dialog REPLACES the simple confirm (single dialog, not two-step)
- Soft-deleted users hidden from admin users tab by default
- Add a filter toggle to show deleted users when needed

### Firebase Auth Cleanup
- Create a Firebase Cloud Function (callable) that admin triggers from client
- Cloud Function handles: (1) Firestore soft-delete, (2) Full Firebase Auth account deletion
- Auth account is FULLY DELETED (not just disabled) — email becomes available for new registration
- Firestore soft-delete preserves all history/display data independent of Auth deletion

### Claude's Discretion
- Visual treatment of deleted user names in UI (strikethrough, grayed out, badge — pick best approach)
- Cloud Function error handling and rollback strategy
- Exact filter toggle implementation for showing deleted users
- Loading states during deletion process

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdminComponent.vue`: Already has tab structure (teams, users, audit, rateLimits) — add new functionality to existing users tab
- `AdminTeamsTab.vue`: Delete icon button + name-confirmation dialog pattern to mirror for user deletion
- `AdminUsersTab.vue`: Existing user list with search, table, and email/name display — needs delete action column added
- `teamFirebase.deleteTeam()`: Full cascade delete (surveys, votes, messages, notifications, invitations, subcollections, team doc) — reusable for team deletion option in creator conflict
- `useAdminUseCases.ts`: Has `deleteTeamAsAdmin()` — extend with user deletion use case
- `useAdminComposable.ts`: UI delegation layer for admin operations
- `adminFirebase.ts`: `getAllUsers()`, `getAllTeams()`, `getAllSurveys()` — already loads all data needed

### Established Patterns
- Clean architecture: Components -> Composables -> Use Cases -> Firebase Services -> Stores
- Error handling: `mapFirestoreError()` with typed error hierarchy
- Audit logging: Fire-and-forget `writeAuditLog()` for sensitive operations
- i18n: All user-facing text through `$t()` / `useI18n()` with cs-CZ and en-US translations
- Quasar dialogs: `q-dialog` with `q-card` for confirmation flows

### Integration Points
- `AdminUsersTab.vue` — add actions column with delete button
- `adminFirebase.ts` — add soft-delete user function
- `useAdminUseCases.ts` — add user deletion use case with creator conflict resolution
- `useAdminComposable.ts` — add UI delegation for user deletion flow
- `interfaces.ts` — extend IUser with `status` and `deletedAt` fields
- New Cloud Function project/file for Auth account deletion
- Firestore security rules — update to handle soft-deleted user access
- Auth listener / route guard — block soft-deleted users from accessing app

</code_context>

<specifics>
## Specific Ideas

- User wants vote history preserved with labels distinguishing "deleted" vs "left" users — research the best approach for this across the system
- Pattern should work for both scenarios: admin-deleted user and user who voluntarily leaves a team
- The `leaved-{userName}` / `deleted-{userName}` label concept needs research for the optimal data model approach
- Creator conflict dialog should feel like the existing team delete dialog — same card style, clean, focused

</specifics>

<deferred>
## Deferred Ideas

- User restore/un-delete capability — noted for future phase
- "User left team" flow (voluntary leave with history tracking) — related but separate capability, could share the same data model

</deferred>

---

*Phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment*
*Context gathered: 2026-03-06*

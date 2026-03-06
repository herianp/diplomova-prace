---
phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment
plan: 03
subsystem: auth, ui
tags: [firestore, security-rules, soft-delete, display-name, auth-safety]

requires:
  - phase: 27-01
    provides: ITeamMember.status and IUser.status fields, Cloud Functions infrastructure
provides:
  - Deleted user display with "(deleted)" suffix via centralized getMemberDisplayName
  - Auth safety net blocking soft-deleted users from app access
  - Firestore rules allowing admin to update user documents
affects: [admin-user-deletion, team-member-display, auth-flow]

tech-stack:
  added: []
  patterns: [centralized deleted-user display via getMemberDisplayName, auth state soft-delete guard]

key-files:
  created: []
  modified:
    - src/composable/useTeamMemberUtils.ts
    - src/composable/useAuthUseCases.ts
    - firestore.rules

key-decisions:
  - "Soft-delete check added in both initializeAuth and continuous auth listener for complete coverage"
  - "Auth listener reads existing getUserFromFirestore call to avoid extra Firestore read in initializeAuth; continuous listener adds one read"

patterns-established:
  - "Deleted user display: centralized in getMemberDisplayName, propagates to all consumers automatically"
  - "Auth safety net: check user status before setting up team listeners"

requirements-completed: []

duration: 2min
completed: 2026-03-06
---

# Phase 27 Plan 03: Deleted User Display and Auth Safety Net Summary

**Centralized deleted-user display via getMemberDisplayName "(deleted)" suffix with auth safety net blocking soft-deleted users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T14:44:29Z
- **Completed:** 2026-03-06T14:45:48Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Deleted members show "{name} (deleted)" suffix everywhere in the app (players, cashbox, reports, votes, etc.) via single centralized change
- Soft-deleted users are blocked from accessing the app even if Firebase Auth deletion failed
- Firestore security rules updated to allow app admin to update user documents for soft-delete operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Update deleted user display and auth safety net** - `c95f309` (feat)
2. **Task 2: Update Firestore security rules for admin user management** - `305b55f` (feat)

## Files Created/Modified
- `src/composable/useTeamMemberUtils.ts` - getMemberDisplayName checks member.status for deleted suffix
- `src/composable/useAuthUseCases.ts` - Auth safety net in initializeAuth and continuous auth listener
- `firestore.rules` - Added `allow update: if isAppAdmin()` for users collection

## Decisions Made
- Added soft-delete check in both `initializeAuth` (initial load) and the continuous `authStateListener` callback for complete coverage
- In `initializeAuth`, reused the existing `getUserFromFirestore` call to avoid an extra Firestore read; the continuous listener adds one read since it did not previously fetch the user doc
- The "(deleted)" suffix is hardcoded English since display names themselves are not translated

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Plan 03 deliverables complete
- Deleted user display propagates automatically to all consumers of getMemberDisplayName
- Auth safety net active for edge case where Auth deletion fails
- Firestore rules ready for admin user management operations

---
*Phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment*
*Completed: 2026-03-06*

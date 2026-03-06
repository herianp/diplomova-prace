---
phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment
plan: 04
subsystem: api
tags: [firestore, client-side, soft-delete, admin]

requires:
  - phase: 27-03
    provides: Auth safety net blocking soft-deleted users
provides:
  - Client-side Firestore soft-delete for user documents
  - Client-side Firestore creator reassignment for team documents
  - Admin update Firestore rule for teams collection
affects: []

tech-stack:
  added: []
  patterns: [client-side Firestore updateDoc replacing Cloud Function httpsCallable]

key-files:
  created: []
  modified:
    - src/services/adminFirebase.ts
    - src/composable/useAdminUseCases.ts
    - firestore.rules

key-decisions:
  - "Dropped Firebase Auth account deletion entirely - auth safety net handles soft-deleted users"
  - "Direct updateDoc calls replace httpsCallable for both soft-delete and creator reassignment"

patterns-established:
  - "Admin operations use direct Firestore writes with isAppAdmin() security rules instead of Cloud Functions"

requirements-completed: []

duration: 3min
completed: 2026-03-06
---

# Phase 27 Plan 04: Gap Closure - Client-Side Firestore Operations Summary

**Replaced Cloud Function httpsCallable with direct Firestore updateDoc for user soft-delete and team creator reassignment**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T15:49:07Z
- **Completed:** 2026-03-06T15:52:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed all Cloud Function dependencies (httpsCallable, getFunctions) from adminFirebase.ts
- Added softDeleteUser and reassignTeamCreator as direct Firestore updateDoc operations
- Added admin update rule for teams collection in Firestore security rules
- Refactored useAdminUseCases to use new client-side methods with unchanged public API

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Cloud Function calls with client-side Firestore operations** - `83c6776` (feat)
2. **Task 2: Add admin update rule for teams collection** - `1c99fb6` (chore)

## Files Created/Modified
- `src/services/adminFirebase.ts` - Replaced httpsCallable with softDeleteUser and reassignTeamCreator using updateDoc
- `src/composable/useAdminUseCases.ts` - Refactored deleteUserAsAdmin to call new client-side methods
- `firestore.rules` - Added `allow update: if isAppAdmin()` for teams collection

## Decisions Made
- Dropped Firebase Auth account deletion entirely since auth safety net (plan 03) already blocks soft-deleted users at login
- Used direct updateDoc calls instead of writeBatch since operations are independent and small

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin user deletion flow is fully client-side, no Cloud Functions or Blaze plan needed
- All four plans of Phase 27 are now complete

---
*Phase: 27-admin-user-deletion-with-cascade-handling-and-team-creator-reassignment*
*Completed: 2026-03-06*

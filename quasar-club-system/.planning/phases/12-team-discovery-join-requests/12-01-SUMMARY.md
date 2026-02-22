---
phase: 12-team-discovery-join-requests
plan: "01"
subsystem: database
tags: [firebase, firestore, security-rules, composable, typescript]

# Dependency graph
requires:
  - phase: 11-team-creation
    provides: team creation flow that new users land in before discovering/joining teams
provides:
  - IJoinRequest interface with pending/approved/declined/cancelled lifecycle
  - joinRequestFirebase service with real-time listeners and CRUD operations
  - useJoinRequestUseCases composable with max-5 and duplicate-prevention validation
  - Firestore security rules for joinRequests collection and team browse access
affects:
  - 12-02
  - 12-03
  - 12-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useJoinRequestFirebase follows useTeamFirebase pattern (onSnapshot listeners + getDocs for count)
    - useJoinRequestUseCases follows useTeamUseCases pattern (authStore, teamStore, error handling)
    - Non-blocking audit log writes via fire-and-forget pattern (consistent with other operations)

key-files:
  created:
    - src/services/joinRequestFirebase.ts
    - src/composable/useJoinRequestUseCases.ts
  modified:
    - src/interfaces/interfaces.ts
    - firestore.rules

key-decisions:
  - "joinRequests Firestore rules use direct allow read/update blocks (multiple allow read statements — Firestore uses OR logic)"
  - "teams collection gets a broad `allow read: if request.auth != null` rule for browse — coexists with member-only write rules"
  - "sendJoinRequest validates both pending count and existing membership before creating request"

patterns-established:
  - "joinRequestFirebase: getAllTeams uses onSnapshot without where filter — returns all teams for browse"
  - "countPendingRequestsByUser uses getDocs for point-in-time count check before creating request"
  - "addMemberToTeam uses arrayUnion on teams doc — consistent with invitation accept pattern"

requirements-completed: [DISC-01, DISC-02]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 12 Plan 01: Join Request Data Layer Summary

**joinRequests Firestore collection with security rules, IJoinRequest interface, Firebase service with 8 methods, and use case composable with max-5 pending validation and duplicate prevention**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T12:18:36Z
- **Completed:** 2026-02-22T12:20:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- IJoinRequest interface with full status lifecycle (pending/approved/declined/cancelled) and AuditOperation extended with joinRequest.approve and joinRequest.decline
- joinRequestFirebase service with 8 methods: getAllTeams, getJoinRequestsByUser, getJoinRequestsByTeam, createJoinRequest, updateJoinRequestStatus, cancelJoinRequest, countPendingRequestsByUser, addMemberToTeam
- useJoinRequestUseCases composable enforcing max 5 pending requests and duplicate membership check, with non-blocking audit log writes on approve/decline
- Firestore security rules for joinRequests collection (create own, read own, power user read/approve/decline, user cancel, app admin) and teams browse read for any authenticated user

## Task Commits

Each task was committed atomically:

1. **Task 1: Add IJoinRequest interface, update AuditOperation, and create joinRequestFirebase service** - `5a11a64` (feat)
2. **Task 2: Create useJoinRequestUseCases composable and update Firestore security rules** - `1530407` (feat)

## Files Created/Modified
- `src/interfaces/interfaces.ts` - Added IJoinRequest interface and joinRequest.approve/decline to AuditOperation
- `src/services/joinRequestFirebase.ts` - New Firebase service with 8 methods for join request operations and team browsing
- `src/composable/useJoinRequestUseCases.ts` - New business logic composable with validation, audit logging, and listener delegation
- `firestore.rules` - Added joinRequests collection rules and teams browse read rule

## Decisions Made
- Firestore uses OR logic for multiple `allow read` statements — used two separate read rules for joinRequests (own + power user) rather than combining with a complex OR condition
- Teams collection gets a broad `allow read: if request.auth != null` rule for browse — placed before the member-only rule, works due to Firestore OR semantics
- sendJoinRequest validation checks teamStore.teams for membership (avoids extra Firestore read since teams are already loaded in state)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The joinRequests Firestore collection will be created automatically on first write.

## Next Phase Readiness
- Data layer is complete and ready for UI consumption in plans 02-04
- All three listeners (all teams, user requests, team requests) are ready to be wired into UI components
- Security rules cover all access patterns needed by browse page, my-requests page, and power user management page

## Self-Check: PASSED

All files present and commits verified:
- src/interfaces/interfaces.ts - FOUND
- src/services/joinRequestFirebase.ts - FOUND
- src/composable/useJoinRequestUseCases.ts - FOUND
- firestore.rules - FOUND
- Commit 5a11a64 - FOUND
- Commit 1530407 - FOUND

---
*Phase: 12-team-discovery-join-requests*
*Completed: 2026-02-22*

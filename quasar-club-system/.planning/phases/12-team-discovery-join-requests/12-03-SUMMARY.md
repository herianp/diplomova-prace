---
phase: 12-team-discovery-join-requests
plan: "03"
subsystem: ui
tags: [vue, quasar, pinia, firebase, real-time, i18n]

# Dependency graph
requires:
  - phase: 12-team-discovery-join-requests
    plan: "01"
    provides: joinRequestFirebase service with getJoinRequestsByTeam listener, useJoinRequestUseCases with approveJoinRequest/declineJoinRequest, IJoinRequest interface
provides:
  - JoinRequestManagement.vue component with per-request approve/decline UI
  - teamStore pendingJoinRequests reactive state with real-time listener
  - CustomDrawer sidebar badge showing pending join request count for power users
affects:
  - 12-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - pendingJoinRequests listener registered under 'pendingJoinRequests' ListenerId in team scope — cleaned up on team switch
    - Power user guard in setPendingJoinRequestsListener — skips listener setup for regular members
    - Badge rendered conditionally in v-for via q-item-section side with route comparison

key-files:
  created:
    - src/components/team/JoinRequestManagement.vue
  modified:
    - src/stores/teamStore.ts
    - src/composable/useTeamUseCases.ts
    - src/services/listenerRegistry.ts
    - src/components/new/CustomDrawer.vue
    - src/i18n/en-US/index.ts
    - src/i18n/cs-CZ/index.ts

key-decisions:
  - "pendingJoinRequests ListenerId added to listenerRegistry team scope so it auto-cleans up on team switch via unregisterByScope('team')"
  - "Power user check in setPendingJoinRequestsListener uses teamStore.currentTeam.powerusers — avoids extra Firestore reads"
  - "Badge uses q-item-section side with route comparison inside v-for — simpler than special-casing Teams entry in topLinks array"

patterns-established:
  - "JoinRequestManagement: isProcessing disables both buttons during operation to prevent double-submission"
  - "approveError/declineError translation keys added to joinRequests namespace for consistent error handling"

requirements-completed: [DISC-03, DISC-04, DISC-05]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 12 Plan 03: Join Request Management UI Summary

**Real-time pending join requests sidebar badge and approve/decline management component wired to teamStore via power-user-gated Firestore listener**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T12:23:20Z
- **Completed:** 2026-02-22T12:26:09Z
- **Tasks:** 2
- **Files modified:** 6 (+ 1 created)

## Accomplishments
- teamStore gains `pendingJoinRequests` reactive array, `setPendingJoinRequests` setter, and `pendingJoinRequestCount` computed — all cleared on `clearData()`
- `setPendingJoinRequestsListener` in useTeamUseCases sets up real-time team-scoped Firestore listener only for power users, registered with `listenerRegistry` for automatic cleanup on team switch
- JoinRequestManagement.vue renders pending requests with avatar, name, email, and individual approve/decline buttons with loading state and toast feedback
- CustomDrawer "Teams" link shows red badge with live count from teamStore; `setPendingJoinRequestsListener` called on team switch alongside `setSurveysListener`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pending join requests state to teamStore and set up listener in useTeamUseCases** - `c103914` (feat)
2. **Task 2: Create JoinRequestManagement component and add sidebar badge** - `59f5cf4` (feat)

## Files Created/Modified
- `src/components/team/JoinRequestManagement.vue` - Power user component with approve/decline per-request actions, loading state, empty state, and toast feedback
- `src/stores/teamStore.ts` - Added pendingJoinRequests ref, setPendingJoinRequests setter, pendingJoinRequestCount computed
- `src/composable/useTeamUseCases.ts` - Added setPendingJoinRequestsListener with power-user guard and team-scope registry
- `src/services/listenerRegistry.ts` - Added 'pendingJoinRequests' to ListenerId type and team-scoped IDs
- `src/components/new/CustomDrawer.vue` - Badge on Teams link; calls setPendingJoinRequestsListener on team switch
- `src/i18n/en-US/index.ts` - Added joinRequests translation block (9 keys)
- `src/i18n/cs-CZ/index.ts` - Added joinRequests translation block (9 keys, full Czech pluralization)

## Decisions Made
- `pendingJoinRequests` added to `listenerRegistry` team scope so `unregisterByScope('team')` in `selectTeam` automatically cleans it up before re-registering for new team — consistent with surveys listener pattern
- Power user check uses `teamStore.currentTeam?.powerusers?.includes()` in the use case layer rather than in the component — avoids Firestore reads, consistent with existing patterns
- Badge rendered inline inside the existing `v-for` topLinks loop using `q-item-section side` with route comparison — avoids restructuring the topLinks array or adding a special-case slot

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added 'pendingJoinRequests' to listenerRegistry ListenerId type**
- **Found during:** Task 1 (teamStore and useTeamUseCases setup)
- **Issue:** listenerRegistry.ts has a strict `ListenerId` union type — `listenerRegistry.register('pendingJoinRequests', ...)` would fail TypeScript without adding it to the type
- **Fix:** Added `'pendingJoinRequests'` to the `ListenerId` type and to the `teamScopedIds` array in `unregisterByScope`
- **Files modified:** src/services/listenerRegistry.ts
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** c103914 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical for TypeScript correctness)
**Impact on plan:** Essential for type safety. listenerRegistry already had this pattern for all other listeners; adding pendingJoinRequests follows the same pattern.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The listener activates automatically on team selection for power users.

## Next Phase Readiness
- JoinRequestManagement component is ready to be embedded in TeamsPage (plan 12-04) as a section visible to power users
- Badge is live and reactive — will show count as soon as Firestore listener receives data
- Approve/decline operations write audit logs and update Firestore atomically via existing useJoinRequestUseCases methods

## Self-Check: PASSED

All files present:
- src/components/team/JoinRequestManagement.vue - FOUND (133 lines)
- src/stores/teamStore.ts - FOUND (contains pendingJoinRequests)
- src/composable/useTeamUseCases.ts - FOUND (contains setPendingJoinRequestsListener)
- src/services/listenerRegistry.ts - FOUND (contains pendingJoinRequests in ListenerId)
- src/components/new/CustomDrawer.vue - FOUND (contains q-badge)
- src/i18n/en-US/index.ts - FOUND (contains joinRequests block)
- src/i18n/cs-CZ/index.ts - FOUND (contains joinRequests block)

Commits verified:
- c103914 - FOUND (Task 1)
- 59f5cf4 - FOUND (Task 2)

---
*Phase: 12-team-discovery-join-requests*
*Completed: 2026-02-22*

---
phase: 14-rate-limiting-user-quotas
plan: 01
subsystem: admin, database
tags: [firestore, pinia, vue, rate-limiting, admin-ui]

# Dependency graph
requires:
  - phase: 12-team-discovery-join-requests
    provides: IJoinRequest interface and listenerRegistry patterns used here
provides:
  - IRateLimitConfig, IRateLimitAction, IUserUsage interfaces
  - Firestore rateLimits/global document with CRUD and real-time listener
  - Pinia rateLimitStore with reactive config state
  - useRateLimitUseCases composable for load/listen/update
  - Admin Rate Limits tab with inline editing in AdminComponent
affects:
  - 14-02 (enforcement plan will use useRateLimitUseCases and rateLimitStore)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pinia Setup Store with pure state mutations (consistent with teamStore/authStore)
    - Firebase service composable pattern (consistent with adminFirebase/teamFirebase)
    - ListenerRegistry for real-time listener lifecycle management

key-files:
  created:
    - src/interfaces/interfaces.ts (IRateLimitConfig, IRateLimitAction, IUserUsage interfaces added)
    - src/services/rateLimitFirebase.ts
    - src/stores/rateLimitStore.ts
    - src/composable/useRateLimitUseCases.ts
    - src/components/admin/AdminRateLimitsTab.vue
  modified:
    - src/services/listenerRegistry.ts (added 'rateLimits' ListenerId)
    - src/components/admin/AdminComponent.vue (added Rate Limits tab)
    - src/i18n/cs-CZ/index.ts (added admin.rateLimits.* keys)
    - src/i18n/en-US/index.ts (added admin.rateLimits.* keys)

key-decisions:
  - "rateLimits Firestore document auto-seeded on first access with default values — no separate migration step needed"
  - "startConfigListener used in AdminRateLimitsTab onMounted — real-time updates propagate immediately to all admin views"
  - "'rateLimits' ListenerId added to listenerRegistry to follow established lifecycle management pattern"

patterns-established:
  - "Rate limit config stored in rateLimits/global Firestore doc, read via real-time listener"
  - "useRateLimitUseCases composable serves as the single access point for config read/write"

requirements-completed: [RATE-01, RATE-04]

# Metrics
duration: 25min
completed: 2026-02-22
---

# Phase 14 Plan 01: Rate Limiting Data Layer & Admin UI Summary

**Firestore-backed rate limit config with Pinia store, real-time listener, and Admin tab featuring inline-editable 5-row table**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-22T16:00:00Z
- **Completed:** 2026-02-22T16:24:27Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Data layer: IRateLimitConfig/IRateLimitAction/IUserUsage interfaces, rateLimitFirebase service, rateLimitStore Pinia store, useRateLimitUseCases composable
- Admin Rate Limits tab with q-table showing all 5 configurable limits (teamCreation, messages, joinRequests, surveys, fines)
- Inline editing: pencil icon -> number input -> Enter/checkmark saves to Firestore, real-time listener updates UI immediately
- Default config auto-seeded to Firestore on first access (no manual setup needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Data layer — interfaces, Firebase service, store, use cases** - `e8f8742` (feat)
2. **Task 2: Admin Rate Limits tab with inline editing** - `6fd3344` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/interfaces/interfaces.ts` - Added IRateLimitAction, IRateLimitConfig, IUserUsage interfaces
- `src/services/rateLimitFirebase.ts` - Firestore CRUD for rateLimits config and user/team usage counters
- `src/stores/rateLimitStore.ts` - Pinia Setup Store for reactive rate limit config state
- `src/composable/useRateLimitUseCases.ts` - Business logic: loadConfig, startConfigListener, updateLimit, getDefaults
- `src/services/listenerRegistry.ts` - Added 'rateLimits' to ListenerId union type
- `src/components/admin/AdminRateLimitsTab.vue` - Admin tab with q-table and inline editing
- `src/components/admin/AdminComponent.vue` - Added 4th tab (rateLimits, icon=speed)
- `src/i18n/cs-CZ/index.ts` - Added admin.rateLimitsTab and admin.rateLimits.* keys (Czech)
- `src/i18n/en-US/index.ts` - Added admin.rateLimitsTab and admin.rateLimits.* keys (English)

## Decisions Made
- rateLimits/global Firestore document auto-seeded with defaults on first access — no migration needed
- startConfigListener wired in AdminRateLimitsTab onMounted for real-time propagation
- 'rateLimits' ListenerId follows established listenerRegistry lifecycle pattern

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required. The rateLimits/global Firestore document is auto-created with default values on first access.

## Next Phase Readiness
- Rate limit config data layer fully in place for Plan 02 (enforcement)
- useRateLimitUseCases exposes loadConfig, startConfigListener for use in action composables
- rateLimitStore.config provides reactive access to all 5 limit thresholds

---
*Phase: 14-rate-limiting-user-quotas*
*Completed: 2026-02-22*

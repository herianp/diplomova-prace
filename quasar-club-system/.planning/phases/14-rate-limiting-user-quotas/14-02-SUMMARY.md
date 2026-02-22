---
phase: 14-rate-limiting-user-quotas
plan: 02
subsystem: enforcement, composable, ui
tags: [rate-limiting, composable, vue, i18n, firestore]

# Dependency graph
requires:
  - phase: 14-01
    provides: rateLimitStore, rateLimitFirebase, IRateLimitConfig, IUserUsage
provides:
  - useRateLimiter composable (checkLimit, incrementUsage, formatResetInfo, useActionLimitStatus)
  - Client-side enforcement in all 5 rate-limited actions
  - Disabled buttons with tooltips when limits reached
affects:
  - src/composable/useTeamUseCases.ts
  - src/composable/useSurveyUseCases.ts
  - src/composable/useJoinRequestUseCases.ts
  - src/composable/useCashboxUseCases.ts
  - src/services/messageFirebase.ts
  - src/components/onboarding/CreateTeamForm.vue
  - src/components/SurveyComponent.vue
  - src/components/MessagesComponent.vue
  - src/components/CashboxComponent.vue

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Central rate limiter composable with action config map
    - useActionLimitStatus reactive helper for UI binding
    - Weekly/daily window auto-reset on stale window detection
    - Concurrent limit derived from live Firestore query (not stored counter)

key-files:
  created:
    - src/composable/useRateLimiter.ts
  modified:
    - src/composable/useTeamUseCases.ts (added checkLimit + incrementUsage for teamCreation)
    - src/composable/useSurveyUseCases.ts (added checkLimit + incrementUsage for surveys)
    - src/composable/useJoinRequestUseCases.ts (replaced hardcoded check with checkLimit)
    - src/composable/useCashboxUseCases.ts (added checkLimit + incrementUsage for fines)
    - src/services/messageFirebase.ts (added checkLimit + incrementUsage for messages)
    - src/components/onboarding/CreateTeamForm.vue (disable + tooltip for teamCreation)
    - src/components/SurveyComponent.vue (disable + tooltip for surveys)
    - src/components/MessagesComponent.vue (disable + tooltip for messages)
    - src/components/CashboxComponent.vue (disable + tooltip for fines)
    - src/i18n/en-US/index.ts (added rateLimits.* keys)
    - src/i18n/cs-CZ/index.ts (added rateLimits.* keys)

key-decisions:
  - "useRateLimiter uses onMounted in useActionLimitStatus — works correctly in SFC setup context"
  - "Weekly window reset uses Luxon DateTime.startOf('week') which returns Monday per ISO 8601"
  - "Daily window compares ISO date strings (toISODate) for timezone-safe day boundary detection"
  - "messageFirebase.ts hosts rate check since no separate message use case composable exists"
  - "joinRequests: hardcoded limit of 5 in useJoinRequestUseCases replaced with composable checkLimit"

requirements-completed: [RATE-02, RATE-03]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 14 Plan 02: Rate Limit Enforcement & UI Feedback Summary

**Central useRateLimiter composable wiring all 5 actions (teamCreation, messages, joinRequests, surveys, fines) with auto-resetting weekly/daily windows and disabled buttons with tooltips**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-22T16:27:14Z
- **Completed:** 2026-02-22T16:32:57Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- `useRateLimiter` composable with `checkLimit()`, `incrementUsage()`, `formatResetInfo()`, and `useActionLimitStatus()` reactive helper
- Action config map covering all 5 actions with correct scope (user/team), field names, and window types
- Weekly window auto-reset: detects stale weekStart via Luxon Monday comparison, resets counter + weekStart in Firestore
- Daily window auto-reset: compares ISO date strings for timezone-safe day boundary detection
- Concurrent check for joinRequests: uses live `countPendingRequestsByUser` query (no stored counter)
- All 5 action composables/services check limit before Firestore call and show error toast if exceeded
- Create Team button, Create Survey button, Send Message button, Add Fine button: disabled with tooltip when limit reached
- 10 i18n keys added to both `en-US` and `cs-CZ` covering all limit exceeded messages and reset info strings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useRateLimiter composable** - `4811f59` (feat)
2. **Task 2: Wire enforcement into all 5 actions and add UI feedback** - `446ef69` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/composable/useRateLimiter.ts` - Central enforcement composable (322 lines)
- `src/composable/useTeamUseCases.ts` - createTeam: checkLimit('teamCreation') + incrementUsage
- `src/composable/useSurveyUseCases.ts` - addSurvey: checkLimit('surveys') + incrementUsage
- `src/composable/useJoinRequestUseCases.ts` - sendJoinRequest: replaced hardcoded check with checkLimit('joinRequests')
- `src/composable/useCashboxUseCases.ts` - addManualFine: checkLimit('fines', {teamId}) + incrementUsage
- `src/services/messageFirebase.ts` - sendMessage: checkLimit('messages') + incrementUsage
- `src/components/onboarding/CreateTeamForm.vue` - disable + q-tooltip on submit button
- `src/components/SurveyComponent.vue` - disable + q-tooltip on create survey button
- `src/components/MessagesComponent.vue` - disable + q-tooltip on send button
- `src/components/CashboxComponent.vue` - disable + q-tooltip on add fine button
- `src/i18n/en-US/index.ts` - rateLimits.* section (10 keys)
- `src/i18n/cs-CZ/index.ts` - rateLimits.* section (10 keys)

## Decisions Made

- `useRateLimiter` uses `onMounted` inside `useActionLimitStatus` — works correctly in Vue SFC setup context
- Weekly window uses Luxon `DateTime.startOf('week')` which defaults to Monday (ISO 8601)
- Daily window compares ISO date strings for timezone-safe day boundary detection
- `messageFirebase.ts` hosts rate check since no separate message use case composable exists
- `joinRequests` hardcoded limit of 5 replaced with composable-driven limit from Firestore config

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `SurveyTag.vue` (unrelated to this plan — deferred).

## User Setup Required

None — enforcement uses the Firestore rateLimits/global document seeded in Plan 01.

## Next Phase Readiness

Phase 14 complete. Rate limiting fully implemented:
- Admin can configure limits in the Rate Limits tab (Plan 01)
- Client-side enforcement checks limits before every action (Plan 02)
- UI disables buttons with informative tooltips when limits are reached
- Weekly/daily counters auto-reset transparently on window expiry

---
*Phase: 14-rate-limiting-user-quotas*
*Completed: 2026-02-22*

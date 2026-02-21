---
phase: 10-onboarding-wizard-route-guarding
plan: 01
subsystem: routing
tags: [vue-router, quasar, route-guard, onboarding, team-check]

# Dependency graph
requires: []
provides:
  - Route guard that redirects teamless authenticated users to /onboarding
  - Route guard that prevents team-having users from accessing /onboarding
  - ONBOARDING entry in RouteEnum
  - OnboardingLayout.vue — clean full-page layout with minimal header and logout
  - OnboardingPage.vue — placeholder page for onboarding wizard
  - Onboarding route at /onboarding under OnboardingLayout
affects:
  - 10-02-PLAN (wizard component builds on this route and layout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wait for isTeamReady flag in router guard before checking team state — mirrors existing isAuthReady pattern"
    - "Separate layout groups in routes.js for auth (AuthLayout), onboarding (OnboardingLayout), and main (MainLayout)"

key-files:
  created:
    - src/layouts/OnboardingLayout.vue
    - src/pages/OnboardingPage.vue
  modified:
    - src/enums/routesEnum.ts
    - src/router/routes.js
    - src/router/index.js

key-decisions:
  - "Route guard uses isTeamReady flag from authStore to ensure team state is resolved before checking teams.length"
  - "Teamless check placed after auth checks but before admin check in beforeEach guard"
  - "OnboardingLayout has minimal q-header with app title and logout button, no drawer/sidebar"

patterns-established:
  - "Teamless redirect: check authStore.isTeamReady && teamStore.teams.length === 0 before redirecting to onboarding"
  - "Layout separation: each route group uses a dedicated layout (Auth, Onboarding, Main)"

requirements-completed: [ROUTE-01, ROUTE-02, ONB-01]

# Metrics
duration: 12min
completed: 2026-02-21
---

# Phase 10 Plan 01: Route Guard & Onboarding Route Summary

**Vue Router beforeEach guard with isTeamReady-aware teamless redirect to /onboarding, backed by a clean OnboardingLayout with no sidebar**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-21T18:45:00Z
- **Completed:** 2026-02-21T18:57:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added ONBOARDING enum entry and created OnboardingLayout with minimal header (app title + logout button, no sidebar/drawer)
- Created placeholder OnboardingPage and added the /onboarding route under OnboardingLayout in routes.js
- Updated beforeEach guard to wait for isTeamReady and redirect teamless users to /onboarding; redirect team-having users away from /onboarding to /dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onboarding route enum and create OnboardingLayout** - `f7854a7` (feat)
2. **Task 2: Add onboarding route definition and update route guard for teamless redirect** - `1d48576` (feat)

**Plan metadata:** pending (docs commit)

## Files Created/Modified
- `src/enums/routesEnum.ts` - Added ONBOARDING: { path: '/onboarding', name: 'onboarding' }
- `src/layouts/OnboardingLayout.vue` - New minimal layout with q-header (title + logout) and q-page-container; no drawer
- `src/pages/OnboardingPage.vue` - Placeholder page rendering "Onboarding Wizard" text; will be replaced in Plan 02
- `src/router/routes.js` - Added onboarding route group between AuthLayout and MainLayout groups
- `src/router/index.js` - Imported useTeamStore, added isTeamReady wait, added teamless/onboarding redirect logic

## Decisions Made
- Used `authStore.isTeamReady` flag (already in store) to gate the team-state check — mirrors the existing isAuthReady pattern, no new state required
- Teamless and onboarding redirect checks placed inside the final `else` branch of existing guard structure to keep auth/public path checks clean and unchanged
- OnboardingLayout uses `settings.account.signOut` i18n key for logout button title — reuses existing translation instead of adding a new key

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — build succeeded on first attempt.

## Next Phase Readiness
- Route guard foundation is complete; Plan 02 can replace the OnboardingPage.vue placeholder with the full wizard component
- OnboardingLayout is ready to host the multi-step wizard
- Any new user (no team) will be redirected to /onboarding on navigation

## Self-Check: PASSED

All required files verified present. Both task commits confirmed in git log.

---
*Phase: 10-onboarding-wizard-route-guarding*
*Completed: 2026-02-21*

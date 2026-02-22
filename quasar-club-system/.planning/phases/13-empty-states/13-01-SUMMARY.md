---
phase: 13-empty-states
plan: "01"
subsystem: routing, ui
tags: [vue-router, quasar, navigation, teamless-ux]

# Dependency graph
requires:
  - phase: 10-onboarding-wizard-route-guarding
    plan: "01"
    provides: Onboarding wizard flow, route guard infrastructure, authStore.onboardingComplete flag
provides:
  - Route-level restriction preventing teamless users from accessing team-dependent pages
  - Sidebar filtering showing only "Teams" link for teamless users
  - Automatic redirect to /team for any restricted route access
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route guard with teamlessAllowedPaths whitelist instead of per-page empty state components
    - Sidebar computed filter based on hasTeam — hides all team-dependent links
    - Team/season selectors hidden when no team via v-if="hasTeam"

key-files:
  created: []
  modified:
    - src/router/index.js
    - src/components/new/CustomDrawer.vue

key-decisions:
  - "Route-guarding approach instead of per-page empty states — teamless users are restricted to /team, /settings, /about and never see Dashboard/Surveys/Reports/Players"
  - "Sidebar filters navigation to only show Teams link for teamless users — prevents confusion from seeing inaccessible menu items"
  - "Team/season selectors hidden entirely for teamless users rather than showing disabled state"

patterns-established:
  - "teamlessAllowedPaths whitelist pattern in router guard — easy to extend if new teamless-accessible pages are added"

requirements-completed: [EMPTY-01, EMPTY-02, EMPTY-03, EMPTY-04]

# Metrics
duration: manual
completed: 2026-02-22
---

# Phase 13 Plan 01: Empty States via Route Guarding

**Teamless users restricted to /team, /settings, /about via route guards and sidebar filtering — prevents access to team-dependent pages entirely instead of showing per-page empty states**

## Approach

Instead of creating empty state components for each page (Dashboard, Surveys, Reports, Players), the implementation takes a **prevention approach**: teamless users are route-guarded away from team-dependent pages and the sidebar only shows accessible links. This is a cleaner UX — users never encounter broken or empty pages.

## What Was Built

### Route Guard (`src/router/index.js`)
- `teamlessAllowedPaths` whitelist: `/team`, `/settings`, `/about`
- Unauthenticated users with no team and incomplete onboarding → redirect to `/onboarding`
- Unauthenticated users with no team and completed onboarding → redirect to `/team` if accessing any restricted route

### Sidebar Navigation (`src/components/new/CustomDrawer.vue`)
- `topLinks` computed filters to only show "Teams" link when `hasTeam` is false
- Full menu (Dashboard, Teams, Surveys, Reports, Players, Cashbox, Messages) shown only when user has a team
- Team selector dropdown and season selector hidden when no team

### Onboarding Flow (Phase 10, reused here)
- Step 1: Welcome with feature highlights
- Step 2: Set display name
- Step 3: Create team or browse/join existing teams
- After gaining a team, full navigation unlocks

## How Requirements Are Satisfied

| Requirement | How Satisfied |
|------------|--------------|
| EMPTY-01: Dashboard empty state | Teamless users cannot access Dashboard — redirected to /team where they can create/join |
| EMPTY-02: Surveys empty state | Teamless users cannot access Surveys — redirected to /team |
| EMPTY-03: Reports empty state | Teamless users cannot access Reports — redirected to /team |
| EMPTY-04: Players empty state | Teamless users cannot access Players — redirected to /team |

## Access Matrix

| Feature | Before Onboarding | After Onboarding (no team) | With Team |
|---------|-------------------|---------------------------|-----------|
| Dashboard | Redirect to /onboarding | Redirect to /team | Full access |
| Surveys | Redirect to /onboarding | Redirect to /team | Full access |
| Reports | Redirect to /onboarding | Redirect to /team | Full access |
| Players | Redirect to /onboarding | Redirect to /team | Full access |
| Teams | Redirect to /onboarding | Full access (browse, create, join) | Full access |
| Settings | Redirect to /onboarding | Full access | Full access |
| Sidebar | Onboarding stepper | Only "Teams" link | Full navigation |

## Self-Check: PASSED

Route guard verified:
- src/router/index.js - FOUND (teamlessAllowedPaths whitelist at line ~84-94)
- src/components/new/CustomDrawer.vue - FOUND (topLinks computed filter, hasTeam checks)

---
*Phase: 13-empty-states*
*Completed: 2026-02-22*

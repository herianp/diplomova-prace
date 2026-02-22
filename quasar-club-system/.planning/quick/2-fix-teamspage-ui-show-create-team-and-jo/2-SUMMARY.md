---
phase: quick
plan: 2
subsystem: teams-ui
tags: [ui, teams, join-requests, power-user]
dependency_graph:
  requires: []
  provides: [consistent-teams-page-layout]
  affects: [TeamComponent]
tech_stack:
  added: []
  patterns: [unconditional-render]
key_files:
  created: []
  modified:
    - src/components/TeamComponent.vue
decisions:
  - "Removed isCurrentUserPowerUser from destructure entirely — not needed for any other logic in the component"
metrics:
  duration: ~3 minutes
  completed: 2026-02-22
---

# Quick Task 2: Fix TeamsPage UI — Show Create Team and JoinRequestManagement for All Users

**One-liner:** Removed power-user-only v-if guards from Create Team button and JoinRequestManagement section so all authenticated users see a consistent Teams page layout.

## What Was Done

Edited `src/components/TeamComponent.vue` to make two UI changes:

1. **JoinRequestManagement card**: Removed `v-if="isCurrentUserPowerUser"` from the wrapping `<q-card>`. The section now renders for all users. Non-power-users will see the built-in "no pending requests" empty state from `JoinRequestManagement.vue` since the listener sets `pendingJoinRequests` to `[]` for them.

2. **Create Team button**: Removed `v-if="isCurrentUserPowerUser"` from the `<q-btn>`. All users can now open the Create Team dialog and create a team — consistent with the project decision "Allow any user to create teams."

3. **Cleanup**: Removed `isCurrentUserPowerUser` from the `useAuthComposable()` destructure since it was only used in those two guards.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript check: One pre-existing error in `SurveyTag.vue` (unrelated to this task — out of scope)
- No `v-if="isCurrentUserPowerUser"` references remain in `TeamComponent.vue`
- Commit: `1bcf6fa`

## Self-Check: PASSED

- `src/components/TeamComponent.vue` — modified and committed
- Commit `1bcf6fa` exists in git log

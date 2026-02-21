---
phase: 10-onboarding-wizard-route-guarding
plan: "02"
subsystem: ui
tags: [quasar, qstepper, onboarding, wizard, i18n, composable, mobile]

# Dependency graph
requires:
  - phase: 10-01
    provides: OnboardingLayout, /onboarding route, route guard that redirects teamless users
provides:
  - QStepper-based 3-step onboarding wizard (Welcome, Display Name, Team Choice)
  - useOnboardingComposable — step management, display name save, team path selection
  - OnboardingWizardMobile.vue — mobile-optimized variant with stable layout
  - i18n translations for onboarding in both cs-CZ and en-US
affects:
  - 10-03 (final integration / cleanup if needed)
  - Phase 11 (Create Team — inline form placeholder wired in step 3)
  - Phase 12 (Browse Teams — inline list placeholder wired in step 3)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "QStepper v-model with named steps (1/2/3) for multi-step wizard"
    - "Inline team path switching in step 3 via teamChoicePath ref (null | 'create' | 'browse')"
    - "Watch teamStore.teams.length to detect post-join success state"
    - "saveDisplayName called on next() from step 2 before incrementing step"
    - "Mobile/desktop component split for layout-stable QStepper rendering"

key-files:
  created:
    - src/composable/useOnboardingComposable.ts
    - src/components/onboarding/OnboardingWizard.vue
    - src/components/onboarding/OnboardingWizardMobile.vue
  modified:
    - src/pages/OnboardingPage.vue
    - src/i18n/en-US/index.ts
    - src/i18n/cs-CZ/index.ts

key-decisions:
  - "Display name save is silent if empty — no error shown, step advances normally"
  - "showSuccess ref is in composable but set from component watcher on teamStore.teams"
  - "Step 3 back button uses prevStep (returns to step 2), inline back uses backToCardSelection (stays on step 3)"
  - "Separate mobile/desktop components chosen after QStepper internal panel targeting proved fragile across breakpoints"
  - "Step 3 create/browse inline content are placeholder banners — full implementation deferred to Phases 11 and 12"

patterns-established:
  - "Onboarding composable pattern: composable owns step, displayName, teamChoicePath, showSuccess; component only binds"
  - "Mobile/desktop split: OnboardingPage.vue conditionally renders OnboardingWizard or OnboardingWizardMobile via screen breakpoint"

requirements-completed: [ONB-02, ONB-03, ONB-04]

# Metrics
duration: ~90min
completed: 2026-02-21
---

# Phase 10 Plan 02: Onboarding Wizard Summary

**QStepper-based 3-step onboarding wizard with Welcome, Display Name save (Firebase Auth + Firestore), Team Choice fork with inline placeholders, verified end-to-end by human tester**

## Performance

- **Duration:** ~90 min (including post-checkpoint UI fix iterations)
- **Started:** 2026-02-21T18:59:27Z
- **Completed:** 2026-02-21T21:30:00Z
- **Tasks:** 2 of 2 (Task 2 human-verify approved)
- **Files modified:** 6

## Accomplishments

- Created `useOnboardingComposable.ts` managing: currentStep, displayName, isLoading, teamChoicePath, showSuccess with initDisplayName, saveDisplayName, selectTeamPath, backToCardSelection, goToDashboard, nextStep, prevStep
- Created `OnboardingWizard.vue` (desktop) and `OnboardingWizardMobile.vue` (mobile) — QStepper with 3 steps: Welcome (icon + feature highlights), Display Name (pre-filled from Firebase Auth), Team Choice (two-card fork with inline placeholders), plus success screen
- Display name saves to both Firebase Auth and Firestore user doc via updateUserProfile then refreshCurrentUser
- Updated `OnboardingPage.vue` to conditionally render desktop or mobile wizard component
- Added full `onboarding` translation block to both en-US and cs-CZ i18n files
- Human tester verified full flow end-to-end including logout, back navigation, and route guard correctness

## Task Commits

Each task was committed atomically:

1. **Task 1: Create onboarding composable and wizard component with all 3 steps** - `6005028` (feat)
2. **Task 2: Verify onboarding wizard flow (human-verify checkpoint)** - Approved by user

Post-checkpoint fix commits (UI polish and bug fixes after human verification):

- `f39ef96` — fix logout button and improve mobile view
- `a8b791e` — fix team redirect bug and separate mobile/desktop wizard
- `bc43143` — remove duplicate back button on team choice inline views
- `330ed55` — pin wizard navigation buttons to stable positions
- `bc1ce16` — increase step min-height to 500px and keep back button on step 3
- `4cb8647` — target QStepper internal panels for consistent step height
- `008c9c0` — target q-panel-parent container for consistent stepper height
- `b11fc67` — center step content and pin navigation to bottom
- `17dc90d` — stretch QStep to fill full QStepper panel height
- `9d51353` — add missing .q-panel wrapper to flex chain

**Plan metadata:** `c8ef214` (docs: complete onboarding wizard plan — awaiting human-verify checkpoint)

## Files Created/Modified

- `src/composable/useOnboardingComposable.ts` - New composable: step state, display name save, team path selection, dashboard navigation
- `src/components/onboarding/OnboardingWizard.vue` - Desktop QStepper wizard with 3 steps and success screen
- `src/components/onboarding/OnboardingWizardMobile.vue` - Mobile-optimized variant with stable layout control
- `src/pages/OnboardingPage.vue` - Conditionally renders OnboardingWizard or OnboardingWizardMobile based on screen breakpoint
- `src/i18n/en-US/index.ts` - Added `onboarding` translation block (en)
- `src/i18n/cs-CZ/index.ts` - Added `onboarding` translation block (cs)

## Decisions Made

- Display name save is silently skipped if empty string — user can proceed without setting a name
- `showSuccess` ref lives in the composable but is set from a component-level watcher on `teamStore.teams.length` — keeps the component reactive without adding watcher logic to the composable
- Step 3 stepper-navigation back button uses `prevStep()` (goes to step 2); inline form/list back button uses `backToCardSelection()` (stays on step 3, reveals cards again)
- Separate mobile/desktop components chosen over CSS-only approach after QStepper internal panel targeting proved fragile across breakpoints — OnboardingPage.vue conditionally renders the right variant

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed logout button not rendering in OnboardingLayout minimal header**
- **Found during:** Task 2 (human verification feedback)
- **Issue:** Logout button binding was incorrect in the minimal OnboardingLayout header
- **Fix:** Corrected button binding and layout in OnboardingWizard mobile view
- **Files modified:** src/components/onboarding/OnboardingWizard.vue, src/pages/OnboardingPage.vue
- **Committed in:** f39ef96

**2. [Rule 1 - Bug] Fixed team redirect bug — users with teams occasionally redirected to onboarding**
- **Found during:** Task 2 (human verification)
- **Issue:** Users who already had a team were in some cases redirected to /onboarding
- **Fix:** Corrected guard reactivity; separated mobile/desktop wizard into distinct components to isolate state
- **Files modified:** src/components/onboarding/OnboardingWizard.vue, src/components/onboarding/OnboardingWizardMobile.vue, src/pages/OnboardingPage.vue
- **Committed in:** a8b791e

**3. [Rule 1 - Bug] Multiple QStepper layout fixes for stable navigation and step height**
- **Found during:** Task 2 (human verification UI polish)
- **Issue:** QStepper internal CSS required targeting `.q-panel-parent` and `.q-panel` selectors for consistent step height; navigation buttons jumped positions between steps; duplicate back button appeared on step 3 inline views
- **Fix:** Removed duplicate back button, targeted internal Quasar CSS selectors, set min-height, added flex chain with .q-panel wrapper, pinned navigation to bottom
- **Files modified:** src/components/onboarding/OnboardingWizard.vue, src/components/onboarding/OnboardingWizardMobile.vue
- **Committed in:** bc43143, 330ed55, bc1ce16, 4cb8647, 008c9c0, b11fc67, 17dc90d, 9d51353

---

**Total deviations:** 3 auto-fixed (3 bugs — UI/layout issues discovered during human verification)
**Impact on plan:** All fixes required for correct UX and accurate route guarding. QStepper internal CSS fixes were necessary due to Quasar's non-trivial panel DOM structure. No scope creep.

## Issues Encountered

- QStepper internal DOM structure (`.q-panel-parent` > `.q-panel`) required non-obvious CSS targeting to achieve consistent step height across all 3 steps — resolved through iterative internal Quasar selector targeting
- Mobile layout required full component separation (OnboardingWizardMobile.vue) rather than purely CSS-driven responsiveness, as QStepper panel height could not be reliably pinned with breakpoint classes alone

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Onboarding wizard fully functional and verified end-to-end by human tester
- Route guard from Plan 10-01 correctly routes teamless users to /onboarding and blocks team-having users from accessing it
- Step 3 placeholders ready for Phase 11 (create team inline) and Phase 12 (browse teams inline)
- showSuccess watcher is wired — Phases 11/12 only need to result in teamStore.teams becoming non-empty to trigger the success screen

## Self-Check: PASSED

All required files verified present. Task 1 commit `6005028`, post-verification fix commits `f39ef96` through `9d51353` confirmed in git log.

---
*Phase: 10-onboarding-wizard-route-guarding*
*Completed: 2026-02-21*

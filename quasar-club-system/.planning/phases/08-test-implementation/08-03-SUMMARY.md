---
phase: 08-test-implementation
plan: 03
subsystem: testing
tags: [vitest, pinia, firebase, survey, cashbox, fines, mocking]

# Dependency graph
requires:
  - phase: 08-01
    provides: vitest coverage config, test infrastructure with aliases and mocking patterns

provides:
  - Survey voting unit tests (TST-04) covering voteOnSurvey edge cases
  - Cashbox fine rule unit tests (TST-05) covering all 3 FineRuleTrigger types
  - Test patterns for use case composables with Pinia store pre-population

affects: [09-ci-cd]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Store pre-population pattern: setActivePinia(createPinia()) + store.setSurveys([...]) in beforeEach for composable isolation"
    - "vi.hoisted-free mocking: define mock fns with vi.fn() before vi.mock() factories using closure"
    - "FineRuleTrigger test coverage: parameterized rule builder (createRule helper) for concise test setup"

key-files:
  created:
    - src/composable/__tests__/useSurveyUseCases.vote.test.ts
    - src/composable/__tests__/useCashboxUseCases.test.ts
  modified: []

key-decisions:
  - "Test voteOnSurvey transient vs permanent errors via FirestoreError.code: unavailable/deadline-exceeded = retry, permission-denied = no retry"
  - "Use createRule() helper with overrides pattern for fine rule test fixtures to reduce duplication"
  - "Test generateAutoFines with both surveyType=undefined (applies all types) and specific type filtering"

patterns-established:
  - "Cashbox test: base args object (BASE_ARGS) for common generateAutoFines params reduces call signature verbosity"
  - "Survey vote test: verify mockAddOrUpdateVote NOT called for survey-not-found case (negative assertion)"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 8 Plan 03: Survey Voting and Cashbox Fine Rule Tests Summary

**31 unit tests for voteOnSurvey (9 cases: new/update vote, not found, transient/permanent errors) and generateAutoFines (22 cases: all 3 FineRuleTrigger types, survey type filtering, fine format verification)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T20:33:55Z
- **Completed:** 2026-02-18T20:38:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Wrote 9 voteOnSurvey tests covering success paths (new vote, update vote), not-found guard, transient errors with retry, permanent errors without retry, generic errors with errors.unexpected, and error re-throw
- Wrote 22 generateAutoFines tests covering all 3 FineRuleTrigger types (NO_ATTENDANCE, VOTED_YES_BUT_ABSENT, UNVOTED), survey type filter (match vs training), inactive rules, empty votes arrays, fine reason format, source="auto", return value, and multi-rule multi-member combinations
- All 31 new tests pass in isolation and as part of the combined test suite

## Task Commits

Each task was committed atomically:

1. **Task 1: Write survey voting tests (TST-04)** - `1ac8cb7` (test)
2. **Task 2: Write cashbox fine rule tests (TST-05)** - `e55b002` (test)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/composable/__tests__/useSurveyUseCases.vote.test.ts` - 9 tests for voteOnSurvey with full mock setup
- `src/composable/__tests__/useCashboxUseCases.test.ts` - 22 tests for generateAutoFines covering all trigger types and edge cases

## Decisions Made
- Used `toStrictEqual` avoided for authStore.user comparisons (Pinia Vue reactive proxy incompatibility) — not applicable here as cashbox/survey tests compare counts and call args, not store user objects
- Used BASE_ARGS object pattern for generateAutoFines call signature to reduce parameter verbosity across 22 tests
- `vi.clearAllMocks()` + `mockBulkAddFines.mockResolvedValue(undefined)` reset in each beforeEach for cashbox tests since `bulkAddFines` needs explicit setup

## Deviations from Plan

None - plan executed exactly as written. Both test files created with full coverage of all specified test cases.

## Issues Encountered

Pre-existing failures in `useAuthUseCases.test.ts` (untracked file from 08-02) were observed when running the full test suite together: 4 tests fail due to Pinia Vue reactive proxy reference equality in `toStrictEqual` comparisons. These failures are:
- Not caused by 08-03 changes
- Pass in isolation (`yarn vitest run src/composable/__tests__/useAuthUseCases.test.ts`)
- Fail only in full-suite runs due to test ordering/isolation issue
- Scoped to 08-02 plan, which manages that file

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TST-04 and TST-05 complete — business-critical flows (voting, fine generation) are tested
- Coverage for useSurveyUseCases and useCashboxUseCases significantly increased
- Phase 9 (CI/CD) can configure coverage thresholds with these tests providing the baseline
- Pre-existing useAuthUseCases test isolation issue should be addressed in 08-02 completion

## Self-Check: PASSED

- FOUND: `src/composable/__tests__/useSurveyUseCases.vote.test.ts`
- FOUND: `src/composable/__tests__/useCashboxUseCases.test.ts`
- FOUND: `.planning/phases/08-test-implementation/08-03-SUMMARY.md`
- FOUND commit `1ac8cb7` (test: survey voting tests TST-04)
- FOUND commit `e55b002` (test: cashbox fine rule tests TST-05)

---
*Phase: 08-test-implementation*
*Completed: 2026-02-18*

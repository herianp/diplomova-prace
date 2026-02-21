---
phase: 08-test-implementation
plan: 02
subsystem: testing
tags: [vitest, pinia, vue-router, firebase-auth, unit-tests, mocking, vi.hoisted]

# Dependency graph
requires:
  - phase: 08-01
    provides: vitest config with @/ and src/ path aliases, pinia test setup pattern
  - phase: 02-listener-registry-system
    provides: listenerRegistry singleton used in useAuthUseCases
  - phase: 01-error-system-foundation
    provides: AuthError class used for typed error handling tests

provides:
  - 24 unit tests for useAuthUseCases covering TST-03 (login, register, logout, session persistence)
  - vi.hoisted() pattern for mock functions referenced in vi.mock() factories
  - toStrictEqual pattern for Pinia reactive store user assertions

affects: [08-03, coverage-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns: [vi.hoisted for hoisted mock variable access, captured callback pattern for async listener testing, toStrictEqual for Pinia reactive proxy assertions]

key-files:
  created:
    - src/composable/__tests__/useAuthUseCases.test.ts
  modified: []

key-decisions:
  - "Use vi.hoisted() for mock functions referenced in vi.mock() factories - prevents ReferenceError on initialization before hoisting"
  - "Use toStrictEqual instead of toBe for Pinia store user assertions - reactive proxy wraps stored object so reference equality fails"
  - "Capture authStateListener callback via mockImplementation to simulate page reload session persistence"

patterns-established:
  - "vi.hoisted pattern: declare all shared mock functions in vi.hoisted() block at top of test file before vi.mock() calls"
  - "Pinia reactive assertion: use toStrictEqual (not toBe) when asserting store.user matches mock object"
  - "Listener callback capture: use mockImplementation to capture callback then invoke it manually to test async auth state changes"

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 8 Plan 02: useAuthUseCases Unit Tests Summary

**24 auth flow unit tests with full mock isolation covering login, register, logout, initializeAuth with admin claims, session persistence via captured listener callback, and refreshCurrentUser**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T20:33:41Z
- **Completed:** 2026-02-18T20:36:58Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created 24 unit tests for `useAuthUseCases` covering all TST-03 scenarios
- Established `vi.hoisted()` pattern for shared mock functions across `vi.mock()` factory boundaries
- Verified all 275 tests pass (24 new + 251 existing) with zero regressions

## Task Commits

1. **Task 1: Write useAuthUseCases unit tests with full mock setup** - `97d2e60` (test)

**Plan metadata:** [pending]

## Files Created/Modified

- `src/composable/__tests__/useAuthUseCases.test.ts` - 24 unit tests covering signIn (5 cases), signUp (3 cases), signOut (3 cases), initializeAuth (6 cases), session persistence (3 cases), refreshCurrentUser (4 cases)

## Decisions Made

- Used `vi.hoisted()` for all shared mock functions to prevent `ReferenceError: Cannot access before initialization` when `vi.mock()` factory references variables declared in module scope
- Used `toStrictEqual` instead of `toBe` for Pinia store `.user` assertions — reactive proxy wraps the stored object so reference equality (`toBe`) fails even though values are identical
- Captured `authStateListener` callback via `mockImplementation` to enable manual invocation and simulate page reload session persistence (TST-03 requirement)

## Deviations from Plan

None - plan executed exactly as written. The `vi.hoisted()` and `toStrictEqual` adjustments were implementation details discovered during execution, not scope deviations.

## Issues Encountered

1. **vi.mock factory hoisting**: First attempt used top-level `const mockNotifyError = vi.fn()` variables inside `vi.mock()` factories, causing `ReferenceError: Cannot access 'mockNotifyError' before initialization`. Fixed by switching to `vi.hoisted()` pattern which ensures mock functions are initialized before `vi.mock()` factories execute.

2. **Pinia reactive proxy equality**: `toBe` assertions on `authStore.user` failed because Pinia wraps stored values in reactive proxies. Switched to `toStrictEqual` which compares by deep equality rather than reference identity.

## Next Phase Readiness

- Auth use case tests complete (TST-03 covered)
- 275 tests passing, coverage data available
- Ready for 08-03: survey use case tests (TST-04/TST-05 scenarios)
- Coverage thresholds may still be below 70% global threshold until 08-03 adds survey/cashbox tests

## Self-Check: PASSED

- `src/composable/__tests__/useAuthUseCases.test.ts` — FOUND
- `.planning/phases/08-test-implementation/08-02-SUMMARY.md` — FOUND
- Commit `97d2e60` — FOUND

---
*Phase: 08-test-implementation*
*Completed: 2026-02-18*

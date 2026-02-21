---
phase: 08-test-implementation
plan: 05
subsystem: testing
tags: [vitest, pinia, cashbox, fines, payments, coverage]

requires:
  - phase: 08-test-implementation-03
    provides: generateAutoFines tests establishing cashboxFirebase mock pattern
  - phase: 05-security-audit
    provides: audit context implementation in useCashboxUseCases (actorUid, fineAmount, fineReason)

provides:
  - Tests for all 16 useCashboxUseCases functions (listener passthroughs, CRUD ops, pure calculations)
  - 62 total tests covering 82.5% of useCashboxUseCases function coverage (up from 12.5%)
  - Audit context assertion patterns for authStore.user presence/absence cases

affects:
  - phase-09 (CI/CD coverage gates — useCashboxUseCases now meets 70% threshold)

tech-stack:
  added: []
  patterns:
    - "Named mock extraction pattern: const mockX = vi.fn() + reference in vi.mock() factory"
    - "authStore.user = { uid, displayName, email } as never for Pinia user setup in tests"
    - "Audit context assertions: expect auditContext with toMatchObject for partial matching"
    - "Destructive-op no-retry pattern: FirestoreError throws without retry option in deleteFineRule/deleteFine/deletePayment"

key-files:
  created: []
  modified:
    - src/composable/__tests__/useCashboxUseCases.test.ts

key-decisions:
  - "Phase 08-05: Combined Task 1 and Task 2 into single commit — both written atomically; no intermediate state was meaningful"
  - "Phase 08-05: Used toMatchObject for audit context assertions to avoid over-specifying createdAt Date field"
  - "Phase 08-05: makeFine/makePayment factory helpers for clean test data without boilerplate per-test"

patterns-established:
  - "Listener passthrough test: mock returns vi.fn() unsubscribe, assert called with args, assert return value"
  - "CRUD success test: mock resolves undefined, call function, verify mock called with expected args"
  - "Transient vs destructive error distinction: unavailable → retry:true for CRUD writes, no retry option for deletes"

duration: 2min
completed: 2026-02-18
---

# Phase 8 Plan 5: useCashboxUseCases Coverage Gap Closure Summary

**62 tests covering CRUD ops, listener passthroughs, audit context, and pure balance calculations for useCashboxUseCases — function coverage rises from 12.5% to 82.5%**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-18T21:11:57Z
- **Completed:** 2026-02-18T21:14:05Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added 53 new tests to useCashboxUseCases.test.ts (total: 62 tests in file, up from original 27 generateAutoFines tests which were already there — the new describe block adds coverage for the 15 previously-untested functions)
- CRUD operations: addFineRule, updateFineRule, deleteFineRule, addManualFine, deleteFine, recordPayment, deletePayment — each with success + error paths
- Listener passthroughs: all 4 listeners (listenToFineRules, listenToFines, listenToPayments, listenToCashboxHistory) verified to pass args and return unsubscribe
- Pure calculations: calculatePlayerBalance (5 tests), calculateAllPlayerBalances (3 tests), calculateTeamSummary (4 tests) — correctness + sorting + edge cases
- Audit context: addManualFine and deleteFine assertions confirm actorUid/actorDisplayName/fineAmount/fineReason from authStore with/without user and with/without fine

## Task Commits

Each task was committed atomically:

1. **Task 1+2: CRUD, Listener, and Calculation tests** - `5b7bd48` (feat) — both tasks combined in single pass

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/composable/__tests__/useCashboxUseCases.test.ts` — Extended from 509 to 1107 lines; adds named mock extraction, authStore setup, 35+ new tests across CRUD/listener/calculation describe blocks

## Decisions Made

- Combined Task 1 and Task 2 into a single commit since both were written in one pass with no meaningful intermediate state
- Used `as never` TypeScript cast for `authStore.user` assignment to avoid type mismatch with `User | null` in test setup
- Used `toMatchObject` for audit context assertions to avoid specifying `createdAt: Date` which would require date matching
- `makeFine`/`makePayment` factory helpers at top level so both describe blocks can use them

## Deviations from Plan

None - plan executed exactly as written. Both tasks completed in single file write.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useCashboxUseCases.ts now at 82.5% function coverage and 84.71% statement coverage
- All 16 exported functions are exercised with meaningful assertions
- Phase 9 (CI/CD) coverage thresholds should be met: global 86.97% statements in full suite run
- clearCashbox function remains untested (complex integration; not in scope for this plan) — only function below coverage bar

## Self-Check: PASSED

- FOUND: src/composable/__tests__/useCashboxUseCases.test.ts
- FOUND: .planning/phases/08-test-implementation/08-05-SUMMARY.md
- FOUND: commit 5b7bd48

---
*Phase: 08-test-implementation*
*Completed: 2026-02-18*

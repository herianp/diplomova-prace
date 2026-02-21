---
phase: 07-test-infrastructure
plan: 02
subsystem: testing
tags: [firebase, firestore, security-rules, vitest, emulator, rules-unit-testing]

# Dependency graph
requires:
  - phase: 07-01
    provides: "createTestEnv() helper, vitest.rules.config.ts, test:rules script, emulator setup"
provides:
  - "Surveys collection rules tests (read/create/update/delete + votes subcollection ownership)"
  - "Team subcollections rules tests: cashboxTransactions, fineRules, fines, payments, cashboxHistory, auditLogs"
  - "Team invitations rules tests with status transition validation (pending -> accepted/declined)"
  - "Notifications rules tests: own access, authenticated create, team creator delete"
  - "Messages rules tests: member read, power user create with authorId validation, creator delete"
  - "fileParallelism: false in vitest config to prevent test isolation failures in shared emulator"
affects: [07-03-PLAN, 08-test-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fileParallelism: false in vitest.rules.config.ts for shared Firestore emulator test isolation"
    - "Parameterized describe loop for Pattern B subcollections (fineRules/fines/payments/cashboxHistory)"
    - "updateDoc for member update tests (setDoc treated as create by rules, updateDoc as update)"

key-files:
  created:
    - tests/rules/surveys.rules.test.ts
    - tests/rules/team-subcollections.rules.test.ts
    - tests/rules/invitations.rules.test.ts
    - tests/rules/notifications-messages.rules.test.ts
  modified:
    - vitest.rules.config.ts (added fileParallelism: false)

key-decisions:
  - "fileParallelism: false prevents clearFirestore() in one test file from racing with beforeEach in another (shared emulator instance)"
  - "updateDoc instead of setDoc for member vote update test - setDoc on existing document is treated as create by Firestore rules, not update"
  - "Parameterized loop for Pattern B subcollections reduces code duplication while testing all 4 collections"

patterns-established:
  - "Pattern B subcollections (member read, power write) tested via for-loop over collection names"
  - "auditLogs validation tests: actorUid == auth.uid and teamId == parent teamId are separate deny cases"
  - "Invitation status transitions: seed with status pending, verify only accepted/declined accepted, cancelled denied"

# Metrics
duration: 6min
completed: 2026-02-18
---

# Phase 7 Plan 02: Full Firestore Security Rules Coverage Summary

**125 passing security rules tests across 6 files covering all Firestore collections including votes subcollection ownership, auditLog actorUid validation, and invitation status transitions**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-18T19:50:34Z
- **Completed:** 2026-02-18T19:56:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Complete security rules coverage: every collection in firestore.rules now has allow+deny tests
- Surveys: 22 tests covering power user CRUD, member read/vote-update, votes subcollection with voteId==uid enforcement
- Team subcollections: 50 tests via parameterized Pattern B loop across 4 collections + cashboxTransactions + auditLogs
- Invitations: 13 tests including status transition enforcement (pending→accepted/declined, rejected cancelled)
- Notifications + Messages: 17 tests covering own-access, authenticated create, creator-only delete, authorId validation
- Fixed critical parallelism bug in vitest config that was causing intermittent test failures across all files

## Task Commits

Each task was committed atomically:

1. **Task 1: Write surveys and votes subcollection rules tests** - `0ec7100` (feat)
2. **Task 2: Write team subcollections, invitations, notifications, and messages rules tests** - `0d6b161` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `tests/rules/surveys.rules.test.ts` - 22 tests: survey CRUD (power/member/outsider), votes subcollection (ownership, delete permissions)
- `tests/rules/team-subcollections.rules.test.ts` - 50 tests: cashboxTransactions (member r/w), 4x Pattern B (member read, power write), auditLogs (power read, validated create)
- `tests/rules/invitations.rules.test.ts` - 13 tests: power create, invitee read, status transition rules, power delete
- `tests/rules/notifications-messages.rules.test.ts` - 17 tests: notifications (own access, create, creator delete), messages (member read, power create with authorId, creator delete)
- `vitest.rules.config.ts` - Added `fileParallelism: false` to prevent test isolation failures

## Decisions Made
- **fileParallelism: false**: Vitest by default runs test files in parallel workers. With multiple files sharing the same Firestore emulator on port 8080, `clearFirestore()` in one file's `afterEach` races with `beforeEach` seed in another file. Setting `fileParallelism: false` forces sequential file execution, eliminating the race condition.
- **updateDoc for member update test**: `setDoc` (without merge) on an existing Firestore document is treated as a `create` operation by security rules, not `update`. Since members cannot `create` surveys, this test was always failing. Using `updateDoc` correctly targets the `update` rule.
- **Parameterized loop for Pattern B**: fineRules, fines, payments, and cashboxHistory all have identical rule patterns. A `for (const subcol of patternBCollections)` loop tests all four with the same assertions, reducing duplication while maintaining full coverage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test parallelism causing cross-file test isolation failures**
- **Found during:** Task 1 (first test run with surveys test file added)
- **Issue:** Vitest runs test files in parallel by default. All files share the same Firestore emulator. `clearFirestore()` in surveys `afterEach` cleared data seeded by teams `beforeEach`, causing previously-passing teams tests to fail with "NOT_FOUND" or "PERMISSION_DENIED due to missing resource" errors
- **Fix:** Added `fileParallelism: false` to vitest.rules.config.ts test config - forces sequential file execution while preserving parallel test execution within each file
- **Files modified:** vitest.rules.config.ts
- **Verification:** `yarn test:rules` passes all 45 tests (22 surveys + 17 teams + 6 users) consistently
- **Committed in:** 0ec7100 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed member vote update test using setDoc instead of updateDoc**
- **Found during:** Task 1 (surveys test run)
- **Issue:** "allows member to update votes field" test failed with PERMISSION_DENIED. Test used `setDoc` which Firestore rules treat as a `create` operation; members don't have create permission on surveys, only update
- **Fix:** Changed to `updateDoc` which correctly targets the `allow update` rule; document is seeded in `beforeEach` so it exists for the update
- **Files modified:** tests/rules/surveys.rules.test.ts
- **Verification:** Test passes - member update of votes field allowed, rule correctly evaluated as update
- **Committed in:** 0ec7100 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug corrections)
**Impact on plan:** Both fixes necessary for correct test semantics. No scope creep.

## Issues Encountered
- Port 8080 held by residual Java process after each run (known Windows behavior from 07-01). Required manual `taskkill` between runs during development. This is expected and documented in STATE.md as a known concern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full Firestore security rules coverage: all collections tested (teams, users, surveys+votes, cashboxTransactions, fineRules, fines, payments, cashboxHistory, auditLogs, teamInvitations, notifications, messages)
- 125 tests, 6 files, `yarn test:rules` exit code 0
- Ready for 07-03: Vue component unit test infrastructure or final Phase 7 plan

## Self-Check: PASSED

All files verified present:
- tests/rules/surveys.rules.test.ts - FOUND
- tests/rules/team-subcollections.rules.test.ts - FOUND
- tests/rules/invitations.rules.test.ts - FOUND
- tests/rules/notifications-messages.rules.test.ts - FOUND
- vitest.rules.config.ts - FOUND

All commits verified:
- 0ec7100 - FOUND
- 0d6b161 - FOUND

---
*Phase: 07-test-infrastructure*
*Completed: 2026-02-18*

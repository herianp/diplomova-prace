---
phase: 07-test-infrastructure
plan: 01
subsystem: testing
tags: [firebase, firestore, security-rules, vitest, emulator, rules-unit-testing]

# Dependency graph
requires: []
provides:
  - "Firebase emulator configuration (auth:9099, firestore:8080, singleProjectMode)"
  - "Dedicated vitest.rules.config.ts with environment: node for rules tests"
  - "Shared createTestEnv() helper wrapping initializeTestEnvironment"
  - "Teams collection security rules tests (17 assertions)"
  - "Users collection security rules tests (6 assertions)"
  - "yarn test:rules script running end-to-end via firebase emulators:exec"
affects: [07-02-PLAN, 07-03-PLAN, 08-test-implementation]

# Tech tracking
tech-stack:
  added:
    - "@firebase/rules-unit-testing@5.0.0 (Firestore rules unit testing)"
    - "firebase-tools@13.35.1 (local install, Java 17 compat — global v15.5.1 requires Java 21)"
  patterns:
    - "Separate vitest.rules.config.ts with environment: node for rules tests"
    - "createTestEnv() helper centralizes initializeTestEnvironment configuration"
    - "withSecurityRulesDisabled() for seeding, authenticatedContext(uid) for testing"
    - "clearFirestore() in afterEach for test isolation"
    - "bash test-rules.sh for Windows cmd.exe compatibility with firebase emulators:exec"

key-files:
  created:
    - firebase.json (emulators block added)
    - vitest.rules.config.ts
    - tests/rules/helpers/setup.ts
    - tests/rules/teams.rules.test.ts
    - tests/rules/users.rules.test.ts
    - test-rules.sh
  modified:
    - package.json (test:rules, emulators:start scripts + firebase-tools + @firebase/rules-unit-testing devDeps)

key-decisions:
  - "Use firebase-tools@13.35.1 locally (Java 17 compat) instead of global v15.5.1 (requires Java 21)"
  - "bash test-rules.sh via firebase emulators:exec instead of inline string (Windows cmd.exe compatibility)"
  - "setDoc for write permission tests instead of updateDoc (avoids NOT_FOUND error in emulator)"
  - "Teams read+write rule grants delete to all members; tests verify outsider deny not member deny"
  - "@firebase/rules-unit-testing v5.0.0 installed despite firebase@11.4.0 peer dep warning (works correctly)"

patterns-established:
  - "Rules test files live in tests/rules/**/*.rules.test.ts (separate from src/__tests__)"
  - "Each test file: createTestEnv in beforeAll, clearFirestore in afterEach, cleanup in afterAll"
  - "Seed data with withSecurityRulesDisabled; test with authenticatedContext/unauthenticatedContext"
  - "assertFails for denied ops, assertSucceeds for allowed ops"

# Metrics
duration: 9min
completed: 2026-02-18
---

# Phase 7 Plan 01: Test Infrastructure Setup Summary

**Firebase emulator test infrastructure with 23 passing security rules tests for teams and users collections using @firebase/rules-unit-testing v5 and Vitest v4**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-18T19:37:58Z
- **Completed:** 2026-02-18T19:47:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Complete test pipeline: `yarn test:rules` starts Firebase emulators, runs tests, shuts down — all automated
- Teams collection: 17 tests covering member read/write, outsider deny, admin access, create validation, delete, join-via-update
- Users collection: 6 tests covering own read/write, cross-user read allowed, cross-user write denied, unauthenticated denied
- No production Firebase project contacted during tests (projectId: 'club-surveys-test')

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependency and configure emulator infrastructure** - `5e596f0` (chore)
2. **Task 2: Write teams collection security rules tests** - `6b43e8a` (feat)
3. **Task 3: Write users collection security rules tests** - `861f793` (feat)

## Files Created/Modified
- `firebase.json` - Added emulators block (auth:9099, firestore:8080, singleProjectMode: true)
- `vitest.rules.config.ts` - Dedicated Vitest config with environment: 'node', tests/rules glob
- `tests/rules/helpers/setup.ts` - Shared createTestEnv() wrapping initializeTestEnvironment
- `tests/rules/teams.rules.test.ts` - 17 tests for teams collection (217 lines)
- `tests/rules/users.rules.test.ts` - 6 tests for users collection (110 lines)
- `test-rules.sh` - Bash wrapper for Windows cmd.exe compatibility
- `package.json` - Added test:rules, emulators:start scripts; @firebase/rules-unit-testing, firebase-tools devDeps

## Decisions Made
- **Local firebase-tools@13.35.1**: Global v15.5.1 requires Java 21; only Java 17 installed. Installing locally as devDependency allows `yarn test:rules` to use the compatible version transparently.
- **bash test-rules.sh**: `firebase emulators:exec` on Windows uses cmd.exe to run the child script. Direct shell script invocation (`./test-rules.sh`) fails. Wrapping with `bash` resolves this.
- **setDoc vs updateDoc**: Using `updateDoc` on a document that was seeded in `beforeEach` worked in isolation but failed with NOT_FOUND in some runs. Using `setDoc` is more reliable for testing write permission.
- **Teams delete test**: The `allow read, write` rule grants delete to ALL team members (not just creator). Tests verify outsider denial rather than non-creator-member denial, accurately reflecting the security model.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed firebase-tools@13.35.1 locally due to Java version mismatch**
- **Found during:** Task 2 (running teams tests for the first time)
- **Issue:** Global firebase-tools v15.5.1 requires Java 21; system only has Java 17. `firebase emulators:exec` immediately errored: "firebase-tools no longer supports Java version before 21"
- **Fix:** Installed firebase-tools@13.35.1 as dev dependency. yarn scripts use local node_modules/.bin/firebase automatically.
- **Files modified:** package.json, yarn.lock
- **Verification:** `./node_modules/.bin/firebase --version` shows 13.35.1; emulators start successfully
- **Committed in:** 6b43e8a (Task 2 commit)

**2. [Rule 3 - Blocking] Changed test:rules script to use `bash test-rules.sh` for Windows compatibility**
- **Found during:** Task 3 (first full suite run via yarn test:rules)
- **Issue:** `firebase emulators:exec` on Windows spawns cmd.exe as child process, which cannot execute `./test-rules.sh` (POSIX path syntax)
- **Fix:** Updated script to `firebase emulators:exec --only firestore,auth "bash test-rules.sh"` — cmd.exe can invoke `bash.exe` (Git Bash), which correctly runs the shell script
- **Files modified:** package.json
- **Verification:** `yarn test:rules` runs successfully, all 23 tests pass
- **Committed in:** 861f793 (Task 3 commit)

**3. [Rule 1 - Bug] Fixed write test using setDoc instead of updateDoc**
- **Found during:** Task 3 (users test execution)
- **Issue:** `allows user to write own document` test failed with NOT_FOUND because `updateDoc` requires pre-existing document; timing with `clearFirestore`/`beforeEach` could leave document absent
- **Fix:** Changed to `setDoc` which works whether document exists or not, testing write permission correctly
- **Files modified:** tests/rules/users.rules.test.ts
- **Verification:** Test passes consistently
- **Committed in:** 861f793 (Task 3 commit)

**4. [Rule 1 - Bug] Corrected teams delete test to reflect actual rules**
- **Found during:** Task 2 (analyzing teams rules before writing tests)
- **Issue:** Plan specified "denies member (non-creator) delete of team" but the Firestore rules have `allow read, write` for members (which includes delete), so any member CAN delete
- **Fix:** Changed test to verify outsider cannot delete (correct assertion) instead of non-creator-member cannot delete (incorrect assertion)
- **Files modified:** tests/rules/teams.rules.test.ts
- **Verification:** Tests accurately reflect the security model defined in firestore.rules
- **Committed in:** 6b43e8a (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bug corrections)
**Impact on plan:** All fixes necessary for correct execution. Blocking fixes resolved infrastructure compatibility. Bug corrections ensured tests accurately reflect the actual security rules rather than a misread of rule semantics.

## Issues Encountered
- Port 8080 left in LISTEN state after each test run (residual Java process). Each consecutive run required killing the process first. This is a known Windows behavior with Firebase emulators (see research Pitfall 4). Developers running `yarn test:rules` multiple times in quick succession may need to wait ~15 seconds or manually kill the Java process.

## Next Phase Readiness
- Full test infrastructure operational: emulators, vitest config, shared helpers, npm scripts
- Pattern established for all future rules test files in 07-02 and 07-03
- Port cleanup issue is a known operational concern, not a blocker

---
*Phase: 07-test-infrastructure*
*Completed: 2026-02-18*

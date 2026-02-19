---
phase: 09-ci-cd-pipeline
plan: 01
subsystem: infra
tags: [github-actions, ci, vitest, coverage, firebase-emulator, yaml]

# Dependency graph
requires:
  - phase: 07-test-infrastructure
    provides: yarn test:rules script and Firebase emulator setup required by security-rules-tests job
  - phase: 08-test-implementation
    provides: unit test suite (355 tests) and vitest coverage thresholds at 70% enforced in CI
provides:
  - .github/workflows/ci.yml with 3 parallel jobs (lint-and-build, unit-tests, security-rules-tests)
  - Coverage PR comments via davelosert/vitest-coverage-report-action@v2
  - json and json-summary coverage reporters in vitest.config.ts
affects: [09-02-deploy]

# Tech tracking
tech-stack:
  added:
    - actions/checkout@v4 (GitHub Actions)
    - actions/setup-node@v4 with yarn cache
    - actions/setup-java@v4 Temurin 17 (for Firebase emulator)
    - actions/cache@v4 (Firebase emulator binary cache)
    - davelosert/vitest-coverage-report-action@v2 (PR coverage comments)
  patterns:
    - Concurrency group pattern to cancel stale PR runs
    - Parallel jobs for independent CI stages (lint vs tests vs security-rules)
    - Emulator binary caching keyed on package.json hash
    - Coverage report posted even on test failure (if: always())

key-files:
  created:
    - .github/workflows/ci.yml
  modified:
    - vitest.config.ts

key-decisions:
  - "Concurrency group added to ci.yml to cancel in-progress runs on same PR (saves compute on rapid commits)"
  - "VITE_FIREBASE_API_KEY passed via secrets to lint-and-build and unit-tests jobs (needed at Vite build/test time)"
  - "vitest json+json-summary reporters added alongside existing text/lcov/html - no reporters removed"
  - "timeout-minutes: 15 on security-rules-tests job to prevent emulator hang from consuming CI minutes"
  - "firebase-tools not globally installed in CI - available from devDependencies after yarn install"

patterns-established:
  - "Parallel job pattern: independent stages (lint, unit tests, security rules) run concurrently"
  - "Coverage reporting: if: always() ensures PR comment even when tests fail threshold"
  - "Java setup: actions/setup-java@v4 with temurin/17 before any firebase emulator step"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 09 Plan 01: CI Workflow for PR Checks Summary

**GitHub Actions CI workflow with 3 parallel jobs (lint+build, unit tests with vitest coverage PR comments, security rules with Java 17 emulator cache) triggered on every PR to master**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T07:45:43Z
- **Completed:** 2026-02-19T07:47:11Z
- **Tasks:** 2
- **Files modified:** 2 (vitest.config.ts modified, .github/workflows/ci.yml created)

## Accomplishments

- Extended vitest.config.ts coverage reporters from 3 to 5 (added json and json-summary required by PR comment action)
- Created .github/workflows/ci.yml with 3 parallel jobs and concurrency group for PR run cancellation
- All 355 existing tests pass and generate coverage-final.json + coverage-summary.json artifacts verified locally

## Task Commits

Each task was committed atomically:

1. **Task 1: Add json and json-summary coverage reporters to vitest config** - `9e3c838` (chore)
2. **Task 2: Create CI workflow for PR checks** - `b2523eb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `vitest.config.ts` - Added 'json' and 'json-summary' to coverage.reporter array; enables coverage-final.json and coverage-summary.json generation
- `.github/workflows/ci.yml` - 64-line CI workflow: pull_request trigger, concurrency group, 3 parallel jobs with full step definitions

## Decisions Made

- Concurrency group added (from research open questions section) to cancel stale PR runs when new commits are pushed — reduces wasted CI compute
- VITE_FIREBASE_API_KEY passed via secrets to both lint-and-build and unit-tests jobs (Vite requires env vars at build and test time)
- timeout-minutes: 15 on security-rules-tests to prevent emulator process hang from consuming the full 6-hour GitHub Actions default timeout
- firebase-tools not globally installed — devDependencies entry (13.35.1) available after yarn install (anti-pattern avoided per research)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - Python not available for YAML validation so switched to Node.js string checks (17 structural assertions), all passed.

## User Setup Required

None - no external service configuration required for CI workflow creation. Note: when first PR is opened against master, `VITE_FIREBASE_API_KEY` must be added as a GitHub Actions secret for lint-and-build and unit-tests jobs to succeed.

## Self-Check

- [x] `.github/workflows/ci.yml` exists (verified: file read, 64 lines)
- [x] `vitest.config.ts` has 5 reporters including json and json-summary (verified: string check)
- [x] `coverage/coverage-final.json` generated (verified: ls output, 148481 bytes)
- [x] `coverage/coverage-summary.json` generated (verified: ls output, 2893 bytes)
- [x] Commits 9e3c838 and b2523eb exist (verified: git log)
- [x] All 355 tests pass (verified: yarn test:coverage output)

## Self-Check: PASSED

## Next Phase Readiness

- CI workflow ready for 09-02 (deploy workflow) which will re-use the same job patterns for push to master
- Coverage threshold enforcement active: 70% lines/functions/branches/statements causes non-zero exit if not met
- Security rules cache keyed on package.json hash — will be warm after first CI run

---
*Phase: 09-ci-cd-pipeline*
*Completed: 2026-02-19*

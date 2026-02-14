# Roadmap: Quasar Club System — Production Hardening

## Overview

This roadmap transforms an existing Vue 3 + Quasar + Firebase club management system from a working prototype into a production-ready application. The journey addresses critical stability issues (listener lifecycle management, error handling, data scaling), establishes comprehensive testing infrastructure, and implements operational excellence features (audit trails, performance monitoring). Nine phases build incrementally from foundational error handling through data migration to full CI/CD automation, ensuring the system can reliably serve 40+ concurrent users with no silent failures, no lost votes, and no stale data.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Error System Foundation** - Typed error hierarchy and centralized handling
- [ ] **Phase 2: Listener Registry System** - Centralized lifecycle management for Firestore listeners
- [ ] **Phase 3: Code Quality & TypeScript** - Strict mode enablement and structured logging
- [ ] **Phase 4: Data Model Migration** - Move votes from arrays to subcollections
- [ ] **Phase 5: Security & Audit** - Audit trail and permission error boundaries
- [ ] **Phase 6: Performance** - Lazy chart rendering and optimization
- [ ] **Phase 7: Test Infrastructure** - Firebase emulator setup and tooling
- [ ] **Phase 8: Test Implementation** - Comprehensive test coverage for critical paths
- [ ] **Phase 9: CI/CD Pipeline** - Automated testing and deployment

## Phase Details

### Phase 1: Error System Foundation
**Goal**: Replace any-typed error catches with a typed error hierarchy that enables programmatic error handling and user-friendly feedback
**Depends on**: Nothing (first phase)
**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04, ERR-05
**Success Criteria** (what must be TRUE):
  1. Developer sees typed error classes (AuthError, FirestoreError, ValidationError, ListenerError) when catching errors in IDE autocomplete
  2. User sees Czech/English error messages for common Firebase failures (permission denied, network error, wrong password) instead of technical codes
  3. User can retry failed operations via retry button in error notification toast
  4. Application continues running after auth/Firestore errors instead of white screen crash
  5. Password change flow shows specific error message when reauthentication fails due to wrong password
**Plans**: 5 plans in 4 waves

Plans:
- [ ] 01-01-PLAN.md — Error class hierarchy and i18n messages (Wave 1)
- [ ] 01-02-PLAN.md — Notification service and global error handler (Wave 1)
- [ ] 01-03-PLAN.md — Firebase service migration to typed errors (Wave 2)
- [ ] 01-04-PLAN.md — Use case migration with error notifications (Wave 3)
- [ ] 01-05-PLAN.md — Password change flow hardening (Wave 4)

### Phase 2: Listener Registry System
**Goal**: Centrally manage all Firestore listener lifecycles to eliminate memory leaks and race conditions
**Depends on**: Phase 1 (uses typed errors for listener failures)
**Requirements**: LST-01, LST-02, LST-03, LST-04, LST-05
**Success Criteria** (what must be TRUE):
  1. User can switch between teams without seeing stale data from previous team (listeners properly unsubscribed)
  2. Application memory usage stays stable during 60+ minute session (no accumulating listeners)
  3. User sees permission error notification instead of empty dashboard when Firestore rules deny access
  4. User does not see race condition errors on login (auth state resolved before data listeners start)
  5. Developer can inspect active listeners via ListenerRegistry debug method showing count and metadata
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 3: Code Quality & TypeScript
**Goal**: Enable TypeScript strict mode and replace console logging with structured logging system
**Depends on**: Phase 2 (stable foundation before adding type strictness)
**Requirements**: QAL-01, QAL-02, QAL-03, QAL-04
**Success Criteria** (what must be TRUE):
  1. TypeScript compiler shows zero implicit any errors when running tsc with strict mode enabled
  2. Developer sees structured log entries with context (userId, teamId, operation) instead of raw console.error output
  3. i18n translation key typos caught at compile time (type error for missing keys)
  4. Firebase config TODO comment resolved with documented environment variable or constant
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Data Model Migration
**Goal**: Migrate survey votes from document arrays to subcollections to support unlimited team growth
**Depends on**: Phase 3 (needs testing infrastructure and error handling before risky migration)
**Requirements**: DAT-01, DAT-02, DAT-03, DAT-04
**Success Criteria** (what must be TRUE):
  1. User can vote on surveys with 200+ team members without hitting document size limit errors
  2. Existing votes from production are preserved and accessible after migration (zero data loss)
  3. Developer can toggle feature flag to switch between array-based and subcollection-based reads for rollback safety
  4. Vote submission uses single addOrUpdateVote function regardless of backend storage (duplicates removed)
  5. Teams with 30+ members see complete vote lists without IN query limit errors
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: Security & Audit
**Goal**: Add audit trail for sensitive operations and surface permission errors to users
**Depends on**: Phase 4 (audit system uses same data patterns as migration)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Power user can view audit log showing who deleted surveys, modified fines, or removed team members with timestamps
  2. User sees explicit permission denied notification instead of silent empty results when Firestore rules reject query
  3. Team admin can delete team with 1000+ surveys/fines/members without transaction batch size errors
  4. Application waits for auth state confirmation before initializing team listeners (no permission-denied flash)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: Performance
**Goal**: Optimize chart rendering and eliminate resource waste from accumulated listeners
**Depends on**: Phase 5 (performance monitoring requires stable baseline)
**Requirements**: PRF-01, PRF-02, PRF-03, PRF-04
**Success Criteria** (what must be TRUE):
  1. User scrolls dashboard without lag as charts render only when entering viewport (lazy loading)
  2. Developer sees Firebase Performance Monitoring dashboard showing page load times and API latencies
  3. User switches teams without memory accumulation (listeners from previous team unsubscribed)
  4. Notification page stops fetching when scrolled to bottom (pagination boundary respected)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 7: Test Infrastructure
**Goal**: Configure Firebase emulators and Vitest for local testing without hitting production
**Depends on**: Phase 6 (stable codebase before adding test tooling)
**Requirements**: TST-01, TST-02
**Success Criteria** (what must be TRUE):
  1. Developer runs npm test and sees Firebase Auth/Firestore emulators start automatically on ports 9099/8080
  2. Firestore security rules have passing unit tests covering allow/deny scenarios for all collections
  3. Test suite runs against local emulators with seeded data instead of production Firebase project
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 8: Test Implementation
**Goal**: Achieve 70%+ test coverage for critical user flows
**Depends on**: Phase 7 (requires test infrastructure)
**Requirements**: TST-03, TST-04, TST-05, TST-06, TST-07
**Success Criteria** (what must be TRUE):
  1. Auth flow tests verify login, register, logout, permission denied, and session persistence scenarios
  2. Survey voting tests verify concurrent votes, vote updates, and missing votes array edge cases
  3. Cashbox fine rule tests verify all FineRuleTrigger types (survey response, manual, payment)
  4. Form validation composable tests verify async validation including debounce scenarios
  5. Listener cleanup tests verify unsubscribe called on component unmount and navigation
  6. Vitest coverage report shows 70%+ for lines, functions, branches, statements
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 9: CI/CD Pipeline
**Goal**: Automate testing and deployment via GitHub Actions
**Depends on**: Phase 8 (requires passing test suite)
**Requirements**: TST-08
**Success Criteria** (what must be TRUE):
  1. GitHub PR triggers automated workflow running lint, tests, and build checks
  2. Master branch push deploys to Firebase Hosting after tests pass
  3. CI build fails when test coverage drops below 70% threshold
  4. Developer sees test results and coverage report directly in GitHub PR checks
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Error System Foundation | 0/5 | Not started | - |
| 2. Listener Registry System | 0/TBD | Not started | - |
| 3. Code Quality & TypeScript | 0/TBD | Not started | - |
| 4. Data Model Migration | 0/TBD | Not started | - |
| 5. Security & Audit | 0/TBD | Not started | - |
| 6. Performance | 0/TBD | Not started | - |
| 7. Test Infrastructure | 0/TBD | Not started | - |
| 8. Test Implementation | 0/TBD | Not started | - |
| 9. CI/CD Pipeline | 0/TBD | Not started | - |

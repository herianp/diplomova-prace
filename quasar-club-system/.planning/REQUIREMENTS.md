# Requirements: Quasar Club System — Production Hardening

**Defined:** 2026-02-14
**Core Value:** Reliable real-time survey voting and team management that works correctly under concurrent use

## v1 Requirements

### Error System (ERR)

- [ ] **ERR-01**: App uses typed error hierarchy (AuthError, FirestoreError, ValidationError, ListenerError) instead of `any` catches
- [ ] **ERR-02**: Global Vue error handler catches unhandled errors and displays user-friendly Quasar notifications
- [ ] **ERR-03**: All async operations show error recovery UI (retry buttons, feedback toasts) on failure
- [ ] **ERR-04**: Firebase error codes mapped to i18n user-friendly messages (Czech/English)
- [ ] **ERR-05**: Password change reauthentication flow shows clear error messages for wrong password

### Listener Lifecycle (LST)

- [ ] **LST-01**: Centralized ListenerRegistry manages all Firestore listeners with auto-cleanup on component unmount
- [ ] **LST-02**: Auth initialization uses Promise-based coordination instead of 100-300ms timing buffers
- [ ] **LST-03**: Team switching properly unsubscribes previous listeners before establishing new ones (no stale data)
- [ ] **LST-04**: All notification listeners have proper error callbacks that surface permission issues to users
- [ ] **LST-05**: Listener cleanup verified on logout (all unsubscribe functions called)

### Testing (TST)

- [ ] **TST-01**: Firebase Emulator Suite configured for local development and testing
- [ ] **TST-02**: Firestore security rules have unit tests covering all permission scenarios
- [ ] **TST-03**: Auth flow tested end-to-end (login, register, logout, permission denied, session persistence)
- [ ] **TST-04**: Survey voting tested for concurrent scenarios (rapid votes, vote updates, missing votes array)
- [ ] **TST-05**: Cashbox fine rule evaluation tested for all FineRuleTrigger types including edge cases
- [ ] **TST-06**: Form validation composable has unit tests including async validation scenarios
- [ ] **TST-07**: Listener cleanup tested (verify unsubscribe called on unmount/navigation)
- [ ] **TST-08**: CI pipeline runs tests on every push (GitHub Actions)

### Data Model & Scale (DAT)

- [ ] **DAT-01**: Survey votes migrated from document arrays to subcollections
- [ ] **DAT-02**: Migration script handles live data (dual-write during transition, rollback capability)
- [ ] **DAT-03**: IN query limit handled properly for teams with 30+ members (batched queries)
- [ ] **DAT-04**: Vote functions consolidated to single `addOrUpdateVote` (remove duplicates)

### Security & Audit (SEC)

- [ ] **SEC-01**: Audit trail logs sensitive operations (survey deletion, fine modification, team member removal, vote verification)
- [ ] **SEC-02**: Permission-denied errors show user-visible feedback instead of silently degrading to empty arrays
- [ ] **SEC-03**: Team deletion cascade handles batches larger than 499 items with transaction safety
- [ ] **SEC-04**: Auth state verified before initializing team listeners

### Performance (PRF)

- [ ] **PRF-01**: Charts render lazily using intersection observer (not all 4 simultaneously)
- [ ] **PRF-02**: Firebase Performance Monitoring initialized for automatic web vitals tracking
- [ ] **PRF-03**: Listeners unsubscribed when switching teams (not accumulated in memory)
- [ ] **PRF-04**: Notification pagination stops fetching when data exhausted

### Code Quality (QAL)

- [ ] **QAL-01**: TypeScript strict mode enabled with all implicit `any` types resolved
- [ ] **QAL-02**: Structured logging replaces raw console.error/console.warn calls with context-rich log utility
- [ ] **QAL-03**: TODO comment in Firebase config resolved
- [ ] **QAL-04**: Type-safe i18n keys (compile-time validation of translation key usage)

## v2 Requirements

### Monitoring & Observability

- **MON-01**: Sentry integration with source maps for production error tracking
- **MON-02**: Error rate dashboards and alerting
- **MON-03**: Request ID tracing across async operations

### Operational Excellence

- **OPS-01**: Feature flags system (Firestore-based) for safe rollouts
- **OPS-02**: Graceful degradation (disable non-critical features during failures)
- **OPS-03**: Automated Firestore backup and recovery procedures
- **OPS-04**: Health check endpoint for uptime monitoring

### Advanced UX

- **UX-01**: Offline detection with connection status indicator and operation queuing
- **UX-02**: Admin audit dashboard showing who did what
- **UX-03**: Rate limiting awareness with clear quota error messages

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side rendering | Firebase Hosting serves static SPA, no SSR needed |
| Custom auth system | Firebase Auth with custom claims is sufficient |
| Real-time chat | Not core to club management |
| Mobile native app | Web SPA sufficient for 40+ user base |
| Complex caching | Firebase handles caching, low user count doesn't justify |
| A/B testing | Too small a user base to get meaningful results |
| Custom analytics | Firebase Analytics sufficient for this scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ERR-01 | Phase 1 | Pending |
| ERR-02 | Phase 1 | Pending |
| ERR-03 | Phase 1 | Pending |
| ERR-04 | Phase 1 | Pending |
| ERR-05 | Phase 1 | Pending |
| LST-01 | Phase 2 | Pending |
| LST-02 | Phase 2 | Pending |
| LST-03 | Phase 2 | Pending |
| LST-04 | Phase 2 | Pending |
| LST-05 | Phase 2 | Pending |
| QAL-01 | Phase 3 | Pending |
| QAL-02 | Phase 3 | Pending |
| QAL-03 | Phase 3 | Pending |
| QAL-04 | Phase 3 | Pending |
| DAT-01 | Phase 4 | Pending |
| DAT-02 | Phase 4 | Pending |
| DAT-03 | Phase 4 | Pending |
| DAT-04 | Phase 4 | Pending |
| SEC-01 | Phase 5 | Pending |
| SEC-02 | Phase 5 | Pending |
| SEC-03 | Phase 5 | Pending |
| SEC-04 | Phase 5 | Pending |
| PRF-01 | Phase 6 | Pending |
| PRF-02 | Phase 6 | Pending |
| PRF-03 | Phase 6 | Pending |
| PRF-04 | Phase 6 | Pending |
| TST-01 | Phase 7 | Pending |
| TST-02 | Phase 7 | Pending |
| TST-03 | Phase 8 | Pending |
| TST-04 | Phase 8 | Pending |
| TST-05 | Phase 8 | Pending |
| TST-06 | Phase 8 | Pending |
| TST-07 | Phase 8 | Pending |
| TST-08 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after initial definition*

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Reliable real-time survey voting and team management that works correctly under concurrent use — no lost votes, no stale data, no silent failures.
**Current focus:** Phase 6 - Performance Optimization (complete)

## Current Position

Phase: 6 of 9 (Performance Optimization)
Plan: 2 of 2 in current phase
Status: Complete
Last activity: 2026-02-15 — Completed 06-02-PLAN.md (Dashboard Lazy Loading & Performance Verification)

Progress: [██████░░░░] 67% (6/9 phases complete, 2/2 plans in current phase complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 20
- Average duration: 8.5 minutes
- Total execution time: 2.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-error-system-foundation | 5 | 102.4 min | 20.5 min |
| 02-listener-registry-system | 3 | 9.6 min | 3.2 min |
| 03-code-quality-typescript | 4 | 35.0 min | 8.8 min |
| 04-data-model-migration | 3 | 7.0 min | 2.3 min |
| 05-security-audit | 3 | 11.0 min | 3.7 min |
| 06-performance | 2 | 6.0 min | 3.0 min |

**Recent Trend:**
- Last 5 plans: 05-01 (3min), 05-02 (4min), 05-03 (4min), 06-01 (4min), 06-02 (2min)
- Trend: Excellent velocity - Phase 06 complete in 6 minutes total (verification-heavy tasks)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase structure: 9 phases derived from requirement clustering (ERR → LST → QAL → DAT → SEC → PRF → TST split 3-way)
- Testing split: Separated infrastructure (Phase 7), implementation (Phase 8), CI/CD (Phase 9) for comprehensive depth
- Migration safety: Phase 4 depends on Phase 3 to ensure testing infrastructure exists before risky data migration
- Brownfield approach: All phases address existing codebase hardening, not greenfield development
- Error class prototype chain fix: Applied Object.setPrototypeOf only in AppError base class for instanceof compatibility (01-01)
- Error message organization: Separated error messages into dedicated errors.js files instead of inline in index.js (01-01)
- [Phase 01]: Retry only available with explicit onRetry callback (not in global handler)
- [Phase 01-error-system-foundation]: Retry only for transient errors (network, unavailable, deadline-exceeded) - no retry for destructive operations or permanent errors
- [Phase 01-05]: Network errors show retry button, permanent errors (wrong password, weak password) don't
- [Phase 01-05]: No-user check moved outside try-catch for clearer error path in changeUserPassword
- [Phase 02-01]: Promise-based auth coordination eliminates timing buffers and race conditions
- [Phase 02-01]: ListenerRegistry manages all listener lifecycle instead of individual stores
- [Phase 02-01]: Scope-based cleanup enables team-switch cleanup (team vs user scoped listeners)
- [Phase 02-02]: Auto-cleanup on re-register eliminates manual unsubscribe checks
- [Phase 02-02]: All 9 listener types registered with central registry (zero local unsubscribe storage)
- [Phase 02-02]: Team switching cleanup via unregisterByScope('team') prevents stale data leaks
- [Phase 02-03]: App.vue safety net cleanup on unmount provides final guarantee
- [Phase 02-03]: Developer debug interface (__listenerDebug) available in dev mode for memory leak inspection
- [Phase 03-01]: Enabled full TypeScript strict mode immediately instead of incremental (15 explicit any + 30+ implicit errors manageable)
- [Phase 03-01]: Used type guards in validation rules for unknown → typed narrowing
- [Phase 03-01]: Controlled 'as any' usage only for Chart.js and i18n complex types
- [Phase 03-02]: Keep legacy: true mode for template $t() compatibility (i18n)
- [Phase 03-02]: Use Czech locale as primary for MessageSchema type inference
- [Phase 03-02]: Export MessageSchema type for composition API use cases
- [Phase 03-02]: Add localStorage persistence for language preference in boot file
- [Phase 03-03]: Custom lightweight logger over vuejs3-logger (Vue dependency incompatible with plain TypeScript services)
- [Phase 03-03]: Log level filtering: debug/info in dev, error-only in production
- [Phase 03-03]: createLogger() scoped factory pattern for automatic module tagging
- [Phase 03-03]: JSON context format enables future log aggregation integration
- [Phase 03-04]: Scoped logger per composable/component for module-specific tagging
- [Phase 03-04]: Include entity IDs (teamId, userId, surveyId) in all error contexts
- [Phase 03-04]: QAL-02 complete: all 105 original console calls replaced with structured logging
- [Phase 04-01]: Feature flags default to false for safe initial state (USE_VOTE_SUBCOLLECTIONS, DUAL_WRITE_VOTES)
- [Phase 04-01]: Type-safe feature flag getter with const assertion for immutability
- [Phase 04-01]: Votes subcollection security enforces voteId == auth.uid for ownership
- [Phase 04-01]: All legacy vote wrappers removed (addVote, addSurveyVote, addSurveyVoteUseCase) before migration
- [Phase 04-02]: Use writeBatch for atomic dual-write to ensure consistency between array and subcollection
- [Phase 04-02]: Parallelize subcollection reads using Promise.all for performance
- [Phase 04-02]: Implement fallback to array votes if subcollection read fails for reliability
- [Phase 04-02]: Handle subcollection enrichment in listener layer for transparent source swapping
- [Phase 04-03]: Use set() instead of create() for idempotent migration (safe to re-run)
- [Phase 04-03]: Chunk batches at 499 operations (Firestore limit is 500)
- [Phase 04-03]: Rate limit: 200ms between batches, 1s pause every 10 batches to avoid quota errors
- [Phase 04-03]: Continue migration on per-survey errors instead of aborting entire process
- [Phase 04-03]: Verification script is strictly read-only (no write operations)
- [Phase 04-03]: Check three dimensions: count equality, value equality, orphan detection
- [Phase 04-03]: Use structured logging with dedicated scopes (migration, migration-verify)
- [Phase 05-01]: Audit log writes are fire-and-forget to prevent audit failures from blocking operations
- [Phase 05-01]: Only power users can read audit logs to prevent privacy issues
- [Phase 05-01]: Audit logs are immutable (no update rule) and tamper-proof (no delete for non-admins)
- [Phase 05-01]: actorUid validation in security rules ensures audit trail truthfulness
- [Phase 05-02]: SEC-02: Permission-denied errors surface via optional onError callback instead of silent callback([]) degradation
- [Phase 05-02]: Transient errors (network, unavailable) continue graceful degradation to prevent UI flash on temporary issues
- [Phase 05-02]: SEC-03: Team cascade delete uses 499-operation batches with rate limiting (200ms every 10 batches)
- [Phase 05-02]: SEC-04: Verified via documentation comment - auth coordination already implemented in Phase 2
- [Phase 05-03]: Audit context is optional in all Firebase service signatures for backward compatibility
- [Phase 05-03]: Use case layer extracts actor identity from authStore before calling Firebase services
- [Phase 05-03]: Survey deletion audit includes survey title from store lookup
- [Phase 05-03]: Fine deletion audit includes amount and reason from component-level lookup
- [Phase 05-03]: Member removal audit includes member displayName from component context
- [Phase 05-03]: bulkAddFines excluded from audit logging (auto-generated fines covered by survey verification audit)
- [Phase 06-01]: Use VueUse intersection observer instead of native API for Vue 3 reactive wrapper with automatic cleanup
- [Phase 06-01]: Threshold 0.1 with 50px rootMargin for early chart rendering (starts before full visibility for smooth UX)
- [Phase 06-01]: hasRendered flag prevents re-observation after first intersection (charts persist after scrolling)
- [Phase 06-01]: Individual visibility watchers per chart instead of single observer for independent lifecycle control

### Pending Todos

None yet.

### Blockers/Concerns

**Known risks from research:**
- Phase 5 Sentry integration: Quasar-specific setup may differ from standard Vue 3 (verify during planning)
- Windows emulator compatibility: Firebase emulator suite on MINGW64_NT needs verification (Phase 7)

**Resolved risks:**
- ~~Phase 4 migration complexity: Firestore dual-write pattern needs validation during planning~~ - Feature flags created, security rules deployed (04-01), migration scripts ready (04-03)
- ~~TypeScript strict mode impact: May reveal extensive type errors requiring incremental fixes~~ - Strict mode enabled with manageable errors (03-01)

## Session Continuity

Last session: 2026-02-15 (plan execution)
Stopped at: Completed 06-02-PLAN.md - Dashboard Lazy Loading & Performance Verification (2 tasks, 2 minutes)
Resume file: .planning/phases/06-performance/06-02-SUMMARY.md

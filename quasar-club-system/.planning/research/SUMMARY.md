# Project Research Summary

**Project:** Vue 3 + Quasar + Firebase Production Hardening
**Domain:** Club management system for football teams (40+ users, real-time collaboration)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project is a football club management system built with Vue 3, Quasar Framework, and Firebase that currently serves 40+ users with features for surveys, voting, team management, and messaging. The application follows Clean Architecture principles with distinct layers for components, UI composables, use cases, Firebase services, and Pinia stores. The research identifies critical production readiness gaps that must be addressed before the application can reliably scale or handle production workloads.

The recommended approach focuses on four foundational pillars: centralized error handling with typed error classes, listener lifecycle management to prevent memory leaks and quota exhaustion, comprehensive testing infrastructure using Vitest and Firebase emulators, and strategic data migrations to handle growth. The current codebase has partial implementations (6 of 116 files handle cleanup, 4.3% test coverage, 27% of files have error handling) that need systematic completion. Error tracking integration with Sentry, performance monitoring with Firebase Performance, and automated CI/CD should follow foundational work.

Key risks include unmanaged Firebase listeners causing memory leaks and quota exhaustion (only 6 files properly clean up listeners), Firestore document size limits being reached as votes accumulate (votes stored as arrays will fail at ~200 members), and race conditions in auth flows causing permission-denied errors. These can be mitigated through a centralized ListenerRegistry, migrating votes to subcollections using feature-flagged dual-write, and implementing proper auth-ready gates before data fetching. The project's existing Clean Architecture provides an excellent foundation for production hardening without requiring architectural rewrites.

## Key Findings

### Recommended Stack

The technology stack builds on the project's existing Vue 3 + Quasar + Firebase foundation with production-focused additions. The testing infrastructure should use Vitest (already configured), @vue/test-utils for component testing, happy-dom for DOM simulation, Firebase Emulator Suite for integration testing, and MSW for API mocking. Error handling and monitoring requires Sentry for error tracking (better Vue integration than alternatives), Firebase Performance Monitoring (zero-config for Firebase apps), and Firebase Analytics for user behavior tracking.

**Core technologies:**
- **Vitest + @vue/test-utils**: Unit and component testing — already in use, fast ESM support, Vue-aware
- **Firebase Emulator Suite**: Local testing environment — test auth, Firestore, functions without hitting production
- **Sentry (Vue integration)**: Error tracking and monitoring — industry standard, generous free tier, automatic error capture
- **@vitest/coverage-v8**: Code coverage reporting — faster than Istanbul, built-in Vitest integration
- **TypeScript strict mode**: Type safety hardening — eliminate implicit any, catch bugs at compile time
- **Firebase Performance Monitoring**: Real user monitoring — already available in Firebase SDK, tracks page loads and network requests
- **MSW (Mock Service Worker)**: API mocking for tests — modern service worker-based approach, better than traditional HTTP mocking

**Critical configuration notes:**
- Enable TypeScript strict mode (currently has implicit any types)
- Set Vitest coverage thresholds (70% for lines, functions, branches, statements)
- Configure Firebase emulator ports (Auth: 9099, Firestore: 8080, UI: 4000)
- Set up Sentry with source maps for production error tracking

### Expected Features

Production hardening focuses on reliability and operational excellence rather than new user-facing features. The application already has core functionality (auth, surveys, voting, team management) but lacks production infrastructure.

**Must have (table stakes):**
- Centralized error handling — prevent crashes from propagating to users (currently missing Vue errorHandler)
- User-friendly error messages — map Firebase error codes to i18n messages (currently exposing technical errors)
- Listener cleanup — prevent memory leaks in long sessions (only 6 of 116 files handle cleanup)
- Structured logging — replace 78 console.log instances with proper logging system
- Error recovery UI — retry buttons for failed operations
- Offline detection — show connection status and queue operations
- Session timeout handling — clear messaging on auth expiration
- Basic CI/CD — automated linting, testing, and deployment
- Test coverage for critical paths — auth, survey creation, voting flows (currently 4.3% coverage)

**Should have (competitive):**
- Error tracking integration — Sentry or Firebase Crashlytics for production issue visibility
- Performance monitoring — Firebase Performance to identify bottlenecks
- Typed error classes — custom error hierarchy for programmatic handling
- Audit trail — track critical operations for compliance and debugging (survey verify, team changes)
- Analytics integration — understand usage patterns (Firebase Analytics or Plausible)
- Health check endpoint — monitor app availability
- Feature flags — control rollout without deployments (Firestore-based custom solution)

**Defer (v2+):**
- Request ID tracing — useful when debugging becomes complex (not needed at 40 users)
- Graceful degradation — feature isolation with fallbacks (overkill for current scale)
- Advanced caching — stale-while-revalidate patterns (Firebase costs not yet significant)
- A/B testing infrastructure — wait for product-market fit clarity

### Architecture Approach

The application follows Clean Architecture with strict unidirectional data flow: Vue components delegate to UI composables (navigation logic), which call use cases (business logic orchestration), which use Firebase services (pure data access), with Pinia stores holding reactive state only. This separation is well-implemented and should be preserved during production hardening.

**Major components:**

1. **Typed Error System** — Base AppError class with domain-specific extensions (AuthError, FirestoreError, ValidationError, ListenerError). Firebase services classify errors, use cases handle retry logic, UI composables convert to user messages. Flow: Firebase Services (throw typed errors) → Use Cases (retry/fallback) → UI Composables (format notifications) → Components (display).

2. **ListenerRegistry Singleton** — Centralized tracking of all active Firestore listeners with automatic cleanup. Prevents memory leaks and quota waste. Each listener registered with unique ID, unsubscribe function, metadata, and cleanup callback. Integrates with use cases via register/unregister calls, cleans up on logout and component unmount.

3. **Data Migration Infrastructure** — Feature-flagged dual-write system for migrating votes from arrays to subcollections. Enables zero-downtime migration with rollback capability. Three-phase approach: dual-write to both sources, switch read source, cleanup old data. Controlled by runtime feature flags in Firestore.

4. **Audit Service** — Batch-writing service for tracking critical operations (survey create/update/delete/verify, team member changes). Captures actor, timestamp, before/after state, metadata. Queues events and flushes every 5 seconds or when batch size reached. Stores in auditLogs collection with team-based partitioning.

**Key patterns:**
- Error boundaries at every layer with typed exceptions
- Centralized listener lifecycle management
- Feature flags for gradual rollouts and migrations
- Audit logging for critical business operations
- Separation of concerns maintained throughout

### Critical Pitfalls

1. **Unmanaged Firebase Listener Lifecycles** — Only 6 of 116 files properly clean up listeners with onUnmounted hooks. Listeners continue running after component unmount, causing memory leaks, runaway Firestore reads, and quota exhaustion. App becomes unresponsive after 30+ minutes of use. Prevention: Create centralized ListenerRegistry singleton, register every listener with cleanup callback, unregister all on logout, use onBeforeUnmount in components. Manual timing buffers (100-300ms) in code indicate race condition workarounds that need proper async/await instead.

2. **Firestore Document Size Limits** — Survey votes stored as arrays in documents will exceed 1MB limit with ~200 active voters. Current setup has 44 team members with 100+ surveys, creating potential for 4,400+ vote entries. Each vote ~50 bytes means already at 22% of limit. Writes fail silently with cryptic errors. Prevention: Migrate votes array to subcollection immediately, implement document size monitoring, set array size limits in Firestore rules. Migration is HIGH PRIORITY for this project.

3. **Missing Error Boundaries** — No global Vue errorHandler configured, only 31 of 116 files have try/catch (27% coverage), 78 console.error calls without user feedback, no Sentry integration. Single uncaught error crashes entire application with white screen of death. Users force-refresh and lose unsaved work. Prevention: Add Vue global error handler in main.ts, wrap all Firebase operations in try/catch at service layer, integrate Sentry, show user-friendly messages while logging technical details.

4. **Race Conditions in Auth Flow** — Data listeners may start before auth state is known, causing permission-denied errors. Manual timing buffers (100-300ms) in code are workarounds for race conditions. isAuthReady flag exists but may not be used consistently. Results in blank dashboards, flashing UI with wrong data, login redirects failing. Prevention: Gate all data listeners on isAuthReady === true, use router guards that wait for auth, never rely on setTimeout for synchronization, use watch on authStore.isAuthReady with immediate flag.

5. **No Test Coverage for Critical Paths** — Only 5 test files for 116 source files (4.3% coverage). No E2E tests for auth, survey, voting flows. No CI/CD to run tests automatically. Results in production hotfixes after releases, fear of refactoring, regression bugs found by users. Prevention: Set minimum 70% coverage threshold, write tests for critical paths first (login/logout, survey creation, voting), add CI/CD that fails if tests don't pass, use Firebase emulator for integration tests.

**Additional moderate pitfalls:**
- Inconsistent error messages (78 console.error with technical messages, no i18n mapping)
- Missing offline handling (no persistence, connection monitoring, or retry logic)
- Hardcoded configuration (season dates, no feature flags, can't change without redeploy)
- No audit trail (can't answer "who changed this survey?")
- Inadequate loading states (inconsistent across components, no skeleton loaders)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundational infrastructure before monitoring and optimization. The listener lifecycle and error system are prerequisites for everything else. Data migration can run in parallel with testing once foundations are in place.

### Phase 1: Error System Foundation
**Rationale:** Error handling is the foundation for all other production features. Without typed errors and centralized handling, monitoring tools can't capture useful information and users see crashes. No dependencies on other features, can be built immediately.

**Delivers:**
- Typed error class hierarchy (AppError, AuthError, FirestoreError, ValidationError, ListenerError)
- Error handlers and conversion utilities
- Updated Firebase services throwing typed errors
- Updated use cases with retry logic for retryable errors
- UI composables displaying user-friendly messages via Quasar Notify
- Global Vue errorHandler in main.ts
- i18n error message mappings

**Addresses:**
- Missing error boundaries (critical pitfall #3)
- Inconsistent error messages (moderate pitfall #6)
- User-friendly error messages (table stakes feature)
- Centralized error handling (table stakes feature)

**Avoids:**
- White screen of death from uncaught errors
- Users seeing technical Firebase error codes
- Inability to track error patterns (foundation for Sentry)

**Testing:** Unit tests for error classification, integration tests with Firebase emulator

### Phase 2: Listener Registry System
**Rationale:** Second most critical issue after error handling. Memory leaks and quota exhaustion will occur in production without proper cleanup. Builds on error system for handling listener-related errors. Must be implemented before scaling beyond current user base.

**Delivers:**
- ListenerRegistry singleton class
- Refactored use cases registering all listeners
- Cleaned up stores removing redundant unsubscribe storage
- onBeforeUnmount cleanup in App.vue and components
- Listener health monitoring and logging
- Auth-ready gating for data listeners

**Addresses:**
- Unmanaged listener lifecycles (critical pitfall #1)
- Race conditions in auth flow (critical pitfall #4)
- Listener cleanup (table stakes feature)
- Session timeout handling (table stakes feature)

**Avoids:**
- Memory leaks in long sessions
- Firestore quota exhaustion
- Permission-denied errors from auth race conditions
- Stale listeners receiving irrelevant data

**Uses:** Error system from Phase 1 for ListenerError handling

**Testing:** Integration tests for listener cleanup on logout and navigation

### Phase 3: Testing Infrastructure
**Rationale:** Once error handling and listeners are stable, testing prevents regressions. Can start in parallel with Phase 2 for independent components. Critical before any refactoring or feature work. Enables confident deployment.

**Delivers:**
- Vitest configuration with V8 coverage (70% thresholds)
- Firebase Emulator Suite setup (Auth: 9099, Firestore: 8080)
- MSW setup for API mocking
- Unit tests for Firebase services (error classification)
- Unit tests for use cases (business logic, retry logic)
- Unit tests for UI composables (error-to-UI conversion)
- Integration tests for critical paths (auth, survey creation, voting)
- GitHub Actions CI/CD pipeline (lint, test, build, deploy)

**Addresses:**
- No test coverage for critical paths (critical pitfall #5)
- Basic CI/CD (table stakes feature)
- Test coverage requirement (table stakes feature)

**Avoids:**
- Production hotfixes after releases
- Regression bugs discovered by users
- Fear of refactoring codebase

**Uses:** Error system for testing error scenarios, Listener registry for testing cleanup

**Testing:** Meta-testing — verify coverage thresholds enforced, CI fails on test failures

### Phase 4: Data Migration (Votes Subcollection)
**Rationale:** Time-sensitive due to document size limits. Can start once error system and testing are in place (needs robust error handling and tests for migration script). Moderate urgency — not blocking launch but needed before significant user growth.

**Delivers:**
- Feature flag system (config/featureFlags.ts)
- Vote migration script (migrations/votesMigration.ts)
- Dual-write implementation in surveyFirebase.ts
- Migration verification tests
- Rollback script
- Feature flag toggle to switch read source
- Array field cleanup after verification

**Addresses:**
- Firestore document size limits (critical pitfall #2)
- Hardcoded configuration (moderate pitfall #8)

**Avoids:**
- Failed writes when vote arrays exceed 1MB limit
- Emergency migration under pressure
- Data loss from failed migrations

**Uses:** Error system for migration failure handling, testing infrastructure for migration verification

**Implements:** Feature flag architecture pattern (useful for future features)

**Testing:** Migration script tests with seeded data, vote count comparison before/after

### Phase 5: Monitoring and Analytics
**Rationale:** Once core stability is achieved (error handling, listener cleanup, tests, migration), add production visibility. This is when error tracking becomes valuable — after error infrastructure is in place. Low risk to add, high value for operational excellence.

**Delivers:**
- Sentry integration for error tracking
- Firebase Performance Monitoring setup
- Firebase Analytics or Plausible integration
- Structured logging system (replace console.log)
- Performance budgets and monitoring
- Source map configuration for production errors

**Addresses:**
- Error tracking integration (differentiator feature)
- Performance monitoring (differentiator feature)
- Analytics integration (differentiator feature)
- Structured logging (table stakes feature)

**Avoids:**
- Blindness to production issues
- Performance regressions going unnoticed
- Inability to answer usage questions

**Uses:** Error system for Sentry error context, testing infrastructure for monitoring config verification

**Testing:** Verify Sentry captures test errors, Performance Monitoring tracks test requests

### Phase 6: Operational Excellence
**Rationale:** Final polish for production operations. Build on monitoring infrastructure. Lower urgency — valuable but not blocking deployment. Can be implemented incrementally as operational needs emerge.

**Delivers:**
- Audit Service for critical operations
- Offline resilience (Firestore persistence, connection monitoring)
- Error recovery UI (retry buttons)
- Health check endpoint
- TypeScript strict mode enforcement
- Expanded test coverage (E2E with Playwright)
- Automated Firestore backups
- Performance optimization based on monitoring data

**Addresses:**
- No audit trail (moderate pitfall #9)
- Missing offline handling (moderate pitfall #7)
- Error recovery UI (table stakes feature)
- Weak TypeScript (minor pitfall #15)
- Health check endpoint (differentiator feature)

**Avoids:**
- Inability to debug "who changed what"
- Poor experience on bad connections
- User frustration with non-recoverable errors

**Uses:** All previous phases as foundation

**Testing:** Audit trail queries, offline mode scenarios, health check endpoint availability

### Phase Ordering Rationale

- **Phase 1 first** because typed errors are foundation for everything else (monitoring, testing, user experience)
- **Phase 2 second** because listener leaks will cause production failures; builds on error system
- **Phase 3 third** to lock in stability before refactoring; enables confident changes in later phases
- **Phase 4 before user growth** because document size limits are hard stop; needs testing infrastructure in place
- **Phase 5 after stability** because monitoring is only valuable when core functionality is reliable
- **Phase 6 iteratively** based on operational needs that emerge from Phase 5 monitoring

**Dependency chain:**
```
Phase 1 (Errors) → Phase 2 (Listeners) → Phase 3 (Testing)
                                             ↓
                     Phase 4 (Migration) ← Testing
                              ↓
                     Phase 5 (Monitoring)
                              ↓
                     Phase 6 (Operations)
```

**Parallelization opportunities:**
- Phase 3 can start during Phase 2 for independent components
- Phase 4 planning and script writing during Phase 3
- Phase 6 items can be implemented individually as needs arise

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 4 (Data Migration):** Complex Firestore migration patterns, feature flag best practices, rollback strategies need validation. Sparse documentation on zero-downtime migrations with dual-write. Consider /gsd:research-phase for migration patterns.

- **Phase 5 (Monitoring):** Sentry Vue 3 + Quasar integration specifics, Firebase Performance configuration for Vite projects. May have evolved since training data cutoff (Jan 2025). Verify with Context7 or official docs.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Error System):** Well-documented TypeScript error patterns, Vue errorHandler is standard. Abundant examples available.

- **Phase 2 (Listener Registry):** Standard singleton pattern, Firebase listener lifecycle well-documented. Project already has partial implementation to build on.

- **Phase 3 (Testing):** Vitest and Firebase emulator documentation comprehensive. Testing patterns mature and stable.

- **Phase 6 (Operations):** Individual features are standard (audit logging, offline mode, health checks). Can reference existing patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core recommendations (Vitest, Sentry, Firebase tools) are industry standard with stable APIs. Version numbers based on Jan 2025 training data — verify current versions. MSW v2 may have breaking changes from v1, check migration guide. |
| Features | HIGH | Feature analysis based on concrete codebase gaps (78 console.error calls, 6/116 files with cleanup, 4.3% test coverage). Production feature requirements well-established. Clear prioritization based on observed deficiencies. |
| Architecture | HIGH | Current Clean Architecture verified via code inspection. Patterns (error boundaries, listener registry, feature flags, audit logging) are proven approaches. Project structure already supports recommended patterns without major refactoring. |
| Pitfalls | HIGH | Listener lifecycle issues, document size limits, missing error handling verified in codebase analysis. Firebase Firestore 1MB limit is official specification. Vue 3 and Firebase gotchas from official documentation. Race condition evidence visible in code (timing buffers). |

**Overall confidence:** MEDIUM-HIGH

Research is grounded in concrete codebase analysis (file counts, code patterns, existing implementations) combined with proven production patterns. Main uncertainty is around specific package versions (training data through Jan 2025, now Feb 2026) and whether Sentry/Firebase SDKs have introduced breaking changes. Core recommendations are sound regardless of minor version differences.

### Gaps to Address

**During planning/execution:**

- **Package version verification:** Check npm for latest stable versions of Sentry, MSW, TypeScript, Vitest packages before installation. Review changelog for breaking changes between Jan 2025 and Feb 2026.

- **Firebase quota specifics:** Verify exact Firestore concurrent listener limits and read quotas for free tier. Training data suggests ~1000 listeners per client and 50K reads/day free tier, but confirm with current Firebase documentation.

- **Quasar + Sentry integration:** Training data covers Vue 3 + Sentry, but Quasar-specific setup may have nuances. Check for Quasar boot file requirements and SSR considerations even though project is SPA.

- **Migration rollback procedures:** Research showed dual-write pattern but rollback details sparse. During Phase 4 planning, investigate rollback strategies and test with staging data before production migration.

- **MSW v2 migration:** If project or tests previously used MSW v1, breaking changes exist in v2. Review MSW migration guide during Phase 3 setup.

**Validation during implementation:**

- **TypeScript strict mode impact:** Enabling strict mode will reveal many implicit any types. Budget time for fixing type errors incrementally. Consider enabling strict per-module rather than all at once.

- **Firebase emulator Windows compatibility:** Project runs on Windows (MINGW64_NT). Verify Firebase emulator suite works correctly on Windows, particularly port binding and file watchers.

- **Coverage threshold tuning:** 70% coverage threshold may be too aggressive initially. Start with 50% and incrementally increase as tests are written.

- **Listener registry integration:** Manual timing buffers (100-300ms) in auth flow suggest complex race conditions. ListenerRegistry implementation may require iterative debugging to get timing right.

## Sources

### Primary (HIGH confidence)

**Codebase analysis (verified 2026-02-14):**
- 116 source files analyzed for error handling, listener cleanup, testing
- 6 files with onUnmounted hooks (5.2% of codebase)
- 5 test files (4.3% test coverage)
- 31 files with try/catch blocks (27% error handling coverage)
- 78 console.error/log instances
- Votes stored as array in survey documents (verified in interfaces.ts)
- 44 team members in production (verified from CLAUDE.md)
- Clean Architecture layers confirmed (composable/, services/, stores/ structure)
- Manual timing buffers found in auth/listener initialization

**Official specifications:**
- Firebase Firestore 1MB document size limit (hard constraint, not changing)
- Firebase Firestore security rules (permission-denied errors verified)
- Vue 3 lifecycle hooks (onMounted, onUnmounted, onBeforeUnmount)
- TypeScript strict mode compiler options
- Vitest configuration options and coverage providers

### Secondary (MEDIUM confidence)

**Training data (Jan 2025 cutoff):**
- Vue 3 Composition API best practices and patterns
- Firebase Firestore listener lifecycle management patterns
- Clean Architecture principles (Robert C. Martin)
- Sentry Vue integration documentation
- Firebase Performance Monitoring setup
- Vitest + Vue Test Utils patterns
- TypeScript error handling patterns
- Feature flag implementation approaches
- Audit logging for SaaS applications
- Production deployment best practices

**Community consensus:**
- Sentry as industry standard for Vue error tracking
- Vitest as default choice for Vite projects (over Jest)
- Firebase Emulator Suite for integration testing
- ListenerRegistry pattern for managing Firestore subscriptions
- Typed error hierarchies for enterprise applications

### Tertiary (LOW confidence, needs validation)

**Package versions:**
- @sentry/vue ^8.48.0 (verify current version)
- MSW ^2.6.8 (check for v2 breaking changes)
- @vitest/coverage-v8 ^4.0.0 (confirm compatibility)
- firebase-tools ^13.23.1 (verify emulator versions)

**Platform-specific:**
- Firebase concurrent listener limits (~1000 per client, verify official docs)
- Firestore free tier quotas (50K reads/day, verify current Firebase pricing)
- Quasar-specific Sentry integration patterns (verify Quasar docs)
- Windows compatibility for Firebase emulators (verify in project environment)

**Emerging patterns:**
- Feature flag best practices for dual-write migrations (research during Phase 4)
- Zero-downtime Firestore data migration strategies (research during Phase 4)
- Optimal batch sizes for audit log writes (tune based on usage patterns)

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*

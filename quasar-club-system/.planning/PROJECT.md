# Quasar Club System

## What This Is

A production-hardened football club management system built with Vue 3, Quasar Framework, and Firebase. It enables team members to vote on surveys (attendance), manage teams, track fines/payments via a cashbox system, view reports/charts, and receive notifications. Used by real football teams with 44+ active members. Features typed error handling, centralized listener management, audit trails, and automated CI/CD.

## Core Value

Reliable real-time survey voting and team management that works correctly under concurrent use — no lost votes, no stale data, no silent failures.

## Requirements

### Validated

- ✓ User authentication with email/password — existing
- ✓ Team creation and management — existing
- ✓ Survey creation, editing, deletion — existing
- ✓ Survey voting with real-time updates — existing
- ✓ Survey verification by power users — existing
- ✓ Cashbox system with fines and payments — existing
- ✓ Auto-fine generation based on survey rules — existing
- ✓ Dashboard with metrics and charts — existing
- ✓ Reports with activity charts — existing
- ✓ Notification system — existing
- ✓ Multi-language support (Czech/English) — existing
- ✓ Clean architecture (components → composables → use cases → services → stores) — existing
- ✓ Route guards and auth state management — existing
- ✓ Firestore security rules — existing
- ✓ Build optimization with manual chunk splitting — existing
- ✓ Typed error hierarchy (AuthError, FirestoreError, ValidationError, ListenerError) — v1.0
- ✓ Global error handler with user-friendly Quasar notifications — v1.0
- ✓ Error recovery UI with retry buttons for transient errors — v1.0
- ✓ Firebase error codes mapped to Czech/English i18n messages — v1.0
- ✓ Password change reauthentication with clear error messages — v1.0
- ✓ Centralized ListenerRegistry with auto-cleanup — v1.0
- ✓ Promise-based auth coordination (no timing buffers) — v1.0
- ✓ Team switching with proper listener cleanup — v1.0
- ✓ Permission error surfacing to users — v1.0
- ✓ Listener cleanup verified on logout — v1.0
- ✓ TypeScript strict mode with zero implicit-any — v1.0
- ✓ Structured logging replacing all console calls — v1.0
- ✓ Type-safe i18n keys — v1.0
- ✓ Firebase config TODO resolved — v1.0
- ✓ Votes migrated to subcollections with dual-write — v1.0
- ✓ Migration script with rollback capability — v1.0
- ✓ IN query batching for 30+ member teams — v1.0
- ✓ Vote functions consolidated to addOrUpdateVote — v1.0
- ✓ Audit trail for sensitive operations — v1.0
- ✓ Permission-denied errors show user feedback — v1.0
- ✓ Team deletion cascade for large datasets — v1.0
- ✓ Auth state verified before team listeners — v1.0
- ✓ Lazy chart rendering with intersection observer — v1.0
- ✓ Firebase Performance Monitoring — v1.0
- ✓ Notification pagination bounds checking — v1.0
- ✓ Firebase Emulator Suite configured — v1.0
- ✓ Firestore security rules unit tests — v1.0
- ✓ Auth flow tests (login, register, logout, permissions) — v1.0
- ✓ Survey voting tests (concurrent, updates, edge cases) — v1.0
- ✓ Cashbox fine rule tests (all trigger types) — v1.0
- ✓ Form validation composable tests — v1.0
- ✓ Listener cleanup tests — v1.0
- ✓ CI/CD pipeline with GitHub Actions — v1.0

### Active

#### Current Milestone: v1.2 Auth Pages — SHIPPED 2026-02-26

**Goal:** Login and registration pages support dynamic language switching (CZ/EN) so users can choose their language before authenticating.

- [x] Language switcher on auth pages (login, register)
- [x] All auth form labels and text internationalized via i18n
- [x] Fix broken LanguageSwitcher.vue component

### Out of Scope

- Mobile native app — web SPA is sufficient for current user base
- Server-side rendering — Firebase hosting serves static SPA
- Real-time chat — not core to club management
- OAuth/social login — email/password sufficient for team members
- Offline support — users always have connectivity at club events
- Sentry/error monitoring — deferred to v2 (MON-01)

## Context

- **User base**: Football teams, primarily Xaverov team with 44 members
- **Firebase project**: `club-surveys`
- **Codebase**: 21,120 LOC across TypeScript/Vue files, clean architecture
- **Tech stack**: Vue 3 + Quasar 2.16 + Firebase 11.4 + Vite + Vitest
- **Test coverage**: 82%+ function coverage, security rules tests for all collections
- **CI/CD**: GitHub Actions — PR checks (lint, tests, build) + master deploy to Firebase Hosting
- **Deployment**: Firebase Hosting via GitHub Actions
- **Codebase map**: Available at `.planning/codebase/` with 7 analysis documents
- **Known issues**: 4 auth use case tests fail in full-suite runs (pass in isolation — test ordering issue)

## Constraints

- **Tech stack**: Vue 3 + Quasar + Firebase — no framework changes
- **Firebase limits**: Firestore IN query limited to 30 items (batched), document size 1MB max
- **Backward compatibility**: Must not break existing user sessions or data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Move votes to subcollections | Document array approach hits 1MB limit with large teams | ✓ Good — dual-write with feature flags enables safe rollback |
| Add typed error system | `any` catches lose type safety, can't distinguish error types | ✓ Good — 4 error classes with i18n messages and retry logic |
| Consolidate vote functions | 3 duplicate functions increase maintenance burden | ✓ Good — single addOrUpdateVote function |
| Add audit collection | No record of who deleted/modified sensitive data | ✓ Good — fire-and-forget writes, power-user-only reads |
| Lazy chart rendering | All 4 charts render simultaneously, blocking UI | ✓ Good — intersection observer with VueUse |
| Promise-based auth coordination | Timing buffers (100-300ms) caused race conditions | ✓ Good — eliminates all timing-based auth waits |
| Custom lightweight logger over vuejs3-logger | Vue dependency incompatible with plain TS services | ✓ Good — scoped factory pattern, JSON context |
| Feature flags default to false | Safe initial state for vote migration rollout | ✓ Good — const assertion for type safety |
| Fire-and-forget audit writes | Audit failures shouldn't block user operations | ✓ Good — operations never fail due to audit |
| Local firebase-tools@13.35.1 | Global v15.5.1 requires Java 21, local works with Java 17 | ✓ Good — bash wrapper for Windows compatibility |
| fileParallelism: false for rules tests | Multiple test files sharing emulator cause clearFirestore() races | ✓ Good — sequential runs prevent data conflicts |
| vi.hoisted() for mock functions | vitest hoists vi.mock() above const declarations | ✓ Good — prevents ReferenceError in test factories |

| Allow any user to create teams | New users need to bootstrap without admin help | ✓ Good — v1.1 |
| Join request system for team discovery | Invitation-only limits growth, browsing enables self-service | ✓ Good — v1.1 |

---
*Last updated: 2026-02-26 after v1.2 milestone shipped*

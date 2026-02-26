# Milestones

## v1.0 Production Hardening (Shipped: 2026-02-19)

**Phases completed:** 9 phases, 29 plans, 31 tasks

**Key accomplishments:**
- Typed error hierarchy with Czech/English user-facing messages and retry for transient errors
- Centralized listener lifecycle management eliminating memory leaks and race conditions
- TypeScript strict mode with structured logging replacing all 105 console calls
- Vote subcollection migration enabling unlimited team scaling with dual-write and rollback safety
- Audit trail for sensitive operations (survey deletion, fine modifications, member removal)
- Lazy chart rendering with intersection observers and Firebase Performance Monitoring
- Comprehensive test suite — security rules tests + 82%+ unit test coverage
- CI/CD pipeline with GitHub Actions PR checks and automated Firebase Hosting deployment

**Stats:** 158 files changed, +26,907/-742 lines, 6 days (2026-02-14 → 2026-02-19), ~3.3h execution
**Git range:** feat(01-01) → feat(09-02)

## v1.1 New User Onboarding & No-Team UX (Shipped: 2026-02-22)

**Phases completed:** 5 phases (10-14), 10 plans

**Key accomplishments:**
- Onboarding wizard for teamless users with display name setup and team choice
- Any authenticated user can create a team (creator becomes power user)
- Team discovery with browse list, join requests, and power user approval/decline
- Route guarding — teamless users restricted to /team, /settings, /about
- Rate limiting & user quotas with admin UI and client-side enforcement

## v1.2 Auth Pages (Shipped: 2026-02-26)

**Phases completed:** 1 phase (15), 1 plan

**Key accomplishments:**
- Language switcher added to AuthLayout for pre-login language selection (CZ/EN)
- All hardcoded strings in LoginFormNew.vue and RegisterFormNew.vue internationalized via i18n
- Fixed broken LanguageSwitcher.vue component
- Logout race condition fix — listeners unregistered before sign-out to prevent permission-denied errors

---


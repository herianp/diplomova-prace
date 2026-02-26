# Roadmap: Quasar Club System

## Milestones

- **v1.0 Production Hardening** — Phases 1-9 (shipped 2026-02-19)
- **v1.1 New User Onboarding & No-Team UX** — Phases 10-14 (shipped 2026-02-22)
- **v1.2 Auth Pages** — Phase 15 (shipped 2026-02-26)

## Phases

<details>
<summary>v1.0 Production Hardening (Phases 1-9) — SHIPPED 2026-02-19</summary>

- [x] Phase 1: Error System Foundation (5/5 plans) — completed 2026-02-14
- [x] Phase 2: Listener Registry System (3/3 plans) — completed 2026-02-15
- [x] Phase 3: Code Quality & TypeScript (4/4 plans) — completed 2026-02-15
- [x] Phase 4: Data Model Migration (3/3 plans) — completed 2026-02-15
- [x] Phase 5: Security & Audit (3/3 plans) — completed 2026-02-15
- [x] Phase 6: Performance (2/2 plans) — completed 2026-02-15
- [x] Phase 7: Test Infrastructure (2/2 plans) — completed 2026-02-18
- [x] Phase 8: Test Implementation (5/5 plans) — completed 2026-02-18
- [x] Phase 9: CI/CD Pipeline (2/2 plans) — completed 2026-02-19

</details>

<details>
<summary>v1.1 New User Onboarding & No-Team UX (Phases 10-14) — SHIPPED 2026-02-22</summary>

- [x] Phase 10: Onboarding Wizard & Route Guarding (2/2 plans) — completed 2026-02-21
- [x] Phase 11: Team Creation (1/1 plans) — completed 2026-02-22
- [x] Phase 12: Team Discovery & Join Requests (4/4 plans) — completed 2026-02-22
- [x] Phase 13: Empty States (1/1 plans) — completed 2026-02-22
- [x] Phase 14: Rate Limiting & User Quotas (2/2 plans) — completed 2026-02-22

</details>

<details>
<summary>v1.2 Auth Pages (Phase 15) — SHIPPED 2026-02-26</summary>

- [x] Phase 15: Auth Page i18n & Language Switcher (1/1 plans) — completed 2026-02-26

</details>

## Phase Details

### Phase 15: Auth Page i18n & Language Switcher
**Goal**: Auth pages (login, register) display all text in the selected language and provide a language switcher so users can change language before authenticating
**Depends on**: Phase 14 (v1.1 complete)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. All hardcoded strings in LoginFormNew.vue and RegisterFormNew.vue use i18n `$t()` keys
  2. A language switcher is visible in the AuthLayout (top-right corner) on both login and register pages
  3. Switching language on the auth page immediately updates all visible text
  4. The selected language persists to localStorage and is used after login
**Plans:** 1/1

Plans:
- [x] 15-01-PLAN.md — Add auth i18n keys, internationalize forms, add language switcher to AuthLayout, fix LanguageSwitcher component

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Error System Foundation | v1.0 | 5/5 | Complete | 2026-02-14 |
| 2. Listener Registry System | v1.0 | 3/3 | Complete | 2026-02-15 |
| 3. Code Quality & TypeScript | v1.0 | 4/4 | Complete | 2026-02-15 |
| 4. Data Model Migration | v1.0 | 3/3 | Complete | 2026-02-15 |
| 5. Security & Audit | v1.0 | 3/3 | Complete | 2026-02-15 |
| 6. Performance | v1.0 | 2/2 | Complete | 2026-02-15 |
| 7. Test Infrastructure | v1.0 | 2/2 | Complete | 2026-02-18 |
| 8. Test Implementation | v1.0 | 5/5 | Complete | 2026-02-18 |
| 9. CI/CD Pipeline | v1.0 | 2/2 | Complete | 2026-02-19 |
| 10. Onboarding Wizard & Route Guarding | v1.1 | 2/2 | Complete | 2026-02-21 |
| 11. Team Creation | v1.1 | 1/1 | Complete | 2026-02-22 |
| 12. Team Discovery & Join Requests | v1.1 | 4/4 | Complete | 2026-02-22 |
| 13. Empty States | v1.1 | 1/1 | Complete | 2026-02-22 |
| 14. Rate Limiting & User Quotas | v1.1 | 2/2 | Complete | 2026-02-22 |
| 15. Auth Page i18n & Language Switcher | v1.2 | 1/1 | Complete | 2026-02-26 |

**All milestones shipped. No active phases.**

# Roadmap: Quasar Club System

## Milestones

- ✅ **v1.0 Production Hardening** — Phases 1-9 (shipped 2026-02-19)
- 🚧 **v1.1 New User Onboarding & No-Team UX** — Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Production Hardening (Phases 1-9) — SHIPPED 2026-02-19</summary>

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

### 🚧 v1.1 New User Onboarding & No-Team UX (In Progress)

**Milestone Goal:** New users see a guided onboarding wizard and all pages handle the "no team" state gracefully.

- [x] **Phase 10: Onboarding Wizard & Route Guarding** — Intercept teamless users, collect display name, and branch to create or join a team (completed 2026-02-21)
- [x] **Phase 11: Team Creation** — Any authenticated user can create a team and automatically become its power user (completed 2026-02-22)
- [ ] **Phase 12: Team Discovery & Join Requests** — Browse teams, send join requests, and let power users approve or decline them
- [ ] **Phase 13: Empty States** — All main pages show contextual guidance with call-to-action when user has no team

## Phase Details

### Phase 10: Onboarding Wizard & Route Guarding
**Goal**: Teamless users are intercepted by route guards and guided through a wizard that collects their display name and leads them to create or join a team
**Depends on**: Phase 9 (v1.0 complete)
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ROUTE-01, ROUTE-02
**Success Criteria** (what must be TRUE):
  1. A newly registered user who has no team is automatically redirected to the onboarding wizard when navigating to any protected page
  2. A user with a team who visits the onboarding URL is redirected directly to the dashboard without seeing the wizard
  3. The wizard presents a field where the user can set or confirm their display name before proceeding
  4. The wizard presents two clear paths: create a new team or browse existing teams
  5. After the user gains team membership through the wizard, they land on the dashboard
**Plans:** 2/2 plans complete

Plans:
- [ ] 10-01-PLAN.md — Route guard for teamless users, onboarding route, and clean layout
- [ ] 10-02-PLAN.md — 3-step onboarding wizard (Welcome, Display Name, Team Choice)

### Phase 11: Team Creation
**Goal**: Any authenticated user can create a team from within the onboarding wizard or the app, and the creator is automatically granted power user status on that team
**Depends on**: Phase 10
**Requirements**: TEAM-01, TEAM-02
**Success Criteria** (what must be TRUE):
  1. A user who has never been a power user can create a new team and see it appear in the app immediately
  2. The team creator appears in the team's power user list and has access to power user actions (survey management, join request approval)
  3. No admin approval or pre-existing power user role is required to create a team
**Plans:** 1/1 plans complete

Plans:
- [ ] 11-01-PLAN.md — Inline team creation form in onboarding wizard, wired to existing createTeam use case

### Phase 12: Team Discovery & Join Requests
**Goal**: Users can browse all existing teams and send join requests; team power users can approve or decline those requests; approved users become team members
**Depends on**: Phase 11
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05
**Success Criteria** (what must be TRUE):
  1. A teamless user can see a list of all teams in the system from within the onboarding wizard
  2. A user can tap a team in the list and send a join request; confirmation is visible to the user
  3. A team power user sees a badge or list of pending join requests for their team
  4. A power user can approve a join request, after which the requesting user appears in the team's members list
  5. A power user can decline a join request, after which the request disappears without adding the user to the team
**Plans:** 3/4 plans executed

Plans:
- [ ] 12-01-PLAN.md — Data layer: IJoinRequest interface, joinRequestFirebase service, useJoinRequestUseCases, Firestore security rules
- [ ] 12-02-PLAN.md — Team browse list UI in onboarding wizard with filtering, badges, and join request flow
- [ ] 12-03-PLAN.md — Power user request management: sidebar badge, approve/decline UI, audit logging
- [ ] 12-04-PLAN.md — Standalone /teams page integration, My Requests in Settings, end-to-end verification

### Phase 13: Empty States
**Goal**: Dashboard, Surveys, Reports, and Players pages each render meaningful guidance with a call-to-action when the authenticated user belongs to no team
**Depends on**: Phase 10
**Requirements**: EMPTY-01, EMPTY-02, EMPTY-03, EMPTY-04
**Success Criteria** (what must be TRUE):
  1. A teamless user who lands on the Dashboard sees a message explaining the situation and a button that navigates to onboarding
  2. A teamless user who visits the Surveys page sees an empty state with a call-to-action rather than a blank or broken page
  3. A teamless user who visits the Reports page sees an empty state with a call-to-action rather than broken charts
  4. A teamless user who visits the Players page sees an empty state with a call-to-action rather than an empty list with no context
**Plans**: TBD

Plans:
- [ ] 13-01: Shared empty-state component — reusable no-team banner with configurable CTA
- [ ] 13-02: Apply empty state to Dashboard, Surveys, Reports, and Players pages

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
| 10. Onboarding Wizard & Route Guarding | 2/2 | Complete    | 2026-02-21 | - |
| 11. Team Creation | 1/1 | Complete    | 2026-02-22 | - |
| 12. Team Discovery & Join Requests | 3/4 | In Progress|  | - |
| 13. Empty States | v1.1 | 0/2 | Not started | - |

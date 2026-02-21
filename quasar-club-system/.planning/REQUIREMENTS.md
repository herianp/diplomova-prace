# Requirements: Quasar Club System

**Defined:** 2026-02-21
**Core Value:** Reliable real-time survey voting and team management that works correctly under concurrent use — no lost votes, no stale data, no silent failures.

## v1.1 Requirements

Requirements for New User Onboarding & No-Team UX. Each maps to roadmap phases.

### Onboarding

- [x] **ONB-01**: User without a team sees an onboarding wizard instead of the main app
- [x] **ONB-02**: User can set their display name during onboarding
- [x] **ONB-03**: User can choose between creating a team or browsing existing teams
- [x] **ONB-04**: User who completes onboarding (has a team) is redirected to the dashboard

### Team Creation

- [ ] **TEAM-01**: Any authenticated user can create a team (not restricted to power users)
- [ ] **TEAM-02**: Team creator automatically becomes power user of that team only

### Team Discovery & Joining

- [ ] **DISC-01**: User can browse a list of all existing teams
- [ ] **DISC-02**: User can send a join request to a team
- [ ] **DISC-03**: Team power user sees pending join requests
- [ ] **DISC-04**: Team power user can approve or decline a join request
- [ ] **DISC-05**: Approved user is added to the team's members array

### Empty States

- [ ] **EMPTY-01**: Dashboard shows guidance to create/join a team when user has no team
- [ ] **EMPTY-02**: Surveys page shows guidance when user has no team
- [ ] **EMPTY-03**: Reports page shows guidance when user has no team
- [ ] **EMPTY-04**: Players page shows guidance when user has no team

### Route Guarding

- [x] **ROUTE-01**: Teamless users are redirected to onboarding from protected pages
- [x] **ROUTE-02**: Users with a team skip onboarding and go directly to dashboard

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Team Discovery Enhancements

- **DISC-06**: Teams can set a description visible in the browse list
- **DISC-07**: User can search/filter teams by name

## Out of Scope

| Feature | Reason |
|---------|--------|
| Team visibility toggle (public/private) | All teams visible for now, simplicity |
| App-wide admin approval for team creation | Any user can create, no gatekeeping |
| Auto-join without approval | Power user approval required for join requests |
| Onboarding feature tour | Keep wizard focused on profile + team setup only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ONB-01 | Phase 10 | Complete |
| ONB-02 | Phase 10 | Complete |
| ONB-03 | Phase 10 | Complete |
| ONB-04 | Phase 10 | Complete |
| ROUTE-01 | Phase 10 | Complete |
| ROUTE-02 | Phase 10 | Complete |
| TEAM-01 | Phase 11 | Pending |
| TEAM-02 | Phase 11 | Pending |
| DISC-01 | Phase 12 | Pending |
| DISC-02 | Phase 12 | Pending |
| DISC-03 | Phase 12 | Pending |
| DISC-04 | Phase 12 | Pending |
| DISC-05 | Phase 12 | Pending |
| EMPTY-01 | Phase 13 | Pending |
| EMPTY-02 | Phase 13 | Pending |
| EMPTY-03 | Phase 13 | Pending |
| EMPTY-04 | Phase 13 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 — traceability filled after roadmap creation*

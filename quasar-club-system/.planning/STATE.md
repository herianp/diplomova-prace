# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Reliable real-time survey voting and team management that works correctly under concurrent use — no lost votes, no stale data, no silent failures.
**Current focus:** v1.1 — Phase 12: Team Discovery & Join Requests

## Current Position

Milestone: v1.1 New User Onboarding & No-Team UX
Phase: 12 of 13 (Team Discovery & Join Requests)
Plan: 3 of 4 in current phase
Status: In progress — Plan 12-03 complete
Last activity: 2026-02-22 — Plan 12-03 complete: real-time sidebar badge and JoinRequestManagement component with approve/decline for power users

Progress: [███░░░░░░░] 30% (v1.1)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 29
- Total execution time: ~3.3 hours
- Timeline: 6 days (2026-02-14 → 2026-02-19)
- Files modified: 158 (+26,907/-742 lines)

**v1.1 (in progress):**
- Plans completed: 6 of 10

## Accumulated Context

### Decisions

All v1.0 decisions archived in PROJECT.md Key Decisions table.

v1.1 decisions:
- Allow any user to create teams — new users bootstrap without admin help
- Join request system for team discovery — browsing enables self-service
- Route guard uses isTeamReady flag from authStore to gate team-state check before redirecting to /onboarding
- OnboardingLayout: clean full-page with minimal header (app title + logout), no drawer/sidebar
- [Phase 10]: Display name save is silent if empty — user can proceed without setting a name
- [Phase 10]: showSuccess ref set from component-level watcher on teamStore.teams.length for reactive team detection
- [Phase 10 P02]: Separate mobile/desktop wizard components chosen after QStepper internal panel targeting proved fragile across breakpoints
- [Phase 10 P02]: Step 3 create/browse inline content are placeholder banners — full implementation deferred to Phases 11 and 12
- [Phase 11 P01]: CreateTeamForm is minimal (no q-card) — parent wizard provides the visual container
- [Phase 11 P01]: Success detection reuses existing teamStore.teams.length watcher in both wizard variants — no new watcher needed
- [Phase 11 P01]: isCreatingTeam lives in composable so both wizard variants share state through the composable instance
- [Phase 12]: joinRequests Firestore rules use separate allow read blocks (Firestore OR logic) for own and power-user access
- [Phase 12]: teams collection gets broad read rule for authenticated users enabling team browse without membership
- [Phase 12 P02]: TeamBrowseList is self-contained (no props) — manages its own Firestore listeners internally, keeping wizard components clean
- [Phase 12 P02]: Cancel request button shown inline next to pending badge — no separate cancel view needed for onboarding flow
- [Phase 12 P03]: pendingJoinRequests ListenerId added to listenerRegistry team scope for automatic cleanup on team switch
- [Phase 12 P03]: Power user guard in setPendingJoinRequestsListener uses teamStore.currentTeam.powerusers — avoids extra Firestore reads
- [Phase 12 P03]: Badge uses q-item-section side with route comparison inside v-for — simpler than special-casing Teams entry in topLinks

### Pending Todos

None.

### Blockers/Concerns

- Port 8080 residual Java process after test runs: consecutive `yarn test:rules` runs need ~15s delay or manual process kill
- useAuthUseCases.test.ts: 4 tests fail in full-suite runs (pass in isolation — test ordering issue)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Fix admin page styling and create PlayersPage with player cards and detail dialog | 2026-02-21 | 6f54409 | [1-fix-admin-page-styling-and-create-player](./quick/1-fix-admin-page-styling-and-create-player/) |
| Phase 10 P02 | 2 | 1 tasks | 5 files |
| Phase 12-team-discovery-join-requests P01 | 2 | 2 tasks | 4 files |

## Session Continuity

Last session: 2026-02-22 (Phase 12, Plan 03 completion)
Stopped at: Completed 12-03-PLAN.md — all tasks done, SUMMARY.md created
Resume file: None

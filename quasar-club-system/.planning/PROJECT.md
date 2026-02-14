# Quasar Club System — Production Hardening

## What This Is

A football club management system built with Vue 3, Quasar Framework, and Firebase. It enables team members to vote on surveys (attendance), manage teams, track fines/payments via a cashbox system, view reports/charts, and receive notifications. Used by real football teams with 40+ active members.

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

### Active

- [ ] Fix listener race conditions and lifecycle management
- [ ] Move votes from document arrays to subcollections (scaling fix)
- [ ] Add proper error typing (replace `any` catches with typed errors)
- [ ] Remove duplicated vote functions (consolidate to single `addOrUpdateVote`)
- [ ] Add error recovery with user-facing feedback for all async operations
- [ ] Add audit trail for sensitive operations (deletions, fine modifications)
- [ ] Add comprehensive test coverage for critical paths
- [ ] Fix permission error boundaries with user-visible feedback
- [ ] Optimize chart rendering (lazy loading)
- [ ] Add data consistency validation for survey verification → cashbox flow
- [ ] Harden password change reauthentication flow
- [ ] Fix team deletion cascade for large datasets
- [ ] Add notification pagination bounds checking
- [ ] Type-safe i18n keys

### Out of Scope

- Mobile native app — web SPA is sufficient for current user base
- Server-side rendering — Firebase hosting serves static SPA
- Real-time chat — not core to club management
- OAuth/social login — email/password sufficient for team members
- Offline support — users always have connectivity at club events

## Context

- **User base**: Football teams, primarily Xaverov team with 44 members
- **Firebase project**: `club-surveys`
- **Existing codebase**: ~50 source files, clean architecture already established
- **Current issues**: Race conditions in listeners, missing error recovery, no audit trail, test gaps, votes stored as arrays hitting Firestore document size limits
- **Codebase map**: Available at `.planning/codebase/` with 7 analysis documents
- **Deployment**: Firebase Hosting, AWS deploy workflow exists

## Constraints

- **Tech stack**: Vue 3 + Quasar + Firebase — no framework changes
- **Data migration**: Votes subcollection change requires migrating existing data
- **Firebase limits**: Firestore IN query limited to 30 items, document size 1MB max
- **Backward compatibility**: Must not break existing user sessions or data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Move votes to subcollections | Document array approach hits 1MB limit with large teams | — Pending |
| Add typed error system | `any` catches lose type safety, can't distinguish error types | — Pending |
| Consolidate vote functions | 3 duplicate functions increase maintenance burden | — Pending |
| Add audit collection | No record of who deleted/modified sensitive data | — Pending |
| Lazy chart rendering | All 4 charts render simultaneously, blocking UI | — Pending |

---
*Last updated: 2026-02-14 after initialization*

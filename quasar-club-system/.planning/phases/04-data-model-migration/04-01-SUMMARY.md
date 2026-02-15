---
phase: 04-data-model-migration
plan: 01
subsystem: data-migration
tags: [feature-flags, security-rules, refactoring, vote-consolidation]
dependency_graph:
  requires: [03-04-logging-migration]
  provides: [feature-flag-system, votes-subcollection-security, unified-vote-function]
  affects: [vote-storage, subcollection-migration]
tech_stack:
  added:
    - src/config/featureFlags.ts (feature flag configuration)
  patterns:
    - Type-safe feature flag getter with FeatureFlagKey type
    - Firestore subcollection security rules with explicit voteId == auth.uid constraint
key_files:
  created:
    - src/config/featureFlags.ts
  modified:
    - firestore.rules
    - src/services/surveyFirebase.ts
    - src/composable/useSurveyUseCases.ts
decisions:
  - Use const assertion for feature flags object to ensure type safety
  - Default both migration flags to false for safe initial state
  - Enforce voteId == request.auth.uid in subcollection rules for vote ownership
  - Remove all legacy vote wrappers in single refactoring to prevent partial migration
metrics:
  duration: 3 minutes
  completed: 2026-02-15
  tasks_completed: 2
  files_modified: 4
  lines_added: 53
  lines_removed: 41
---

# Phase 04 Plan 01: Feature Flags and Vote Function Consolidation Summary

Feature flag system created with type-safe getter, votes subcollection security rules deployed with team member access and voteId ownership enforcement, all legacy vote wrappers removed leaving single addOrUpdateVote -> voteOnSurvey path.

## Overview

This plan established the foundation for subcollection migration by:
1. Creating a feature flag system to control vote storage backend at runtime
2. Deploying Firestore security rules for the votes subcollection before any writes occur
3. Consolidating all vote functions to eliminate duplicates before adding subcollection logic

## Tasks Completed

### Task 1: Create feature flags and update security rules
**Status:** Complete | **Commit:** dab42d0

Created `src/config/featureFlags.ts` with:
- `USE_VOTE_SUBCOLLECTIONS: false` - toggles read source (array vs subcollection)
- `DUAL_WRITE_VOTES: false` - enables writing to both backends during transition
- Type-safe `isFeatureEnabled(flag)` getter function
- `FeatureFlagKey` type for compile-time safety
- `as const` for flags object to ensure immutability

Updated `firestore.rules`:
- Added votes subcollection rules inside surveys match block (after line 23)
- Team members can read all votes for surveys they can access
- Team members can create/update their own vote (voteId == request.auth.uid constraint)
- Power users have full access to votes
- App admin has read/delete access
- Used `get()` to fetch parent survey's teamId since subcollection rules don't inherit parent context

**Files modified:**
- src/config/featureFlags.ts (created)
- firestore.rules (subcollection rules added)

### Task 2: Consolidate vote functions and remove legacy wrappers
**Status:** Complete | **Commit:** fa2b791

**In `src/services/surveyFirebase.ts`:**
- Deleted `addVote` wrapper function (lines 125-127)
- Deleted `addSurveyVote` wrapper function (lines 129-138)
- Removed both from return object
- Kept only `addOrUpdateVote` as the single vote function

**In `src/composable/useSurveyUseCases.ts`:**
- Deleted `addSurveyVoteUseCase` function (lines 121-142) - duplicate of voteOnSurvey
- Updated `voteOnSurvey` to call `surveyFirebase.addOrUpdateVote` instead of `surveyFirebase.addVote`
- Kept only `voteOnSurvey` as the single vote use case

**In `src/components/new/SurveyCard.vue`:**
- Confirmed it uses `voteOnSurvey` from `useSurveyUseCases()` - no changes needed
- Local `addSurveyVote` function calls `voteOnSurvey` correctly

**Verification:**
- Grep for `addVote\b` in src/services/ - zero results (only addOrUpdateVote remains)
- Grep for `addSurveyVote\b` in src/services/ - zero results
- Grep for `addSurveyVoteUseCase` - zero results
- Single vote path confirmed: SurveyCard -> voteOnSurvey -> addOrUpdateVote

**Files modified:**
- src/services/surveyFirebase.ts (removed 2 wrapper functions)
- src/composable/useSurveyUseCases.ts (removed duplicate use case)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Feature flags file created with both migration flags defaulting to false ✓
2. Security rules deployed for votes subcollection with proper team member and power user access ✓
3. All legacy vote function wrappers removed (addVote, addSurveyVote, addSurveyVoteUseCase) ✓
4. Single vote path: SurveyCard -> voteOnSurvey -> addOrUpdateVote ✓
5. Build verification shows no new TypeScript errors (6 pre-existing linting errors unrelated to changes) ✓

## Impact Analysis

**Immediate:**
- Feature flags available for controlling vote storage backend
- Security rules deployed and ready for subcollection writes
- Vote function call path simplified from 3 duplicate functions to 1

**Dependencies:**
- Phase 04-02 (Dual-write implementation) can now use feature flags
- Vote subcollection writes will be secured when enabled
- No breaking changes - application behavior unchanged

**Risk Assessment:**
- Zero risk - feature flags default to false (current behavior)
- Security rules deployed but unused until feature flags enable subcollection writes
- Vote function consolidation is pure refactoring with no behavioral change

## Next Steps

Phase 04-02: Implement dual-write logic in `addOrUpdateVote` using `DUAL_WRITE_VOTES` feature flag to write votes to both array and subcollection.

## Self-Check: PASSED

**Created files exist:**
- FOUND: src/config/featureFlags.ts

**Modified files exist:**
- FOUND: firestore.rules
- FOUND: src/services/surveyFirebase.ts
- FOUND: src/composable/useSurveyUseCases.ts

**Commits exist:**
- FOUND: dab42d0 (feat(04-01): create feature flags and deploy votes subcollection security rules)
- FOUND: fa2b791 (refactor(04-01): consolidate vote functions and remove legacy wrappers)

**Feature flag verification:**
- isFeatureEnabled function exports FeatureFlagKey type
- USE_VOTE_SUBCOLLECTIONS and DUAL_WRITE_VOTES both default to false
- Flags object uses const assertion

**Security rules verification:**
- votes subcollection rules nested inside surveys match block
- voteId == request.auth.uid constraint enforced
- Team member read access confirmed
- Power user and app admin access confirmed

**Vote function verification:**
- addVote wrapper removed from surveyFirebase.ts
- addSurveyVote wrapper removed from surveyFirebase.ts
- addSurveyVoteUseCase removed from useSurveyUseCases.ts
- Only addOrUpdateVote remains in service layer
- Only voteOnSurvey remains in use cases
- voteOnSurvey calls addOrUpdateVote directly

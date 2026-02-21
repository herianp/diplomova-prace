---
phase: 04-data-model-migration
plan: 02
subsystem: data-migration
tags: [subcollections, dual-write, feature-flags, batch-operations]
dependency_graph:
  requires: [04-01-feature-flags]
  provides: [subcollection-vote-backend, dual-write-atomicity, transparent-data-source-swap]
  affects: [vote-storage, survey-listener, data-migration-readiness]
tech_stack:
  added:
    - Firestore writeBatch for atomic dual-write operations
    - Subcollection vote storage pattern (surveys/{surveyId}/votes/{userUid})
  patterns:
    - Feature-flag-gated code paths for progressive backend migration
    - Promise.all for parallelized subcollection reads
    - Graceful fallback from subcollection to array on read errors
key_files:
  created: []
  modified:
    - src/services/surveyFirebase.ts
decisions:
  - Use writeBatch for atomic dual-write to ensure consistency between array and subcollection
  - Parallelize subcollection reads across surveys using Promise.all for performance
  - Implement fallback to array votes if subcollection read fails for reliability
  - Handle subcollection enrichment in listener layer for transparent source swapping
  - Add DAT-03 comment noting subcollection architecture eliminates IN query limits
metrics:
  duration: 2 minutes
  completed: 2026-02-15
  tasks_completed: 2
  files_modified: 1
  lines_added: 157
  lines_removed: 18
---

# Phase 04 Plan 02: Subcollection Vote Backend Implementation Summary

Implemented subcollection vote read/write logic with feature-flag-gated dual-write support using Firebase writeBatch for atomic operations, enabling transparent data source swap at listener level without downstream changes.

## Overview

This plan implemented the core DAT-01 subcollection storage backend for votes with three operational modes:
1. **Array-only mode** (default, USE_VOTE_SUBCOLLECTIONS=false, DUAL_WRITE_VOTES=false): Current behavior unchanged
2. **Dual-write mode** (DUAL_WRITE_VOTES=true): Atomic writes to both array and subcollection for safe migration transition
3. **Subcollection-only mode** (USE_VOTE_SUBCOLLECTIONS=true): Post-migration mode reading/writing only subcollection

The subcollection pattern eliminates the 1MB document size limit for votes and avoids IN query issues since votes are queried by parent survey ID, not by user ID list.

## Tasks Completed

### Task 1: Add subcollection write functions and dual-write logic to surveyFirebase
**Status:** Complete | **Commit:** 7b54573

**Internal helper functions added:**

1. `addVoteToSubcollection(surveyId, userUid, vote)` - Writes single vote to `surveys/{surveyId}/votes/{userUid}` using setDoc with merge. Document structure:
```typescript
{
  userUid: string,
  vote: boolean,
  updatedAt: Date
}
```

2. `addVoteDualWrite(surveyId, userUid, newVote, votes)` - Atomic dual-write using writeBatch:
   - Operation 1: Update survey document's votes array (same logic as current implementation)
   - Operation 2: Set vote document in subcollection
   - Single batch.commit() ensures atomicity

3. `getVotesFromSubcollection(surveyId)` - Reads all documents from `surveys/{surveyId}/votes/` collection, returns `IVote[]` by mapping doc.id to userUid and doc.data().vote

**Modified functions:**

- **`addOrUpdateVote`**: Three code paths gated by feature flags:
  - `DUAL_WRITE_VOTES=true`: Calls `addVoteDualWrite` for atomic writes to both backends
  - `USE_VOTE_SUBCOLLECTIONS=true`: Calls `addVoteToSubcollection` for subcollection-only
  - Default: Existing array-only logic preserved
  - Early return optimization if vote unchanged (works for all modes)

- **`verifySurvey`**: When DUAL_WRITE_VOTES enabled and updatedVotes provided:
  - Uses writeBatch to update survey document and write each vote to subcollection atomically
  - Single batch.commit() ensures verification and vote sync are atomic

- **`updateSurveyVotes`**: When DUAL_WRITE_VOTES enabled:
  - Uses writeBatch to update array and sync all votes to subcollection atomically
  - Ensures bulk vote updates maintain consistency between backends

**Exports:**
- Added `getVotesFromSubcollection` to return object for use case layer access

**Imports added:**
- `getDocs` - for reading subcollection documents
- `setDoc` - for writing individual vote documents
- `writeBatch` - for atomic multi-operation writes
- `isFeatureEnabled` from `@/config/featureFlags`

**DAT-03 note added:**
```typescript
// NOTE: Subcollection architecture eliminates IN query limit issues (DAT-03).
// Votes are queried per-survey via getDocs on the subcollection, not by user ID list.
```

**Files modified:**
- src/services/surveyFirebase.ts (+127 lines, -16 lines)

### Task 2: Update survey listener for subcollection reads
**Status:** Complete | **Commit:** 93a09a3

**In `src/services/surveyFirebase.ts`:**

Updated `getSurveysByTeamId` listener to transparently swap vote data source:
- After mapping snapshot docs to surveys, check if `USE_VOTE_SUBCOLLECTIONS` is true
- If enabled, use `Promise.all` to parallelize subcollection reads across all surveys
- For each survey, call `getVotesFromSubcollection(survey.id)` and replace `survey.votes`
- Implemented two-level error handling:
  - Per-survey try/catch: Falls back to array votes if single subcollection read fails
  - Outer try/catch: Logs warning if overall enrichment fails
- Survey listener callback changed from sync to async to support subcollection reads

**Impact:**
- Downstream consumers (components, pages, charts) continue reading `survey.votes` without changes
- Data source is transparently swapped at listener level based on feature flag
- Same `ISurvey` interface regardless of backend storage
- All existing components work identically with subcollection backend

**Files modified:**
- src/services/surveyFirebase.ts (+30 lines, -2 lines)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification checks passed:

1. `npx quasar build` completes with zero new errors (6 pre-existing linting errors unchanged) ✓
2. Feature flag `USE_VOTE_SUBCOLLECTIONS=false` + `DUAL_WRITE_VOTES=false`: app behavior unchanged (array reads/writes) ✓
3. Code review: `addOrUpdateVote` has three distinct code paths gated by feature flags ✓
4. Code review: `getSurveysByTeamId` enriches votes from subcollection when flag is true ✓
5. Code review: `writeBatch` used for atomic dual-write operations ✓
6. `getVotesFromSubcollection` is exported from surveyFirebase ✓

**Grep verification:**
- `writeBatch` found at: import line, addVoteDualWrite, verifySurvey, updateSurveyVotes
- `isFeatureEnabled` found at: import line, addOrUpdateVote (2x), verifySurvey, updateSurveyVotes, getSurveysByTeamId
- `getVotesFromSubcollection` found at: definition, getSurveysByTeamId call, return object export

## Impact Analysis

**Immediate:**
- Subcollection vote backend fully implemented with atomic dual-write support
- Survey listener transparently swaps data source based on feature flags
- Three operational modes available (array-only, dual-write, subcollection-only)
- Zero behavioral changes with default feature flag values

**Dependencies:**
- Phase 04-03 (Migration Script) can now enable DUAL_WRITE_VOTES to start populating subcollections
- Migration verification can enable USE_VOTE_SUBCOLLECTIONS to test subcollection reads
- Post-migration can disable DUAL_WRITE_VOTES and set USE_VOTE_SUBCOLLECTIONS=true for subcollection-only mode

**Risk Assessment:**
- Zero risk with current flags (both false) - existing behavior preserved
- Dual-write mode uses writeBatch for atomicity - no partial write risk
- Subcollection read failures fall back to array votes for reliability
- Listener enrichment errors logged but don't break survey display

**Performance Considerations:**
- Subcollection reads parallelized with Promise.all for minimal latency
- Dual-write mode adds one extra Firestore operation per vote (acceptable for migration)
- Batch operations reduce network overhead vs individual writes
- Subcollection-only mode reduces survey document size (better for large teams)

## Technical Details

**Firestore Operations:**

Array-only mode (default):
- 1 updateDoc per vote

Dual-write mode (DUAL_WRITE_VOTES=true):
- 1 batch with 2 operations per vote (array update + subcollection set)
- Atomic commit ensures consistency

Subcollection-only mode (USE_VOTE_SUBCOLLECTIONS=true):
- Write: 1 setDoc per vote
- Read: 1 getDocs per survey (returns all votes)

**Data Structure:**

Subcollection document path: `surveys/{surveyId}/votes/{userUid}`
Document schema:
```typescript
{
  userUid: string     // Matches doc ID for easy querying
  vote: boolean       // true = yes, false = no
  updatedAt: Date     // Timestamp for audit trail
}
```

**Security:**
- Firestore rules deployed in 04-01 enforce voteId == auth.uid for ownership
- Team members can only create/update their own vote
- Power users have full access for verification/correction

## Next Steps

Phase 04-03: Create migration script to backfill existing array votes to subcollections, enable DUAL_WRITE_VOTES flag to start dual-writing new votes, verify data consistency.

## Self-Check: PASSED

**Modified files exist:**
- FOUND: src/services/surveyFirebase.ts

**Commits exist:**
- FOUND: 7b54573 (feat(04-02): add subcollection write functions and dual-write logic)
- FOUND: 93a09a3 (feat(04-02): update survey listener for subcollection reads)

**Feature implementation verification:**
- addVoteToSubcollection function defined
- addVoteDualWrite function defined using writeBatch
- getVotesFromSubcollection function defined and exported
- addOrUpdateVote has three code paths (DUAL_WRITE_VOTES, USE_VOTE_SUBCOLLECTIONS, default)
- verifySurvey dual-writes when DUAL_WRITE_VOTES enabled
- updateSurveyVotes dual-writes when DUAL_WRITE_VOTES enabled
- getSurveysByTeamId enriches votes from subcollection when USE_VOTE_SUBCOLLECTIONS enabled
- Promise.all used for parallelized subcollection reads
- Fallback to array votes on subcollection read errors
- DAT-03 comment about IN query limits present

**Import verification:**
- getDocs imported from firebase/firestore
- setDoc imported from firebase/firestore
- writeBatch imported from firebase/firestore
- isFeatureEnabled imported from @/config/featureFlags

**Build verification:**
- Build completes successfully
- Same 6 pre-existing linting errors (no new errors introduced)

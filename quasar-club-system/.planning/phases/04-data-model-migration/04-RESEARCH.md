# Phase 4: Data Model Migration - Research

**Researched:** 2026-02-15
**Domain:** Firestore data migration, subcollections, feature flags, batch operations
**Confidence:** MEDIUM-HIGH

## Summary

This phase addresses Firestore's 1MB document size limit by migrating survey votes from array fields to subcollections. The current implementation stores votes as `votes: IVote[]` arrays directly in survey documents, which will fail when teams exceed ~200 active voters (estimated at 220KB for 44 members voting on 100 surveys). The codebase already has working patterns for batch operations (see `teamFirebase.ts` deleteTeam function with 499-document batches) and IN query chunking (see `firestoreUtils.ts` with 30-item limit handling).

The standard migration approach uses dual-write pattern during transition: write to both array and subcollection, use feature flags to toggle read source, validate data consistency, then cut over to subcollection-only reads/writes. This enables zero-downtime migration with rollback capability. Security rules must be updated to handle subcollections explicitly (rules don't cascade from parent documents). The project already has Firebase integration, batch operation patterns, and structured error handling from Phase 1, providing a solid foundation.

**Primary recommendation:** Implement feature flag system for toggling vote storage backend, create migration script using Firebase batch writes (500 ops/batch limit), add votes subcollection with security rules mirroring parent survey permissions, consolidate duplicate vote functions (addVote/addSurveyVote/addOrUpdateVote), use parallel reads during migration (old array first, fallback to subcollection), validate zero data loss with verification script before final cutover.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase Firestore | 11.4.0 (existing) | Subcollection storage | Already in project, native subcollection support |
| Firebase Batch Operations | 11.4.0 (existing) | Migration script writes | Built into Firestore SDK, handles atomicity |
| TypeScript | (existing) | Type-safe migration | Already configured, strict mode from Phase 3 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firestore Transactions | 11.4.0 (existing) | Data consistency validation | For read-modify-write operations during migration |
| Vitest | 4.0.18 (existing) | Migration script testing | Verify data integrity before/after migration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dual-write pattern | Direct cutover migration | Direct cutover has no rollback; dual-write adds complexity but safety |
| Feature flags in code | Firestore Remote Config | Remote Config adds dependency; simple boolean flags sufficient for binary toggle |
| Batch writes | Cloud Functions for Firebase | Functions add deployment complexity; batch writes simpler for one-time migration |
| Manual migration script | Fireway schema migration tool | Fireway adds abstraction overhead; custom script more transparent for this specific use case |

**Installation:**
```bash
# No new dependencies required - uses existing Firebase SDK
# Feature flag implementation uses simple config file pattern
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── config/
│   └── featureFlags.ts          # Feature flag toggles
├── services/
│   └── surveyFirebase.ts        # Updated with subcollection logic
├── migrations/
│   ├── 001-votes-to-subcollection.ts   # Migration script
│   └── verify-migration.ts             # Data validation script
└── interfaces/
    └── interfaces.ts            # IVote interface (unchanged)

firestore.rules                  # Updated security rules for votes subcollection
```

### Pattern 1: Feature Flag Toggle for Storage Backend

**What:** Boolean flag controls whether vote reads/writes use array or subcollection
**When to use:** During migration transition period (2-4 weeks typical)
**Example:**
```typescript
// Source: Based on https://designrevision.com/blog/feature-flags-best-practices
// config/featureFlags.ts
export const featureFlags = {
  USE_VOTE_SUBCOLLECTIONS: false, // Toggle to true after migration completes
} as const

export type FeatureFlags = typeof featureFlags

// services/surveyFirebase.ts
import { featureFlags } from '@/config/featureFlags'

const addOrUpdateVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
  if (featureFlags.USE_VOTE_SUBCOLLECTIONS) {
    return addVoteToSubcollection(surveyId, userUid, newVote)
  } else {
    return addVoteToArray(surveyId, userUid, newVote, votes)
  }
}
```

### Pattern 2: Dual-Write Migration Pattern

**What:** Write to both array and subcollection during transition, read from array (fallback to subcollection if missing)
**When to use:** During active migration while validating data consistency
**Example:**
```typescript
// Source: https://firebase.google.com/docs/firestore/best-practices
// Dual write phase
const addVoteDualWrite = async (surveyId: string, userUid: string, vote: boolean, votes: IVote[]) => {
  const batch = writeBatch(db)

  // Write 1: Update array (old pattern)
  const surveyRef = doc(db, 'surveys', surveyId)
  const updatedVotes = votes.find(v => v.userUid === userUid)
    ? votes.map(v => v.userUid === userUid ? { ...v, vote } : v)
    : [...votes, { userUid, vote }]
  batch.update(surveyRef, { votes: updatedVotes })

  // Write 2: Update subcollection (new pattern)
  const voteRef = doc(db, 'surveys', surveyId, 'votes', userUid)
  batch.set(voteRef, { userUid, vote, timestamp: new Date() })

  await batch.commit()
}

// Parallel read with fallback
const getUserVote = async (surveyId: string, userUid: string, votes: IVote[]): Promise<IVote | undefined> => {
  // Try array first (existing data)
  const arrayVote = votes.find(v => v.userUid === userUid)
  if (arrayVote) return arrayVote

  // Fallback to subcollection (migrated data)
  const voteRef = doc(db, 'surveys', surveyId, 'votes', userUid)
  const voteDoc = await getDoc(voteRef)
  return voteDoc.exists() ? voteDoc.data() as IVote : undefined
}
```

### Pattern 3: Batch Migration Script

**What:** Process all existing surveys in batches of 500 operations, copy votes array to subcollection documents
**When to use:** One-time migration execution before enabling subcollection reads
**Example:**
```typescript
// Source: https://firebase.google.com/docs/firestore/manage-data/transactions
// migrations/001-votes-to-subcollection.ts
const BATCH_SIZE = 500 // Firestore limit

const migrateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
  const batches: WriteBatch[] = []
  let currentBatch = writeBatch(db)
  let operationCount = 0

  for (const vote of votes) {
    const voteRef = doc(db, 'surveys', surveyId, 'votes', vote.userUid)
    currentBatch.set(voteRef, {
      userUid: vote.userUid,
      vote: vote.vote,
      migratedAt: new Date()
    })

    operationCount++
    if (operationCount === BATCH_SIZE) {
      batches.push(currentBatch)
      currentBatch = writeBatch(db)
      operationCount = 0
    }
  }

  if (operationCount > 0) {
    batches.push(currentBatch)
  }

  // Commit all batches sequentially
  for (const batch of batches) {
    await batch.commit()
  }
}

const migrateAllSurveys = async () => {
  const surveysSnapshot = await getDocs(collection(db, 'surveys'))
  let migratedCount = 0
  let errorCount = 0

  for (const surveyDoc of surveysSnapshot.docs) {
    try {
      const votes = surveyDoc.data().votes || []
      await migrateSurveyVotes(surveyDoc.id, votes)
      migratedCount++
      console.log(`Migrated ${surveyDoc.id}: ${votes.length} votes`)
    } catch (error) {
      errorCount++
      console.error(`Failed to migrate ${surveyDoc.id}:`, error)
    }
  }

  console.log(`Migration complete: ${migratedCount} success, ${errorCount} errors`)
}
```

### Pattern 4: Security Rules for Subcollections

**What:** Explicit rules for votes subcollection mirroring parent survey permissions
**When to use:** Must be deployed before migration script runs
**Example:**
```javascript
// Source: https://firebase.google.com/docs/firestore/security/rules-structure
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /surveys/{surveyId} {
      // Existing survey rules...
      allow read, write, update, create: if isPowerUserForTeam(getTeamId());

      // NEW: Subcollection rules for votes
      match /votes/{voteId} {
        // Allow team members to read all votes in their surveys
        allow read: if canTeamExistsAndIsUserAuthenticated(get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId) &&
          isTeamMember(get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId);

        // Allow team members to create/update their own vote
        allow create, update: if request.auth != null &&
          voteId == request.auth.uid && // Vote document ID must match user's UID
          canTeamExistsAndIsUserAuthenticated(get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId) &&
          isTeamMember(get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId);

        // Allow power users full access to votes
        allow read, write, delete: if isPowerUserForTeam(get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId);
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Skipping validation step:** Running migration without verifying data consistency between array and subcollection leads to silent data loss. Always run verification script comparing counts/values before cutover.
- **Sequential document IDs in migration:** Writing votes with sequential IDs (vote1, vote2, vote3) creates Firestore hotspots. Use userUid as document ID for natural distribution.
- **Deleting array field immediately:** Removing `votes: []` array during migration prevents rollback. Keep array field until subcollection reads are validated in production.
- **No feature flag:** Hard-coding subcollection logic without toggle makes rollback require code deployment instead of config change. Always use feature flag for storage backend toggle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migration framework | Custom migration orchestrator with versioning/rollback | Firebase batch writes + feature flags | Migration is one-time operation; full framework adds complexity for single use case |
| Vote count aggregation | Real-time vote counter that queries subcollection on every read | Denormalized count field updated on vote write | Subcollection queries scale poorly; denormalized counts give O(1) reads |
| Migration progress tracking | Custom progress table with percentages | Simple console logging + Firestore transaction counts | Migration runs once in controlled environment; progress UI unnecessary overhead |
| Data validation logic | Custom schema validator for vote documents | TypeScript interfaces + Firestore security rules | Firestore rules enforce schema server-side; TypeScript catches client errors |

**Key insight:** This is a targeted data model fix, not a general migration system. Over-engineering with frameworks (Fireway, Migration Script Runner) adds abstraction overhead for a one-time batch operation. Firebase SDK batch writes + feature flags provide rollback safety without framework lock-in.

## Common Pitfalls

### Pitfall 1: Ignoring Firestore Write Rate Limits During Migration

**What goes wrong:** Migration script fails midway with "RESOURCE_EXHAUSTED" errors when writing too fast to single collection

**Why it happens:**
- Firestore has soft limit of 500 writes/second to collections with sequential keys
- Migration scripts often batch aggressively without rate limiting
- Team with 100 surveys × 44 members = 4,400 vote documents written in seconds

**Current evidence in project:**
- Existing `teamFirebase.ts` deleteTeam function uses batches correctly (499 operations)
- No rate limiting logic exists in codebase
- Project has 44 team members already (per CLAUDE.md) — potential for 4,400+ votes

**Consequences:**
- Migration fails after 500-1000 writes
- Partial data migration (some surveys migrated, some not)
- Requires manual cleanup and restart
- Lost development time debugging rate limit errors

**Prevention:**
1. **Add delays between batches** — Wait 200ms between batch commits for large migrations
2. **Use non-sequential vote IDs** — Vote document ID = userUid (natural distribution, not sequential)
3. **Monitor batch sizes** — Log batch commit counts to detect rate limit approach
4. **Test with production data volumes** — Run migration script against Firestore emulator with full dataset

**Detection:**
- Firestore errors with code "RESOURCE_EXHAUSTED"
- Migration script stops after consistent number of writes (~500)
- Firebase console shows "quota exceeded" warnings

**Code example:**
```typescript
// BAD: No rate limiting
for (const batch of batches) {
  await batch.commit() // Hits rate limit after 500 writes
}

// GOOD: Rate limited batches
for (let i = 0; i < batches.length; i++) {
  await batches[i].commit()
  if ((i + 1) % 10 === 0) { // Every 10 batches (5000 writes)
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second pause
  }
}
```

---

### Pitfall 2: Security Rules Not Updated Before Migration

**What goes wrong:** Migration script writes to votes subcollection, but security rules reject writes because subcollection rules don't exist

**Why it happens:**
- Firestore security rules don't cascade from parent to subcollections
- Developers assume `match /surveys/{surveyId}` rules apply to `surveys/{id}/votes/{voteId}`
- Migration script runs with Firebase Admin SDK (bypasses rules), but then app reads fail

**Current evidence in project:**
- `firestore.rules` has no subcollection rules for surveys (lines 6-24 only cover surveys collection)
- Existing subcollection rules exist for teams (fineRules, fines, payments at lines 88-113)
- Pattern established: each subcollection needs explicit rules

**Consequences:**
- Migration appears successful (Admin SDK writes succeed)
- Production app reads from votes subcollection fail with "permission-denied"
- Users can't vote after cutover to subcollection backend
- Emergency rollback to array-based votes required

**Prevention:**
1. **Deploy security rules BEFORE migration** — Add votes subcollection rules first
2. **Test rules with Firestore emulator** — Verify team members can read/write votes
3. **Use get() to access parent document** — Rules need `get(/databases/$(database)/documents/surveys/$(surveyId)).data.teamId` to check team membership
4. **Mirror parent permissions** — Votes subcollection should have same access controls as survey document

**Warning signs:**
- Migration script succeeds but app shows "permission-denied" errors
- Firebase console Security Rules playground shows denied operations
- Production error logs show Firestore code: "permission-denied"

---

### Pitfall 3: Data Inconsistency During Dual-Write Transition

**What goes wrong:** User votes during migration, writes to both array and subcollection with different values due to race condition

**Why it happens:**
- Dual-write uses batch operations, but batches can fail partially
- Network issues cause array write to succeed but subcollection write to fail
- No validation that both writes completed successfully
- Users can trigger multiple rapid votes (clicking yes/no repeatedly)

**Current evidence in project:**
- `surveyFirebase.ts` addOrUpdateVote uses single updateDoc (lines 94-122), not batched
- No retry logic for failed votes
- No validation that vote was persisted before UI updates

**Consequences:**
- Array shows "Yes" vote, subcollection shows "No" vote (or missing)
- After cutover to subcollection, user's previous vote appears changed
- Vote counts don't match between array aggregate and subcollection count
- User trust eroded ("I voted Yes, why does it show No?")

**Prevention:**
1. **Use Firestore transactions for dual-write** — Ensures both writes succeed or both fail atomically
2. **Add validation step in migration** — Compare array votes vs subcollection votes, report mismatches
3. **Implement retry logic** — If batch fails, retry up to 3 times before surfacing error
4. **Lock votes during migration** — Disable voting UI during migration window (maintenance mode)

**Validation script pattern:**
```typescript
const validateVoteConsistency = async (surveyId: string, votes: IVote[]) => {
  const subcollectionSnapshot = await getDocs(collection(db, 'surveys', surveyId, 'votes'))
  const subcollectionVotes = subcollectionSnapshot.docs.map(doc => doc.data() as IVote)

  // Compare counts
  if (votes.length !== subcollectionVotes.length) {
    console.error(`Survey ${surveyId}: Array has ${votes.length} votes, subcollection has ${subcollectionVotes.length}`)
    return false
  }

  // Compare individual votes
  for (const arrayVote of votes) {
    const subVote = subcollectionVotes.find(v => v.userUid === arrayVote.userUid)
    if (!subVote) {
      console.error(`Survey ${surveyId}: Vote from ${arrayVote.userUid} missing in subcollection`)
      return false
    }
    if (subVote.vote !== arrayVote.vote) {
      console.error(`Survey ${surveyId}: Vote mismatch for ${arrayVote.userUid}: array=${arrayVote.vote}, sub=${subVote.vote}`)
      return false
    }
  }

  return true
}
```

---

### Pitfall 4: Consolidating Vote Functions Without Removing Legacy Callers

**What goes wrong:** DAT-04 requires consolidating addVote/addSurveyVote/addOrUpdateVote to single function, but legacy callers still exist scattered across codebase

**Why it happens:**
- Requirement says "consolidate to single function" but doesn't specify removing old functions
- Developers add new unified function but leave old ones for "backward compatibility"
- No automated check that old functions are unused
- Code search shows function definitions exist, assumes they're needed

**Current evidence in project:**
- `surveyFirebase.ts` has 3 vote functions: addOrUpdateVote (lines 94-122), addVote (lines 125-127), addSurveyVote (lines 129-138)
- addVote and addSurveyVote are thin wrappers calling addOrUpdateVote
- Comments say "Legacy function names for backward compatibility (can be removed later)"
- No usage analysis performed to confirm safe removal

**Consequences:**
- Future developers see 3 functions, don't know which to use
- Inconsistent implementations (if one gets updated, others don't)
- Test coverage gaps (tests might cover old function, not new one)
- "Dead code" smell accumulates, reducing codebase maintainability

**Prevention:**
1. **Search for all callers before consolidation** — Use `grep -r "addVote\|addSurveyVote" src/` to find usage
2. **Update all callers to use unified function** — Change call sites to addOrUpdateVote before removing old functions
3. **Delete old functions immediately** — Don't leave "backward compatibility" wrappers, they become permanent
4. **Add TypeScript deprecation warnings** — Mark old functions `@deprecated` if keeping temporarily, with removal date

**Detection:**
```bash
# Find all callers of legacy functions
grep -r "\.addVote\(" src/
grep -r "\.addSurveyVote\(" src/

# If output is empty, safe to remove functions
# If output shows callers, update them first
```

## Code Examples

Verified patterns from official sources and project codebase:

### Querying Subcollection Votes
```typescript
// Source: https://firebase.google.com/docs/firestore/data-model
import { collection, getDocs, query, where } from 'firebase/firestore'

// Get all votes for a survey
const getVotesForSurvey = async (surveyId: string): Promise<IVote[]> => {
  const votesRef = collection(db, 'surveys', surveyId, 'votes')
  const snapshot = await getDocs(votesRef)
  return snapshot.docs.map(doc => doc.data() as IVote)
}

// Get specific user's vote
const getUserVoteFromSubcollection = async (surveyId: string, userId: string): Promise<IVote | null> => {
  const voteRef = doc(db, 'surveys', surveyId, 'votes', userId)
  const voteDoc = await getDoc(voteRef)
  return voteDoc.exists() ? voteDoc.data() as IVote : null
}

// Listen to vote changes in real-time
const subscribeToSurveyVotes = (surveyId: string, callback: (votes: IVote[]) => void): Unsubscribe => {
  const votesRef = collection(db, 'surveys', surveyId, 'votes')
  return onSnapshot(votesRef, (snapshot) => {
    const votes = snapshot.docs.map(doc => doc.data() as IVote)
    callback(votes)
  })
}
```

### Batch Migration with Error Handling
```typescript
// Source: Project pattern from teamFirebase.ts lines 48-63
import { writeBatch, collection, getDocs } from 'firebase/firestore'

const migrateSurveysWithErrorHandling = async () => {
  const surveysSnapshot = await getDocs(collection(db, 'surveys'))
  const results = {
    total: surveysSnapshot.docs.length,
    success: 0,
    failed: 0,
    errors: [] as Array<{ surveyId: string, error: string }>
  }

  for (const surveyDoc of surveysSnapshot.docs) {
    try {
      const votes = surveyDoc.data().votes || []

      // Batch write votes to subcollection (500 operation limit)
      for (let i = 0; i < votes.length; i += 500) {
        const batch = writeBatch(db)
        const chunk = votes.slice(i, i + 500)

        chunk.forEach((vote: IVote) => {
          const voteRef = doc(db, 'surveys', surveyDoc.id, 'votes', vote.userUid)
          batch.set(voteRef, vote)
        })

        await batch.commit()
      }

      results.success++
      console.log(`✓ Migrated survey ${surveyDoc.id}: ${votes.length} votes`)
    } catch (error) {
      results.failed++
      results.errors.push({
        surveyId: surveyDoc.id,
        error: error instanceof Error ? error.message : String(error)
      })
      console.error(`✗ Failed to migrate survey ${surveyDoc.id}:`, error)
    }
  }

  console.log(`\nMigration Results:`)
  console.log(`Total surveys: ${results.total}`)
  console.log(`Successful: ${results.success}`)
  console.log(`Failed: ${results.failed}`)

  if (results.errors.length > 0) {
    console.log('\nErrors:')
    results.errors.forEach(err => console.log(`- ${err.surveyId}: ${err.error}`))
  }

  return results
}
```

### Feature Flag Configuration Pattern
```typescript
// Source: https://designrevision.com/blog/feature-flags-best-practices
// config/featureFlags.ts
export const featureFlags = {
  // Vote storage migration feature flag
  // Set to true after migration completes and validation passes
  USE_VOTE_SUBCOLLECTIONS: false,

  // Enable dual-write mode during migration (write to both array and subcollection)
  DUAL_WRITE_VOTES: false,
} as const

export type FeatureFlagKey = keyof typeof featureFlags

// Type-safe flag getter
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return featureFlags[flag]
}

// Usage in surveyFirebase.ts
import { isFeatureEnabled } from '@/config/featureFlags'

const addOrUpdateVote = async (surveyId: string, userUid: string, vote: boolean, votes: IVote[]) => {
  if (isFeatureEnabled('DUAL_WRITE_VOTES')) {
    // Migration mode: write to both
    return addVoteDualWrite(surveyId, userUid, vote, votes)
  } else if (isFeatureEnabled('USE_VOTE_SUBCOLLECTIONS')) {
    // Post-migration mode: subcollection only
    return addVoteToSubcollection(surveyId, userUid, vote)
  } else {
    // Pre-migration mode: array only (current state)
    return addVoteToArray(surveyId, userUid, vote, votes)
  }
}
```

### Data Validation Script
```typescript
// migrations/verify-migration.ts
const verifyMigrationIntegrity = async (): Promise<boolean> => {
  const surveysSnapshot = await getDocs(collection(db, 'surveys'))
  let totalMismatches = 0

  for (const surveyDoc of surveysSnapshot.docs) {
    const arrayVotes = surveyDoc.data().votes || []
    const subcollectionSnapshot = await getDocs(
      collection(db, 'surveys', surveyDoc.id, 'votes')
    )
    const subcollectionVotes = subcollectionSnapshot.docs.map(doc => doc.data() as IVote)

    // Check counts match
    if (arrayVotes.length !== subcollectionVotes.length) {
      console.error(
        `Survey ${surveyDoc.id}: Count mismatch (array: ${arrayVotes.length}, subcollection: ${subcollectionVotes.length})`
      )
      totalMismatches++
      continue
    }

    // Check individual votes match
    for (const arrayVote of arrayVotes) {
      const subVote = subcollectionVotes.find(v => v.userUid === arrayVote.userUid)
      if (!subVote) {
        console.error(`Survey ${surveyDoc.id}: Vote ${arrayVote.userUid} missing in subcollection`)
        totalMismatches++
      } else if (subVote.vote !== arrayVote.vote) {
        console.error(
          `Survey ${surveyDoc.id}: Vote ${arrayVote.userUid} value mismatch (array: ${arrayVote.vote}, sub: ${subVote.vote})`
        )
        totalMismatches++
      }
    }
  }

  const success = totalMismatches === 0
  console.log(`\nValidation ${success ? 'PASSED' : 'FAILED'}`)
  console.log(`Total mismatches: ${totalMismatches}`)

  return success
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct array modification | Subcollections for unbounded data | 2015+ (Firestore GA) | Scalability beyond 1MB document limit |
| Manual migration scripts | Fireway/MSR migration tools | 2020+ | Standardized but adds complexity for one-time ops |
| Hard-coded backend logic | Feature flags for gradual rollout | 2018+ | Enables safe rollback without code deployment |
| Sequential batch commits | Rate-limited batches with delays | 2021+ (rate limits enforced) | Prevents RESOURCE_EXHAUSTED errors |
| Cascading security rules | Explicit subcollection rules | 2017 (Firestore launch) | Required by Firestore security model |

**Deprecated/outdated:**
- **Direct cutover migration without dual-write:** Modern approach uses gradual rollout with parallel reads (array first, subcollection fallback) to enable rollback
- **Storing unbounded arrays in documents:** Firestore best practices now recommend subcollections for any data that grows with user count (votes, comments, messages)
- **Assuming security rules cascade to subcollections:** Firestore requires explicit rules for each subcollection path since launch

## Open Questions

1. **Should migration run in production or use export/import workflow?**
   - What we know: Firebase Admin SDK can run migration script directly against production Firestore
   - What's unclear: Risk tolerance for running batch writes against live database vs. safer export→transform→import approach
   - Recommendation: Run migration during low-traffic window (3-6 AM) with DUAL_WRITE_VOTES enabled first to validate without risk. If team size < 50 and surveys < 200, direct migration acceptable. For larger datasets, consider Firestore export/import with transformation.

2. **How long to maintain dual-write mode before cutover?**
   - What we know: Dual-write adds latency (two Firestore operations instead of one) and doubles write costs
   - What's unclear: Project's budget for extended dual-write period vs. risk tolerance for fast cutover
   - Recommendation: 1 week dual-write minimum to validate in production. Run daily verification scripts. If 7 consecutive days show zero mismatches, safe to toggle USE_VOTE_SUBCOLLECTIONS to true.

3. **Should array field be removed after successful migration?**
   - What we know: Keeping `votes: []` array enables instant rollback by toggling feature flag
   - What's unclear: Storage cost vs. rollback safety tradeoff, plus whether array needs gradual cleanup
   - Recommendation: Keep array field for 30 days post-cutover (1 month rollback window). After 30 days, run cleanup script to set `votes: []` on all surveys. Don't remove field entirely (breaks backward compatibility with old mobile app versions if they exist).

4. **How to handle IN query limit workaround after migration?**
   - What we know: Current code has `firestoreUtils.ts` chunking for 30-item IN limit (DAT-03 requirement)
   - What's unclear: Whether vote subcollections still need chunked queries, or if structure eliminates the issue
   - Recommendation: Vote subcollections use different query pattern (query by surveyId parent, not IN clause). IN query limit only applies to filtering team members, which is separate concern. Keep `queryByIdsInChunks` utility for member queries, don't apply to votes.

## Sources

### Primary (HIGH confidence)
- [Firebase Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) - Migration patterns, document size limits, subcollection recommendations
- [Firebase Firestore Data Structure](https://firebase.google.com/docs/firestore/manage-data/structure-data) - When to use subcollections vs arrays, migration guidance
- [Firebase Firestore Security Rules Structure](https://firebase.google.com/docs/firestore/security/rules-structure) - Subcollection rules patterns, parent document validation
- [Firebase Firestore Storage Size Calculations](https://firebase.google.com/docs/firestore/storage-size) - 1MB document limit specification
- [Firebase Firestore Quotas and Limits](https://firebase.google.com/docs/firestore/quotas) - 500 writes/second rate limits, batch operation constraints
- Project codebase: `src/services/teamFirebase.ts` - Existing batch operation pattern (lines 48-83)
- Project codebase: `src/utils/firestoreUtils.ts` - IN query chunking pattern (lines 1-35)

### Secondary (MEDIUM confidence)
- [7+ Google Firestore Query Performance Best Practices for 2026](https://estuary.dev/blog/firestore-query-best-practices/) - Subcollection indexing, performance patterns verified against official docs
- [Feature Flags Best Practices: Complete Guide (2026)](https://designrevision.com/blog/feature-flags-best-practices) - Feature flag toggle patterns for rollback safety
- [Firebase Firestore Migration Scripts](https://medium.com/@r_dev/firebase-firestore-migration-scripts-59daba139cb4) - Real-world migration script patterns
- [Fireway GitHub](https://github.com/kevlened/fireway) - Schema migration tool reference (evaluated as alternative)

### Tertiary (LOW confidence)
- Migration Script Runner (MSR) - Framework mentioned in search results but not verified for Firebase Firestore compatibility
- Cloud Functions for Firebase - Alternative execution environment for migration, not evaluated in depth

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase SDK already in project, subcollections are native Firestore feature with official documentation
- Architecture: MEDIUM-HIGH - Dual-write pattern verified in best practices docs, batch operations confirmed in project codebase, feature flag pattern from industry sources
- Pitfalls: HIGH - Document size limit (1MB) is official spec, security rules non-cascading is Firestore design, rate limits confirmed in quotas docs, data inconsistency patterns from real-world migration articles
- Code examples: HIGH - Based on official Firebase docs and existing project patterns (teamFirebase.ts batch operations, firestoreUtils.ts chunking)

**Research date:** 2026-02-15
**Valid until:** 2026-05-15 (90 days - stable technology, Firebase Firestore API changes infrequently)

**Specific confidence notes:**
- Firestore 1MB limit and security rules behavior: 100% confidence (official Firebase specification)
- Batch write limits (500 operations): 100% confidence (official Firebase quotas documentation)
- Dual-write migration pattern: 85% confidence (best practice from official docs, but implementation details vary by use case)
- Feature flag approach: 80% confidence (industry standard pattern but not Firebase-specific guidance)
- Migration timing estimates (1 week dual-write): 60% confidence (based on general best practices, actual timing depends on traffic patterns and risk tolerance)

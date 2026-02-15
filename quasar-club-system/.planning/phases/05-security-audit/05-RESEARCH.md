# Phase 5: Security & Audit - Research

**Researched:** 2026-02-15
**Domain:** Firestore audit logging, error surfacing, batch cascade delete, auth coordination
**Confidence:** MEDIUM-HIGH

## Summary

Phase 5 addresses operational security and user experience gaps in the existing system. The application currently logs sensitive operations (survey deletion, fine modifications, team member removal) only via `createLogger()` console output with no persistent audit trail. Permission-denied errors from Firestore security rules result in silent empty array degradation (see `teamFirebase.ts` line 95 callback pattern), giving users no feedback when access is blocked. Team deletion uses batch operations correctly (499 operations per batch) but lacks testing for teams with 1000+ related documents. Auth state coordination was resolved in Phase 2 using Promise-based `authStateReady()` pattern.

The codebase has foundational infrastructure from previous phases: Phase 1 established typed error hierarchy with `FirestoreError` and error mapping to i18n keys, Phase 2 implemented `ListenerRegistry` with Promise-based auth coordination eliminating race conditions, Phase 3 added structured logging via `createLogger()`, and Phase 4 demonstrated batch operation patterns with 499-chunk limits. These provide the building blocks needed for audit trails and error surfacing.

**Primary recommendation:** Create `auditLogs` Firestore subcollection under teams with structured log entries (operation type, actor UID, timestamp, entity ID, before/after snapshots), wrap all listener error callbacks to throw instead of degrading silently (leverage Phase 1 error notification system), extend existing `teamFirebase.ts` batch deletion to handle multiple 499-operation batches sequentially for unlimited scale, and verify SEC-04 already satisfied by Phase 2's `authStateReady()` Promise coordination.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase Firestore | 11.4.0 (existing) | Audit log storage in subcollections | Native subcollection support, security rules integration |
| Existing error system | Phase 1 | Permission error surfacing | Already has `FirestoreError`, `notifyError()`, i18n mapping |
| Existing logger | Phase 3 | Structured logging foundation | `createLogger()` pattern established, extend for audit |
| Existing batch ops | Phase 4 | Cascade delete pattern | `teamFirebase.ts` already implements 499-chunk batches |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firestore Security Rules | (existing) | Audit log access control | Restrict audit read to power users only |
| TypeScript interfaces | (existing) | Type-safe audit log schema | Define `IAuditLog` interface for consistency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firestore subcollections | Google Cloud Audit Logs | Cloud Audit Logs are admin-level only (track API calls, not app logic like "user deleted survey"); app-level audit needs custom implementation |
| Custom audit service | Pangea Secure Audit Log extension | Pangea adds blockchain tamper-proofing but requires third-party service; Firestore subcollections sufficient for 40-user team |
| Throwing on permission errors | Graceful degradation (current) | Throwing surfaces errors to users via Phase 1 notification system instead of silent empty results |
| Cloud Functions cascade | Client-side batch cascade | Functions add deployment complexity; client-side batches work for 40-user scale |

**Installation:**
```bash
# No new dependencies required - uses existing Firebase SDK and Phase 1-4 infrastructure
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── auditLogFirebase.ts         # NEW: Audit log write/read operations
│   ├── teamFirebase.ts             # UPDATE: Enhanced cascade delete with unlimited batches
│   ├── surveyFirebase.ts           # UPDATE: Add audit logging to deleteSurvey
│   ├── cashboxFirebase.ts          # UPDATE: Add audit logging to fine modifications
│   └── listenerRegistry.ts         # EXISTING: Already handles auth coordination
├── interfaces/
│   └── interfaces.ts               # UPDATE: Add IAuditLog interface
├── composable/
│   ├── useAuditLogComposable.ts    # NEW: UI layer for audit log viewing
│   ├── useTeamUseCases.ts          # UPDATE: Surface listener errors instead of degrading
│   └── useSurveyUseCases.ts        # UPDATE: Audit log integration
└── pages/
    └── AuditLogPage.vue            # NEW: Power user audit log viewer

firestore.rules                     # UPDATE: Add auditLogs subcollection rules
```

### Pattern 1: Application-Level Audit Log Schema

**What:** Structured audit log documents stored in Firestore subcollections under teams, capturing who did what when with before/after snapshots.

**When to use:** Every sensitive operation identified in SEC-01 requirement: survey deletion, fine modification, team member removal, vote verification (power user actions).

**Example:**
```typescript
// Source: Custom pattern based on https://medium.com/@md.mollaie/audit-log-in-firebase-firestore-database-3c6a7d71ac4a
// File: src/interfaces/interfaces.ts

export interface IAuditLog {
  id?: string
  teamId: string
  operation: 'survey.delete' | 'fine.create' | 'fine.update' | 'fine.delete' | 'member.remove' | 'vote.verify'
  actorUid: string          // User who performed the action
  actorDisplayName: string  // Display name at time of action
  timestamp: Date
  entityId: string          // ID of affected entity (surveyId, fineId, memberUid)
  entityType: 'survey' | 'fine' | 'member' | 'vote'
  before?: Record<string, unknown>  // State before change (for updates/deletes)
  after?: Record<string, unknown>   // State after change (for creates/updates)
  metadata?: Record<string, unknown> // Additional context (e.g., reason for removal)
}

// File: src/services/auditLogFirebase.ts
import { addDoc, collection, doc, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { IAuditLog } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { createLogger } from 'src/utils/logger'

const log = createLogger('auditLogFirebase')

export function useAuditLogFirebase() {
  const writeAuditLog = async (entry: Omit<IAuditLog, 'id'>): Promise<void> => {
    try {
      // Audit logs stored as subcollection under team: teams/{teamId}/auditLogs/{logId}
      const auditRef = collection(doc(db, 'teams', entry.teamId), 'auditLogs')
      await addDoc(auditRef, {
        ...entry,
        timestamp: new Date()  // Server timestamp
      })

      log.info('Audit log written', {
        teamId: entry.teamId,
        operation: entry.operation,
        actorUid: entry.actorUid,
        entityId: entry.entityId
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to write audit log', {
        teamId: entry.teamId,
        operation: entry.operation,
        error: firestoreError.message
      })
      // Don't throw - audit log failure shouldn't block the main operation
    }
  }

  const getAuditLogs = async (
    teamId: string,
    filters?: { operation?: IAuditLog['operation']; limit?: number }
  ): Promise<IAuditLog[]> => {
    try {
      const auditRef = collection(doc(db, 'teams', teamId), 'auditLogs')
      let q = query(auditRef, orderBy('timestamp', 'desc'))

      if (filters?.operation) {
        q = query(q, where('operation', '==', filters.operation))
      }

      if (filters?.limit) {
        q = query(q, limit(filters.limit))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IAuditLog))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to read audit logs', { teamId, error: firestoreError.message })
      throw firestoreError
    }
  }

  return {
    writeAuditLog,
    getAuditLogs
  }
}

// Usage example in surveyFirebase.ts
const deleteSurvey = async (surveyId: string, teamId: string, actorUid: string, actorName: string, surveyData: ISurvey) => {
  try {
    // Perform the delete
    await deleteDoc(doc(db, 'surveys', surveyId))

    // Write audit log (non-blocking)
    const { writeAuditLog } = useAuditLogFirebase()
    await writeAuditLog({
      teamId,
      operation: 'survey.delete',
      actorUid,
      actorDisplayName: actorName,
      entityId: surveyId,
      entityType: 'survey',
      before: { title: surveyData.title, status: surveyData.status },
      metadata: { voteCount: surveyData.votes.length }
    })
  } catch (error: unknown) {
    const firestoreError = mapFirestoreError(error, 'delete')
    log.error('Failed to delete survey', { surveyId, error: firestoreError.message })
    throw firestoreError
  }
}
```

### Pattern 2: Permission Error Surfacing (No Silent Degradation)

**What:** Replace callback-based error handling that returns empty arrays with error throwing that surfaces permission issues to users via Phase 1 notification system.

**When to use:** All Firestore listener error callbacks currently using graceful degradation pattern.

**Example:**
```typescript
// Source: Based on existing error patterns from Phase 1 + Firebase docs
// File: src/services/teamFirebase.ts

// BEFORE (current pattern - silently degrades):
const getTeamsByUserId = (userId: string, callback: (teams: ITeam[]) => void): Unsubscribe => {
  const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

  return onSnapshot(teamsQuery, (snapshot) => {
    const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ITeam))
    callback(teams)
  }, (error) => {
    const listenerError = new ListenerError('teams', 'errors.listener.failed', { originalError: error.message })
    log.error('Teams listener failed', { userId, code: error.code, error: listenerError.message })
    callback([])  // ⚠️ SILENT DEGRADATION - user sees empty list, no error message
  })
}

// AFTER (Phase 5 - surface errors):
const getTeamsByUserId = (userId: string, callback: (teams: ITeam[]) => void): Unsubscribe => {
  const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

  return onSnapshot(teamsQuery, (snapshot) => {
    const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ITeam))
    callback(teams)
  }, (error) => {
    // Map Firestore error to typed error with i18n key
    const firestoreError = mapFirestoreError(error, 'read')
    log.error('Teams listener failed', { userId, code: error.code, error: firestoreError.message })

    // For permission-denied specifically, show explicit user feedback
    if (error.code === 'permission-denied') {
      // notifyError will be called by the use case layer
      throw new FirestoreError(
        'permission-denied',
        'read',
        'errors.firestore.permissionDenied',
        {
          collection: 'teams',
          userId,
          hint: 'Check if user is authenticated and team member'
        }
      )
    }

    // For other errors, still throw (don't degrade silently)
    throw firestoreError
  })
}

// File: src/composable/useTeamUseCases.ts
const setTeamListener = async (userId: string) => {
  try {
    const unsubscribe = teamFirebase.getTeamsByUserId(userId, (teams) => {
      teamStore.setTeams(teams)
    })
    listenerRegistry.register('teams', unsubscribe, { userId })
  } catch (error: unknown) {
    // Catch thrown errors from listener error callback
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      // Show user-visible notification with explanation
      notifyError('errors.firestore.permissionDenied', {
        retry: false,  // Permission errors won't be fixed by retrying
        caption: 'Please contact your team admin for access.'
      })
    } else {
      // Other errors might be transient (network, etc.)
      const shouldRetry = error instanceof FirestoreError &&
        (error.code === 'unavailable' || error.code === 'deadline-exceeded')

      notifyError(error instanceof FirestoreError ? error.message : 'errors.unexpected', {
        retry: shouldRetry,
        onRetry: shouldRetry ? () => setTeamListener(userId) : undefined
      })
    }
    throw error  // Re-throw for caller to handle
  }
}
```

### Pattern 3: Unlimited Batch Cascade Delete

**What:** Extend existing `teamFirebase.ts` deleteTeam batch pattern to handle unlimited document counts by sequentially committing multiple 499-operation batches.

**When to use:** Team deletion when team has 1000+ surveys, fines, or members (addresses SEC-03 requirement).

**Example:**
```typescript
// Source: Existing pattern from teamFirebase.ts lines 47-84 + Phase 4 batch patterns
// File: src/services/teamFirebase.ts

const deleteTeam = async (teamId: string) => {
  try {
    // Collections to clean up
    const collectionsToClean = ['surveys', 'messages', 'notifications', 'teamInvitations']

    for (const col of collectionsToClean) {
      const q = query(collection(db, col), where('teamId', '==', teamId))
      const snapshot = await getDocs(q)

      // ENHANCED: Handle unlimited documents with multiple batches
      const docs = snapshot.docs
      const BATCH_SIZE = 499  // Leave room for team doc in final batch

      // Split into batches of 499 operations
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        const chunk = docs.slice(i, i + BATCH_SIZE)

        chunk.forEach((d) => batch.delete(d.ref))

        await batch.commit()

        log.info('Batch delete progress', {
          teamId,
          collection: col,
          processed: Math.min(i + BATCH_SIZE, docs.length),
          total: docs.length
        })

        // Add small delay between batches to avoid rate limiting (every 10 batches = ~5000 writes)
        if ((i / BATCH_SIZE + 1) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      log.info('Collection cleaned', { teamId, collection: col, count: docs.length })
    }

    // Delete subcollections (fineRules, fines, payments, auditLogs) with same unlimited pattern
    const subcollections = ['fineRules', 'fines', 'payments', 'cashboxTransactions', 'auditLogs']
    for (const sub of subcollections) {
      const subRef = collection(doc(db, 'teams', teamId), sub)
      const subSnap = await getDocs(subRef)

      if (!subSnap.empty) {
        const docs = subSnap.docs
        const BATCH_SIZE = 499

        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + BATCH_SIZE)

          chunk.forEach((d) => batch.delete(d.ref))
          await batch.commit()

          log.info('Subcollection batch delete progress', {
            teamId,
            subcollection: sub,
            processed: Math.min(i + BATCH_SIZE, docs.length),
            total: docs.length
          })

          if ((i / BATCH_SIZE + 1) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }
    }

    // Delete surveys' votes subcollections (Phase 4 data model)
    // NOTE: Need to query all team surveys first, then delete their votes subcollections
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))
    const surveysSnapshot = await getDocs(surveysQuery)

    for (const surveyDoc of surveysSnapshot.docs) {
      const votesRef = collection(doc(db, 'surveys', surveyDoc.id), 'votes')
      const votesSnap = await getDocs(votesRef)

      if (!votesSnap.empty) {
        const docs = votesSnap.docs
        const BATCH_SIZE = 499

        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + BATCH_SIZE)

          chunk.forEach((d) => batch.delete(d.ref))
          await batch.commit()

          if ((i / BATCH_SIZE + 1) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }
    }

    // Finally, delete the team document itself
    await deleteDoc(doc(db, 'teams', teamId))

    log.info('Team deleted successfully', { teamId })
  } catch (error: unknown) {
    const firestoreError = mapFirestoreError(error, 'delete')
    log.error('Failed to delete team', { teamId, error: firestoreError.message })
    throw firestoreError
  }
}
```

### Pattern 4: Security Rules for Audit Logs

**What:** Firestore security rules restricting audit log read access to power users only, while allowing writes from authenticated team members (for system-generated logs).

**When to use:** Must be deployed alongside audit log implementation to prevent unauthorized access to sensitive operation history.

**Example:**
```javascript
// Source: https://firebase.google.com/docs/firestore/security/rules-structure
// File: firestore.rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /teams/{teamId} {
      // ... existing team rules ...

      // NEW: Audit logs subcollection - power users read only
      match /auditLogs/{logId} {
        // Only power users can read audit logs
        allow read: if request.auth != null &&
          get(/databases/$(database)/documents/teams/$(teamId)).data.powerusers.hasAny([request.auth.uid]);

        // Authenticated users can write (system creates logs during operations)
        // NOTE: In production, this should be restricted to Cloud Functions or Admin SDK
        // For now, allow authenticated writes since client-side code creates logs
        allow create: if request.auth != null &&
          request.resource.data.teamId == teamId &&
          request.resource.data.actorUid == request.auth.uid;

        // App admin full access
        allow read, delete: if isAppAdmin();
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Blocking operations on audit log failures:** Audit log writes should never block user-facing operations. If audit log write fails, log the failure but allow the main operation (survey delete, fine update) to succeed. Users care about their action completing, not the audit trail.

- **Storing sensitive data in audit logs:** Don't log passwords, API keys, or other secrets in `before`/`after` snapshots. For user objects, log only non-sensitive fields (displayName, role) not email/phone.

- **Synchronous audit log writes in UI components:** Audit logging should happen in service layer (Firebase services or use cases), never in Vue components. Components shouldn't know audit logs exist.

- **Using Cloud Audit Logs for application-level events:** Google Cloud Audit Logs track API-level operations (who called Firestore API, when) but don't capture application semantics ("user deleted survey for team X"). App-level audit requires custom implementation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blockchain-backed audit trail | Custom cryptographic chain of custody | Firestore subcollections (or Pangea extension if tamper-proofing required) | 40-user team doesn't need blockchain complexity; Firestore + security rules sufficient |
| Custom permission error detection | Manual string parsing of error messages | Firestore error codes + Phase 1 error mapper | Firebase SDK provides structured error codes; mapper already exists |
| Batch operation orchestration | Custom batch manager with queuing | Sequential `writeBatch` loops with 499 chunks | Firestore batches are atomic; sequential commits simpler than queue system |
| Audit log aggregation/analytics | Custom dashboard with real-time queries | Firestore queries with orderBy/limit + caching | Team size (40 users) doesn't justify complex analytics; simple queries work |

**Key insight:** Google Cloud Audit Logs provide infrastructure-level audit (API calls, admin changes) but don't capture application-level business logic ("power user deleted survey titled 'Practice Schedule'"). Application audit logs must be custom-built using Firestore subcollections. The codebase already has all needed building blocks: typed errors (Phase 1), structured logging (Phase 3), batch operations (Phase 4), and auth coordination (Phase 2).

## Common Pitfalls

### Pitfall 1: Audit Log Writes Blocking User Operations

**What goes wrong:** User deletes survey, operation hangs or fails because audit log write is slow or fails, user sees error message despite survey being deleted successfully.

**Why it happens:**
- Audit log write happens synchronously in same try/catch as main operation
- Network issues or Firestore unavailability blocks audit write
- Main operation succeeds but audit write fails, causing rollback or error state
- User experience degraded by infrastructure concern (audit logging)

**Current evidence in project:**
- Existing Firebase operations use `await` for all writes (see `surveyFirebase.ts` line 84 `deleteDoc`)
- No pattern established for non-blocking async operations
- Error handling throws on any Firestore failure

**Consequences:**
- Poor user experience (operations feel slow)
- False-positive errors (main action succeeded but user sees error)
- Users retry operations causing duplicates
- Audit logging becomes reason NOT to use the feature

**Prevention:**
1. **Non-blocking audit writes** — Use fire-and-forget pattern with `.catch()` instead of `await`
2. **Audit failures don't throw** — Catch audit errors, log them, but don't propagate to caller
3. **Separate try/catch blocks** — Main operation and audit log have independent error handling
4. **Client-side write confirmation before audit** — Show user success immediately after main operation, audit happens async

**Code example:**
```typescript
// BAD: Audit log blocks user operation
const deleteSurvey = async (surveyId: string, teamId: string, actorUid: string) => {
  try {
    await deleteDoc(doc(db, 'surveys', surveyId))  // Main operation
    await writeAuditLog({ ... })  // ⚠️ Blocks here if audit slow/fails
  } catch (error) {
    throw error  // User sees error even if survey was deleted successfully
  }
}

// GOOD: Non-blocking audit log
const deleteSurvey = async (surveyId: string, teamId: string, actorUid: string, actorName: string) => {
  try {
    // Main operation
    await deleteDoc(doc(db, 'surveys', surveyId))

    // Audit log - fire and forget (don't await)
    writeAuditLog({
      teamId,
      operation: 'survey.delete',
      actorUid,
      actorDisplayName: actorName,
      entityId: surveyId,
      entityType: 'survey'
    }).catch(error => {
      // Log audit failure but don't throw
      log.error('Audit log write failed (non-blocking)', {
        surveyId,
        error: error instanceof Error ? error.message : String(error)
      })
    })

    // User operation complete, audit happens in background
  } catch (error: unknown) {
    const firestoreError = mapFirestoreError(error, 'delete')
    log.error('Failed to delete survey', { surveyId, error: firestoreError.message })
    throw firestoreError  // Only throw if main operation failed
  }
}
```

---

### Pitfall 2: Exposing Audit Logs to Non-Power Users

**What goes wrong:** Regular team members can read audit logs showing who deleted surveys or modified fines, creating privacy/trust issues within team.

**Why it happens:**
- Security rules not deployed before audit log feature enabled
- Rules allow `request.auth != null` (any authenticated user) instead of power user check
- Audit log page accessible via router without role check
- Developer assumes subcollection rules cascade from parent (they don't)

**Current evidence in project:**
- `firestore.rules` has pattern of power-user-only writes for subcollections (fineRules, fines, payments)
- No audit log rules exist yet
- Router guards don't enforce power user role on all pages
- Team members can see all team data currently

**Consequences:**
- Team members see "John deleted the vote from Sarah" logs
- Internal team politics amplified by visibility into administrative actions
- Privacy concerns if audit logs contain sensitive context
- Team admin loses trust if members question every action

**Prevention:**
1. **Power-user-only read rules** — `allow read: if isPowerUserForTeam(teamId)` in security rules
2. **Client-side route guards** — Check `authStore.isPowerUser` before showing audit log page
3. **UI-level hiding** — Don't show "View Audit Log" button/link to non-power users
4. **Test rules with emulator** — Verify regular members get permission-denied on audit reads

**Warning signs:**
- Firestore console shows `permission-denied` errors from non-power-user UIDs
- User reports "I can see who deleted things" when they shouldn't
- Audit log page accessible but returns empty results (rules blocking, not UI)

---

### Pitfall 3: Cascade Delete Hitting Transaction Size Limit Despite 499 Chunks

**What goes wrong:** Team deletion fails midway with "Transaction too big" error even though batches contain <500 operations.

**Why it happens:**
- Firestore transaction size limit is based on total bytes, not operation count
- Large documents (surveys with 100+ vote objects) can hit 10MB transaction limit with <500 operations
- Deleting documents with many indexes (teamId, status, createdDate) counts index entry deletions toward size
- Survey deletion includes votes subcollection (Phase 4), multiplying document count

**Current evidence in project:**
- `teamFirebase.ts` uses 499-operation batches (line 57-62)
- No transaction size monitoring or fallback logic
- Surveys can have 44+ votes (44 team members per CLAUDE.md)
- No testing with 1000+ document teams (SEC-03 requirement)

**Consequences:**
- Team deletion fails after 200-300 surveys deleted
- Partial deletion leaves team in broken state (some data deleted, some not)
- User sees generic error "Transaction failed"
- Manual cleanup required via Firebase console

**Prevention:**
1. **Reduce batch size for large documents** — Use 200-300 operations per batch if documents >10KB
2. **Add progress feedback** — Show user "Deleting 523 of 1245 documents..." progress
3. **Query document sizes first** — Check total size before batch, adjust chunk size dynamically
4. **Fallback to smaller batches** — If batch fails, retry with half the operations
5. **Test with production-scale data** — Run deletion against emulator with 1000+ surveys

**Detection:**
```typescript
// Monitor batch commit failures
try {
  await batch.commit()
} catch (error) {
  if (error.code === 'resource-exhausted' || error.message.includes('too big')) {
    log.error('Batch size too large, reducing chunk size', {
      teamId,
      currentChunkSize: chunk.length,
      reducedChunkSize: Math.floor(chunk.length / 2)
    })
    // Retry with smaller chunks
  }
}
```

---

### Pitfall 4: Silent Degradation Masking Permission Issues

**What goes wrong:** User sees empty dashboard/survey list but doesn't know if it's because (a) team has no data, or (b) Firestore rules are denying access.

**Why it happens:**
- Listener error callbacks return empty arrays instead of throwing (see `teamFirebase.ts` line 95)
- Phase 1 error notification system never triggered because errors caught and suppressed
- No UI distinction between "loading", "empty", and "permission denied" states
- Developers prioritize "graceful degradation" over user feedback

**Current evidence in project:**
- All listener error callbacks use `callback([])` pattern (surveyFirebase.ts line 63, teamFirebase.ts line 95)
- No UI state for "permission denied" vs "no data"
- Users might see empty dashboard and assume team has no surveys
- Phase 1 error system (`notifyError`) exists but never called for listener failures

**Consequences:**
- User assumes team is inactive when actually rules deny access
- User creates duplicate surveys thinking old ones disappeared
- Team admin unaware that security rules are broken
- Support burden ("why can't I see my team?") instead of clear error message

**Prevention:**
1. **Throw on permission-denied** — Let listener error callbacks throw for `permission-denied` code
2. **Catch in use case layer** — Use cases handle thrown errors and call `notifyError()`
3. **UI loading states** — Show spinner until first listener callback, then show empty/error state
4. **Explicit "no access" UI** — If permission denied, show "You don't have permission to view this team" instead of empty list

**Warning signs:**
- Users report "my data disappeared"
- Firebase console shows permission-denied errors but app logs don't
- Empty arrays returned for non-empty collections
- No user-visible error messages for Firestore failures

---

### Pitfall 5: Auth Coordination Assumed Fixed Without Verification

**What goes wrong:** Assumption that Phase 2 solved SEC-04 (auth verified before listeners) without actually testing the scenario.

**Why it happens:**
- Phase 2 implemented `authStateReady()` Promise pattern (see research line 166-200)
- Developer assumes all listeners now use this pattern
- No verification that team listeners wait for auth completion
- Race condition could still exist if listeners start before `authStateReady()` resolves

**Current evidence in project:**
- `useAuthUseCases.ts` calls `authStateReady()` and sets `authStore.setAuthReady(true)` (line 33)
- `useTeamUseCases.ts` calls `setTeamListener()` after auth completes (line 46)
- `listenerRegistry` tracks listeners but doesn't enforce initialization order
- No explicit check that auth is ready before starting team listeners

**Consequences:**
- Permission-denied flash on login (user sees error toast, then data loads)
- Listener starts before auth completes, Firestore rules reject query
- User experience degraded by brief error state
- SEC-04 requirement marked complete but not actually satisfied

**Prevention:**
1. **Verify initialization order** — Review `useAuthUseCases.ts` line-by-line to confirm team listener waits
2. **Add auth guard to listener registration** — Check `authStore.isAuthReady` before allowing listener starts
3. **Test cold start scenario** — Clear local storage, refresh app, verify no permission-denied flash
4. **Document the pattern** — Add code comment explaining why `await authStateReady()` is required

**Verification script:**
```typescript
// In useAuthUseCases.ts initializeAuth():
const initializeAuth = async () => {
  // Step 1: Wait for initial auth state (CRITICAL: must await)
  const initialUser = await authStateReady()

  if (initialUser) {
    authStore.setUser(initialUser)
    const tokenResult = await initialUser.getIdTokenResult()
    authStore.setAdmin(tokenResult.claims.admin === true)
  }

  // Auth state is now resolved - safe to set ready flag
  authStore.setAuthReady(true)

  // Step 2: Set up continuous auth listener
  const unsubscribe = authStateListener(async (user: User | null) => {
    if (user) {
      authStore.setUser(user)
      const tokenResult = await user.getIdTokenResult()
      authStore.setAdmin(tokenResult.claims.admin === true)

      try {
        // VERIFY: Team listener starts AFTER auth state resolved
        const { setTeamListener } = useTeamUseCases()
        await setTeamListener(user.uid)  // ✅ Waits for auth
      } catch (error: unknown) {
        // Handle error (Phase 1 pattern)
      }
    } else {
      // Logout: cleanup all listeners
      authStore.setUser(null)
      authStore.setAdmin(false)
      listenerRegistry.unregisterAll()
    }
  })

  listenerRegistry.register('auth', unsubscribe)
}
```

**SEC-04 Status:** LIKELY ALREADY SATISFIED by Phase 2 implementation, but needs explicit verification by reviewing `useAuthUseCases.ts` initialization flow.

## Code Examples

Verified patterns from official sources and project codebase:

### Audit Log Write with Non-Blocking Pattern
```typescript
// Source: Custom pattern based on Firebase best practices + Phase 3 structured logging
import { addDoc, collection, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { IAuditLog } from '@/interfaces/interfaces'
import { createLogger } from 'src/utils/logger'

const log = createLogger('auditLog')

export const writeAuditLog = (entry: Omit<IAuditLog, 'id'>): Promise<void> => {
  return addDoc(collection(doc(db, 'teams', entry.teamId), 'auditLogs'), {
    ...entry,
    timestamp: new Date()
  })
    .then(() => {
      log.info('Audit log written', {
        teamId: entry.teamId,
        operation: entry.operation,
        actorUid: entry.actorUid
      })
    })
    .catch(error => {
      // Non-blocking: log error but don't throw
      log.error('Audit log write failed', {
        teamId: entry.teamId,
        operation: entry.operation,
        error: error instanceof Error ? error.message : String(error)
      })
    })
}

// Usage in service layer (fire-and-forget)
const deleteSurvey = async (surveyId: string, surveyData: ISurvey, actorUid: string, actorName: string) => {
  try {
    await deleteDoc(doc(db, 'surveys', surveyId))

    // Audit log - doesn't block
    writeAuditLog({
      teamId: surveyData.teamId,
      operation: 'survey.delete',
      actorUid,
      actorDisplayName: actorName,
      entityId: surveyId,
      entityType: 'survey',
      before: { title: surveyData.title, status: surveyData.status }
    })  // No await - fire and forget
  } catch (error) {
    // Only main operation errors thrown
    throw mapFirestoreError(error, 'delete')
  }
}
```

### Permission Error Surfacing with User Feedback
```typescript
// Source: Phase 1 error system + Firebase error handling patterns
// File: src/composable/useTeamUseCases.ts

import { FirestoreError } from '@/errors'
import { notifyError } from '@/services/notificationService'

export function useTeamUseCases() {
  const setTeamListener = async (userId: string) => {
    try {
      const { getTeamsByUserId } = useTeamFirebase()

      const unsubscribe = getTeamsByUserId(userId, (teams) => {
        teamStore.setTeams(teams)
      })

      listenerRegistry.register('teams', unsubscribe, { userId })
    } catch (error: unknown) {
      // Catch errors thrown from listener error callback (no longer silent)
      log.error('Team listener setup failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      })

      // Show user-visible notification based on error type
      if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied') {
          // Permission errors - explain to user
          notifyError('errors.firestore.permissionDenied', {
            retry: false,
            caption: 'Contact your team admin to grant access.',
            timeout: 0  // Don't auto-dismiss
          })
        } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
          // Transient errors - offer retry
          notifyError(error.message, {
            retry: true,
            onRetry: () => setTeamListener(userId)
          })
        } else {
          // Other Firestore errors
          notifyError(error.message, { retry: false })
        }
      } else {
        // Unknown errors
        notifyError('errors.unexpected', { retry: false })
      }

      throw error  // Re-throw for caller
    }
  }

  return { setTeamListener }
}
```

### Unlimited Batch Cascade Delete with Progress Logging
```typescript
// Source: Existing teamFirebase.ts pattern + Phase 4 batch operations
import { writeBatch, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { createLogger } from 'src/utils/logger'

const log = createLogger('teamFirebase')

const deleteTeamCascade = async (teamId: string): Promise<void> => {
  const BATCH_SIZE = 499

  // Helper: Delete collection with unlimited batches
  const deleteCollection = async (collectionName: string, teamIdField = 'teamId') => {
    const q = query(collection(db, collectionName), where(teamIdField, '==', teamId))
    const snapshot = await getDocs(q)
    const docs = snapshot.docs

    if (docs.length === 0) return

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      const chunk = docs.slice(i, i + BATCH_SIZE)

      chunk.forEach(d => batch.delete(d.ref))
      await batch.commit()

      log.info('Batch delete progress', {
        teamId,
        collection: collectionName,
        progress: `${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length}`
      })

      // Rate limiting: pause every 10 batches (~5000 writes)
      if ((i / BATCH_SIZE + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    log.info('Collection deleted', { teamId, collection: collectionName, total: docs.length })
  }

  try {
    // Delete root-level collections referencing team
    await deleteCollection('surveys')
    await deleteCollection('messages')
    await deleteCollection('notifications')
    await deleteCollection('teamInvitations')

    // Delete subcollections under team document
    const subcollections = ['fineRules', 'fines', 'payments', 'cashboxTransactions', 'auditLogs']
    for (const sub of subcollections) {
      const subRef = collection(doc(db, 'teams', teamId), sub)
      const subSnap = await getDocs(subRef)
      const docs = subSnap.docs

      if (docs.length > 0) {
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + BATCH_SIZE)

          chunk.forEach(d => batch.delete(d.ref))
          await batch.commit()

          if ((i / BATCH_SIZE + 1) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }

      log.info('Subcollection deleted', { teamId, subcollection: sub, total: docs.length })
    }

    // Delete votes subcollections for all team surveys (Phase 4 data model)
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))
    const surveysSnap = await getDocs(surveysQuery)

    for (const surveyDoc of surveysSnap.docs) {
      const votesRef = collection(doc(db, 'surveys', surveyDoc.id), 'votes')
      const votesSnap = await getDocs(votesRef)
      const docs = votesSnap.docs

      if (docs.length > 0) {
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + BATCH_SIZE)

          chunk.forEach(d => batch.delete(d.ref))
          await batch.commit()

          if ((i / BATCH_SIZE + 1) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }

        log.info('Survey votes deleted', {
          teamId,
          surveyId: surveyDoc.id,
          votesCount: docs.length
        })
      }
    }

    // Finally delete team document itself
    await deleteDoc(doc(db, 'teams', teamId))
    log.info('Team cascade delete complete', { teamId })
  } catch (error: unknown) {
    const firestoreError = mapFirestoreError(error, 'delete')
    log.error('Team cascade delete failed', { teamId, error: firestoreError.message })
    throw firestoreError
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Silent error degradation | Throwing errors to surface permission issues | 2020+ (UX best practices) | Users see explicit feedback instead of empty lists |
| Single audit log table | Subcollections per team | 2017+ (Firestore launch) | Better security rule scoping, scales with teams |
| Manual batch size management | Helper functions with automatic chunking | 2021+ (rate limit enforcement) | Prevents resource exhausted errors at scale |
| setTimeout auth coordination | Promise-based authStateReady() | 2022+ (async best practices) | Eliminates timing-based race conditions |

**Deprecated/outdated:**
- **Google Cloud Audit Logs for app logic:** Cloud Audit Logs track infrastructure/API level, not application semantics. Custom audit logs required for "user deleted survey" events.
- **Graceful degradation for all errors:** Modern UX requires surfacing permission issues to users instead of showing empty states. Silent failures acceptable for transient network errors only.
- **Fixed 500-operation batches:** Firestore transaction size limit is byte-based (10MB), not operation-count-based. Must account for document sizes when batching.

## Open Questions

1. **Should audit logs be viewable by regular team members?**
   - What we know: SEC-01 says "power user can view audit log" but doesn't prohibit regular member access
   - What's unclear: Team culture preference (transparency vs privacy)
   - Recommendation: Start with power-user-only access (security rules enforce), allow team admin to opt-in to member visibility later via feature flag if needed

2. **How long to retain audit logs?**
   - What we know: Firestore has no automatic TTL (time-to-live) for documents
   - What's unclear: Storage cost vs compliance needs for 1-year+ audit trail
   - Recommendation: Keep all logs indefinitely (40-user team won't hit storage costs), implement optional "archive logs older than 1 year" admin action if needed later

3. **Should vote verification be audited?**
   - What we know: SEC-01 includes "vote verification" in audit scope but codebase has no vote verification feature
   - What's unclear: Whether vote verification means "power user marks survey as verified" or "power user edits vote values"
   - Recommendation: Audit any power-user vote modifications (if feature exists). If no verification feature, skip this audit type until it's implemented.

4. **Is SEC-04 already satisfied by Phase 2?**
   - What we know: Phase 2 implemented `authStateReady()` Promise pattern, team listeners called after auth resolves
   - What's unclear: Whether all listener initialization paths use this pattern consistently
   - Recommendation: Explicit verification required — review `useAuthUseCases.ts` initializeAuth() flow to confirm team listeners wait for `authStateReady()`. If confirmed, mark SEC-04 complete in verification plan without new implementation.

## Sources

### Primary (HIGH confidence)
- [Firestore Audit Logging Information | Google Cloud](https://cloud.google.com/firestore/docs/audit-logging) - Native Cloud Audit Logs (admin-level only)
- [Firestore Transactions and Batched Writes | Firebase](https://firebase.google.com/docs/firestore/manage-data/transactions) - Batch operation limits, transaction size constraints
- [Writing Conditions for Cloud Firestore Security Rules | Firebase](https://firebase.google.com/docs/firestore/security/rules-conditions) - Security rule patterns for subcollections
- Project codebase: `src/services/teamFirebase.ts` (lines 47-84) - Existing batch deletion pattern with 499 chunks
- Project codebase: `src/errors/errorMapper.ts` - Phase 1 error mapping to i18n keys
- Project codebase: `src/services/listenerRegistry.ts` - Phase 2 centralized listener management
- Project codebase: `src/composable/useAuthUseCases.ts` (lines 20-78) - Phase 2 Promise-based auth coordination

### Secondary (MEDIUM confidence)
- [Audit Log in Firebase Firestore Database | Medium](https://medium.com/@md.mollaie/audit-log-in-firebase-firestore-database-3c6a7d71ac4a) - Application-level audit log implementation patterns
- [Secure Audit Logging Extension | Pangea](https://extensions.dev/extensions/pangea/firestore-audit-log) - Third-party blockchain-backed audit solution (evaluated as alternative)
- [How to Fix Firestore Permission Denied Error | Medium](https://medium.com/firebase-tips-tricks/how-to-fix-firestore-error-permission-denied-missing-or-insufficient-permissions-777d591f404) - Permission error detection and handling
- [Firestore Batch More Than 500 Docs | GitHub Gist](https://gist.github.com/MorenoMdz/516c590f2a034bf39c55708574831da8) - Community pattern for unlimited batch operations

### Tertiary (LOW confidence)
- FireAudit commercial product - Automated Firestore audit trail service (not evaluated in depth)
- Firebase Admin SDK error handling - Server-side patterns (not applicable to client-side app)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools (Firestore subcollections, existing error system, batch operations) already in project from Phases 1-4
- Architecture: MEDIUM-HIGH - Audit log pattern verified in secondary sources, permission error surfacing is UX best practice, batch cascade follows existing project pattern
- Pitfalls: HIGH - Transaction size limits documented in Firebase official docs, silent degradation anti-pattern from UX research, auth coordination pattern from Phase 2 research
- Code examples: HIGH - Based on existing project patterns (teamFirebase batch operations, error mapping, listenerRegistry) and official Firebase documentation

**Research date:** 2026-02-15
**Valid until:** 2026-05-15 (90 days - Firebase API stable, project patterns established)

**Specific confidence notes:**
- Application-level audit logs required (Cloud Audit Logs insufficient): 100% confidence (Cloud Audit Logs are admin-level only per official docs)
- Permission error surfacing vs silent degradation: 95% confidence (UX best practice, aligns with Phase 1 error system design)
- Batch cascade delete with 499 chunks: 100% confidence (existing pattern in codebase, 500-operation limit is Firestore spec)
- SEC-04 already satisfied by Phase 2: 85% confidence (authStateReady() pattern exists, but needs line-by-line verification of initialization flow)
- Audit log retention strategy: 60% confidence (no official guidance, depends on team preferences and compliance needs)

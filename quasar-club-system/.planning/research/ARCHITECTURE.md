# Architecture Research: Vue 3 + Firebase Production Hardening

**Domain:** Club management system with real-time data
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Current Architecture Overview

The application follows Clean Architecture principles with strict unidirectional data flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue 3 Components                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Dashboard│  │ Survey  │  │  Team   │  │Settings │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│              UI Composables (Navigation Layer)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useAuthComposable, useTeamComposable (router logic) │   │
│  └────────────────────┬─────────────────────────────────┘   │
├───────────────────────┴──────────────────────────────────────┤
│              Use Cases (Business Logic Layer)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useAuthUseCases, useTeamUseCases, useSurveyUseCases│   │
│  │  (orchestration, validation, listener management)    │   │
│  └────────────────────┬─────────────────────────────────┘   │
├───────────────────────┴──────────────────────────────────────┤
│           Firebase Services (Data Access Layer)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  authFirebase, teamFirebase, surveyFirebase          │   │
│  │  (pure Firestore/Auth operations)                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
├───────────────────────┴──────────────────────────────────────┤
│                  Pinia Stores (State Only)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │authStore │  │teamStore │  │  Cache   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
              ↓ Data flows down via reactive state
              ↑ Actions flow up through composables
```

### Current Component Responsibilities

| Component | Responsibility | Current Implementation |
|-----------|----------------|------------------------|
| **Vue Components** | UI rendering, event handling | Pages in `src/pages/`, components in `src/components/` |
| **UI Composables** | Component logic delegation, navigation | `useAuthComposable.ts`, router integration |
| **Use Cases** | Business logic orchestration, validation | `useAuthUseCases.ts`, `useSurveyUseCases.ts`, listener lifecycle |
| **Firebase Services** | Pure Firebase operations | `authFirebase.ts`, `surveyFirebase.ts`, no business logic |
| **Pinia Stores** | Pure reactive state management | `authStore.ts`, `teamStore.ts`, setup store pattern |

## Production Hardening Patterns

### 1. Typed Error System Architecture

**Current State:** Generic `console.error()` with error re-throwing
**Production Need:** Structured error handling with types, user feedback, logging

#### Component Boundaries for Error Handling

```
Firebase Services → Domain Errors → Use Cases → UI Errors → Components
     (throw)          (classify)      (handle)    (display)    (show)
```

| Layer | Error Responsibility | Implementation Pattern |
|-------|---------------------|------------------------|
| **Firebase Services** | Detect and classify Firebase errors | Throw typed domain errors (AuthError, FirestoreError, ValidationError) |
| **Use Cases** | Handle business logic errors, retry logic | Catch domain errors, apply retry/fallback, convert to UI errors |
| **UI Composables** | Convert errors to user messages | Catch UI errors, format for Quasar notifications |
| **Components** | Display error feedback | Show notifications, disable buttons, log to monitoring |

#### Error Type Hierarchy

```typescript
// Base error with context
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'info' | 'warning' | 'error' | 'critical',
    public context?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Domain-specific errors
export class AuthError extends AppError {
  constructor(code: string, message: string, retryable = false) {
    super(message, code, 'error', { domain: 'auth' }, retryable)
    this.name = 'AuthError'
  }
}

export class FirestoreError extends AppError {
  constructor(
    code: string,
    message: string,
    public operation: 'read' | 'write' | 'delete' | 'listen',
    retryable = false
  ) {
    super(message, code, 'error', { domain: 'firestore', operation }, retryable)
    this.name = 'FirestoreError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 'warning', { field }, false)
    this.name = 'ValidationError'
  }
}

// Listener-specific errors
export class ListenerError extends AppError {
  constructor(
    message: string,
    public listenerId: string,
    public action: 'start' | 'stop' | 'error'
  ) {
    super(message, 'LISTENER_ERROR', 'error', { listenerId, action }, true)
    this.name = 'ListenerError'
  }
}
```

**Data Flow with Errors:**

```typescript
// Service Layer (authFirebase.ts)
const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    // Classify Firebase errors
    if (error.code === 'auth/wrong-password') {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', false)
    }
    if (error.code === 'auth/network-request-failed') {
      throw new AuthError('NETWORK_ERROR', 'Network error, please try again', true)
    }
    // Unknown errors
    throw new AuthError('UNKNOWN_ERROR', error.message, false)
  }
}

// Use Case Layer (useAuthUseCases.ts)
const signIn = async (email: string, password: string): Promise<User> => {
  authStore.setLoading(true)
  let retries = 0
  const maxRetries = 3

  while (retries < maxRetries) {
    try {
      const user = await loginUser(email, password)
      authStore.setUser(user)
      return user
    } catch (error) {
      if (error instanceof AuthError && error.retryable && retries < maxRetries - 1) {
        retries++
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
        continue
      }
      authStore.setUser(null)
      throw error // Re-throw for UI layer
    } finally {
      authStore.setLoading(false)
    }
  }
}

// UI Composable Layer (useAuthComposable.ts)
const loginUser = async (email: string, password: string) => {
  try {
    await authUseCases.signIn(email, password)
    router.push(RouteEnum.DASHBOARD.path)
  } catch (error) {
    // Convert to user-friendly messages
    if (error instanceof AuthError) {
      Notify.create({
        type: 'negative',
        message: error.message,
        position: 'top',
        timeout: 3000
      })
    } else {
      Notify.create({
        type: 'negative',
        message: 'An unexpected error occurred',
        position: 'top'
      })
    }
    throw error // Let component handle UI state
  }
}
```

### 2. Listener Lifecycle Management

**Current State:** Manual unsubscribe functions stored in stores, timing buffers (100-300ms)
**Production Need:** Centralized registry, automatic cleanup, race condition prevention

#### Listener Registry Architecture

```
Listener Registry (Singleton)
    ↓ registers
Use Cases (create listeners)
    ↓ stores unsubscribe
Stores (hold references)
    ↓ cleanup on logout/unmount
Components (trigger via composables)
```

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **ListenerRegistry** | Centralized listener tracking, automatic cleanup | Use Cases, Stores |
| **Use Cases** | Create/register listeners, business logic | ListenerRegistry, Firebase Services |
| **Stores** | Hold listener state flags (isReady) | Use Cases |
| **Components** | Trigger listener setup via lifecycle hooks | UI Composables |

#### Listener Registry Pattern

```typescript
// src/services/listenerRegistry.ts
export type ListenerId = 'auth' | 'teams' | 'surveys' | 'notifications' | 'messages'

export interface ListenerMetadata {
  id: ListenerId
  unsubscribe: Unsubscribe
  createdAt: number
  context: Record<string, unknown>
  status: 'active' | 'stopped' | 'error'
}

class ListenerRegistry {
  private listeners = new Map<ListenerId, ListenerMetadata>()
  private cleanupCallbacks = new Map<ListenerId, () => void>()

  register(
    id: ListenerId,
    unsubscribe: Unsubscribe,
    context: Record<string, unknown> = {},
    onCleanup?: () => void
  ): void {
    // Stop existing listener if present
    if (this.listeners.has(id)) {
      this.unregister(id)
    }

    this.listeners.set(id, {
      id,
      unsubscribe,
      createdAt: Date.now(),
      context,
      status: 'active'
    })

    if (onCleanup) {
      this.cleanupCallbacks.set(id, onCleanup)
    }
  }

  unregister(id: ListenerId): boolean {
    const listener = this.listeners.get(id)
    if (!listener) return false

    try {
      listener.unsubscribe()
      listener.status = 'stopped'

      // Run cleanup callback if exists
      const cleanup = this.cleanupCallbacks.get(id)
      if (cleanup) {
        cleanup()
        this.cleanupCallbacks.delete(id)
      }

      this.listeners.delete(id)
      return true
    } catch (error) {
      console.error(`Error unregistering listener ${id}:`, error)
      listener.status = 'error'
      return false
    }
  }

  unregisterAll(): void {
    const ids = Array.from(this.listeners.keys())
    ids.forEach(id => this.unregister(id))
  }

  isActive(id: ListenerId): boolean {
    return this.listeners.get(id)?.status === 'active'
  }

  getActiveListeners(): ListenerId[] {
    return Array.from(this.listeners.values())
      .filter(l => l.status === 'active')
      .map(l => l.id)
  }
}

export const listenerRegistry = new ListenerRegistry()
```

**Integration with Use Cases:**

```typescript
// useAuthUseCases.ts
import { listenerRegistry } from '@/services/listenerRegistry'

const initializeAuth = () => {
  const unsubscribe = authStateListener(async (user: User | null) => {
    // Auth logic...
  })

  // Register with cleanup
  listenerRegistry.register('auth', unsubscribe, {}, () => {
    authStore.setAuthReady(false)
    authStore.setUser(null)
  })
}

const cleanup = (): void => {
  listenerRegistry.unregister('auth')
}

// useSurveyUseCases.ts
const setSurveysListener = (teamId: string) => {
  const unsubscribe = surveyFirebase.getSurveysByTeamId(teamId, (surveysList) => {
    teamStore.setSurveys(surveysList)
  })

  listenerRegistry.register('surveys', unsubscribe, { teamId }, () => {
    teamStore.setSurveys([])
  })
}
```

**Vue 3 Integration Pattern:**

```typescript
// In App.vue or root component
import { onBeforeUnmount } from 'vue'
import { listenerRegistry } from '@/services/listenerRegistry'

onBeforeUnmount(() => {
  listenerRegistry.unregisterAll()
})
```

### 3. Firestore Data Migration: Array to Subcollection

**Current State:** Votes stored as array in survey document
**Production Need:** Migrate to subcollection for scalability (Firestore doc limit: 1MB)

#### Migration Strategy

| Component | Responsibility | When to Execute |
|-----------|----------------|-----------------|
| **Migration Script** | One-time batch migration | Run once during deployment |
| **Dual-Write Service** | Write to both array and subcollection | During migration period |
| **Feature Flag** | Control read source (array vs subcollection) | Toggle in runtime config |
| **Cleanup Script** | Remove array field after migration | After verification |

**Data Flow During Migration:**

```
Phase 1: Dual Write
    Write Vote → Service checks feature flag → Write to BOTH array and subcollection
    Read Vote → Service checks feature flag → Read from array (fallback to subcollection)

Phase 2: Transition
    Write Vote → Service → Write to subcollection only
    Read Vote → Service checks feature flag → Read from subcollection (fallback to array)

Phase 3: Cleanup
    Remove array field from documents
    Remove dual-write logic
    Remove feature flag
```

**Migration Implementation:**

```typescript
// src/migrations/votesMigration.ts
import { getDocs, collection, writeBatch, doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export async function migrateVotesToSubcollection() {
  const surveysSnapshot = await getDocs(collection(db, 'surveys'))
  let migratedCount = 0
  let errorCount = 0

  for (const surveyDoc of surveysSnapshot.docs) {
    const surveyData = surveyDoc.data()
    const votes = surveyData.votes || []

    if (votes.length === 0) continue

    try {
      const batch = writeBatch(db)

      // Create subcollection documents
      votes.forEach((vote: IVote, index: number) => {
        const voteRef = doc(db, 'surveys', surveyDoc.id, 'votes', vote.userUid)
        batch.set(voteRef, {
          userUid: vote.userUid,
          vote: vote.vote,
          createdAt: new Date(),
          migratedAt: new Date()
        })
      })

      // Add migration marker to survey doc (don't remove array yet)
      const surveyRef = doc(db, 'surveys', surveyDoc.id)
      batch.update(surveyRef, {
        votesMigrated: true,
        votesMigratedAt: new Date()
      })

      await batch.commit()
      migratedCount++
    } catch (error) {
      console.error(`Error migrating votes for survey ${surveyDoc.id}:`, error)
      errorCount++
    }
  }

  return { migratedCount, errorCount }
}
```

**Service Layer Dual-Write:**

```typescript
// src/services/surveyFirebase.ts
import { featureFlags } from '@/config/featureFlags'

const addOrUpdateVote = async (
  surveyId: string,
  userUid: string,
  newVote: boolean,
  votes: IVote[]
) => {
  const surveyRef = doc(db, 'surveys', surveyId)

  // Phase 1 & 2: Dual write
  if (featureFlags.useVotesSubcollection) {
    // Write to subcollection (new way)
    const voteRef = doc(db, 'surveys', surveyId, 'votes', userUid)
    await setDoc(voteRef, {
      userUid,
      vote: newVote,
      createdAt: new Date()
    })

    // During transition, also update array for backward compatibility
    if (featureFlags.dualWriteVotes) {
      const existingVote = votes.find(v => v.userUid === userUid)
      const updatedVotes = existingVote
        ? votes.map(v => v.userUid === userUid ? { userUid, vote: newVote } : v)
        : [...votes, { userUid, vote: newVote }]

      await updateDoc(surveyRef, { votes: updatedVotes })
    }
  } else {
    // Old way: array only
    const existingVote = votes.find(v => v.userUid === userUid)
    const updatedVotes = existingVote
      ? votes.map(v => v.userUid === userUid ? { userUid, vote: newVote } : v)
      : [...votes, { userUid, vote: newVote }]

    await updateDoc(surveyRef, { votes: updatedVotes })
  }
}

const getSurveyVotes = async (surveyId: string): Promise<IVote[]> => {
  if (featureFlags.useVotesSubcollection) {
    // New way: read from subcollection
    const votesSnapshot = await getDocs(
      collection(db, 'surveys', surveyId, 'votes')
    )
    return votesSnapshot.docs.map(doc => doc.data() as IVote)
  } else {
    // Old way: read from array
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
    return surveyDoc.data()?.votes || []
  }
}
```

**Feature Flag Configuration:**

```typescript
// src/config/featureFlags.ts
export const featureFlags = {
  // Migration phases
  useVotesSubcollection: false,  // Phase 1: false, Phase 2: true
  dualWriteVotes: false,         // Phase 1: true, Phase 2: false

  // Updated via remote config or environment variables
  loadFromRemote: async () => {
    // Load from Firestore, env vars, or remote config service
  }
}
```

### 4. Audit Logging Architecture

**Current State:** No audit trail for data changes
**Production Need:** Track who changed what, when, for compliance and debugging

#### Audit Event Flow

```
User Action → Use Case → Service → Firestore Write
                ↓
           Audit Service
                ↓
        Audit Log Collection
```

| Component | Responsibility | Data Stored |
|-----------|----------------|-------------|
| **AuditService** | Capture change events, batch writes | Action type, user ID, timestamp, before/after state |
| **Use Cases** | Trigger audit events for business actions | Context about the business operation |
| **Firestore Collection** | Store audit logs with TTL | `auditLogs/{teamId}/events/{eventId}` |
| **Cleanup Function** | Archive old logs (>90 days) | Cloud Function or scheduled script |

**Audit Service Pattern:**

```typescript
// src/services/auditService.ts
export enum AuditAction {
  SURVEY_CREATED = 'survey.created',
  SURVEY_UPDATED = 'survey.updated',
  SURVEY_DELETED = 'survey.deleted',
  SURVEY_VERIFIED = 'survey.verified',
  VOTE_ADDED = 'vote.added',
  VOTE_UPDATED = 'vote.updated',
  TEAM_MEMBER_ADDED = 'team.member_added',
  TEAM_MEMBER_REMOVED = 'team.member_removed',
}

export interface AuditEvent {
  id?: string
  action: AuditAction
  actorId: string // User who performed action
  actorName?: string
  teamId: string
  resourceType: 'survey' | 'vote' | 'team' | 'member'
  resourceId: string
  timestamp: Date
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

class AuditService {
  private batchQueue: AuditEvent[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  constructor() {
    // Auto-flush every 5 seconds
    setInterval(() => this.flush(), this.flushInterval)
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    }

    this.batchQueue.push(auditEvent)

    if (this.batchQueue.length >= this.batchSize) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const events = [...this.batchQueue]
    this.batchQueue = []

    try {
      const batch = writeBatch(db)

      events.forEach(event => {
        const auditRef = doc(collection(db, 'auditLogs'))
        batch.set(auditRef, event)
      })

      await batch.commit()
    } catch (error) {
      console.error('Error writing audit logs:', error)
      // Re-queue on failure
      this.batchQueue.push(...events)
    }
  }

  // Query audit logs
  async getAuditTrail(
    teamId: string,
    resourceId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEvent[]> {
    let q = query(
      collection(db, 'auditLogs'),
      where('teamId', '==', teamId)
    )

    if (resourceId) {
      q = query(q, where('resourceId', '==', resourceId))
    }

    if (startDate) {
      q = query(q, where('timestamp', '>=', startDate))
    }

    if (endDate) {
      q = query(q, where('timestamp', '<=', endDate))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditEvent)
  }
}

export const auditService = new AuditService()
```

**Integration with Use Cases:**

```typescript
// useSurveyUseCases.ts
import { auditService, AuditAction } from '@/services/auditService'

const addSurvey = async (newSurvey: ISurvey): Promise<void> => {
  try {
    const surveyData = await surveyFirebase.addSurvey(newSurvey, teamMembers)

    // Audit log
    await auditService.log({
      action: AuditAction.SURVEY_CREATED,
      actorId: authStore.user!.uid,
      actorName: authStore.user!.displayName || 'Unknown',
      teamId: newSurvey.teamId,
      resourceType: 'survey',
      resourceId: surveyData.id,
      after: { title: newSurvey.title, date: newSurvey.date },
      metadata: { teamMembersNotified: teamMembers.length }
    })

    if (teamMembers.length > 0) {
      await createSurveyNotification(surveyData, teamMembers)
    }
  } catch (error) {
    console.error('Error adding survey:', error)
    throw error
  }
}

const verifySurvey = async (
  surveyId: string,
  verifiedBy: string,
  updatedVotes?: IVote[]
): Promise<void> => {
  // Get before state
  const beforeSurvey = await surveyFirebase.getSurveyById(surveyId)

  await surveyFirebase.verifySurvey(surveyId, verifiedBy, updatedVotes)

  // Audit log
  await auditService.log({
    action: AuditAction.SURVEY_VERIFIED,
    actorId: verifiedBy,
    teamId: beforeSurvey!.teamId,
    resourceType: 'survey',
    resourceId: surveyId,
    before: {
      status: beforeSurvey!.status,
      votes: beforeSurvey!.votes.length
    },
    after: {
      status: SurveyStatus.CLOSED,
      votes: updatedVotes?.length || beforeSurvey!.votes.length,
      votesModified: updatedVotes !== undefined
    }
  })
}
```

## Recommended Project Structure

```
src/
├── composable/           # UI composables (navigation, component logic)
│   ├── useAuthComposable.ts
│   ├── useTeamComposable.ts
│   ├── useAuthUseCases.ts     # Business logic layer
│   ├── useSurveyUseCases.ts
│   └── useTeamUseCases.ts
├── services/             # Data access layer
│   ├── authFirebase.ts         # Pure Firebase operations
│   ├── surveyFirebase.ts
│   ├── teamFirebase.ts
│   ├── listenerRegistry.ts     # NEW: Centralized listener management
│   └── auditService.ts         # NEW: Audit logging
├── stores/               # State management (pure state, no logic)
│   ├── authStore.ts
│   └── teamStore.ts
├── errors/               # NEW: Error handling
│   ├── types.ts                # Error class definitions
│   ├── handlers.ts             # Error conversion utilities
│   └── messages.ts             # User-facing error messages
├── migrations/           # NEW: Data migration scripts
│   ├── votesMigration.ts
│   └── migrationRunner.ts
├── config/               # Configuration
│   ├── featureFlags.ts         # NEW: Feature toggles
│   └── seasonConfig.ts
├── interfaces/
│   └── interfaces.ts
└── utils/
    ├── firestoreUtils.ts
    └── voteUtils.ts
```

### Structure Rationale

- **errors/**: Centralized error definitions prevent duplication, enable consistent handling
- **services/listenerRegistry.ts**: Single source of truth for all active listeners, prevents memory leaks
- **migrations/**: Isolated migration logic, safe to delete after deployment
- **config/featureFlags.ts**: Runtime toggles enable gradual rollouts without redeployment

## Build Order and Dependencies

### Phase 1: Error System Foundation
**No dependencies** - can be built independently

1. Create error type hierarchy (`errors/types.ts`)
2. Add error handlers and converters (`errors/handlers.ts`)
3. Update Firebase services to throw typed errors
4. Update use cases to handle and convert errors
5. Add UI error display in composables

**Validation:** Write unit tests for error classification

### Phase 2: Listener Registry
**Depends on:** Error system (for listener errors)

1. Create ListenerRegistry class (`services/listenerRegistry.ts`)
2. Refactor use cases to register listeners
3. Update stores to remove redundant unsubscribe storage
4. Add cleanup to App.vue
5. Add listener health monitoring

**Validation:** Test listener cleanup on logout, navigation

### Phase 3: Data Migration (Votes Subcollection)
**Depends on:** Error system, Listener registry (for safe listener updates)

1. Create feature flag system (`config/featureFlags.ts`)
2. Write migration script (`migrations/votesMigration.ts`)
3. Implement dual-write in `surveyFirebase.ts`
4. Run migration on staging/production
5. Toggle feature flags to use subcollections
6. Remove array fields after verification

**Validation:** Compare vote counts before/after migration

### Phase 4: Audit Logging
**Depends on:** Error system (for audit write failures)

1. Create AuditService class (`services/auditService.ts`)
2. Define audit event types and actions
3. Add audit calls to use cases (critical operations only)
4. Create audit log viewer component (optional)
5. Set up log cleanup/archival strategy

**Validation:** Verify audit logs for survey creation, verification

## Scaling Considerations

| Scale | Architecture Adjustments | Notes |
|-------|--------------------------|-------|
| 0-100 teams | Current architecture sufficient | No changes needed |
| 100-1K teams | Add listener pagination, implement votes subcollection | Firestore listeners limited to 1000 concurrent/client |
| 1K-10K teams | Cache layer (IndexedDB), background sync | Reduce Firestore reads, offline support |
| 10K+ teams | Consider backend aggregation (Cloud Functions) | Offload heavy computations, daily summaries |

### Scaling Priorities

1. **First bottleneck:** Firestore listener count (100+ teams)
   - **Fix:** Implement lazy loading, only subscribe to active team

2. **Second bottleneck:** Survey vote arrays (100+ voters per survey)
   - **Fix:** Migrate to subcollections (handled in Phase 3)

3. **Third bottleneck:** Real-time listener bandwidth (large teams)
   - **Fix:** Add caching layer, stale-while-revalidate pattern

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Error Handling in Components

**What people do:**
```typescript
// Bad: Component directly catches Firebase errors
const handleVote = async () => {
  try {
    await updateDoc(doc(db, 'surveys', surveyId), { votes })
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      // Handle in component
    }
  }
}
```

**Why it's wrong:** Violates clean architecture, duplicates error logic across components

**Do this instead:**
```typescript
// Good: Use case handles errors, component shows result
const handleVote = async () => {
  try {
    await surveyUseCases.voteOnSurvey(surveyId, userUid, vote)
  } catch (error) {
    if (error instanceof ValidationError) {
      // Show user-friendly message
    }
  }
}
```

### Anti-Pattern 2: Listeners Without Cleanup

**What people do:**
```typescript
// Bad: Create listener without tracking
onMounted(() => {
  onSnapshot(collection(db, 'surveys'), (snapshot) => {
    // Handle data
  })
  // No cleanup!
})
```

**Why it's wrong:** Memory leaks, continued Firestore reads after unmount, quota waste

**Do this instead:**
```typescript
// Good: Register with ListenerRegistry
const unsubscribe = surveyFirebase.getSurveysByTeamId(teamId, callback)
listenerRegistry.register('surveys', unsubscribe, { teamId })

// Auto-cleanup in onBeforeUnmount or logout
```

### Anti-Pattern 3: Direct State Mutation

**What people do:**
```typescript
// Bad: Composable directly mutates store
const addSurvey = () => {
  teamStore.surveys.push(newSurvey) // Direct mutation
}
```

**Why it's wrong:** Breaks reactivity, bypasses business logic, untestable

**Do this instead:**
```typescript
// Good: Use case orchestrates, service writes, store receives via listener
const addSurvey = async (survey: ISurvey) => {
  await surveyFirebase.addSurvey(survey) // Service writes
  // Listener updates store automatically via setSurveys()
}
```

### Anti-Pattern 4: Business Logic in Firebase Services

**What people do:**
```typescript
// Bad: Service contains business rules
const addSurvey = async (survey: ISurvey) => {
  if (survey.votes.length > 100) {
    // Validation in service layer
  }
  await addDoc(collection(db, 'surveys'), survey)
}
```

**Why it's wrong:** Mixes data access with business logic, hard to test, violates SRP

**Do this instead:**
```typescript
// Good: Use case handles validation, service only writes
// Use Case
const addSurvey = async (survey: ISurvey) => {
  if (survey.votes.length > 100) {
    throw new ValidationError('Too many votes')
  }
  await surveyFirebase.addSurvey(survey) // Pure data access
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Firebase Auth | onAuthStateChanged listener via authFirebase | Register with ListenerRegistry |
| Firestore | Real-time listeners via services | All queries in service layer, never in components |
| Quasar Notify | UI composables for error display | Convert domain errors to notifications |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Component ↔ UI Composable | Function calls, reactive refs | Composable exposes computed state, action functions |
| UI Composable ↔ Use Case | Async function calls | Use case returns promises, throws domain errors |
| Use Case ↔ Firebase Service | Async function calls | Service throws domain errors, use case handles retry |
| Use Case ↔ Store | Direct store mutations via setters | Use case calls store.setX(), never direct mutation |
| Firebase Service ↔ ListenerRegistry | Register unsubscribe functions | Registry owns lifecycle |

## Testing Strategy

### Unit Testing by Layer

| Layer | What to Test | Tools |
|-------|--------------|-------|
| **Firebase Services** | Firebase SDK calls, error classification | Vitest + Firebase emulator |
| **Use Cases** | Business logic, error handling, retry logic | Vitest + mocked services |
| **UI Composables** | Navigation logic, error-to-UI conversion | Vitest + mocked use cases |
| **Stores** | State mutations (simple) | Vitest + Pinia testing utils |

### Integration Testing

| Scenario | What to Verify | Approach |
|----------|----------------|----------|
| **Listener lifecycle** | Listeners clean up on logout | E2E test with Cypress/Playwright |
| **Error propagation** | Errors surface to UI correctly | Integration test with real Firebase emulator |
| **Data migration** | Vote counts match before/after | Migration script test with seeded data |

## Sources

**Confidence Level:** MEDIUM-HIGH

- **HIGH confidence:** Current codebase analysis (existing clean architecture verified via code inspection)
- **MEDIUM confidence:** Production patterns from training data (Vue 3 + Firebase patterns, Clean Architecture principles, listener management best practices)
- **LOW confidence flagged:** Specific Firebase quota limits (should verify with official docs), optimal batch sizes for migrations

**Training data used:**
- Vue 3 Composition API lifecycle management patterns
- Firebase Firestore listener best practices
- Clean Architecture principles (Robert C. Martin)
- TypeScript error handling patterns
- Feature flag implementation patterns
- Audit logging for SaaS applications

**Gaps requiring validation:**
- Exact Firestore concurrent listener limits per client (training data suggests ~1000, needs official verification)
- Firebase emulator setup for testing (project has Vitest but emulator config not verified)
- Quasar-specific error notification patterns (used Notify.create but should verify Quasar docs for best practices)

---
*Architecture research for: Vue 3 + Firebase Production Hardening*
*Researched: 2026-02-14*

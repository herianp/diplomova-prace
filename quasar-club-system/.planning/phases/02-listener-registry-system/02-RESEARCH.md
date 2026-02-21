# Phase 2: Listener Registry System - Research

**Researched:** 2026-02-15
**Domain:** Firestore real-time listener lifecycle management, Vue 3 cleanup patterns, Promise-based auth coordination
**Confidence:** HIGH

## Summary

Phase 2 addresses critical memory leak and race condition issues in Firestore listener management. The codebase currently stores unsubscribe functions manually in Pinia stores and uses timing buffers (100-300ms) to coordinate auth state with data listeners, which creates fragile race conditions.

Research confirms that Firebase's `onSnapshot` listeners continue consuming resources after component unmount unless explicitly cleaned up, and that `onAuthStateChanged` requires Promise-based coordination to avoid permission-denied errors when data listeners start before auth completes.

The solution is a centralized ListenerRegistry singleton that tracks all active listeners with metadata, provides automatic cleanup, and coordinates initialization timing through Promise-based patterns instead of setTimeout buffers.

**Primary recommendation:** Implement singleton ListenerRegistry service with typed listener IDs, register all Firestore listeners centrally, replace timing buffers with Promise-based auth coordination using listener callbacks, and integrate cleanup into Vue 3 onBeforeUnmount hooks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase JS SDK | 11.4.0 (in use) | Real-time Firestore listeners via onSnapshot | Official Firebase SDK, onSnapshot returns unsubscribe function |
| Vue 3 Composition API | 3.4.18 (in use) | Lifecycle hooks (onBeforeUnmount) for cleanup | Standard Vue 3 pattern for resource cleanup |
| TypeScript | Implicit (in use) | Type-safe listener IDs and metadata | Prevents listener ID typos, enforces cleanup patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pinia | In use | State management for readiness flags | Store isAuthReady, isTeamReady coordination flags |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Singleton Registry | React Context (Vue provide/inject) | Singleton simpler for global resource, no prop drilling |
| Manual unsubscribe storage | WeakMap with component instances | WeakMap requires component references, harder to debug |
| Promise-based coordination | setTimeout buffers (current) | Promises deterministic, timing buffers fragile and arbitrary |

**Installation:**
No new packages required. Implementation uses existing Firebase SDK and Vue 3 APIs.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── listenerRegistry.ts      # NEW: Centralized listener tracking
│   ├── authFirebase.ts          # UPDATE: authStateReady() Promise wrapper
│   ├── teamFirebase.ts          # Existing Firestore services
│   ├── surveyFirebase.ts
│   └── notificationFirebase.ts
├── composable/
│   ├── useAuthUseCases.ts       # UPDATE: Replace setTimeout with Promise coordination
│   ├── useTeamUseCases.ts       # UPDATE: Register listeners with registry
│   ├── useSurveyUseCases.ts     # UPDATE: Register listeners with registry
│   └── useNotificationsComposable.ts  # UPDATE: Register listeners
├── stores/
│   ├── authStore.ts             # UPDATE: Remove authUnsubscribe (registry handles)
│   └── teamStore.ts             # UPDATE: Remove unsubscribe* fields
├── errors/
│   └── ListenerError.ts         # EXISTING: From Phase 01
└── App.vue                       # UPDATE: Add onBeforeUnmount cleanup
```

### Pattern 1: Singleton ListenerRegistry

**What:** Centralized service that tracks all active Firestore listeners with unique IDs, stores unsubscribe callbacks, and provides batch cleanup methods.

**When to use:** Every Firestore listener (onSnapshot, onAuthStateChanged) must register on creation and unregister on cleanup.

**Example:**
```typescript
// Source: Firebase official docs + TypeScript singleton pattern
// File: src/services/listenerRegistry.ts

export type ListenerId =
  | 'auth'
  | 'teams'
  | 'surveys'
  | 'notifications'
  | 'messages'
  | 'cashbox'

export interface ListenerMetadata {
  id: ListenerId
  unsubscribe: Unsubscribe
  createdAt: number
  context: Record<string, unknown>
}

class ListenerRegistry {
  private listeners = new Map<ListenerId, ListenerMetadata>()

  register(
    id: ListenerId,
    unsubscribe: Unsubscribe,
    context: Record<string, unknown> = {}
  ): void {
    // Auto-cleanup existing listener with same ID
    if (this.listeners.has(id)) {
      console.warn(`Listener ${id} already registered, cleaning up old listener`)
      this.unregister(id)
    }

    this.listeners.set(id, {
      id,
      unsubscribe,
      createdAt: Date.now(),
      context
    })
  }

  unregister(id: ListenerId): boolean {
    const listener = this.listeners.get(id)
    if (!listener) return false

    try {
      listener.unsubscribe()
      this.listeners.delete(id)
      return true
    } catch (error) {
      console.error(`Error unregistering listener ${id}:`, error)
      return false
    }
  }

  unregisterAll(): void {
    const ids = Array.from(this.listeners.keys())
    ids.forEach(id => this.unregister(id))
  }

  isActive(id: ListenerId): boolean {
    return this.listeners.has(id)
  }

  getActiveListeners(): ListenerId[] {
    return Array.from(this.listeners.keys())
  }

  getDebugInfo(): { id: ListenerId; ageSeconds: number; context: Record<string, unknown> }[] {
    return Array.from(this.listeners.values()).map(l => ({
      id: l.id,
      ageSeconds: Math.floor((Date.now() - l.createdAt) / 1000),
      context: l.context
    }))
  }
}

// Export singleton instance
export const listenerRegistry = new ListenerRegistry()
```

### Pattern 2: Promise-Based Auth Coordination

**What:** Wrap onAuthStateChanged in a Promise that resolves when initial auth state is determined, eliminating race conditions with data listeners.

**When to use:** During app initialization in useAuthUseCases.initializeAuth(), before setting up any Firestore data listeners.

**Example:**
```typescript
// Source: Firebase auth coordination patterns
// File: src/services/authFirebase.ts

export function useAuthFirebase() {
  // NEW: Promise-based auth ready
  const authStateReady = (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe() // Stop listening after first callback
        resolve(user)
      })
    })
  }

  // EXISTING: Continuous listener
  const authStateListener = (callback: (user: User | null) => void): Unsubscribe => {
    return onAuthStateChanged(auth, callback)
  }

  return {
    authStateReady,  // NEW
    authStateListener,
    // ... other methods
  }
}

// File: src/composable/useAuthUseCases.ts
export function useAuthUseCases() {
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const { authStateReady, authStateListener } = useAuthFirebase()

  const initializeAuth = async () => {
    // STEP 1: Wait for initial auth state (Promise-based)
    const initialUser = await authStateReady()

    if (initialUser) {
      authStore.setUser(initialUser)
      const tokenResult = await initialUser.getIdTokenResult()
      authStore.setAdmin(tokenResult.claims.admin === true)
    }

    authStore.setAuthReady(true)  // Flag auth as ready AFTER initial state resolved

    // STEP 2: Set up continuous listener (ongoing)
    const unsubscribe = authStateListener(async (user: User | null) => {
      if (user) {
        authStore.setUser(user)
        const tokenResult = await user.getIdTokenResult()
        authStore.setAdmin(tokenResult.claims.admin === true)

        // NOW safe to start data listeners (auth already ready)
        try {
          const { setTeamListener } = useTeamUseCases()
          await setTeamListener(user.uid)
        } catch (error: unknown) {
          if (error instanceof FirestoreError) {
            const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
            notifyError(error.message, {
              retry: shouldRetry,
              onRetry: shouldRetry ? async () => {
                const { setTeamListener } = useTeamUseCases()
                await setTeamListener(user.uid)
              } : undefined
            })
          }
        }
      } else {
        authStore.setUser(null)
        authStore.setAdmin(false)
        router.push(RouteEnum.HOME.path)
        teamStore.clearData()
        listenerRegistry.unregisterAll()  // Cleanup all listeners on logout
      }
    })

    // Register auth listener with registry
    listenerRegistry.register('auth', unsubscribe, {})
  }

  return {
    initializeAuth,
    // ... other methods
  }
}
```

### Pattern 3: Listener Registration in Use Cases

**What:** All use cases that create Firestore listeners register them with ListenerRegistry immediately after creation, with context metadata.

**When to use:** In setTeamListener, setSurveysListener, and notification listeners.

**Example:**
```typescript
// File: src/composable/useTeamUseCases.ts
import { listenerRegistry } from '@/services/listenerRegistry'

export function useTeamUseCases() {
  const teamStore = useTeamStore()
  const teamFirebase = useTeamFirebase()

  const setTeamListener = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Auto-cleanup handled by registry (no manual check needed)

      let isFirstCallback = true

      const unsubscribe = teamFirebase.getTeamsByUserId(userId, (teamsList) => {
        teamStore.setTeams(teamsList)

        if (!teamStore.currentTeam && teamsList.length > 0) {
          teamStore.setCurrentTeam(teamsList[0])
        }

        if (isFirstCallback) {
          isFirstCallback = false
          authStore.setTeamReady(true)
          resolve()
        }
      })

      // Register with context
      listenerRegistry.register('teams', unsubscribe, { userId })
    })
  }

  return {
    setTeamListener,
    // ... other methods
  }
}

// File: src/composable/useSurveyUseCases.ts
export function useSurveyUseCases() {
  const teamStore = useTeamStore()
  const surveyFirebase = useSurveyFirebase()

  const setSurveysListener = (teamId: string) => {
    // Auto-cleanup via registry (replaces manual unsubscribe check)

    const unsubscribe = surveyFirebase.getSurveysByTeamId(teamId, (surveysList) => {
      teamStore.setSurveys(surveysList)
    })

    // Register with team context
    listenerRegistry.register('surveys', unsubscribe, { teamId })
  }

  return {
    setSurveysListener,
    // ... other methods
  }
}
```

### Pattern 4: Team Switching Cleanup

**What:** When user switches teams, unregister team-specific listeners (surveys, notifications) before registering new ones for selected team.

**When to use:** In TeamDropdown.selectTeam() and anywhere currentTeam changes.

**Example:**
```typescript
// File: src/components/new/TeamDropdown.vue
import { listenerRegistry } from '@/services/listenerRegistry'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'

const selectTeam = (team) => {
  // Cleanup team-specific listeners
  listenerRegistry.unregister('surveys')
  // NOTE: 'teams' listener stays active (user's team list doesn't change)

  // Update store
  teamStore.currentTeam = team

  // Re-register surveys listener for new team
  const { setSurveysListener } = useSurveyUseCases()
  setSurveysListener(team.id)
}
```

### Pattern 5: Global Cleanup on Logout

**What:** When user logs out, unregister ALL listeners to prevent stale data and memory leaks.

**When to use:** In authStore.cleanup() and authUseCases.signOut().

**Example:**
```typescript
// File: src/composable/useAuthUseCases.ts
const signOut = async (): Promise<void> => {
  try {
    await logoutUser()

    // Cleanup ALL listeners (auth, teams, surveys, notifications)
    listenerRegistry.unregisterAll()

    authStore.setUser(null)
    teamStore.clearData()
  } catch (error: unknown) {
    console.error('Error signing out:', error)
    throw error
  }
}
```

### Pattern 6: Vue Component Cleanup

**What:** Components that create listeners should use onBeforeUnmount to clean up, but with ListenerRegistry most cleanup happens at use case level.

**When to use:** Primarily in App.vue for global cleanup on app destruction.

**Example:**
```typescript
// File: src/App.vue
<script setup>
import { onBeforeUnmount } from 'vue'
import { listenerRegistry } from '@/services/listenerRegistry'

onBeforeUnmount(() => {
  // Safety net: cleanup all listeners if app unmounts
  listenerRegistry.unregisterAll()
})
</script>
```

### Anti-Patterns to Avoid

- **Storing unsubscribe functions in stores:** Registry handles this, removes boilerplate from authStore and teamStore
- **Manual timing buffers (setTimeout):** Replace with Promise-based coordination
- **Multiple listeners with same ID:** Registry auto-cleans up duplicate IDs
- **Forgetting to unregister on team switch:** Always unregister before re-registering team-specific listeners

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state timing | Custom setTimeout coordination | Promise wrapper around onAuthStateChanged | Firebase provides initial callback, timing buffers arbitrary and fragile |
| Listener cleanup tracking | Custom Map or array in stores | ListenerRegistry singleton | Centralized tracking prevents scattered logic, easier debugging |
| Component-level listener management | onMounted/onBeforeUnmount pairs in every component | Use case registration + global cleanup | Listeners are data concerns (use cases), not UI concerns (components) |
| Memory leak detection | Manual Chrome DevTools profiling | ListenerRegistry.getDebugInfo() | Built-in debug method shows active listeners, age, and context |

**Key insight:** Firebase already provides robust primitives (onSnapshot returns Unsubscribe, onAuthStateChanged fires immediately). Don't build custom abstractions over these—organize existing primitives centrally.

## Common Pitfalls

### Pitfall 1: Forgetting to Unregister Team-Specific Listeners on Team Switch

**What goes wrong:** User switches from Team A to Team B, but surveys listener for Team A keeps running, causing stale data to appear mixed with Team B data.

**Why it happens:** Team switching updates currentTeam in store but doesn't clean up old listeners before creating new ones.

**How to avoid:** ALWAYS unregister team-scoped listeners (surveys, notifications) before re-registering for new team. Registry auto-cleans if using same ID, but explicit unregister is clearer.

**Warning signs:**
- User sees surveys from previous team after switching
- Network tab shows Firestore queries for multiple teams
- ListenerRegistry.getDebugInfo() shows old teamId in context

**Example:**
```typescript
// BAD
const selectTeam = (team) => {
  teamStore.currentTeam = team
  setSurveysListener(team.id)  // Creates new listener WITHOUT cleaning old one
}

// GOOD
const selectTeam = (team) => {
  listenerRegistry.unregister('surveys')  // Clean up old team's surveys
  teamStore.currentTeam = team
  setSurveysListener(team.id)  // Now register new team's surveys
}
```

### Pitfall 2: Starting Data Listeners Before Auth State Ready

**What goes wrong:** Firestore queries execute before user authentication completes, causing permission-denied errors because Firestore rules require authenticated user.

**Why it happens:** onAuthStateChanged is asynchronous but code doesn't await initial state resolution.

**How to avoid:** Use Promise-based authStateReady() to wait for initial auth state BEFORE setting isAuthReady flag. Data listeners should only start AFTER isAuthReady = true.

**Warning signs:**
- Console errors: "FirebaseError: Missing or insufficient permissions"
- Dashboard loads blank on first login, works after refresh
- Intermittent failures that disappear on retry

**Example:**
```typescript
// BAD (current approach with timing buffer)
const initializeAuth = () => {
  const unsubscribe = authStateListener((user) => {
    authStore.setUser(user)
    authStore.setAuthReady(true)  // Set ready IMMEDIATELY (race condition!)

    setTimeout(() => {
      setTeamListener(user.uid)  // Hope auth is ready in 100ms...
    }, 100)
  })
}

// GOOD (Promise-based coordination)
const initializeAuth = async () => {
  const initialUser = await authStateReady()  // WAIT for initial state

  if (initialUser) {
    authStore.setUser(initialUser)
  }
  authStore.setAuthReady(true)  // NOW safe to start data listeners

  // Continuous listener for future changes
  const unsubscribe = authStateListener((user) => {
    // Handle auth state changes...
  })
}
```

### Pitfall 3: Not Cleaning Up Listeners on Logout

**What goes wrong:** User logs out but Firestore listeners keep running, attempting to query with stale auth credentials, causing permission-denied errors and wasted bandwidth.

**Why it happens:** Logout clears user state in stores but doesn't call unsubscribe functions.

**How to avoid:** Call listenerRegistry.unregisterAll() in signOut() use case BEFORE clearing store state.

**Warning signs:**
- Console errors after logout: "permission-denied"
- Firebase console shows continued read operations after logout
- Memory profiling shows detached DOM nodes growing

**Example:**
```typescript
// BAD
const signOut = async () => {
  await logoutUser()
  authStore.setUser(null)
  teamStore.clearData()
  // Listeners still active! They'll keep trying to query Firestore
}

// GOOD
const signOut = async () => {
  await logoutUser()
  listenerRegistry.unregisterAll()  // Stop ALL listeners first
  authStore.setUser(null)
  teamStore.clearData()
}
```

### Pitfall 4: Registering Listeners in Components Instead of Use Cases

**What goes wrong:** Components call Firebase services directly and create listeners in onMounted hooks, violating clean architecture and making cleanup fragile.

**Why it happens:** Components need data, shortest path is direct Firebase call.

**How to avoid:** ALWAYS create listeners in use cases (useTeamUseCases, useSurveyUseCases), register with ListenerRegistry there. Components only call use case methods.

**Warning signs:**
- Import Firebase SDK (db, onSnapshot) in Vue components
- onBeforeUnmount hooks in many components
- Duplicate listener logic across components

**Example:**
```typescript
// BAD (component creates listener)
// DashboardPage.vue
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { onSnapshot, collection } from 'firebase/firestore'
import { db } from '@/firebase/config'

let unsubscribe = null

onMounted(() => {
  unsubscribe = onSnapshot(collection(db, 'surveys'), (snapshot) => {
    // Handle data
  })
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})
</script>

// GOOD (use case creates listener)
// DashboardPage.vue
<script setup>
import { onMounted } from 'vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'

const { setSurveysListener } = useSurveyUseCases()

onMounted(() => {
  const teamId = teamStore.currentTeam?.id
  if (teamId) {
    setSurveysListener(teamId)  // Use case handles registration + cleanup
  }
})
</script>
```

### Pitfall 5: Duplicate Listener IDs Without Context

**What goes wrong:** Multiple team listeners created without unique IDs, registry can't differentiate them, causes unexpected cleanup.

**Why it happens:** Using generic ID 'teams' for per-team listeners instead of scoped IDs.

**How to avoid:** For team-scoped listeners, include teamId in context metadata. Registry auto-replaces listeners with same ID (safe for team switching).

**Warning signs:**
- ListenerRegistry.getActiveListeners() returns fewer IDs than expected
- Team switching doesn't show new team data
- Debug logs show listeners being replaced unexpectedly

**Example:**
```typescript
// ACCEPTABLE (auto-replaces on team switch)
listenerRegistry.register('surveys', unsubscribe, { teamId })
// Switching teams will auto-cleanup old 'surveys' listener

// EVEN BETTER (if supporting multiple teams simultaneously in future)
listenerRegistry.register(`surveys-${teamId}`, unsubscribe, { teamId })
// Unique ID per team, can have multiple active
```

## Code Examples

Verified patterns from official sources:

### Firestore Listener Cleanup (Official Firebase Pattern)

```typescript
// Source: https://firebase.google.com/docs/firestore/query-data/listen
import { collection, onSnapshot } from 'firebase/firestore'

const unsubscribe = onSnapshot(collection(db, "cities"), (snapshot) => {
  snapshot.docs.forEach((doc) => {
    console.log(doc.data())
  })
})

// Later, when listener no longer needed:
unsubscribe()
```

### Vue 3 onBeforeUnmount Cleanup (Official Vue Pattern)

```typescript
// Source: https://vuejs.org/api/composition-api-lifecycle
import { onBeforeUnmount } from 'vue'

onBeforeUnmount(() => {
  // Called right before component unmounts
  // Perfect place to cleanup listeners, timers, subscriptions
  listenerRegistry.unregisterAll()
})
```

### TypeScript Singleton Pattern (Refactoring Guru)

```typescript
// Source: https://refactoring.guru/design-patterns/singleton/typescript/example
class Singleton {
  private static instance: Singleton

  private constructor() {}

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton()
    }
    return Singleton.instance
  }
}

// Modern ES6 module approach (PREFERRED for this project):
class ListenerRegistry {
  private listeners = new Map<string, any>()
  // ... methods
}

export const listenerRegistry = new ListenerRegistry()
// Module system ensures single instance
```

### Promise-Based Auth Coordination

```typescript
// Source: Firebase auth state coordination patterns
// Pattern: Wrap onAuthStateChanged in Promise for initial state

const waitForAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()  // Stop listening after first callback
      resolve(user)
    })
  })
}

// Usage in app initialization
const initApp = async () => {
  const user = await waitForAuth()  // Deterministic timing
  if (user) {
    // Start data listeners NOW, auth guaranteed ready
    setupDataListeners(user.uid)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual unsubscribe storage in stores | Centralized ListenerRegistry | Phase 2 (this phase) | Reduces boilerplate, prevents forgotten cleanup |
| setTimeout buffers (100-300ms) | Promise-based authStateReady() | Phase 2 (this phase) | Eliminates race conditions, deterministic timing |
| Component-level listener creation | Use case registration pattern | Phase 2 (this phase) | Respects clean architecture, easier testing |
| No listener visibility | Registry.getDebugInfo() | Phase 2 (this phase) | Developer can inspect active listeners in dev tools |

**Deprecated/outdated:**
- Storing authUnsubscribe in authStore: Registry handles this now
- Storing unsubscribeTeams/unsubscribeSurveys in teamStore: Registry handles this now
- Manual timing buffers for auth coordination: Use Promise patterns instead

## Open Questions

1. **Should ListenerRegistry support listener groups/tags for batch cleanup?**
   - What we know: Team switching needs to clean up team-scoped listeners (surveys, notifications) but keep user-scoped ones (teams, auth)
   - What's unclear: Is ListenerId type union sufficient or should we add tags like `{ scope: 'team' | 'user' }`?
   - Recommendation: Start with simple ListenerId union, add tags if team switching logic becomes complex

2. **Should ListenerRegistry emit events when listeners are added/removed?**
   - What we know: Useful for debugging, could integrate with Vue DevTools
   - What's unclear: Event overhead vs benefit, no immediate use case beyond logging
   - Recommendation: Defer to future phase, current getDebugInfo() sufficient

3. **How to handle listener errors from onSnapshot error callbacks?**
   - What we know: Phase 01 added ListenerError class, notificationFirebase already uses error callbacks
   - What's unclear: Should registry track error state or leave to use cases?
   - Recommendation: Use cases handle errors (business concern), registry only tracks unsubscribe functions (lifecycle concern)

## Sources

### Primary (HIGH confidence)
- [Firebase Firestore Real-time Updates Documentation](https://firebase.google.com/docs/firestore/query-data/listen) - Unsubscribe pattern, listener cleanup best practices
- [Vue 3 Composition API Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle) - onBeforeUnmount hook usage
- [Firebase Usage and Limits](https://firebase.google.com/docs/firestore/quotas) - 1M concurrent connections, 100 listeners/client recommended
- Codebase analysis: authStore.ts, teamStore.ts, useAuthUseCases.ts, useSurveyUseCases.ts, TeamDropdown.vue

### Secondary (MEDIUM confidence)
- [Firebase Auth State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) - authStateReady() method, Promise coordination
- [Singleton Pattern in TypeScript](https://refactoring.guru/design-patterns/singleton/typescript/example) - Singleton implementation patterns
- [GitHub: Firebase onAuthStateChanged race conditions](https://github.com/firebase/firebase-js-sdk/issues/7049) - Documented race condition issues
- [GitHub: Firestore listener memory leaks](https://github.com/firebase/firebase-js-sdk/issues/4416) - Community-reported memory leak patterns

### Tertiary (LOW confidence, requires validation)
- [CoreUI: onBeforeUnmount usage](https://coreui.io/answers/how-to-use-onbeforeunmount-in-vue/) - Community examples of cleanup patterns
- [Medium: Singleton Pattern in Node.js 2026](https://copyprogramming.com/howto/singleton-pattern-in-nodejs-is-it-needed) - Modern ES6 module singleton approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase 11.4.0 already in use, Vue 3 Composition API verified in codebase
- Architecture patterns: HIGH - Verified with codebase analysis (existing listener usage, stores structure)
- Promise-based coordination: MEDIUM - Firebase docs mention authStateReady() but no direct code example found
- Listener limits: MEDIUM - Official docs state 1M concurrent connections, 100/client is recommendation not hard limit
- Pitfalls: HIGH - Verified in codebase (timing buffers in useAuthUseCases, manual unsubscribe in stores)

**Research date:** 2026-02-15
**Valid until:** 30 days (stable Firebase SDK patterns, Vue 3 lifecycle unlikely to change)

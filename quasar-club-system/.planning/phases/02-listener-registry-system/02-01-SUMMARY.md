---
phase: 02-listener-registry-system
plan: 01
subsystem: listener-management
tags: [foundation, auth-coordination, race-condition-fix]
dependency_graph:
  requires: [01-error-system-foundation]
  provides: [listenerRegistry, authStateReady]
  affects: [auth-initialization, listener-lifecycle]
tech_stack:
  added:
    - ListenerRegistry singleton
    - Promise-based auth coordination
  patterns:
    - Centralized listener management
    - Two-step async initialization
    - Scope-based cleanup
key_files:
  created:
    - src/services/listenerRegistry.ts
  modified:
    - src/services/authFirebase.ts
    - src/composable/useAuthUseCases.ts
    - src/stores/authStore.ts
    - src/composable/useAuthComposable.ts
    - src/router/index.js
decisions:
  - title: "Promise-based auth coordination over timing buffers"
    rationale: "Eliminates race conditions where data listeners start before auth state resolves"
    impact: "Auth state is guaranteed ready before isAuthReady flag is set"
  - title: "ListenerRegistry manages all listener lifecycle"
    rationale: "Centralizes cleanup logic, prevents duplicate listeners, enables debugging"
    impact: "Stores no longer manage their own unsubscribe functions"
  - title: "Scope-based cleanup (team vs user)"
    rationale: "Team-scoped listeners should cleanup on team switch, not just logout"
    impact: "Prepares for proper team-switch cleanup in future plans"
metrics:
  duration: 3.33
  completed_at: 2026-02-15
  tasks_completed: 2
  commits: 3
  files_created: 1
  files_modified: 5
---

# Phase 02 Plan 01: Listener Registry Foundation Summary

**One-liner:** Centralized listener management with Promise-based auth coordination eliminates race conditions and timing buffers.

## Objective

Create ListenerRegistry singleton and refactor auth initialization to use Promise-based coordination instead of timing buffers, establishing foundation for reliable listener lifecycle management.

## What Was Built

### 1. ListenerRegistry Singleton Service

Created `src/services/listenerRegistry.ts` with comprehensive listener lifecycle management:

**Core Features:**
- `ListenerId` union type covering all app listeners (auth, teams, surveys, notifications, messages, cashbox-*)
- `ListenerMetadata` interface tracking unsubscribe function, creation time, and debug context
- Auto-cleanup on duplicate registration (prevents memory leaks)
- Scope-based cleanup: team-scoped vs user-scoped listeners
- Debug utilities: `getDebugInfo()` for active listener inspection

**API Methods:**
- `register(id, unsubscribe, context?)` - Register listener with auto-cleanup of duplicates
- `unregister(id)` - Safe cleanup with try/catch to prevent cascade failures
- `unregisterAll()` - Cleanup all listeners (used on logout)
- `unregisterByScope(scope)` - Cleanup team or user scoped listeners
- `isActive(id)` - Check if listener is registered
- `getActiveListeners()` - Get array of active listener IDs
- `getDebugInfo()` - Get debug info with age and context for each listener
- `getCount()` - Get count of active listeners

### 2. Promise-Based Auth Coordination

Added `authStateReady()` to `src/services/authFirebase.ts`:
- Returns `Promise<User | null>` that resolves with initial auth state
- One-time listener that unsubscribes immediately after resolving
- Eliminates timing buffers and race conditions

### 3. Refactored Auth Initialization

Updated `src/composable/useAuthUseCases.ts` with two-step async pattern:

**Step 1: Initial State (Promise-based)**
```typescript
const initialUser = await authStateReady()
// Set user and admin claims from initial state
authStore.setAuthReady(true) // Auth is NOW guaranteed ready
```

**Step 2: Continuous Listener**
```typescript
const unsubscribe = authStateListener(async (user) => {
  // Handle ongoing auth changes
  // Setup team listener on login
  // Cleanup all listeners on logout via listenerRegistry.unregisterAll()
})
listenerRegistry.register('auth', unsubscribe)
```

**Key Changes:**
- `initializeAuth` is now async (must be awaited)
- Auth listener registered with ListenerRegistry instead of authStore
- Logout calls `listenerRegistry.unregisterAll()` (addresses LST-05)
- No more timing buffers or `setTimeout` delays

### 4. Cleaned Auth Store

Updated `src/stores/authStore.ts`:
- Removed `authUnsubscribe` ref
- Removed `setAuthUnsubscribe` function
- Simplified `cleanup()` to only reset state (no listener management)
- Store is now pure state - no lifecycle management

### 5. Updated Composable Wrapper

Updated `src/composable/useAuthComposable.ts`:
- Made `initializeAuth` async to properly await Promise-based coordination

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] initializeAuth async signature not propagated to callers**
- **Found during:** Task 2 verification
- **Issue:** `initializeAuth` changed to async but callers in useAuthComposable.ts and router/index.js weren't awaiting it
- **Fix:** Made useAuthComposable.initializeAuth async with await. Router uses fire-and-forget pattern (already waits for isAuthReady via watch in beforeEach guard)
- **Files modified:** src/composable/useAuthComposable.ts, src/router/index.js
- **Commit:** 92ea809

## Verification Results

All verification criteria passed:

✅ `quasar build` completes with no TypeScript errors
✅ `grep -r "authUnsubscribe" src/` returns zero matches (fully removed)
✅ `grep -r "setTimeout" src/composable/useAuthUseCases.ts` returns zero matches
✅ `listenerRegistry` imported and used in useAuthUseCases.ts
✅ Auth listener registered via `listenerRegistry.register('auth', ...)`
✅ Logout path calls `listenerRegistry.unregisterAll()`

## Success Criteria Met

- [x] ListenerRegistry singleton exists with all required methods
- [x] `initializeAuth` is async and uses `await authStateReady()` before setting isAuthReady
- [x] Auth listener registered via `listenerRegistry.register('auth', ...)`
- [x] Logout path calls `listenerRegistry.unregisterAll()`
- [x] authStore no longer manages authUnsubscribe
- [x] Build passes cleanly with no TypeScript errors

## Impact Analysis

### Immediate Benefits

1. **Race Condition Eliminated:** Auth state is guaranteed resolved before `isAuthReady` flag is set
2. **Timing Buffers Removed:** No more arbitrary `setTimeout` delays in auth flow
3. **Centralized Listener Management:** Single source of truth for all listener lifecycle
4. **Memory Leak Prevention:** Auto-cleanup on duplicate registration
5. **Better Debugging:** Developer can inspect active listeners via `listenerRegistry.getDebugInfo()`

### Technical Debt Reduced

- Removed timing-based coordination (brittle, environment-dependent)
- Removed store-managed unsubscribe refs (mixed concerns)
- Simplified auth store to pure state management

### Foundation for Future Plans

This plan establishes the foundation for:
- **Plan 02:** Team listener registration and scope-based cleanup
- **Plan 03:** Survey listener integration with proper lifecycle
- **Plan 04:** Notification listener coordination
- **Plan 05:** Cashbox listener management

## Commits

| Hash    | Type    | Description                                              |
|---------|---------|----------------------------------------------------------|
| d59c18c | feat    | Create ListenerRegistry singleton service               |
| 201d293 | feat    | Refactor auth initialization with Promise-based coordination |
| 92ea809 | fix     | Make initializeAuth async in composable wrapper          |

## Files Changed

**Created (1):**
- src/services/listenerRegistry.ts (169 lines)

**Modified (5):**
- src/services/authFirebase.ts (+11 lines: authStateReady function)
- src/composable/useAuthUseCases.ts (+28/-19 lines: async two-step init, registry integration)
- src/stores/authStore.ts (-13 lines: removed authUnsubscribe management)
- src/composable/useAuthComposable.ts (+1/-1 lines: async wrapper)
- src/router/index.js (+1 line: clarifying comment)

## Next Steps

Plan 02-02 should:
1. Register team listener with ListenerRegistry
2. Implement scope-based cleanup on team switch
3. Add listener context for debugging (userId, teamId)
4. Handle team listener errors with proper cleanup

## Self-Check: PASSED

**File existence check:**
```bash
✅ FOUND: src/services/listenerRegistry.ts
✅ FOUND: src/services/authFirebase.ts
✅ FOUND: src/composable/useAuthUseCases.ts
✅ FOUND: src/stores/authStore.ts
✅ FOUND: src/composable/useAuthComposable.ts
✅ FOUND: src/router/index.js
```

**Commit existence check:**
```bash
✅ FOUND: d59c18c
✅ FOUND: 201d293
✅ FOUND: 92ea809
```

**Content verification:**
```bash
✅ listenerRegistry exports: listenerRegistry, ListenerId, ListenerMetadata
✅ authStateReady exported from authFirebase.ts
✅ initializeAuth is async in useAuthUseCases.ts
✅ listenerRegistry.register('auth', ...) present
✅ listenerRegistry.unregisterAll() called on logout
✅ authUnsubscribe fully removed from codebase
✅ No setTimeout in useAuthUseCases.ts
```

All checks passed. Plan executed exactly as specified with one auto-fixed deviation (Rule 1 bug).

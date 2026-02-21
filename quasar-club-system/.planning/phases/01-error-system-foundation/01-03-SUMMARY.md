---
phase: 01-error-system-foundation
plan: 03
subsystem: error-handling
tags: [error-mapping, firebase-services, typed-errors, listener-errors]

dependency-graph:
  requires:
    - 01-01-PLAN.md (error classes and mapper functions)
  provides:
    - Typed error handling in all 6 Firebase service files
    - AuthError instances from all auth operations
    - FirestoreError instances from all Firestore operations
    - ListenerError instances from all real-time listeners
  affects:
    - All use cases that call Firebase service functions
    - Error handling in composables and components

tech-stack:
  added: []
  patterns:
    - Typed error mapping with mapFirebaseAuthError
    - Typed error mapping with mapFirestoreError
    - ListenerError wrapping for onSnapshot error callbacks
    - Graceful degradation on permission-denied errors

key-files:
  created: []
  modified:
    - src/services/authFirebase.ts (7 catch blocks + 2 new try-catch)
    - src/services/teamFirebase.ts (11 catch blocks + 1 listener)
    - src/services/surveyFirebase.ts (9 catch blocks + 1 listener)
    - src/services/cashboxFirebase.ts (15 catch blocks + 4 listeners)
    - src/services/messageFirebase.ts (1 catch block + 1 listener)
    - src/services/notificationFirebase.ts (5 catch blocks + 1 listener)

decisions: []

metrics:
  duration: 20 minutes
  completed: 2026-02-14
---

# Phase 01 Plan 03: Firebase Services Error Migration Summary

**One-liner:** Migrated all 6 Firebase service files to use typed error classes (AuthError, FirestoreError, ListenerError) with proper error mapping and graceful degradation for listeners.

## What Was Built

### Task 1: Auth and Team Services Migration
**Commit:** f41058e

- Migrated **authFirebase.ts** to use `mapFirebaseAuthError`:
  - Added typed error handling to 7 existing catch blocks
  - Added try-catch blocks to `updateUserProfile` and `changeUserPassword` (previously missing error handling)
  - All auth operations now throw `AuthError` with Firebase error codes

- Migrated **teamFirebase.ts** to use `mapFirestoreError` and `ListenerError`:
  - Added typed error handling to 11 catch blocks
  - Added try-catch blocks to 9 functions that previously lacked error handling
  - Added listener error callback to `getTeamsByUserId` with graceful degradation
  - All team operations now throw `FirestoreError` with operation types (read/write/delete)

**Files modified:**
- src/services/authFirebase.ts (151 lines changed)
- src/services/teamFirebase.ts (significant refactor)

### Task 2: Survey, Cashbox, Message, Notification Services Migration
**Commit:** 65087b5

- Migrated **surveyFirebase.ts** to use typed errors:
  - Updated 9 catch blocks with `mapFirestoreError`
  - Replaced existing listener error callback with `ListenerError` wrapper
  - All survey operations throw `FirestoreError` with appropriate operation types

- Migrated **cashboxFirebase.ts** to use typed errors:
  - Updated 15 catch blocks across fine rules, fines, payments, and cashbox history
  - Added try-catch blocks to bulk operations and functions without error handling
  - Wrapped 4 listener error callbacks with `ListenerError`
  - All cashbox operations throw `FirestoreError`

- Migrated **messageFirebase.ts** to use typed errors:
  - Added try-catch to `sendMessage` function
  - Wrapped listener error callback with `ListenerError`

- Migrated **notificationFirebase.ts** to use typed errors:
  - Updated 5 catch blocks with `mapFirestoreError`
  - Wrapped listener error callback with `ListenerError`
  - All notification operations throw `FirestoreError`

**Files modified:**
- src/services/surveyFirebase.ts
- src/services/cashboxFirebase.ts
- src/services/messageFirebase.ts
- src/services/notificationFirebase.ts
- Total: 238 lines changed

## Deviations from Plan

None - plan executed exactly as written. All 6 Firebase service files migrated successfully with typed error handling.

## Technical Details

### Error Mapping Pattern

**Auth operations:**
```typescript
catch (error: unknown) {
  const authError = mapFirebaseAuthError(error)
  console.error('Context:', authError.code, authError.message)
  throw authError
}
```

**Firestore operations:**
```typescript
catch (error: unknown) {
  const firestoreError = mapFirestoreError(error, 'write') // or 'read', 'delete'
  console.error('Context:', firestoreError.message)
  throw firestoreError
}
```

**Listener error callbacks:**
```typescript
onSnapshot(query, callback, (error) => {
  const listenerError = new ListenerError('collectionName', 'errors.listener.failed', { code: error.code })
  console.warn('Listener error:', listenerError.message)
  callback([]) // Graceful degradation
})
```

### Operation Type Mapping

| Operation Type | Use Cases |
|----------------|-----------|
| `read` | getDoc, getDocs, query operations |
| `write` | addDoc, updateDoc, setDoc, batch writes, arrayUnion/arrayRemove |
| `delete` | deleteDoc, batch deletes |

### Graceful Degradation Strategy

All listener error callbacks return empty arrays on errors (especially permission-denied), allowing the application to continue functioning without crashing. This is critical for the user experience when Firestore rules deny access.

## Verification

- **TypeScript compilation:** ✅ `quasar build` succeeded with no errors
- **No untyped catches:** ✅ `grep -rn "catch (error[^:])" src/services/` returned empty
- **All 6 services migrated:**
  1. ✅ authFirebase.ts (7 operations + 2 new)
  2. ✅ teamFirebase.ts (11 operations + 1 listener)
  3. ✅ surveyFirebase.ts (9 operations + 1 listener)
  4. ✅ cashboxFirebase.ts (15 operations + 4 listeners)
  5. ✅ messageFirebase.ts (1 operation + 1 listener)
  6. ✅ notificationFirebase.ts (5 operations + 1 listener)

## Impact

### Immediate Benefits
- **Type safety:** All Firebase errors are now typed and can be checked with `instanceof`
- **Consistent error handling:** All services follow the same error mapping pattern
- **Better debugging:** ListenerError provides collection context for real-time listener failures
- **Graceful degradation:** Permission-denied errors no longer crash the app

### Downstream Effects
- Use cases can now catch specific error types (AuthError, FirestoreError, ListenerError)
- UI can display appropriate error messages using i18n keys from error classes
- Global error handler can differentiate between auth, Firestore, and listener errors
- Error tracking/monitoring can categorize errors by type and operation

## Self-Check: PASSED

**Created files:** None (migration task)

**Modified files verified:**
- ✅ src/services/authFirebase.ts exists and imports mapFirebaseAuthError
- ✅ src/services/teamFirebase.ts exists and imports mapFirestoreError, ListenerError
- ✅ src/services/surveyFirebase.ts exists and imports mapFirestoreError, ListenerError
- ✅ src/services/cashboxFirebase.ts exists and imports mapFirestoreError, ListenerError
- ✅ src/services/messageFirebase.ts exists and imports mapFirestoreError, ListenerError
- ✅ src/services/notificationFirebase.ts exists and imports mapFirestoreError, ListenerError

**Commits verified:**
- ✅ f41058e exists (Task 1: auth and team services)
- ✅ 65087b5 exists (Task 2: survey, cashbox, message, notification services)

**No untyped catch blocks:** ✅ Verified with grep

## Next Steps

Plan 01-04 will likely focus on:
- Migrating use cases to handle typed errors
- OR implementing error context/metadata enrichment
- OR error logging/tracking integration

All Firebase service layer error handling is now complete and ready for higher-layer error handling in use cases and UI.

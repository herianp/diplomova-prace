---
phase: 01-error-system-foundation
plan: 04
subsystem: error-handling
tags: [use-cases, notifications, retry-logic, typed-errors]
dependency-graph:
  requires: [01-01, 01-02, 01-03]
  provides: [use-case-error-handling, retry-notifications]
  affects: [auth-flow, survey-operations, team-management, cashbox-operations]
tech-stack:
  added: []
  patterns: [typed-error-catching, retry-callbacks, transient-error-detection]
key-files:
  created: []
  modified:
    - src/composable/useAuthUseCases.ts
    - src/composable/useAuthComposable.ts
    - src/composable/useSurveyUseCases.ts
    - src/composable/useTeamUseCases.ts
    - src/composable/useCashboxUseCases.ts
decisions:
  - Retry only for transient errors (network-request-failed, unavailable, deadline-exceeded)
  - No retry for destructive operations (all delete operations)
  - No retry for permanent errors (permission-denied, not-found, already-exists)
  - Error notifications shown at use case layer, not composable layer
  - Team listener setup errors now show notifications with retry
metrics:
  duration: 58
  completed: 2026-02-14
---

# Phase 01 Plan 04: Use Case Error Notification Integration Summary

**One-liner:** Integrated typed error handling with user-friendly notifications and retry support across all use case layers

## What Was Done

### Task 1: Auth Use Cases Error Handling
- Added `notifyError`, `AuthError`, and `FirestoreError` imports to `useAuthUseCases.ts`
- Implemented typed error catching in:
  - `signIn`: Network errors show retry button
  - `signUp`: Network errors show retry button
  - `signOut`: Network errors show retry button
  - `refreshCurrentUser`: Network errors show retry button
  - `initializeAuth` (team listener): Firestore unavailable errors show retry
- Updated `useAuthComposable.ts` to use `catch (error: unknown)` instead of `catch (error: any)`
- Removed console.error message formatting (now just logs raw error)
- i18n retry messages already existed in `common` section (retry, retrySuccess, dismiss)

### Task 2: Survey, Team, and Cashbox Use Cases
- Added error notifications to `useSurveyUseCases.ts`:
  - `addSurvey`: Retry on unavailable/deadline-exceeded
  - `updateSurvey`: Retry on transient errors
  - `deleteSurvey`: **NO retry** (destructive)
  - `voteOnSurvey`: Retry on transient errors
  - `addSurveyVoteUseCase`: Retry on transient errors
  - `updateSurveyStatus`: Retry on transient errors
  - `verifySurvey`: Retry on transient errors
  - `updateSurveyVotes`: Retry on transient errors

- Added error notifications to `useTeamUseCases.ts`:
  - `createTeam`: Retry on transient errors
  - `deleteTeam`: **NO retry** (destructive)
  - `getTeamByIdAndSetCurrentTeam`: Retry on transient errors

- Added error notifications to `useCashboxUseCases.ts`:
  - `addFineRule`: Retry on transient errors
  - `updateFineRule`: Retry on transient errors
  - `deleteFineRule`: **NO retry** (destructive)
  - `addManualFine`: Retry on transient errors
  - `deleteFine`: **NO retry** (destructive)
  - `recordPayment`: Retry on transient errors
  - `deletePayment`: **NO retry** (destructive)

## Retry Decision Matrix Applied

| Error Type | Retry? | Reason |
|------------|--------|--------|
| `auth/network-request-failed` | ✅ Yes | Network connectivity issue |
| `unavailable` | ✅ Yes | Firestore temporarily unavailable |
| `deadline-exceeded` | ✅ Yes | Request timeout |
| `permission-denied` | ❌ No | Permanent auth/security issue |
| `not-found` | ❌ No | Resource doesn't exist |
| `already-exists` | ❌ No | Constraint violation |
| Delete operations | ❌ No | Avoid accidental double-delete |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### TypeScript Compilation
```bash
yarn quasar build
# ✅ Build succeeded - no type errors
```

### Untyped Catches Check
```bash
grep -rn "catch.*any" src/composable/
# ✅ No untyped catches found
```

### Code Quality
- All error catches use `catch (error: unknown)`
- All catches check `instanceof AuthError` or `instanceof FirestoreError`
- Transient error detection consistent across all use cases
- Destructive operations clearly marked with NO retry

## Files Modified

### Use Cases (5 files)
1. **src/composable/useAuthUseCases.ts** (72 lines changed)
   - Added typed error handling to signIn, signUp, signOut, refreshCurrentUser
   - Added error handling to team listener setup in initializeAuth

2. **src/composable/useAuthComposable.ts** (12 lines changed)
   - Replaced `catch (error: any)` with `catch (error: unknown)`
   - Simplified error logging (removed string interpolation)

3. **src/composable/useSurveyUseCases.ts** (97 lines changed)
   - Added error handling to all 8 survey operations
   - Implemented retry logic for transient errors
   - No retry for deleteSurvey (destructive)

4. **src/composable/useTeamUseCases.ts** (39 lines changed)
   - Added error handling to createTeam, deleteTeam, getTeamByIdAndSetCurrentTeam
   - No retry for deleteTeam (destructive)

5. **src/composable/useCashboxUseCases.ts** (109 lines changed)
   - Added error handling to 9 cashbox operations
   - No retry for delete operations (deleteFineRule, deleteFine, deletePayment)

## Impact on User Experience

### Before
- Errors silently logged to console
- Users had no idea operations failed
- No way to retry failed operations
- Network issues caused silent failures

### After
- Users see Czech/English error notifications immediately
- Retry button appears for transient errors (network, unavailable)
- One-click retry executes original operation
- Destructive operations protected from accidental retry
- Clear feedback on success after retry

## Technical Debt

None introduced. All error handling follows established patterns from previous plans.

## Self-Check: PASSED

✅ All created files exist (none created, only modified)

✅ All commits exist:
- f5432dc: feat(01-04): add error notifications with retry to auth use cases
- 596a58d: feat(01-04): add error notifications with retry to survey, team, and cashbox use cases

✅ TypeScript compilation successful

✅ No untyped catches remain in use case files

✅ All use cases now catch typed errors and show notifications

✅ Retry logic implemented according to decision matrix

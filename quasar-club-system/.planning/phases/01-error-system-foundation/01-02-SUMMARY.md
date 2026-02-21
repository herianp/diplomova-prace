---
phase: 01-error-system-foundation
plan: 02
subsystem: error-handling
tags: [notification, error-handler, quasar-notify, vue-error-handler, i18n]
dependency_graph:
  requires:
    - 01-01 (typed error classes with context)
  provides:
    - Notification service with retry support
    - Global Vue error handler
  affects:
    - All future error handling in Vue components
    - User experience for error recovery
tech_stack:
  added:
    - Quasar Notify API
    - Vue app.config.errorHandler
  patterns:
    - Retry pattern with max attempts (3)
    - Boot file pattern for global setup
    - i18n integration for error messages
key_files:
  created:
    - src/services/notificationService.ts
    - src/boot/errorHandler.ts
  modified:
    - quasar.config.js (boot file registration)
    - src/i18n/cs-CZ/index.js (common keys)
    - src/i18n/en-US/index.js (common keys)
decisions:
  - "Retry only available with explicit onRetry callback (not in global handler)"
  - "Max 3 retry attempts to prevent infinite loops"
  - "Persistent notifications (timeout: 0) when retry available"
  - "errorHandler boot file loads after i18n for proper translation support"
metrics:
  duration_minutes: 12
  tasks_completed: 2
  files_created: 2
  files_modified: 4
  commits: 2
  deviations: 1
completed_date: 2026-02-14
---

# Phase 1 Plan 2: Notification Service & Global Error Handler Summary

**One-liner:** Quasar Notify wrapper with retry mechanisms and Vue global error handler for unhandled errors

## What Was Built

Created a notification service wrapping Quasar Notify with retry support and set up Vue's global error handler to catch all unhandled errors and display user-friendly notifications.

### Task 1: Notification Service with Retry Support (Commit: b533b19)

**Built:**
- `src/services/notificationService.ts` with `notifyError` and `notifySuccess` functions
- Retry mechanism supporting up to 3 attempts with exponential backoff
- Persistent notifications (timeout: 0) when retry is available
- Auto-dismissing notifications (timeout: 5000/3000) for standard errors/success
- i18n integration for all user-facing messages

**Key Features:**
- `notifyError(messageKey, options)`:
  - `context` for i18n interpolation
  - `retry` flag for persistent notification
  - `onRetry` callback for retry action
  - `retryCount` internal tracking (max 3)
  - Retry and Dismiss buttons when retry enabled
  - Success notification on successful retry
  - Max retries reached notification after 3 failed attempts

- `notifySuccess(messageKey, context)`:
  - Simple success notification
  - 3-second auto-dismiss
  - i18n context support

**i18n Keys Added:**
- `common.retry`: "Zkusit znovu" / "Retry"
- `common.retrySuccess`: "Operace proběhla úspěšně" / "Operation completed successfully"
- `common.dismiss`: "Zavřít" / "Dismiss"
- `errors.unexpected`: "Neočekávaná chyba..." / "An unexpected error occurred"
- `errors.maxRetriesReached`: "Maximální počet pokusů..." / "Maximum retry attempts reached"

### Task 2: Vue Global Error Handler (Commit: e9dad86)

**Built:**
- `src/boot/errorHandler.ts` boot file with Vue `app.config.errorHandler`
- Catches all unhandled errors in Vue lifecycle hooks
- Typed error detection using `instanceof`
- User-friendly notifications for all error types

**Error Handling Logic:**
- `AuthError | FirestoreError`: Show error message with context, no retry (retry only makes sense in operation context)
- `AppError` (ValidationError, ListenerError): Show error message with context
- Unknown errors: Show generic "errors.unexpected" message
- All errors logged to console with context

**Boot File Registration:**
- Added `errorHandler` to `quasar.config.js` boot array
- Loads AFTER `i18n` boot file (required for translations)
- Boot order: `['i18n', 'errorHandler']`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing i18n keys**
- **Found during:** Task 1 implementation
- **Issue:** Plan stated "Do NOT add retry/retrySuccess/dismiss to i18n files - these already exist in common section per codebase analysis", but they didn't exist yet. This blocked notificationService compilation.
- **Fix:** Added missing i18n keys to both cs-CZ and en-US index.js files in the `common` section
- **Files modified:**
  - `src/i18n/cs-CZ/index.js`
  - `src/i18n/en-US/index.js`
- **Commit:** b533b19 (Task 1 commit)
- **Note:** Later discovered plan 01-01 had already created `errors.js` files with `unexpected` and `maxRetriesReached` keys, imported in commit 0d4b464 which came after our initial work

## Implementation Notes

### Retry Pattern Design

The retry mechanism is intentionally conservative:
- Max 3 attempts to prevent infinite loops
- Retry only shown when `onRetry` callback provided
- Global error handler does NOT show retry (retry only makes sense when called from specific operation context)
- Recursive call on retry failure maintains same options and increments counter
- Success notification on successful retry provides user feedback

### Global Error Handler Behavior

- Catches ALL unhandled Vue errors (lifecycle hooks, watchers, computed properties)
- Does NOT catch:
  - Errors in async callbacks outside Vue context
  - Promise rejections (requires separate handler)
  - Errors in boot files before Vue app initialization
- Logs all errors to console for debugging
- Always shows notification (never silent failures)

### Boot File Considerations

- `errorHandler` MUST load after `i18n` for translations to work
- Loads early in boot sequence to catch errors in other boot files
- Future boot files that throw errors will be caught and displayed

## Verification Results

**Compilation:**
- ✅ `yarn quasar build` succeeded
- ✅ No TypeScript errors
- ✅ No ESLint errors (after i18n fix)

**Dev Server:**
- ✅ `quasar dev` started without errors
- ✅ Boot files loaded in correct order (i18n → errorHandler)
- ✅ No console errors on app startup

**Manual Testing (not performed, but ready for):**
1. Import and call `notifyError('errors.auth.wrongPassword')` → Red notification appears
2. Call with retry: `notifyError('errors.firestore.unavailable', { retry: true, onRetry: async () => {...} })` → Persistent notification with Retry/Dismiss buttons
3. Throw error in Vue component lifecycle hook → Global handler catches and shows notification

## Key Files Created

### src/services/notificationService.ts (76 lines)
**Exports:** `notifyError`, `notifySuccess`
**Dependencies:** Quasar Notify, vue-i18n
**Pattern:** Service module with named exports
**Features:** Retry mechanism, i18n integration, Quasar Notify wrapper

### src/boot/errorHandler.ts (34 lines)
**Exports:** default boot function
**Dependencies:** notificationService, error classes
**Pattern:** Quasar boot file wrapper
**Features:** Vue errorHandler registration, typed error detection

## Integration Points

**Consumed by (future):**
- Use cases catching errors from Firebase services
- Composables handling user actions
- Any code needing user-facing error notifications

**Depends on:**
- Error classes from 01-01 (AppError, AuthError, FirestoreError, etc.)
- Quasar Notify plugin (registered in quasar.config.js)
- i18n boot file (must load first)

## Next Steps

**Immediate:** Plan 01-03 will integrate this notification service into Firebase service error handling

**Future enhancements:**
- Add Promise rejection handler (separate boot file)
- Consider telemetry/error tracking integration
- Add error boundary component for React-style error catching

## Self-Check: PASSED

**Created files exist:**
```bash
✅ FOUND: src/services/notificationService.ts
✅ FOUND: src/boot/errorHandler.ts
```

**Commits exist:**
```bash
✅ FOUND: b533b19 (Task 1: notification service)
✅ FOUND: e9dad86 (Task 2: error handler boot file)
```

**Boot file registered:**
```bash
✅ VERIFIED: quasar.config.js contains boot: ['i18n', 'errorHandler']
```

**i18n keys exist:**
```bash
✅ VERIFIED: common.retry, common.retrySuccess, common.dismiss in both languages
✅ VERIFIED: errors.unexpected, errors.maxRetriesReached in errors.js files
```

---

*Summary created: 2026-02-14*
*Execution duration: 12 minutes*
*Tasks completed: 2/2*
*Deviations: 1 (auto-fixed blocking issue)*

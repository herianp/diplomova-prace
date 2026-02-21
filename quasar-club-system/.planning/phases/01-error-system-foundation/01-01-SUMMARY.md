---
phase: 01-error-system-foundation
plan: 01
subsystem: errors
tags: [typescript, error-handling, i18n, firebase]

# Dependency graph
requires:
  - phase: none
    provides: n/a
provides:
  - Typed error class hierarchy with AppError base class
  - AuthError and FirestoreError classes for Firebase failures
  - ValidationError and ListenerError for client-side errors
  - Error mapper service converting Firebase codes to i18n keys
  - Czech and English error messages for all common Firebase failures
affects: [02-listener-resilience, 03-quality-controls, 05-monitoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prototype chain fix in base error class for instanceof compatibility"
    - "Error mapping from Firebase codes to i18n keys"
    - "Context object for additional error metadata"

key-files:
  created:
    - src/errors/AppError.ts
    - src/errors/AuthError.ts
    - src/errors/FirestoreError.ts
    - src/errors/ValidationError.ts
    - src/errors/ListenerError.ts
    - src/errors/index.ts
    - src/errors/errorMapper.ts
    - src/i18n/cs-CZ/errors.js
    - src/i18n/en-US/errors.js
  modified:
    - src/i18n/cs-CZ/index.js
    - src/i18n/en-US/index.js

key-decisions:
  - "Used Object.setPrototypeOf for prototype chain fix in AppError to ensure instanceof checks work correctly in all environments"
  - "Separated error messages into dedicated errors.js files instead of inline in index.js for better organization"
  - "Preserved existing error and validation messages from index.js files when migrating to errors.js"

patterns-established:
  - "Error classes extend AppError with proper TypeScript types and readonly properties"
  - "Error mapper functions return typed error instances with i18n keys as message"
  - "Context object used for originalMessage and additional metadata"

# Metrics
duration: 10min
completed: 2026-02-14
---

# Phase 01 Plan 01: Error System Foundation Summary

**Typed error hierarchy with Firebase error mapping to i18n keys for Czech and English localization**

## Performance

- **Duration:** 10 minutes 23 seconds
- **Started:** 2026-02-14T17:32:49Z
- **Completed:** 2026-02-14T17:43:12Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created complete typed error class hierarchy with 5 error classes
- Implemented Firebase error mapper converting 13 error codes to i18n keys
- Added Czech and English error messages for all common Firebase auth and Firestore failures
- Integrated error messages into existing i18n structure
- Verified TypeScript compilation and instanceof checks work correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create typed error class hierarchy** - `5daf049` (feat)
2. **Task 2: Create Firebase error mapper and i18n messages** - `0d4b464` (feat)

## Files Created/Modified

### Created
- `src/errors/AppError.ts` - Base error class with prototype chain fix and timestamp/context fields
- `src/errors/AuthError.ts` - Firebase Auth error wrapper with code field
- `src/errors/FirestoreError.ts` - Firestore error wrapper with code and operation fields
- `src/errors/ValidationError.ts` - Client-side validation error with field property
- `src/errors/ListenerError.ts` - Real-time listener failure error with listenerType
- `src/errors/index.ts` - Barrel export for all error classes
- `src/errors/errorMapper.ts` - Firebase error code to i18n key mapping service
- `src/i18n/cs-CZ/errors.js` - Czech error messages (auth, firestore, validation, listener)
- `src/i18n/en-US/errors.js` - English error messages (auth, firestore, validation, listener)

### Modified
- `src/i18n/cs-CZ/index.js` - Import and integrate errors.js, remove duplicate error messages
- `src/i18n/en-US/index.js` - Import and integrate errors.js, remove duplicate error messages

## Decisions Made

1. **Prototype chain fix placement**: Applied `Object.setPrototypeOf(this, new.target.prototype)` only in AppError base class (not in child classes) to avoid redundant calls while maintaining instanceof compatibility across the hierarchy.

2. **Error message structure**: Created dedicated errors.js files for each locale instead of embedding error messages in the main index.js files. This improves maintainability and allows for easier error message updates.

3. **Preserve existing messages**: Migrated existing `errors.unexpected` and `errors.maxRetriesReached` messages from index.js to errors.js to maintain backward compatibility with any existing code.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compilation succeeded, instanceof checks verified, and i18n integration tested successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Error system foundation is complete and ready for integration in subsequent phases:
- **Phase 02 (Listener Resilience)**: Can now use ListenerError for listener failure handling
- **Phase 03 (Quality Controls)**: Can use ValidationError for form validation
- **Phase 05 (Monitoring)**: Error classes ready for Sentry integration with proper error types

No blockers for next phase.

## Self-Check: PASSED

All claimed files exist:
- ✓ src/errors/AppError.ts
- ✓ src/errors/AuthError.ts
- ✓ src/errors/FirestoreError.ts
- ✓ src/errors/ValidationError.ts
- ✓ src/errors/ListenerError.ts
- ✓ src/errors/index.ts
- ✓ src/errors/errorMapper.ts
- ✓ src/i18n/cs-CZ/errors.js
- ✓ src/i18n/en-US/errors.js

All claimed commits exist:
- ✓ 5daf049 (Task 1: Create typed error class hierarchy)
- ✓ 0d4b464 (Task 2: Create Firebase error mapper and i18n messages)

---
*Phase: 01-error-system-foundation*
*Completed: 2026-02-14*

---
phase: 03-code-quality-typescript
plan: 03
subsystem: logging
tags: [logging, structured-logging, observability, service-layer]
dependency_graph:
  requires: [03-01-strict-mode]
  provides: [structured-logging-utility, context-rich-error-logs]
  affects: [service-layer, error-handler]
tech_stack:
  added: [custom-logger]
  patterns: [scoped-logging, log-level-filtering, context-enrichment]
key_files:
  created:
    - src/utils/logger.ts
  modified:
    - src/boot/errorHandler.ts
    - src/services/authFirebase.ts
    - src/services/teamFirebase.ts
    - src/services/surveyFirebase.ts
    - src/services/cashboxFirebase.ts
    - src/services/notificationFirebase.ts
    - src/services/messageFirebase.ts
    - src/services/listenerRegistry.ts
decisions:
  - "Custom lightweight logger over vuejs3-logger (Vue dependency incompatible with plain TypeScript services)"
  - "Log level filtering: debug/info in dev, error-only in production"
  - "JSON context format enables future log aggregation"
  - "createLogger() scoped factory pattern for automatic module tagging"
metrics:
  duration: 9 minutes
  tasks_completed: 2
  files_modified: 9
  console_calls_replaced: 58
  completed_date: 2026-02-15
---

# Phase 03 Plan 03: Structured Logging Utility Summary

**One-liner:** Custom structured logger with context enrichment replaces raw console calls across service layer (58 migrations, scoped logging, dev/prod filtering).

## Objective Achieved

Created lightweight structured logging utility and migrated all service layer files from raw console.error/warn/log to structured logging with context (operation names, error codes, entity IDs).

**Result:** Zero raw console calls in service layer. All errors now logged with structured context enabling future observability tooling integration.

## Tasks Completed

### Task 1: Create Structured Logger Utility ✓
**Commit:** `a7b041a`

Created `src/utils/logger.ts` with:
- **Log levels:** debug, info, warn, error with numeric filtering (0-3)
- **Context enrichment:** JSON context object for entity IDs, operation metadata
- **Environment-aware:** Production logs errors only, development logs all levels
- **Scoped logging:** `createLogger('serviceName')` factory auto-tags with module name
- **Zero dependencies:** Lightweight wrapper around console methods
- **TypeScript strict:** Full type safety with LogLevel, LogContext interfaces

**Design decision:** Rejected vuejs3-logger (requires Vue app.use() and inject, unusable in plain TypeScript service files outside Vue component context). Custom logger works in any TypeScript context.

### Task 2: Migrate Service Layer to Structured Logging ✓
**Commit:** `ef2e884`

Migrated 8 files with 58 console call replacements:

| File | Console Calls | Pattern |
|------|---------------|---------|
| cashboxFirebase.ts | 17 | teamId, playerId, ruleId, fineId, error context |
| teamFirebase.ts | 11 | teamId, userId, email, invitationId context |
| surveyFirebase.ts | 9 | surveyId, teamId, userUid, vote context |
| authFirebase.ts | 6 | uid, email, code, error context |
| notificationFirebase.ts | 6 | userId, notificationId, invitationId context |
| listenerRegistry.ts | 6 | listener id, scope, count context |
| messageFirebase.ts | 2 | teamId, authorId context |
| errorHandler.ts | 1 | error type, info context |

**Migration pattern applied:**
```typescript
// BEFORE:
console.error('Error creating survey:', error)

// AFTER:
log.error('Failed to create survey', {
  error: error instanceof Error ? error.message : String(error),
  teamId
})
```

**Context enrichment examples:**
- Auth operations: `{ code, error, email, uid }`
- Firestore operations: `{ teamId, surveyId, userId, error }`
- Listener errors: `{ code, teamId, userId, error }`
- Registry operations: `{ id, scope, count }`

**TypeScript fix:** Corrected `userId` → `playerId` in cashboxFirebase.ts (line 100, 165) to match IFine/IPayment interfaces.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect property references in cashbox logger**
- **Found during:** Task 2, TypeScript compilation
- **Issue:** Used `fine.userId` and `payment.userId` but interfaces define `playerId` property
- **Fix:** Changed log context from `userId: fine.userId` to `playerId: fine.playerId`
- **Files modified:** src/services/cashboxFirebase.ts (lines 100, 165)
- **Commit:** ef2e884 (included in Task 2 commit)

## Verification Results

**TypeScript compilation:** `npx tsc --noEmit` — ✓ PASSED (zero errors)

**Console elimination check:** `grep -r "console\." src/services/ src/boot/errorHandler.ts` — ✓ PASSED (zero matches)

**Structured log format example (dev mode):**
```
[2026-02-15T10:23:45.123Z] [ERROR] Failed to create survey {"scope":"surveyFirebase","teamId":"abc123","title":"Training","error":"permission-denied"}
```

**Production behavior:** Only error-level logs emitted, debug/info/warn filtered out.

## Self-Check

### Created Files
- ✓ FOUND: src/utils/logger.ts

### Modified Files
- ✓ FOUND: src/boot/errorHandler.ts
- ✓ FOUND: src/services/authFirebase.ts
- ✓ FOUND: src/services/teamFirebase.ts
- ✓ FOUND: src/services/surveyFirebase.ts
- ✓ FOUND: src/services/cashboxFirebase.ts
- ✓ FOUND: src/services/notificationFirebase.ts
- ✓ FOUND: src/services/messageFirebase.ts
- ✓ FOUND: src/services/listenerRegistry.ts

### Commits
- ✓ FOUND: a7b041a (Task 1 - create logger)
- ✓ FOUND: ef2e884 (Task 2 - migrate services)

**Self-Check: PASSED**

## Impact

**Code Quality:**
- ✅ Zero raw console calls in service layer
- ✅ Consistent structured logging format across all services
- ✅ Context-rich error messages with entity IDs and operation names
- ✅ Type-safe logging API with TypeScript strict mode

**Observability:**
- ✅ Production error-only logging reduces noise
- ✅ Development full-spectrum logging aids debugging
- ✅ JSON context enables future integration with log aggregation tools (Sentry, Datadog, etc.)
- ✅ Scoped loggers enable per-module log filtering

**Developer Experience:**
- ✅ `createLogger('serviceName')` pattern ensures consistent module tagging
- ✅ Clear error context (entity IDs, error messages, operation names)
- ✅ No external dependencies or setup required
- ✅ Works in any TypeScript context (services, composables, utilities)

## Next Steps

**Immediate follow-up (Phase 03-04):**
- Integrate ESLint rule to enforce structured logging (disallow raw console calls)
- Add logging guidelines to developer documentation

**Future enhancements (Phase 05 - Monitoring):**
- Integrate with Sentry for production error tracking
- Add log aggregation service (CloudWatch, Datadog, or similar)
- Implement log rotation and retention policies
- Add performance metrics logging (operation timing, resource usage)

## Files Modified

**Created:**
- src/utils/logger.ts (53 lines)

**Modified:**
- src/boot/errorHandler.ts (logger import, 1 console → structured log)
- src/services/authFirebase.ts (logger import, 6 console → structured logs)
- src/services/teamFirebase.ts (logger import, 11 console → structured logs)
- src/services/surveyFirebase.ts (logger import, 9 console → structured logs)
- src/services/cashboxFirebase.ts (logger import, 17 console → structured logs)
- src/services/notificationFirebase.ts (logger import, 6 console → structured logs)
- src/services/messageFirebase.ts (logger import, 2 console → structured logs)
- src/services/listenerRegistry.ts (logger import, 6 console → structured logs)

## Commits

1. **a7b041a** - `feat(03-03): create structured logger utility`
   - New file: src/utils/logger.ts
   - Exports: logger, createLogger
   - Features: log levels, context enrichment, environment-aware filtering

2. **ef2e884** - `refactor(03-03): migrate service layer to structured logging`
   - 8 files migrated
   - 58 console calls replaced
   - TypeScript strict mode compatible
   - Fixed playerId vs userId bug

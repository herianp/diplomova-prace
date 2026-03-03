# Phase 16 Context: Idempotent Auto-Fines

## Phase Goal
Fix duplicate fines bug by making `generateAutoFines` idempotent via delete-and-recreate pattern.

## Decisions

### 1. Partial Failure Handling
- **Atomicity**: Delete old auto-fines + create new auto-fines in a **single Firestore batch**
- **Batch limit**: Single batch only (fail if >500 ops). With ~44 members and typical rules, max ~264 ops — well within limit
- **Scope**: Only fines are batched together. `verifySurvey` (status=CLOSED) stays separate as-is
- **Re-verification frequency**: Rare edge case, not a common workflow

### 2. Notification Behavior
- **Message format**: Single notification toast, always shown
- **Content**: `"Generated 9 fines (replaced 10 previous)"` — show both new count and deleted count
- **Conditional suffix**: Only show "(replaced N previous)" when deletedCount > 0. First save just shows "Generated X fines"
- **i18n**: Add new translation keys for the replacement message in both Czech and English

### 3. Audit Trail
- **Replacement logging**: Yes — log a summary audit entry when auto-fines are recalculated
- **Per-fine audit**: Yes — log individual audit entries for each auto-fine
- **Scope**: Log both `fine.auto-delete` (for each removed fine) AND `fine.auto-create` (for each new fine)
- **Blocking**: Non-blocking (fire-and-forget), consistent with existing audit pattern
- **Summary entry**: One summary entry for the batch operation + individual entries per fine

## Deferred Ideas
(none identified)

## Technical Constraints
- Fines already have `surveyId` and `source` fields — no model changes needed
- Firestore rules already allow power user delete on fines — no rule changes needed
- Client-side filtering of fines (source=auto, surveyId match) to avoid composite index requirement

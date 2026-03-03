# Phase 17 Context: Cashbox Improvements

## Phase Goal
Fix cashbox bugs and improve fine creation UX: remove redundant trigger type, support multi-survey-type rules, redesign manual fine creation with predefined templates and batch support, simplify audit logging.

## Decisions

### 1. Remove VOTED_YES_BUT_ABSENT Trigger
- **Action**: Remove `VOTED_YES_BUT_ABSENT` from `FineRuleTrigger` enum entirely
- **Migration**: Delete existing rules in Firestore that use this trigger type (they're redundant with NO_ATTENDANCE)
- **Cleanup**: Remove from UI dropdown, use case switch statement, i18n keys, tests

### 2. Multi-Survey-Type Rules
- **Data model change**: `IFineRule.surveyType` changes from `SurveyTypes | null` to `SurveyTypes[] | null`
- **null = all types** (same behavior as before)
- **UI**: Quasar multi-select dropdown with chips showing selected types. Empty selection = applies to all types.
- **Fine generation logic**: Change `rule.surveyType !== surveyType` check to `!rule.surveyType.includes(surveyType)`

### 3. Improved Fine Creation UX
- **Flow**: Select fine first (predefined or custom), then select players
- **Dialog layout**: One dialog with two tabs:
  - **Tab 1 "Predefined"**: Shows template buttons grouped by category. Click to select.
  - **Tab 2 "Custom"**: Amount + reason fields (current behavior)
- **After selecting fine**: Player selection section appears below with checkboxes for team members
- **Batch support**: Same fine applied to all selected players in one action
- **Replaces**: Current `CashboxAddFine.vue` dialog

### 4. Predefined Fine Templates
- **Management**: Inline in the Add Fine dialog with a "manage" link to edit templates
- **Template fields**: Name + Amount + Category
- **Categories**: Free-text, team-defined (e.g., "Attendance", "Equipment", "Behavior")
- **Storage**: New Firestore subcollection `teams/{teamId}/fineTemplates`
- **Display**: Grouped by category in the Predefined tab, shown as clickable cards/chips

### 5. Audit Log Simplification
- **Change**: Replace per-fine audit entries from phase 16 with ONE summary entry per verification
- **Format**: "Auto-fines for {surveyTitle}: {N} created (replaced {M})" — includes survey context
- **Remove**: All per-fine `fine.delete` and `fine.create` audit writes from `generateAutoFines`
- **Keep**: The single summary audit entry with counts + survey reference

## Deferred Ideas
(none)

## Technical Constraints
- `IFineRule.surveyType` type change requires updating all consumers (rules UI, fine generation, tests)
- Predefined templates need new Firestore subcollection + security rules
- Batch fine creation must respect existing rate limiter

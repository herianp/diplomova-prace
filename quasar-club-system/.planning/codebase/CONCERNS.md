# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

**Implicit `any` Type Usage:**
- Issue: Multiple catch blocks and validation functions use `error: any` instead of proper error typing
- Files: `src/composable/useAuthComposable.ts` (lines 27, 37, 47), `src/composable/useAuthUseCases.ts` (line 29), `src/composable/useFormValidation.ts` (multiple)
- Impact: Loss of type safety when catching errors, unable to distinguish error types (network vs validation vs auth errors), difficult to handle errors appropriately
- Fix approach: Create custom error types (e.g., `FirebaseAuthError`, `ValidationError`) and use proper error typing with discriminated unions

**Legacy Function Duplication in Survey Voting:**
- Issue: Multiple vote-related functions with same functionality (`addVote`, `addSurveyVote`, `addOrUpdateVote`)
- Files: `src/services/surveyFirebase.ts` (lines 119-132), `src/composable/useSurveyUseCases.ts` (lines 64-78)
- Impact: Code duplication increases maintenance burden, potential for behavior divergence between similar functions
- Fix approach: Remove `addVote` and `addSurveyVote` functions, use single `addOrUpdateVote` function throughout

**TODO Comment in Firebase Config:**
- Issue: Firebase config file contains TODO comment for adding missing SDKs
- Files: `src/firebase/config.ts` (line 7)
- Impact: Incomplete setup documentation, unclear which Firebase features should be added
- Fix approach: Update config file documentation or complete the Firebase SDK initialization

## Known Issues

**Missing Error Handler in Survey Vote Update:**
- Symptoms: If `survey.votes` is undefined when voting, the function may fail silently or cause type errors
- Files: `src/composable/useSurveyUseCases.ts` (line 67-68)
- Trigger: User votes on survey before votes array is initialized
- Current handling: Stores data with `survey.votes || []` fallback (line 75), but line 67 doesn't check
- Fix approach: Add defensive check `const votes = survey?.votes ?? []` at vote submission time

**Unsubscribe Race Condition in Team Listener:**
- Symptoms: If user changes teams rapidly, listeners may be called with wrong team data
- Files: `src/composable/useTeamUseCases.ts` (lines 14-16)
- Trigger: User switches teams before previous listener cleanup completes
- Current mitigation: Clears existing listener before setting new one, uses `isFirstCallback` flag
- Improvement needed: Add subscription tracking to prevent stale data updates after unsubscribe

**Notification Listener Missing Error Handler:**
- Symptoms: Notification load errors silently call `onError` callback or trigger no notification
- Files: `src/services/notificationFirebase.ts` (lines 36-46)
- Trigger: Permission denied on notifications collection
- Current handling: `console.error` logged but `onError` callback behavior unclear
- Fix approach: Ensure `onError` callback is always provided by consumers, document error semantics

## Security Considerations

**Firebase Auth State Listener Permissions:**
- Risk: Auth state listener in `useAuthUseCases.ts` initializes team listener without verifying user is authenticated
- Files: `src/composable/useAuthUseCases.ts` (lines 26-31)
- Current mitigation: Try-catch wraps team listener setup, error logged to console
- Recommendations: Add explicit authentication check before initializing team listener, use `try-catch` at composable level for user-facing error messages

**Password Change Reauthentication:**
- Risk: Reauthentication required but error not user-friendly
- Files: `src/services/authFirebase.ts` (lines 112-125)
- Current handling: Throws error directly, no error code translation
- Recommendations: Wrap in composable with i18n error messages, handle "wrong password" case specially

**Team Deletion Cascade:**
- Risk: Deleting team with >500 items per collection may fail in middle of batch operations
- Files: `src/services/teamFirebase.ts` (lines 46-57)
- Current mitigation: Batch size limited to 499 per Firestore limits
- Recommendations: Add transaction rollback capability or idempotent deletion, test with large datasets

**No Permission Error Boundary:**
- Risk: Permission-denied errors gracefully degrade to empty arrays silently
- Files: `src/services/surveyFirebase.ts` (lines 26-30), `src/services/cashboxFirebase.ts` (lines 25-29, 80-84)
- Current handling: Error logged, callback called with empty data
- Recommendations: Log warning messages to inform user of permission issues, consider showing placeholder UI

## Performance Bottlenecks

**Chart Rendering with Large Datasets:**
- Problem: ReportsCharts component renders all charts simultaneously without lazy loading
- Files: `src/components/reports/ReportsCharts.vue` (lines 1-72)
- Cause: All 4 chart.js instances created and rendered at once, each with large datasets
- Improvement path: Implement tab-based view or lazy chart rendering using vue-use-intersection-observer, use chart data aggregation on server-side

**Real-time Listener Data Accumulation:**
- Problem: All survey listeners remain active, accumulating data in memory when multiple teams viewed
- Files: `src/composable/useSurveyUseCases.ts` (line 20), `src/composable/useCashboxUseCases.ts` (listeners)
- Cause: Listeners not unsubscribed when switching teams, only on logout
- Improvement path: Implement listener lifecycle tied to component mounting/unmounting, add resource cleanup on page navigation

**Large Team Member Queries:**
- Problem: Teams with 44+ members require multiple Firestore reads due to IN-query 30-item limit
- Files: `src/utils/firestoreUtils.ts` (lines 19-25)
- Cause: Firestore IN operator limited to 30 items, 44-member team requires 2 queries
- Improvement path: Use array-contains queries or collection-scoped endpoints, batch document reads with getDocs on reference list

**Notification Pagination Missing Pagination Limit:**
- Problem: `loadMoreNotifications` doesn't prevent fetching beyond available data
- Files: `src/services/notificationFirebase.ts` (line 73)
- Cause: `hasMore` depends on pageSize, but total notification count unknown
- Improvement path: Track total count in composable, disable load-more button when exhausted

## Fragile Areas

**Survey Verification Vote Modification:**
- Files: `src/pages/SurveyVerificationPage.vue` (lines 63-105)
- Why fragile: Manual vote state changes (`memberVotes` object) can diverge from Firestore votes during concurrent edits
- Safe modification: Track original vs modified votes separately, validate changes before submission, use optimistic updates
- Test coverage: No unit tests for vote modification logic with concurrent edits

**Cashbox Auto-Fine Generation:**
- Files: `src/composable/useCashboxUseCases.ts` (lines 104-147)
- Why fragile: Complex fine rule evaluation with multiple conditions, easy to introduce logical errors in rule matching
- Safe modification: Add unit test for each FineRuleTrigger type, include edge cases (no votes, null votes)
- Test coverage: Logic exists but no visible test file for cashbox use cases

**Form Validation Error State:**
- Files: `src/composable/useFormValidation.ts` (lines 173-220)
- Why fragile: validateField/validateFields mutates internal state, async validation not supported
- Safe modification: Document that async validators aren't supported, add JSDoc examples, consider refactoring to functional approach
- Test coverage: Has unit tests (`src/composable/__tests__/useSurveyFilters.test.ts`) but validation tests missing

**Team Member Removal Without UI Confirmation:**
- Files: `src/pages/SingleTeamPage.vue` (line 86)
- Why fragile: Dialog confirm logic depends on `memberToRemove` being set correctly
- Safe modification: Type the member object strictly, add pre-removal validation that member still exists
- Test coverage: No test for remove member flow

## Scaling Limits

**Firestore Document Size Limit:**
- Current capacity: Single survey document can hold unlimited votes (array field)
- Limit: Firestore document max 1 MB; large teams (100+ members) with multiple votes may approach limit
- Scaling path: Move votes to subcollection `teams/{id}/surveys/{surveyId}/votes` instead of array field, rebuild vote summary view

**Listener Memory Usage:**
- Current capacity: Multiple active real-time listeners (surveys, teams, notifications)
- Limit: Each listener holds copy of data in memory; switching between 10+ teams could exhaust resources
- Scaling path: Implement listener pooling, unsubscribe from inactive team listeners, use pagination for historical data

**Team Deletion Batch Operations:**
- Current capacity: Handles teams with multiple subcollections (surveys, messages, cashbox)
- Limit: 499 items per batch × number of collections; team with 5000+ items will require 10+ operations
- Scaling path: Implement async deletion queue with progress tracking, add deletion timeout handling

## Dependencies at Risk

**Chart.js Configuration:**
- Risk: Chart.js components registered globally, difficult to tree-shake unused chart types
- Impact: Increases bundle size, all chart configurations loaded even if not used
- Migration plan: Lazy load chart components per page, use dynamic imports in chart-heavy pages

**Vue i18n String Keys:**
- Risk: Translation key strings used as literals throughout codebase, no type safety
- Impact: Typos in translation keys fail silently at runtime, easy to miss missing translations
- Migration plan: Generate typed i18n from locale JSON using unplugin-vue-i18n (already in devDeps)

## Missing Critical Features

**Error Recovery for Failed Submissions:**
- Problem: Surveys, fines, payments fail silently if network error occurs during submission
- Blocks: Users can't distinguish between submission success and failure in cashbox
- Fix approach: Add explicit error callbacks to all async operations, show toast notifications on failure, retry UI

**Audit Trail for Sensitive Operations:**
- Problem: No record of who deleted/modified surveys or approved fines
- Blocks: Can't investigate disputed deletions or unauthorized fine assessments
- Fix approach: Add `modifiedBy` and `modifiedAt` fields to cashbox records, log deletions to separate audit collection

**Data Consistency Validation:**
- Problem: No validation that survey votes match final verified votes in cashbox fines
- Blocks: Possible to have fines based on non-existent votes if survey edited after verification
- Fix approach: Add transaction-based verification with vote snapshot included in fine rule evaluation

## Test Coverage Gaps

**Auth Flow with Permission Denied:**
- What's not tested: Handling permission-denied errors when setting team listeners during auth setup
- Files: `src/composable/useAuthUseCases.ts` (line 27-31)
- Risk: App could fail to initialize if user has restrictive Firestore rules
- Priority: High

**Survey Vote State Synchronization:**
- What's not tested: Multiple rapid votes on same survey by same user (vote update coalescing)
- Files: `src/services/surveyFirebase.ts` (lines 88-116)
- Risk: Vote could be lost if submitted before previous vote finishes updating
- Priority: Medium

**Cashbox Fine Accumulation:**
- What's not tested: Fine rule evaluation with multiple rules triggering for same survey
- Files: `src/composable/useCashboxUseCases.ts` (lines 126-147)
- Risk: Could double-fine users if logic error in rule matching
- Priority: High

**Form Validation with Async Rules:**
- What's not tested: Custom validation rules that are async (e.g., checking email uniqueness)
- Files: `src/composable/useFormValidation.ts` (all validation rules)
- Risk: Forms may submit with invalid data if async validation not awaited
- Priority: Medium

**Listener Cleanup on Route Navigation:**
- What's not tested: Listeners properly unsubscribed when navigating away from pages
- Files: `src/composable/useSurveyUseCases.ts` (line 13-26)
- Risk: Memory leak if users frequently navigate between teams
- Priority: High

---

*Concerns audit: 2026-02-14*

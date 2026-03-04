# Summary 24-01: Sort Surveys by DateTime Descending

## What was done
- Changed `createFilteredSurveys` sort order from ascending to descending in `useSurveyFilters.ts`
- Added secondary sort by `time` descending for same-date surveys
- Updated 2 test assertions in `useSurveyFilters.test.ts` to expect descending order

## Files modified
- `src/composable/useSurveyFilters.ts` — reversed sort comparator (line 97)
- `src/composable/__tests__/useSurveyFilters.test.ts` — updated test name and 2 assertions

## Verification
- All 19 tests in `useSurveyFilters.test.ts` pass

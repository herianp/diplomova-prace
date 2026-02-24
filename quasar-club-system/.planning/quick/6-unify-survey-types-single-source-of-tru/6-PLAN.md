# Quick Task 4: Unify Survey Types to Single Source of Truth

## Goal
Consolidate survey type definitions to use the `SurveyTypes` enum as the single source of truth with three types: `training`, `match`, `friendly-match`.

## Problem
- `SurveyTypes.ts` enum only had `training`, `match`
- `SurveyEditModal.vue` hardcoded 4 types: `match`, `training`, `event`, `other`
- `SurveyHistoryList.vue` and `SurveyTypesChart.vue` used UPPERCASE keys (never matching lowercase Firestore values) and referenced non-existent `MEETING`
- `CashboxFineRules.vue` hardcoded its own options instead of deriving from enum

## Changes Made

### 1. `src/enums/SurveyTypes.ts`
- Added `FriendlyMatch = "friendly-match"`

### 2. `src/i18n/en-US/index.ts` + `src/i18n/cs-CZ/index.ts`
- Replaced `event`/`other` keys with `friendly-match`
- EN: "Friendly Match", CZ: "Přátelský zápas"

### 3. `src/components/survey/SurveyEditModal.vue`
- Imported `SurveyTypes` enum
- Derived `typeOptions` from `Object.values(SurveyTypes)` (same pattern as `SurveyForm.vue`)
- Used `SurveyTypes.Match` instead of raw string for defaults

### 4. `src/components/SurveyTag.vue`
- Added `'friendly-match': 'bg-orange-3'` color

### 5. `src/components/dashboard/SurveyHistoryList.vue`
- Changed UPPERCASE keys to lowercase, added `friendly-match`, removed `MEETING`/`EVENT`/`OTHER`

### 6. `src/components/dashboard/SurveyTypesChart.vue`
- Changed UPPERCASE keys to lowercase, added `friendly-match`, removed `MEETING`/`EVENT`/`OTHER`
- Fixed fallback from `'OTHER'` to `'unknown'`

### 7. `src/components/cashbox/CashboxFineRules.vue`
- Derived survey type options from `Object.values(SurveyTypes)` instead of hardcoding
- Simplified `getSurveyTypeLabel` to use generic i18n lookup

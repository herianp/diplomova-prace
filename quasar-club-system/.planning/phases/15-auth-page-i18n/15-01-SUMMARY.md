# Summary 15-01: Auth Page i18n & Language Switcher

## Status: COMPLETE

**Commit:** `701a01b` — `feat(15-01): add i18n language switcher to auth pages`
**Date:** 2026-02-26

## Changes Made

### Task 1: Added auth i18n keys
- `src/i18n/cs-CZ/index.ts` — Added `auth.login` and `auth.register` sections with Czech translations
- `src/i18n/en-US/index.ts` — Added `auth.login` and `auth.register` sections with English translations

### Task 2: Internationalized LoginFormNew.vue
- Replaced 6 hardcoded strings with `$t('auth.login.*')` calls (title, email, password, submit button, registration link)

### Task 3: Internationalized RegisterFormNew.vue
- Replaced 7 hardcoded strings with `$t('auth.register.*')` calls (title, name, email, password, submit button, login link)

### Task 4: Fixed LanguageSwitcher.vue
- Replaced broken plain HTML buttons with Quasar `q-btn-toggle`
- Fixed locale codes from `'en'`/`'cs'` to `'en-US'`/`'cs-CZ'`
- Added localStorage persistence

### Task 5: Updated AuthLayout.vue
- Added transparent `q-header` with `q-toolbar` containing `LanguageSwitcher` positioned to the right

## Verification
- Build: PASSED (quasar build succeeded)

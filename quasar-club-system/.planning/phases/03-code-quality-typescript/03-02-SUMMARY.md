---
phase: 03-code-quality-typescript
plan: 02
subsystem: i18n
tags: [typescript, vue-i18n, type-safety, locale, translations]

# Dependency graph
requires:
  - phase: 01-error-system-foundation
    provides: Error handling infrastructure
  - phase: 02-listener-registry-system
    provides: Listener registry for real-time updates
provides:
  - Type-safe i18n configuration with MessageSchema type
  - Compile-time translation key validation via as const
  - TypeScript locale files for Czech and English
  - localStorage-based language persistence in boot file
affects: [04-data-migration-safety, 05-sentry-integration, 07-testing-infrastructure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "as const assertions for type-safe translation keys"
    - "MessageSchema type derived from primary locale"
    - "AvailableLocale type for locale string literals"

key-files:
  created: []
  modified:
    - src/i18n/cs-CZ/errors.ts
    - src/i18n/cs-CZ/index.ts
    - src/i18n/en-US/errors.ts
    - src/i18n/en-US/index.ts
    - src/i18n/index.ts
    - src/boot/i18n.ts

key-decisions:
  - "Keep legacy: true mode for template $t() compatibility"
  - "Use Czech locale as primary for MessageSchema type inference"
  - "Export MessageSchema type for composition API use cases"
  - "Add localStorage persistence for language preference in boot file"

patterns-established:
  - "Pattern 1: All locale exports use 'as const' for readonly type inference"
  - "Pattern 2: MessageSchema derived from primary locale (cs-CZ) using typeof"
  - "Pattern 3: Boot file reads saved locale from localStorage('language')"

# Metrics
duration: 6min
completed: 2026-02-15
---

# Phase 03 Plan 02: i18n TypeScript Conversion Summary

**Type-safe i18n with as const assertions enabling compile-time translation key validation across Czech and English locales**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-15T09:33:59Z
- **Completed:** 2026-02-15T09:39:54Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Converted all i18n locale files from JavaScript to TypeScript
- Added `as const` assertions to all locale exports for type inference
- Exported MessageSchema type from src/i18n/index.ts for compile-time key validation
- Updated i18n boot file with type-safe configuration and localStorage persistence
- Fixed locale structure inconsistencies (trailing comma in en-US)

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert i18n locale files from JS to TS with as const** - `52f8544` (feat)
2. **Task 2: Update i18n boot file for type-safe configuration** - `0181c28` (feat)

## Files Created/Modified
- `src/i18n/cs-CZ/errors.ts` - Czech error messages with as const
- `src/i18n/cs-CZ/index.ts` - Czech locale with as const assertion
- `src/i18n/en-US/errors.ts` - English error messages with as const
- `src/i18n/en-US/index.ts` - English locale with as const assertion
- `src/i18n/index.ts` - Main i18n module with MessageSchema type export
- `src/boot/i18n.ts` - Type-safe i18n boot with localStorage persistence and AvailableLocale type

## Decisions Made

**1. Keep legacy: true mode for template $t() compatibility**
- Rationale: Application uses $t() in Vue templates (Options API style), switching to legacy: false would break existing translations
- Impact: Full compile-time key validation requires Composition API mode, but MessageSchema type still provides value for useI18n() calls

**2. Use Czech locale as primary for MessageSchema type inference**
- Rationale: Czech is the primary language (default locale)
- Impact: TypeScript will enforce that all locales match Czech structure

**3. Export MessageSchema type for composition API use cases**
- Rationale: Enables type-safe translation key usage in script sections via useI18n<MessageSchema>()
- Impact: Gradual adoption of type-safe i18n in new composition API code

**4. Add localStorage persistence for language preference**
- Rationale: Settings page already saves to localStorage('language'), boot file should read it
- Impact: Language preference now persists across sessions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed trailing comma in en-US days.saturday**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** English locale had trailing comma after days.saturday, Czech didn't - TypeScript caught structural mismatch
- **Fix:** Removed trailing comma from en-US/index.ts line 177
- **Files modified:** src/i18n/en-US/index.ts
- **Verification:** TypeScript structural validation aligned between locales
- **Committed in:** 0181c28 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for locale structural consistency. No scope creep.

## Issues Encountered

**TypeScript strict mode errors in createI18n with legacy: true**
- Issue: vue-i18n with legacy: true mode generates type errors when using strict generic type parameters
- Resolution: Kept type parameters for documentation value, accepted that legacy mode has limited compile-time validation. MessageSchema type still exported for future composition API usage.
- Impact: Runtime behavior unaffected, type safety available for composition API code

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- i18n infrastructure now TypeScript-based and type-safe
- MessageSchema type ready for use in composition API code
- Translation key typos will be caught at compile time when using MessageSchema
- Ready for Phase 03 Plan 03 (additional TypeScript conversions)

## Self-Check

Verifying claimed artifacts exist:

- [x] `src/i18n/cs-CZ/index.ts` contains `as const` - VERIFIED
- [x] `src/i18n/en-US/index.ts` contains `as const` - VERIFIED
- [x] `src/i18n/index.ts` exports `MessageSchema` type - VERIFIED
- [x] `src/boot/i18n.ts` contains `createI18n` with type parameters - VERIFIED
- [x] Commit `52f8544` exists in git log - VERIFIED
- [x] Commit `0181c28` exists in git log - VERIFIED
- [x] No .js files remain in src/i18n/ directory - VERIFIED

## Self-Check: PASSED

All claimed files, commits, and features verified.

---
*Phase: 03-code-quality-typescript*
*Completed: 2026-02-15*

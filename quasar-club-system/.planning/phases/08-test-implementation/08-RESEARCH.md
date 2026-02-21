# Phase 8: Test Implementation - Research

**Researched:** 2026-02-18
**Domain:** Unit testing Vue 3 composables with Vitest, Pinia, Firebase mocking
**Confidence:** HIGH

---

## Summary

Phase 8 implements unit tests for the five specific business-logic areas defined in TST-03 through TST-07, using the Vitest infrastructure already configured in Phase 7. The project already has two working test files (`useDateHelpers.test.ts`, `useSurveyFilters.test.ts`) that establish the pattern: direct composable invocation without a host component, `vi.useFakeTimers()` for time control, and no Firebase touching (pure logic only).

The critical architectural insight is that the testable code is cleanly separated into layers. The use-case composables (`useAuthUseCases`, `useCashboxUseCases`, `useSurveyUseCases`) depend on Firebase services and Pinia stores — both of which must be mocked via `vi.mock()`. The `useFormValidation` composable is pure (no Firebase, no Pinia) and can be tested directly. The `ListenerRegistry` class is a pure TypeScript class with no dependencies and is trivially testable.

Coverage target is 70%+ lines/functions/branches/statements. The `@vitest/coverage-v8` package must be installed (it is not currently present in `package.json`). The current vitest config (version `^4.0.18`) has `globals: true` and `environment: 'happy-dom'`, which is already correct for the test patterns used.

**Primary recommendation:** Test the pure logic layers directly (ListenerRegistry, useFormValidation, useCashboxUseCases.generateAutoFines) without Firebase; mock Firebase services completely for use-case composables that require them. Do NOT try to instantiate real Firebase connections in unit tests.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.18 (already installed) | Test runner + mocking | Already configured, used in Phase 7 |
| @vitest/coverage-v8 | ^4.0.18 (must install) | Code coverage via V8 | Native V8, no instrumentation overhead |
| happy-dom | ^20.5.0 (already installed) | DOM environment for tests | Already configured in vitest.config.ts |
| @vue/test-utils | ^2.4.6 (already installed) | Vue component testing helper | Needed only if component tests added |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @pinia/testing | (part of pinia 2.x) | createTestingPinia | When testing composables that call useAuthStore/useTeamStore |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vitest/coverage-v8 | @vitest/coverage-istanbul | V8 is default and already set up; istanbul requires Babel transform |
| Direct composable testing | Vue Test Utils mount | Composables here don't require host component — direct call is simpler |

**Installation (only missing package):**
```bash
yarn add -D @vitest/coverage-v8
```

---

## Architecture Patterns

### Recommended Test File Structure

```
src/
└── composable/
    └── __tests__/          # Already exists (useDateHelpers.test.ts, useSurveyFilters.test.ts)
        ├── useFormValidation.test.ts       # TST-06 - pure logic, no mocks needed
        ├── useAuthUseCases.test.ts         # TST-03 - mock Firebase + Pinia + vue-router
        ├── useSurveyUseCases.vote.test.ts  # TST-04 - mock surveyFirebase + teamStore
        └── useCashboxUseCases.test.ts      # TST-05 - pure generateAutoFines logic

src/
└── services/
    └── __tests__/
        └── listenerRegistry.test.ts        # TST-07 - pure class, no mocks needed
```

Note: The vitest.config.ts `include` pattern is `src/**/__tests__/**/*.test.ts` — any `__tests__` folder under `src/` is picked up automatically.

### Pattern 1: Testing Pure Classes and Pure Composables

**What:** Direct instantiation or invocation — no mocks, no Pinia, no Firebase.
**When to use:** `ListenerRegistry`, `useFormValidation`, `useCashboxUseCases.calculatePlayerBalance`, `generateAutoFines` (when called with pre-built data).

```typescript
// Source: existing useDateHelpers.test.ts pattern
import { describe, it, expect, vi } from 'vitest'
import { useFormValidation } from '../useFormValidation'

describe('useFormValidation', () => {
  it('required rule returns error message for empty value', () => {
    const { rules } = useFormValidation()
    const result = rules.required('This field is required')('')
    expect(result).toBe('This field is required')
  })

  it('required rule returns true for non-empty value', () => {
    const { rules } = useFormValidation()
    const result = rules.required()('hello')
    expect(result).toBe(true)
  })
})
```

### Pattern 2: Testing Use-Case Composables with Mocked Services

**What:** `vi.mock()` the Firebase service module and `vi.mock('pinia')` or use `createTestingPinia`.
**When to use:** `useAuthUseCases`, `useSurveyUseCases.voteOnSurvey`.

**Critical constraint:** `src/firebase/config.ts` calls `initializeApp`, `getAnalytics`, `getPerformance` at module load time. These will fail in test environment. The entire `@/firebase/config` module MUST be mocked.

```typescript
// Mock firebase config to prevent initializeApp error
vi.mock('@/firebase/config', () => ({
  db: {},
  auth: {},
  analytics: {},
  perf: {}
}))

// Mock the entire firebase service
vi.mock('@/services/authFirebase', () => ({
  useAuthFirebase: () => ({
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
    authStateListener: vi.fn(() => vi.fn()), // returns unsubscribe fn
    authStateReady: vi.fn().mockResolvedValue(null),
    getCurrentUser: vi.fn().mockReturnValue(null),
    refreshUser: vi.fn()
  })
}))
```

### Pattern 3: Pinia Store Setup for Composable Tests

**What:** `setActivePinia(createPinia())` in `beforeEach` to provide real stores.
**When to use:** When testing use-case composables that call `useAuthStore()` or `useTeamStore()`.

```typescript
// Source: Pinia testing docs (pinia.vuejs.org/cookbook/testing.html)
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'

beforeEach(() => {
  setActivePinia(createPinia())
})
```

Using real Pinia stores (not `createTestingPinia`) is preferred here because:
- The stores are pure state (no business logic) — no need to stub actions
- It tests that stores are updated correctly by use cases (this IS the business we care about)

### Pattern 4: Vue Router Mocking for useAuthUseCases

**What:** `vi.mock('vue-router')` because `useAuthUseCases` calls `useRouter()`.
**When to use:** Any composable that calls `useRouter` or `useRoute`.

```typescript
// Source: runthatline.com/vitest-mock-vue-router/
import { vi } from 'vitest'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: {}, query: {} })
}))
```

### Pattern 5: Testing generateAutoFines (Cashbox Fine Rule Logic)

**What:** `generateAutoFines` calls `cashboxFirebase.loadFineRules` then pure logic. Mock the Firebase call, pass in direct vote arrays.
**When to use:** TST-05 — test all FineRuleTrigger types.

```typescript
// Mock cashboxFirebase
vi.mock('@/services/cashboxFirebase', () => ({
  useCashboxFirebase: () => ({
    loadFineRules: vi.fn().mockResolvedValue([
      { id: 'rule-1', name: 'No Show', amount: 50, triggerType: FineRuleTrigger.NO_ATTENDANCE, active: true }
    ]),
    bulkAddFines: vi.fn().mockResolvedValue(undefined)
  })
}))

it('generates fine for NO_ATTENDANCE when player voted false', async () => {
  const { generateAutoFines } = useCashboxUseCases()
  const count = await generateAutoFines(
    'team-1', 'survey-1', 'Training', SurveyTypes.Training,
    [{ userUid: 'player-1', vote: false }],
    [{ userUid: 'player-1', vote: false }],
    ['player-1'],
    'admin-uid'
  )
  expect(count).toBe(1)
})
```

### Pattern 6: Debounce Testing (useFormValidation async scenarios)

**What:** `useFormValidation` does not currently have debounce — the requirement TST-06 says "async validation scenarios". Since no debounce exists in the code, this means testing async scenarios like `validateFields` with async rules using `vi.useFakeTimers()`.

**Finding:** The current `useFormValidation.ts` does NOT have async validation or debounce. All rules are synchronous. TST-06 says "including async validation scenarios" — this may mean testing the reactive `createFormValidator` with `nextTick` or testing the `futureDate`/`pastDate` rules that depend on `new Date()` (requiring `vi.useFakeTimers`).

```typescript
// Timer control for date-dependent rules
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-15'))
})
afterEach(() => {
  vi.useRealTimers()
})

it('futureDate rejects past dates', () => {
  const { rules } = useFormValidation()
  const result = rules.futureDate()('2025-01-01')
  expect(result).toBe('Date must be in the future')
})
```

### Pattern 7: Listener Cleanup Testing

**What:** Test `ListenerRegistry` class directly — register mock unsubscribe functions, verify they are called.

```typescript
// Source: listenerRegistry.ts analysis - pure class, no deps
import { ListenerRegistry } from '@/services/listenerRegistry'

describe('ListenerRegistry', () => {
  let registry: ListenerRegistry

  beforeEach(() => {
    registry = new ListenerRegistry() // Fresh instance each test
  })

  it('calls unsubscribe when unregistering a listener', () => {
    const mockUnsub = vi.fn()
    registry.register('surveys', mockUnsub)
    registry.unregister('surveys')
    expect(mockUnsub).toHaveBeenCalledOnce()
  })

  it('calls all unsubscribes when unregisterAll is called', () => {
    const mockUnsub1 = vi.fn()
    const mockUnsub2 = vi.fn()
    registry.register('auth', mockUnsub1)
    registry.register('surveys', mockUnsub2)
    registry.unregisterAll()
    expect(mockUnsub1).toHaveBeenCalledOnce()
    expect(mockUnsub2).toHaveBeenCalledOnce()
  })
})
```

**IMPORTANT:** The module-level `listenerRegistry` singleton does `window.__listenerDebug = ...` in DEV mode. When importing the singleton, this executes and will fail in Node environment unless `window` is mocked. Avoid importing the singleton directly in tests — import the `ListenerRegistry` class and instantiate fresh.

### Anti-Patterns to Avoid

- **Importing real firebase/config in tests:** The file calls `getAnalytics()` and `getPerformance()` which require a browser and network. Always mock `@/firebase/config`.
- **Using createTestingPinia when stores are pure state:** createTestingPinia stubs all actions — but the authStore and teamStore only have simple setters that ARE the thing being tested.
- **Testing that Firebase SDK calls are made:** Test business logic outcomes (store state updated), not that `updateDoc` was called with specific args.
- **Sharing ListenerRegistry singleton between tests:** Always create a fresh `new ListenerRegistry()` per test.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firebase mocking | Custom Firebase stub class | `vi.mock('@/firebase/config', ...)` | Simple object mock sufficient; Firebase SDK is not called in unit tests |
| Coverage reporting | Manual line counting | `@vitest/coverage-v8` | V8 native, accurate, integrates with vitest |
| Store testing | Manual reactive state setup | `setActivePinia(createPinia())` | Pinia's own API handles reactivity correctly |
| Async timer control | Real `setTimeout` in tests | `vi.useFakeTimers()` / `vi.advanceTimersByTime()` | Deterministic, fast, no flakiness |

**Key insight:** The test complexity here is entirely in mocking boundaries correctly. The actual logic being tested is simple — once mocks are in place, assertions are trivial.

---

## Common Pitfalls

### Pitfall 1: firebase/config Module Initialization at Import Time

**What goes wrong:** `src/firebase/config.ts` calls `initializeApp()`, `getAnalytics()`, and `getPerformance()` at module load time. These fail in Node/happy-dom test environment because they attempt network operations and DOM analytics.

**Why it happens:** Firebase SDK is designed for browser environments. The config module doesn't lazy-initialize.

**How to avoid:** Add `vi.mock('@/firebase/config', ...)` at the top of EVERY test file that imports code touching Firebase. This must be at the top of the file because `vi.mock()` calls are hoisted by Vitest.

**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'app')` or `FirebaseError: No Firebase App` in test output.

```typescript
// Put this at the TOP of any test file touching Firebase-dependent code
vi.mock('@/firebase/config', () => ({
  db: {},
  auth: {},
  analytics: {},
  perf: {}
}))
```

### Pitfall 2: listenerRegistry Singleton Executing window.__listenerDebug

**What goes wrong:** Importing `listenerRegistry` from `listenerRegistry.ts` (the singleton) executes `window.__listenerDebug = {...}` in DEV mode. This mutates `window` and can cause cross-test pollution.

**Why it happens:** The module has side effects at module level in DEV mode.

**How to avoid:** Import the `ListenerRegistry` CLASS not the singleton. Create `new ListenerRegistry()` in each test's `beforeEach`.

```typescript
import { ListenerRegistry } from '@/services/listenerRegistry'
// NOT: import { listenerRegistry } from '@/services/listenerRegistry'
```

### Pitfall 3: useAuthUseCases Depends on vue-router useRouter

**What goes wrong:** `useAuthUseCases()` calls `useRouter()` at the top of the function. Without a Vue app context or mocked router, this throws `[Vue warn]: inject() can only be used inside setup() or functional components`.

**Why it happens:** `useRouter()` uses Vue's inject mechanism which requires an app context.

**How to avoid:** Mock `vue-router` before the test runs.

```typescript
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: mockPush }))
}))
```

### Pitfall 4: notifyError Side Effect in Use-Case Error Handlers

**What goes wrong:** All use-case error handlers call `notifyError(...)` which calls into Quasar's notification system. This will fail in test environments without Quasar.

**How to avoid:** Mock `@/services/notificationService`.

```typescript
vi.mock('@/services/notificationService', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn()
}))
```

### Pitfall 5: Coverage Threshold Not Met Due to Uncovered Files

**What goes wrong:** `coverage.include` includes all `src/` files but many are boot files, i18n, router config etc. that have no tests. This can tank the 70% target.

**How to avoid:** Set `coverage.include` to only the files being tested, or use `coverage.exclude` to omit untestable files (pages, layouts, boot files, i18n).

```typescript
coverage: {
  provider: 'v8',
  include: [
    'src/composable/**/*.ts',
    'src/services/listenerRegistry.ts',
  ],
  exclude: [
    'src/**/__tests__/**',
    'src/boot/**',
    'src/i18n/**',
    'src/router/**',
    'src/pages/**',
    'src/layouts/**',
    'src/components/**',
    'src/firebase/config.ts'
  ],
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

### Pitfall 6: SurveyUseCases.voteOnSurvey Reads teamStore State

**What goes wrong:** `voteOnSurvey` reads `teamStore.surveys.find(s => s.id === surveyId)` to get the current votes array. If the store is empty, the entire function exits without calling Firebase.

**How to avoid:** Pre-populate `teamStore.surveys` in the test before calling `voteOnSurvey`.

```typescript
const teamStore = useTeamStore()
teamStore.setSurveys([{ id: 'survey-1', votes: [], ...rest }])
```

### Pitfall 7: generateAutoFines uses cashboxFirebase.loadFineRules (async)

**What goes wrong:** `generateAutoFines` calls `cashboxFirebase.loadFineRules(teamId)` which is a Firestore read. This must be mocked to avoid real Firebase calls AND to control what rules are returned for each test case.

**Why it happens:** The method loads rules dynamically at verification time (not from a listener).

**How to avoid:** Mock `useCashboxFirebase` entirely in the test file.

---

## Code Examples

Verified patterns from codebase analysis and official sources:

### Coverage Configuration Addition to vitest.config.ts

```typescript
// Source: vitest.dev/guide/coverage.html + codebase vitest.config.ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/composable/**/*.ts',
        'src/services/listenerRegistry.ts',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/boot/**',
        'src/i18n/**',
        'src/router/**',
        'src/pages/**',
        'src/layouts/**',
        'src/components/**',
        'src/firebase/config.ts',
        'src/migrations/**'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  }
})
```

### Script Addition to package.json

```json
"test:coverage": "vitest run --coverage"
```

### Full FineRuleTrigger Test Matrix

The `generateAutoFines` function has three trigger types to test:

```typescript
// FineRuleTrigger.NO_ATTENDANCE — player's verifiedVote.vote === false
// FineRuleTrigger.VOTED_YES_BUT_ABSENT — originalVote.vote === true AND (no verifiedVote OR verifiedVote.vote === false)
// FineRuleTrigger.UNVOTED — no verifiedVote entry at all (memberId not in verifiedVotes)

// Edge cases:
// - surveyType filter: rule.surveyType !== surveyType → skip (e.g., training rule on match survey)
// - inactive rule: rule.active === false → filtered out before loop
// - member has both NO_ATTENDANCE and UNVOTED rules → could get multiple fines
// - missing votes array: original/verified votes empty → UNVOTED fires for all members
```

### Auth Flow Test Scenarios (TST-03)

```typescript
// signIn success: loginUser resolves → authStore.user is set, loading goes false
// signIn failure: loginUser rejects AuthError → authStore.user null, error notified
// signOut: logoutUser resolves → authStore.user null, teamStore.clearData called
// initializeAuth with null user: authStore.setUser(null), authStore.setAuthReady(true), no team listener
// initializeAuth with user: authStore.setUser(user), setAdmin based on claim, setTeamListener called
// session persistence: authStateReady resolves with stored user → auth ready with correct state
```

### Survey Voting Test Scenarios (TST-04)

```typescript
// New vote (user not in votes array): addOrUpdateVote called, votes array extended
// Update vote (user already voted): addOrUpdateVote called with changed value
// Same vote (no change): addOrUpdateVote NOT called (early return in surveyFirebase)
// Missing votes array: survey.votes = undefined → voteOnSurvey can't find survey, does nothing
// Survey not in store: teamStore.surveys is empty → voteOnSurvey returns without calling Firebase
// Firebase error: addOrUpdateVote rejects → notifyError called, error re-thrown
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest for Vue | Vitest (native ESM) | 2022+ | No transform needed for ESM/TypeScript |
| Separate coverage package install | Auto-prompted by vitest run --coverage | Vitest 1.x+ | Just install @vitest/coverage-v8 |
| Mocking Firebase with jest-mock-extended | vi.mock() inline factories | Vitest era | Simpler, no extra packages |
| getByTestId component tests | Direct composable unit tests | Current trend | Faster, more targeted |

**Deprecated/outdated:**
- `@vue/test-utils` `mount()` for composable tests: Not needed here — all targeted composables work without host component.
- `experimentalAstAwareRemapping` coverage option: Removed in Vitest 4, enabled by default.

---

## Open Questions

1. **Does useFormValidation need async validation added?**
   - What we know: Current `useFormValidation.ts` has only synchronous rules. TST-06 says "including async validation scenarios."
   - What's unclear: Does the phase add async validation to the composable, or tests should prove the current sync rules work and use fake timers for date-dependent rules?
   - Recommendation: Interpret as testing date-dependent rules using `vi.useFakeTimers()` for the "async" angle, and testing reactive `createFormValidator` with `nextTick`. Do NOT add new async validation code unless the phase plan explicitly calls for it.

2. **Coverage scope: what counts toward 70%?**
   - What we know: The 70% target applies to the coverage report.
   - What's unclear: Does it mean the entire `src/` must hit 70%, or just the files with tests?
   - Recommendation: Set `coverage.include` to only the composables and services being tested. This gives a meaningful 70% over the tested scope, not diluted by untested pages/components.

3. **How to handle the `createLogger` calls in tested code?**
   - What we know: All use-case composables call `createLogger('...')` which uses `console.log` etc. under the hood.
   - What's unclear: Will logger output clutter test results?
   - Recommendation: Either spy on console in tests or mock `src/utils/logger.ts` with `vi.mock` returning a no-op logger. The latter is cleaner.

---

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `src/composable/useFormValidation.ts` — confirmed synchronous-only rules
- Codebase analysis: `src/services/listenerRegistry.ts` — confirmed pure class, no Firebase imports
- Codebase analysis: `src/composable/useCashboxUseCases.ts` — confirmed `generateAutoFines` logic for all 3 FineRuleTrigger types
- Codebase analysis: `src/firebase/config.ts` — confirmed side-effectful initialization at module load time
- Codebase analysis: `src/composable/__tests__/useDateHelpers.test.ts` — confirmed test pattern used in project
- Codebase analysis: `package.json` — confirmed vitest `^4.0.18`, `@vitest/coverage-v8` NOT installed
- Codebase analysis: `vitest.config.ts` — confirmed `globals: true`, `environment: 'happy-dom'`, coverage not configured

### Secondary (MEDIUM confidence)

- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html) — coverage configuration, include/exclude patterns
- [Vitest API: vi](https://vitest.dev/api/vi.html) — `vi.useFakeTimers`, `vi.advanceTimersByTime`, `vi.stubEnv`, `vi.spyOn`
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html) — `vi.mock()` hoisting behavior, factory pattern
- [Pinia Testing Docs](https://pinia.vuejs.org/cookbook/testing.html) — `createTestingPinia`, `setActivePinia(createPinia())`
- [npmjs @vitest/coverage-v8](https://www.npmjs.com/package/@vitest/coverage-v8) — version 4.0.18 confirmed

### Tertiary (LOW confidence)

- WebSearch result: Vue Router mocking pattern with `vi.mock('vue-router')` — consistent across multiple sources but not verified against the specific vue-router version in use

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and existing test files
- Architecture: HIGH — confirmed from reading all source files being tested
- Pitfalls: HIGH — discovered through direct code analysis (firebase config side effects, singleton window mutation, router injection)
- Coverage config: MEDIUM — confirmed from official vitest docs, exact threshold syntax verified

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (vitest 4.x is stable; Firebase mocking patterns are stable)

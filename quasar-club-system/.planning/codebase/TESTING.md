# Testing Patterns

**Analysis Date:** 2026-02-14

## Test Framework

**Runner:**
- Framework: Vitest 4.0.18
- Config: `vitest.config.ts` at project root
- Environment: `happy-dom` (DOM simulation for unit tests)

**Assertion Library:**
- Vitest built-in expect API with full assertion support

**Run Commands:**
```bash
npm run test              # Run all tests once
npm run test:watch       # Watch mode with re-run on file changes
npm run lint             # ESLint validation
npm run format           # Prettier auto-formatting
```

## Test File Organization

**Location:**
- Tests co-located in `__tests__` subdirectories next to source code
- Example: `src/composable/__tests__/useDateHelpers.test.ts`
- Pattern: `src/{feature}/__tests__/{feature}.test.ts`

**Naming:**
- Pattern: `{sourceFileName}.test.ts`
- Examples:
  - `useDateHelpers.test.ts` (tests for `useDateHelpers.ts`)
  - `surveyStatusUtils.test.ts` (tests for `surveyStatusUtils.ts`)
  - `useSurveyFilters.test.ts` (tests for `useSurveyFilters.ts`)

**Structure:**
```
src/
├── composable/
│   ├── useDateHelpers.ts
│   ├── useSurveyFilters.ts
│   └── __tests__/
│       ├── useDateHelpers.test.ts
│       └── useSurveyFilters.test.ts
├── utils/
│   ├── surveyStatusUtils.ts
│   ├── firestoreUtils.ts
│   └── __tests__/
│       ├── surveyStatusUtils.test.ts
│       ├── firestoreUtils.test.ts
│       └── voteUtils.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useDateHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDayAndMonth', () => {
    it('formats date with day and month name in English', () => {
      const { formatDayAndMonth } = useDateHelpers('en')
      const result = formatDayAndMonth('2025-12-05')
      expect(result).toBe('5. December')
    })
  })
})
```

**Patterns:**

1. **Setup/Teardown:**
   - `beforeEach()`: Initialize fake timers or reset mock state
   - `afterEach()`: Clean up fake timers and clear all mocks with `vi.clearAllMocks()`
   - Example from test files:
   ```typescript
   beforeEach(() => {
     vi.useFakeTimers()
     vi.setSystemTime(new Date('2025-10-15T12:00:00'))
   })

   afterEach(() => {
     vi.useRealTimers()
   })
   ```

2. **Test Organization:**
   - Nested `describe()` blocks for logical grouping
   - Each test has single responsibility
   - Test name describes expected behavior: `it('returns true when date is within range')`

3. **Assertion Patterns:**
   - Basic equality: `expect(result).toBe('value')`
   - Array length: `expect(array).toHaveLength(3)`
   - Array contents: `expect(result.map(s => s.id)).toEqual(['1', '4'])`
   - Boolean: `expect(result).toBe(true)`
   - Comparisons: `expect(result).toBeGreaterThan(0)`
   - Function calls: `expect(mockFn).toHaveBeenCalledWith(arg)`
   - Negation: `expect(mockFn).not.toHaveBeenCalled()`

## Mocking

**Framework:** Vitest mocking with `vi` utilities

**Patterns:**

1. **Module Mocking with `vi.mock()`:**
```typescript
const mockGetDocs = vi.fn()
const mockCollection = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args)
}))

vi.mock('@/firebase/config', () => ({
  db: 'mock-db'
}))
```

2. **Mock Return Values:**
```typescript
beforeEach(() => {
  mockCollection.mockReturnValue('mock-collection-ref')
  mockGetDocs.mockResolvedValue({
    docs: [{ id: 'id-1', data: () => ({ name: 'User 1' }) }]
  })
})
```

3. **Mock Multiple Sequential Calls:**
```typescript
mockGetDocs
  .mockResolvedValueOnce({ docs: [...] })  // First call
  .mockResolvedValueOnce({ docs: [...] })  // Second call
```

4. **Assert Mock Calls:**
```typescript
expect(mockGetDocs).toHaveBeenCalledTimes(1)
expect(mockWhere).toHaveBeenCalledWith('__name__', 'in', ids)
expect(mockFn).not.toHaveBeenCalled()
```

**What to Mock:**
- External APIs (Firebase, Firestore)
- Time/dates when testing time-dependent logic
- HTTP requests
- Environment-dependent functions
- Example from `firestoreUtils.test.ts`: Mock Firebase `collection`, `query`, `where`, `getDocs`

**What NOT to Mock:**
- Pure utility functions being tested
- Helper functions used by the function under test (unless they're external)
- Core business logic that's part of the test scenario
- Example: Test `surveyStatusUtils` functions directly without mocking, only mock time with `vi.useFakeTimers()`

## Fixtures and Factories

**Test Data:**
- Factory functions for creating mock objects
- Named `createMock{Entity}`: `createMockSurvey()`, `createMockUser()`
- Support partial overrides for test scenarios
- Example from multiple test files:
```typescript
const createMockSurvey = (overrides: Partial<ISurvey> = {}): ISurvey => ({
  id: 'survey-1',
  date: '2025-12-01',
  time: '18:00',
  dateTime: new Date('2025-12-01T18:00:00'),
  title: 'Test Survey',
  description: 'Test description',
  teamId: 'team-1',
  type: SurveyTypes.Training,
  votes: [],
  ...overrides
})
```

**Location:**
- Factories at top of test file before test suites
- Can be used across multiple describe blocks
- Keeps test data generation centralized and consistent

**Usage Pattern:**
```typescript
const surveys = [
  createMockSurvey({ id: '1', date: '2025-08-01', title: 'Training Monday' }),
  createMockSurvey({ id: '2', date: '2025-09-15', title: 'Match vs FC' }),
  createMockSurvey({ id: '3', date: '2025-11-20', title: 'Training Wednesday' })
]
```

## Coverage

**Requirements:** Not enforced (no coverage thresholds in vitest config)

**View Coverage:**
- Run `npm run test -- --coverage` (coverage config can be added to vitest.config.ts)

**Current State:**
- Tests exist for utilities: `surveyStatusUtils.ts`, `firestoreUtils.ts`, `voteUtils.ts`
- Tests exist for composables: `useDateHelpers.ts`, `useSurveyFilters.ts`
- Fixtures and factories used to generate diverse test scenarios
- Time-dependent tests use fake timers for reproducibility

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test pure functions with various inputs
- Examples from codebase:
  - `useDateHelpers.test.ts`: Tests date formatting and calculations
  - `surveyStatusUtils.test.ts`: Tests survey status logic
  - `firestoreUtils.test.ts`: Tests Firestore query chunking
  - `useSurveyFilters.test.ts`: Tests survey filtering logic
- Minimal mocking - only external dependencies

**Integration Tests:**
- Not extensively used in current codebase
- Could be added for testing Firebase interactions with state updates
- Would combine Firebase services + Pinia stores

**E2E Tests:**
- Not currently implemented
- Could use Playwright or Cypress for full app flow testing

## Common Patterns

**Async Testing:**
```typescript
it('returns empty array for empty ids', async () => {
  const result = await queryByIdsInChunks<MockUser>('users', [])
  expect(result).toEqual([])
})

// With mocked promise resolution
mockGetDocs.mockResolvedValue({ docs: [...] })

// Or with multiple sequential calls
mockGetDocs
  .mockResolvedValueOnce({ docs: [...] })
  .mockResolvedValueOnce({ docs: [...] })
```

**Error Testing:**
- Wrap with try-catch to verify thrown errors
- Example pattern (not shown but common):
```typescript
it('throws error on invalid input', async () => {
  try {
    await functionThatThrows()
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.message).toContain('expected message')
  }
})
```

**Time-Based Testing:**
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-10-15T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

it('returns true for survey later today', () => {
  const survey = createMockSurvey({ date: '2025-10-15', time: '20:00' })
  expect(isSurveyExpired(survey)).toBe(false)
})
```

**Parametric Testing (via factories):**
```typescript
const scenarios = [
  { id: '1', date: '2025-08-01', title: 'Training Monday' },
  { id: '2', date: '2025-09-15', title: 'Match vs FC' },
  { id: '3', date: '2025-11-20', title: 'Training Wednesday' }
]

scenarios.forEach(scenario => {
  it(`handles survey ${scenario.id}`, () => {
    const survey = createMockSurvey(scenario)
    expect(filterSurveys([survey], ...)).toBeDefined()
  })
})
```

---

*Testing analysis: 2026-02-14*

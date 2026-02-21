# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- Vue components: `PascalCase.vue` (e.g., `SurveyCard.vue`, `TeamForm.vue`)
- TypeScript services/composables: `camelCase.ts` (e.g., `authFirebase.ts`, `useDateHelpers.ts`)
- Composables: `use` prefix followed by camelCase (e.g., `useAuthComposable.ts`, `useFormValidation.ts`)
- Use cases: `use` prefix with "UseCases" suffix (e.g., `useAuthUseCases.ts`, `useSurveyUseCases.ts`)
- Firebase services: `{feature}Firebase.ts` pattern (e.g., `authFirebase.ts`, `teamFirebase.ts`, `surveyFirebase.ts`)
- Test files: `*.test.ts` convention in `__tests__` subdirectories (e.g., `src/composable/__tests__/useDateHelpers.test.ts`)
- Enums: `PascalCase.ts` (e.g., `SurveyTypes.ts`, `routesEnum.ts`)
- Utils: `camelCase.ts` (e.g., `surveyStatusUtils.ts`, `firestoreUtils.ts`)

**Functions:**
- camelCase for all functions: `loginUser()`, `getSurveyStatus()`, `validateField()`
- Prefix async functions with action verb: `loginUser`, `registerUser`, `refreshUser`
- Utility functions return descriptive values: `isSurveyExpired()`, `canModifyVotes()`, `needsVerification()`
- Helper/selector functions use `get` prefix: `getSurveyStatus()`, `getFieldError()`, `getCurrentDate()`
- Boolean check functions use `is`, `can`, or `has` prefix: `isSurveyExpired()`, `canModifyVotes()`, `hasFieldError()`

**Variables:**
- camelCase for all variables and constants
- Use descriptive names: `currentUser`, `isLoading`, `surveyStatusDisplay`
- Reactive variables in Vue: same camelCase (e.g., `const isLoading = ref(false)`)
- Private/internal variables: no underscore prefix, rely on file scope
- Constants at module level: camelCase (not UPPER_CASE) - e.g., `const SEASON_CONFIG = {...}`

**Types:**
- Interface: `I` prefix followed by PascalCase (e.g., `IUser`, `ISurvey`, `ITeam`)
- Enums: PascalCase (e.g., `SurveyStatus`, `FineRuleTrigger`)
- Type aliases: PascalCase (e.g., `ValidationRule`, `ValidationRules`)

## Code Style

**Formatting:**
- Tool: Prettier with config at `.prettierrc.json`
- Semi-colons: false (off) - no semicolons at end of statements
- Quotes: single quotes (`'`) for strings
- Print width: 100 characters

**Linting:**
- Tool: ESLint with flat config at `eslint.config.js`
- Rules: Quasar recommended + Vue essential
- Debugging: `debugger` allowed in dev, error in production
- Promise rejection: no requirement to use Error objects
- File extensions: `.js`, `.cjs`, `.mjs`, `.vue` files linted
- Command: `npm run lint` or `npm run format` (auto-fix with Prettier)

## Import Organization

**Order:**
1. External libraries (Vue, Pinia, Firebase)
2. Project configuration and enums
3. Interfaces and types
4. Composables and use cases
5. Firebase services
6. Stores
7. Utils and helpers
8. Local components

**Example from codebase:**
```typescript
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouteEnum } from '@/enums/routesEnum'
import { useAuthStore } from '@/stores/authStore'
import { useAuthUseCases } from '@/composable/useAuthUseCases'
```

**Path Aliases:**
- `@` maps to `./src` directory via Vite/Quasar configuration
- All imports should use `@/` prefix for project files: `import { IUser } from '@/interfaces/interfaces'`

## Error Handling

**Patterns:**
- Try-catch blocks in all async service functions
- Error logging with descriptive context: `console.error('Context: ${error.code} - ${error.message}')`
- Errors are caught and re-thrown from services to composables/pages
- Firebase-specific errors include code and message in logs
- In composables, catch errors and pass to UI with meaningful user messages
- Example from `authFirebase.ts`:
```typescript
try {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
} catch (error) {
  console.error(`Login Error: ${error.code} - ${error.message}`)
  throw error
}
```

## Logging

**Framework:** `console` methods (no centralized logger)

**Patterns:**
- Use `console.error()` for errors with context: `console.error('Feature: ${error.message}')`
- Log Firebase-specific errors with error code: `console.error(`Login Error: ${error.code}`)`
- Don't log sensitive data (passwords, tokens, private keys)
- Logs include descriptive prefixes for context: `console.error('Error adding user to Firestore:')`

## Comments

**When to Comment:**
- JSDoc comments for exported functions and complex logic
- Inline comments for non-obvious business logic
- Example from `surveyStatusUtils.ts`:
```typescript
/**
 * Check if a survey has expired based on its date and time
 */
export const isSurveyExpired = (survey: ISurvey): boolean => {
```

**JSDoc/TSDoc:**
- Used for public functions and utilities
- Include parameter types and return types
- Format: `/** description */` above function definition
- Example:
```typescript
/**
 * Get the current status of a survey based on expiration and user role
 */
export const getSurveyStatus = (survey: ISurvey, isPowerUser: boolean): SurveyStatus => {
```

## Function Design

**Size:** Keep functions focused and single-responsibility. Complex operations decomposed into smaller utilities.

**Parameters:**
- Maximum 2-3 parameters
- Use objects for multiple related parameters
- Use optional parameters sparingly, prefer overloads
- Example from tests: helper function with optional override:
```typescript
const createMockSurvey = (overrides: Partial<ISurvey> = {}): ISurvey => ({...})
```

**Return Values:**
- Explicit return types on all functions
- Return interfaces for complex objects
- Use discriminated unions for status-based returns
- Example from `surveyStatusUtils.ts`:
```typescript
export const getSurveyStatusDisplay = (survey: ISurvey, isPowerUser: boolean): {
  status: SurveyStatus
  label: string
  color: string
  icon: string
}
```

## Module Design

**Exports:**
- Named exports for all public functions and types: `export const functionName = () => {}`
- Avoid default exports
- Export both interface and factory function separately if needed
- Example from stores:
```typescript
export const useAuthStore = defineStore("auth", () => {
  // ...
  return {
    user,
    isLoading,
    setUser,
    setLoading,
    // ...
  }
})
```

**Barrel Files:**
- Not used extensively; prefer direct imports from source files
- When used, export specific items only

**Stores (Pinia):**
- Setup store pattern using `defineStore` with callback function
- Export stores as composables: `export const useAuthStore = defineStore(...)`
- Pure state only - no business logic in stores
- State mutations with explicit setter functions: `setUser()`, `setLoading()`
- Example from `authStore.ts`:
```typescript
export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  return { user, isLoading, setUser }
})
```

**Composables Organization:**
- UI Composables: delegate component logic to use cases, handle navigation
- Use Cases: orchestrate Firebase services and store updates
- Firebase Services: pure Firebase operations with error handling
- Flow: Component → UI Composable → Use Case → Firebase Service → Store

Example layering from `useAuthComposable.ts`:
```typescript
const loginUser = async (email: string, password: string) => {
  try {
    await authUseCases.signIn(email, password)  // Call use case
    router.push(RouteEnum.DASHBOARD.path)        // Handle UI navigation
  } catch (error: any) {
    console.error(`Login Error: ${error.code}`)  // Log error
    throw error                                   // Propagate to component
  }
}
```

---

*Convention analysis: 2026-02-14*

# Phase 1: Error System Foundation - Research

**Researched:** 2026-02-14
**Domain:** TypeScript Error Handling, Vue 3 Error Boundaries, Firebase Error Mapping, Quasar Notifications
**Confidence:** HIGH

## Summary

Error handling in Vue 3 + Quasar + Firebase + TypeScript applications requires a coordinated approach across multiple layers: custom TypeScript error classes for type safety, Vue 3's global error handler for uncaught errors, Firebase error code mapping for user-friendly messages, and Quasar's Notify plugin for consistent error UI.

The codebase currently has 77 `console.error()` calls with `any`-typed catches (4 instances found) throughout the Clean Architecture layers. Errors are logged but never surface to users, causing silent failures. The existing i18n setup (Czech/English) and Quasar Notify plugin provide the foundation needed for user-facing error feedback.

**Primary recommendation:** Build a typed error hierarchy with base `AppError` class extending Error with proper prototype chain setup for ES5/ES6 compatibility, implement Vue 3 `app.config.errorHandler` for global error catching, create Firebase error code mapping service for i18n messages, and establish retry mechanisms using Quasar Notify action buttons.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x+ | Type-safe error classes | Native `instanceof` checks, compiler validation |
| Vue 3 | 3.4.18 | Global error handler | Built-in `app.config.errorHandler` API |
| Quasar Notify | 2.16.0 | Error feedback UI | Already configured, supports actions/retry |
| vue-i18n | 9.x | Error message localization | Already integrated with Czech/English |
| Firebase SDK | 11.4.0 | Error source | Auth/Firestore error codes need mapping |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| exponential-backoff | 3.x (optional) | Retry logic | If implementing automatic retries for network errors |
| Firebase Admin | N/A | Server-side errors | Not needed - client-side only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom error classes | Plain Error objects | Lose type safety, no programmatic error handling |
| Global error handler | Per-component error boundaries | More granular but requires wrapping every component |
| Quasar Notify | Custom toast component | Already configured, no need to rebuild |
| Manual retry logic | exponential-backoff lib | Lib adds dependency but handles edge cases (jitter, max retries) |

**Installation:**
```bash
# No additional packages required - using existing stack
# Optional if implementing advanced retry:
npm install exponential-backoff
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── errors/
│   ├── AppError.ts           # Base error class
│   ├── AuthError.ts          # Firebase Auth errors
│   ├── FirestoreError.ts     # Firestore errors
│   ├── ValidationError.ts    # Form/data validation errors
│   ├── ListenerError.ts      # Realtime listener errors
│   └── errorMapper.ts        # Firebase code → i18n key mapping
├── services/
│   ├── errorHandler.ts       # Global error handler setup
│   └── notificationService.ts # Quasar Notify wrapper
├── i18n/
│   ├── en-US/
│   │   └── errors.js         # English error messages
│   └── cs-CZ/
│       └── errors.js         # Czech error messages
```

### Pattern 1: TypeScript Custom Error Class Hierarchy
**What:** Extend Error with custom classes, set prototype chain manually for ES5/ES6 compatibility
**When to use:** Every error thrown in the application should be a typed error
**Example:**
```typescript
// Source: https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript
// Base error class
export class AppError extends Error {
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>

  constructor(message: string, context?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context

    // Fix prototype chain for ES5/ES6 compatibility
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// Firebase Auth errors
export class AuthError extends AppError {
  constructor(
    public readonly code: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

// Firestore errors
export class FirestoreError extends AppError {
  constructor(
    public readonly code: string,
    public readonly operation: 'read' | 'write' | 'delete',
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message, { field })
  }
}

// Listener errors
export class ListenerError extends AppError {
  constructor(
    public readonly listenerType: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
  }
}
```

### Pattern 2: Vue 3 Global Error Handler
**What:** Set up `app.config.errorHandler` in main.ts/boot file to catch all uncaught errors
**When to use:** Required for production - catches errors from renders, lifecycle hooks, watchers, event handlers
**Example:**
```typescript
// Source: https://vuejs.org/api/application (official Vue docs)
// In main.ts or boot file
import { boot } from 'quasar/wrappers'
import { notifyError } from 'src/services/notificationService'
import { AppError } from 'src/errors/AppError'

export default boot(({ app }) => {
  app.config.errorHandler = (err: unknown, instance, info) => {
    console.error('Global error handler:', err, info)

    // Handle known error types
    if (err instanceof AppError) {
      notifyError(err.message, {
        context: err.context,
        retry: err instanceof AuthError || err instanceof FirestoreError
      })
    } else {
      // Unknown error - generic message
      notifyError('errors.unexpected', { retry: false })
    }

    // Optionally send to error tracking service (Sentry, etc.)
  }
})
```

### Pattern 3: Firebase Error Mapping Service
**What:** Map Firebase error codes to i18n keys for user-friendly messages
**When to use:** Every Firebase service method should catch and map errors
**Example:**
```typescript
// Source: Official Firebase error codes (https://firebase.google.com/docs/auth/admin/errors)
// src/errors/errorMapper.ts
import { FirebaseError } from 'firebase/app'
import { AuthError, FirestoreError } from './index'

const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/wrong-password': 'errors.auth.wrongPassword',
  'auth/invalid-credential': 'errors.auth.invalidCredential',
  'auth/user-not-found': 'errors.auth.userNotFound',
  'auth/email-already-in-use': 'errors.auth.emailInUse',
  'auth/weak-password': 'errors.auth.weakPassword',
  'auth/network-request-failed': 'errors.auth.networkFailed',
  'auth/too-many-requests': 'errors.auth.tooManyRequests',
  'auth/requires-recent-login': 'errors.auth.requiresRecentLogin',
}

const FIRESTORE_ERROR_MAP: Record<string, string> = {
  'permission-denied': 'errors.firestore.permissionDenied',
  'unavailable': 'errors.firestore.unavailable',
  'not-found': 'errors.firestore.notFound',
  'already-exists': 'errors.firestore.alreadyExists',
  'failed-precondition': 'errors.firestore.failedPrecondition',
}

export function mapFirebaseAuthError(error: unknown): AuthError {
  const fbError = error as FirebaseError
  const code = fbError.code || 'unknown'
  const i18nKey = AUTH_ERROR_MAP[code] || 'errors.auth.unknown'

  return new AuthError(code, i18nKey, {
    originalMessage: fbError.message
  })
}

export function mapFirestoreError(
  error: unknown,
  operation: 'read' | 'write' | 'delete'
): FirestoreError {
  const fbError = error as FirebaseError
  const code = fbError.code?.replace('firestore/', '') || 'unknown'
  const i18nKey = FIRESTORE_ERROR_MAP[code] || 'errors.firestore.unknown'

  return new FirestoreError(code, operation, i18nKey, {
    originalMessage: fbError.message
  })
}
```

### Pattern 4: Quasar Notify Error Display with Retry
**What:** Wrap Quasar Notify in service that supports retry actions
**When to use:** All error display throughout the app
**Example:**
```typescript
// Source: https://quasar.dev/quasar-plugins/notify/ (official Quasar docs)
// src/services/notificationService.ts
import { Notify } from 'quasar'
import { useI18n } from 'vue-i18n'

interface NotifyErrorOptions {
  context?: Record<string, unknown>
  retry?: boolean
  onRetry?: () => Promise<void>
}

export function notifyError(
  messageKey: string,
  options: NotifyErrorOptions = {}
) {
  const { t } = useI18n()

  const notifyConfig: any = {
    type: 'negative',
    message: t(messageKey, options.context),
    position: 'top',
    timeout: options.retry ? 0 : 5000, // Persistent if retry available
  }

  if (options.retry && options.onRetry) {
    notifyConfig.actions = [
      {
        label: t('common.retry'),
        color: 'white',
        handler: async () => {
          try {
            await options.onRetry!()
            Notify.create({
              type: 'positive',
              message: t('common.retrySuccess'),
              position: 'top',
              timeout: 2000
            })
          } catch (err) {
            // Retry failed - show error again
            notifyError(messageKey, options)
          }
        }
      },
      { label: t('common.dismiss'), color: 'white' }
    ]
  }

  Notify.create(notifyConfig)
}

export function notifySuccess(messageKey: string, context?: Record<string, unknown>) {
  const { t } = useI18n()
  Notify.create({
    type: 'positive',
    message: t(messageKey, context),
    position: 'top',
    timeout: 3000
  })
}
```

### Pattern 5: Reauthentication Flow for Password Change
**What:** Detect `auth/requires-recent-login`, prompt for password, retry operation
**When to use:** Password change, email change, account deletion
**Example:**
```typescript
// Source: https://firebase.google.com/docs/auth/web/manage-users (official Firebase docs)
// In authFirebase.ts
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'

export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const auth = getAuth()
  if (!auth.currentUser?.email) {
    throw new AuthError('no-user', 'errors.auth.noUser')
  }

  try {
    // Try to update password directly
    await updatePassword(auth.currentUser, newPassword)
  } catch (error: any) {
    // If requires recent login, reauthenticate first
    if (error.code === 'auth/requires-recent-login') {
      try {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        )
        await reauthenticateWithCredential(auth.currentUser, credential)

        // Retry password update after reauth
        await updatePassword(auth.currentUser, newPassword)
      } catch (reauthError) {
        throw mapFirebaseAuthError(reauthError)
      }
    } else {
      throw mapFirebaseAuthError(error)
    }
  }
}
```

### Anti-Patterns to Avoid
- **`any` typed catch blocks:** Use `unknown` and type-guard to check error type
- **Silent failures:** Never catch without user notification or logging
- **Generic error messages:** Always map to specific, actionable i18n messages
- **Throwing raw Firebase errors:** Always wrap with typed error classes
- **Retry without exponential backoff:** Simple retry loops can create retry storms
- **No error boundaries:** Listener errors can crash entire app without containment

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential backoff retry | Manual setTimeout loops | `exponential-backoff` npm package | Handles jitter, max retries, deadline, prevents retry storms |
| Toast notifications | Custom overlay component | Quasar Notify | Already configured, tested, accessible, supports actions |
| i18n parameter interpolation | String concatenation | vue-i18n named interpolation `{param}` | Type-safe, handles pluralization, escapes XSS |
| Error tracking | Custom logging service | Sentry/Bugsnag integration | Automatic stacktraces, source maps, error grouping |

**Key insight:** Error handling edge cases are deceptively complex - network timeouts, race conditions, reauthentication timing, retry storms, XSS in error messages. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: instanceof Not Working with TypeScript ES5
**What goes wrong:** `error instanceof CustomError` returns false even when it is that type
**Why it happens:** TypeScript transpiles to ES5, breaking prototype chain for extended Error classes
**How to avoid:** Always add `Object.setPrototypeOf(this, new.target.prototype)` in custom error constructors
**Warning signs:** Error handling logic skips custom error cases, falls through to generic handler

### Pitfall 2: Global Error Handler Only Catches Vue Lifecycle Errors
**What goes wrong:** Errors in async functions outside Vue lifecycle (event handlers, setTimeout) don't trigger errorHandler
**Why it happens:** Vue's errorHandler only wraps Vue-managed code (renders, watchers, lifecycle hooks)
**How to avoid:** Always use try-catch in async functions and manually call error notification service
**Warning signs:** Errors in `@click` handlers, Firestore listeners don't show user feedback

### Pitfall 3: Firebase Error Codes Change Between SDK Versions
**What goes wrong:** Error code mapping breaks after Firebase SDK upgrade
**Why it happens:** Firebase deprecated `auth/wrong-password` in favor of `auth/invalid-credential` in v9+
**How to avoid:** Map multiple codes to same i18n key, test error scenarios after upgrades, use Firebase version pinning
**Warning signs:** Generic "Unknown error" messages after Firebase upgrade

### Pitfall 4: Reauthentication Required Error Not Caught
**What goes wrong:** Password change shows generic error instead of prompting for current password
**Why it happens:** `auth/requires-recent-login` only thrown after 5 minutes, developers test immediately after login
**How to avoid:** Explicitly test password change 10+ minutes after login, always catch this specific error code
**Warning signs:** Users report password change fails with generic error

### Pitfall 5: Retry Storms on Permission Denied
**What goes wrong:** User clicks retry on permission-denied error, floods Firestore with rejected requests
**Why it happens:** Permission errors aren't transient - retry will always fail
**How to avoid:** Only show retry for transient errors (network, unavailable), never for permission/auth errors
**Warning signs:** High Firestore read counts, console flooded with permission-denied errors

### Pitfall 6: Error Messages Contain Sensitive Data
**What goes wrong:** Error message shows user email, Firebase path, or internal IDs to user
**Why it happens:** Directly displaying Firebase error messages or logging context to UI
**How to avoid:** Always map to generic i18n messages, log details only in console/monitoring, never show context to user
**Warning signs:** User sees "Failed to write to /users/abc123/teams/xyz789" in error toast

## Code Examples

Verified patterns from official sources:

### TypeScript Error Class with Prototype Fix
```typescript
// Source: https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript
export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // CRITICAL: Fix prototype chain for ES5/ES6 instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// Usage
const error = new AuthError('auth/wrong-password', 'Invalid credentials')
console.log(error instanceof AuthError) // true
console.log(error instanceof AppError) // true
console.log(error instanceof Error) // true
```

### Vue 3 Global Error Handler Setup
```typescript
// Source: https://vuejs.org/api/application (official Vue 3 docs)
app.config.errorHandler = (err: unknown, instance, info) => {
  // err: the error object
  // instance: the component instance that threw the error (or null)
  // info: error info string (e.g., "mounted hook")

  console.error('Error:', err)
  console.error('Info:', info)

  // Handle error display
  if (err instanceof AppError) {
    notifyError(err.message)
  }
}
```

### Quasar Notify with Retry Action
```typescript
// Source: https://quasar.dev/quasar-plugins/notify/ (official Quasar docs)
Notify.create({
  type: 'negative',
  message: t('errors.network.failed'),
  timeout: 0, // Persistent notification
  actions: [
    {
      label: t('common.retry'),
      color: 'white',
      handler: async () => {
        await retryOperation()
      }
    },
    { label: t('common.dismiss'), color: 'white' }
  ]
})
```

### Firebase Error Mapping in Service
```typescript
// In authFirebase.ts
try {
  await signInWithEmailAndPassword(auth, email, password)
} catch (error: unknown) {
  // Map Firebase error to typed error
  throw mapFirebaseAuthError(error)
}

// In calling code (useAuthUseCases.ts)
try {
  await authService.loginUser(email, password)
} catch (error: unknown) {
  if (error instanceof AuthError) {
    // Show localized message
    notifyError(error.message, {
      retry: error.code === 'auth/network-request-failed',
      onRetry: () => authService.loginUser(email, password)
    })
  }
}
```

### vue-i18n Named Interpolation for Error Messages
```typescript
// Source: https://vue-i18n.intlify.dev/guide/essentials/syntax (official vue-i18n docs)
// In i18n/en-US/errors.js
export default {
  auth: {
    wrongPassword: 'Incorrect password. Please try again.',
    emailInUse: 'The email {email} is already registered.',
    tooManyRequests: 'Too many login attempts. Please wait {minutes} minutes.',
  }
}

// Usage
const { t } = useI18n()
const message = t('errors.auth.emailInUse', { email: 'user@example.com' })
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth/wrong-password` | `auth/invalid-credential` | Firebase v9+ (2021) | Must map both codes to same i18n message |
| String-based error messages | Error code enums | TypeScript 4.0+ (2020) | Type-safe error codes, autocomplete |
| `throw new Error(msg)` | Typed error classes | ES6+ (2015) | Programmatic error handling via instanceof |
| Component-level error handling | Global errorHandler | Vue 3 (2020) | Centralized error handling, consistent UX |
| Manual string concat | i18n interpolation | vue-i18n 9+ (2020) | XSS protection, parameter escaping |
| `any` type in catch | `unknown` type in catch | TypeScript 4.0+ (2020) | Forces explicit type checking |

**Deprecated/outdated:**
- **Firebase v8 error format:** Used `firebase.auth.Error` type, now use `FirebaseError` from `firebase/app`
- **Vue 2 errorHandler:** Received different arguments, no `info` parameter
- **Quasar v1 Notify:** Different API, use v2 syntax with `Notify.create()`

## Open Questions

1. **Should we implement automatic retry with exponential backoff?**
   - What we know: Library available (`exponential-backoff`), handles edge cases well
   - What's unclear: User expectation - do they want automatic retries or manual retry button?
   - Recommendation: Start with manual retry buttons, add exponential backoff if users request it

2. **Should listener errors recover automatically or require page refresh?**
   - What we know: Current implementation calls callback with empty array on permission-denied
   - What's unclear: Best UX for persistent listener failures (network, permission)
   - Recommendation: Show error notification with "Refresh" button, attempt reconnect after 5s, max 3 attempts

3. **Should we send errors to external monitoring service?**
   - What we know: Sentry/Bugsnag integrate easily with Vue errorHandler
   - What's unclear: Project budget, privacy requirements for error data
   - Recommendation: Add Sentry integration conditional on environment variable, optional for deployment

## Sources

### Primary (HIGH confidence)
- [Vue.js Application API - errorHandler](https://vuejs.org/api/application) - Official Vue 3 documentation
- [Quasar Notify Plugin](https://quasar.dev/quasar-plugins/notify/) - Official Quasar documentation
- [Firebase Auth Manage Users](https://firebase.google.com/docs/auth/web/manage-users) - Official Firebase reauthentication docs
- [Vue I18n Message Format Syntax](https://vue-i18n.intlify.dev/guide/essentials/syntax) - Official vue-i18n interpolation docs

### Secondary (MEDIUM confidence)
- [How to Fix instanceof Not Working For Custom Errors in TypeScript](https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript) - Verified solution for prototype chain
- [Understanding Custom Errors in TypeScript: A Complete Guide](https://medium.com/@Nelsonalfonso/understanding-custom-errors-in-typescript-a-complete-guide-f47a1df9354c) - Custom error best practices
- [Error Handling in Vue 3](https://enterprisevue.dev/blog/error-handling-in-vue-3/) - Vue error handling patterns
- [Node.js Advanced Patterns: Implementing Robust Retry Logic](https://v-checha.medium.com/advanced-node-js-patterns-implementing-robust-retry-logic-656cf70f8ee9) - Retry pattern best practices
- [Firebase Auth Admin API Errors](https://firebase.google.com/docs/auth/admin/errors) - Error code reference (Admin SDK, but codes match client SDK)

### Tertiary (LOW confidence - needs verification)
- [GitHub - maxzaleski/firebase-error-codes](https://github.com/maxzaleski/firebase-error-codes) - Community-maintained error code list (may be outdated)
- Various Medium articles on Firebase error handling - Use as reference, verify with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, versions confirmed in package.json
- Architecture: HIGH - Patterns verified with official documentation (Vue, Quasar, Firebase, vue-i18n)
- Pitfalls: MEDIUM-HIGH - Prototype chain issue verified, Firebase error code changes documented, reauthentication timing from official docs
- Code examples: HIGH - All examples sourced from official documentation or verified technical blogs

**Research date:** 2026-02-14
**Valid until:** 2026-03-31 (45 days - stable technologies, but Firebase SDK updates quarterly)

**Codebase findings:**
- 77 `console.error()` calls without user feedback
- 4 `catch (error: any)` blocks requiring type replacement
- Quasar Notify already configured in `quasar.config.js`
- i18n already set up with Czech (cs-CZ) and English (en-US)
- Clean Architecture in place - error handling fits naturally at service layer
- Existing reauthentication code in `authFirebase.ts` (lines 112-125) needs error mapping only

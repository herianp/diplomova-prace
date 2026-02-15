# Phase 3: Code Quality & TypeScript - Research

**Researched:** 2026-02-15
**Domain:** TypeScript strict mode, structured logging, type-safe i18n
**Confidence:** HIGH

## Summary

This phase focuses on hardening code quality through TypeScript strict mode, replacing console logging with structured logging, and implementing type-safe i18n. The codebase has 50 TypeScript files and 69 Vue files with minimal existing `any` types (15 occurrences across 3 files), indicating a relatively clean starting point for strict mode migration.

The standard approach involves incremental TypeScript strictness flags, Vue-specific logging libraries for browser environments (not Node.js server-side loggers like Pino/Winston), and Vue i18n's built-in TypeScript support for compile-time translation key validation. The project already uses Vue i18n 9.14.5 with nested translation structures in JavaScript, which needs conversion to TypeScript for type safety.

**Primary recommendation:** Enable TypeScript strict flags incrementally (noImplicitAny first, then strictNullChecks), use vuejs3-logger for structured browser logging with context enrichment, implement Vue i18n TypeScript resource schemas for translation key safety, and resolve Firebase config TODO by documenting the existing VITE_FIREBASE_API_KEY environment variable pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (existing) | Strict type checking | Already in project, enabling strict flags requires no new dependencies |
| vuejs3-logger | ^2.0.0 | Browser-side structured logging | Vue 3 compatible fork of vuejs-logger, designed for frontend logging with Vue components |
| Vue i18n | 9.14.5 (existing) | Type-safe internationalization | Already installed, supports TypeScript resource schemas natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | latest | Node.js type definitions | May be needed for environment variable typing in vite-env.d.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vuejs3-logger | Pino (browser mode) | Pino is Node.js-first with browser shim; vuejs3-logger is Vue-native with better component integration |
| vuejs3-logger | Custom logging wrapper | Hand-rolling loses context management, log levels, production optimization that vuejs3-logger provides |
| Vue i18n TypeScript | typesafe-i18n | typesafe-i18n requires migration from existing Vue i18n setup; Vue i18n's built-in TypeScript support is simpler |

**Installation:**
```bash
npm install vuejs3-logger --save-exact
```

## Architecture Patterns

### TypeScript Strict Mode Migration Pattern

**Incremental Flag Enabling:**
```
Phase 1: Enable noImplicitAny
  ├── Fix explicit any types (15 occurrences in 3 files)
  ├── Add type annotations to function parameters
  └── Verify build passes

Phase 2: Enable strictNullChecks
  ├── Handle null/undefined in optional properties
  ├── Add null checks for Firebase queries
  └── Update interface definitions

Phase 3: Enable remaining strict flags
  ├── strictFunctionTypes
  ├── strictBindCallApply
  ├── strictPropertyInitialization
  └── noImplicitThis (likely already satisfied)
```

**Configuration Location:**
TypeScript config lives in `.quasar/tsconfig.json` (Quasar-managed). Enable strict flags incrementally:

```json
{
  "compilerOptions": {
    "noImplicitAny": true,          // Phase 1
    "strictNullChecks": false,      // Phase 2 (enable after Phase 1)
    "strict": false                 // Phase 3 (or enable individual flags)
  }
}
```

### Structured Logging Pattern

**Replacement Strategy:**
Replace raw console.error/console.warn (105 occurrences across 27 files) with structured logger.

**Logger Setup (boot/logger.ts):**
```typescript
// Source: https://github.com/MarcSchaetz/vuejs3-logger
import VueLogger from 'vuejs3-logger';

const options = {
  isEnabled: true,
  logLevel: import.meta.env.PROD ? 'error' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true
};

export default ({ app }) => {
  app.use(VueLogger, options);
};
```

**Usage Pattern with Context:**
```typescript
// OLD: console.error('Login Error:', authError.code, authError.message)

// NEW: Structured logging with context
this.$log.error('Login failed', {
  errorCode: authError.code,
  errorMessage: authError.message,
  userId: userId || 'anonymous',
  timestamp: Date.now()
});
```

**Context Enrichment for Firebase Operations:**
```typescript
// In Firebase services, inject logger and add context
const logger = inject('vuejs3-logger');

try {
  await someFirebaseOperation();
} catch (error) {
  logger.error('Firebase operation failed', {
    operation: 'createSurvey',
    teamId: teamId,
    userId: currentUserId,
    errorCode: error.code,
    errorMessage: error.message
  });
  throw new FirestoreError(error.code, error.message);
}
```

### Type-Safe i18n Pattern

**Resource Schema Definition:**
Convert existing JavaScript locale files to TypeScript and define schema.

```typescript
// src/i18n/cs-CZ/index.ts (converted from .js)
export default {
  errors: { /* ... */ },
  app: {
    title: "Klubový manažer"
  },
  survey: {
    title: "Ankety",
    create: "Vytvořit anketu",
    // ... nested structure
  }
} as const;

export type MessageSchema = typeof import('./cs-CZ/index').default;
```

**Type-Safe i18n Setup:**
```typescript
// Source: https://vue-i18n.intlify.dev/guide/advanced/typescript
import { createI18n } from 'vue-i18n';
import csCZ from './cs-CZ';
import enUS from './en-US';

type MessageSchema = typeof csCZ;

const i18n = createI18n<[MessageSchema], 'cs-CZ' | 'en-US'>({
  locale: 'cs-CZ',
  messages: {
    'cs-CZ': csCZ,
    'en-US': enUS
  }
});
```

**Type-Safe Component Usage:**
```typescript
// In components with useI18n
const { t } = useI18n<{ message: MessageSchema }>();

// Type-safe: compiler validates key exists
t('survey.title')           // ✓ Valid
t('survey.nonexistent')     // ✗ TypeScript error
```

**Global Type Declaration:**
```typescript
// src/i18n/types.d.ts
import { MessageSchema } from './cs-CZ';

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
```

### Anti-Patterns to Avoid

- **Mass `any` suppression:** Don't use `// @ts-ignore` to skip strict errors; fix types properly
- **Runtime-only logging:** Don't rely on console.log in production; use structured logging with appropriate levels
- **String literal i18n keys:** Don't use hardcoded translation keys without type validation
- **Synchronous strict migration:** Don't enable all strict flags at once; incremental migration prevents overwhelming error counts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontend logging | Custom console wrapper | vuejs3-logger | Loses log levels, context management, production optimization, Vue component integration |
| Type-safe i18n | Custom key validation | Vue i18n TypeScript support | Built-in schema validation, IDE autocomplete, compile-time checking already provided |
| Strict mode migration | Manual file-by-file types | TypeScript compiler flags | Compiler enforces consistency; manual typing is error-prone and incomplete |
| Environment variable typing | Runtime validation | Vite ImportMetaEnv interface augmentation | TypeScript IntelliSense for env vars, compile-time checks |

**Key insight:** All four requirements have established TypeScript/Vue ecosystem solutions. Custom implementations would lack IDE integration, require ongoing maintenance, and miss edge cases that library authors have already solved.

## Common Pitfalls

### Pitfall 1: Server-Side Logger in Browser Context
**What goes wrong:** Developers use Pino or Winston (Node.js loggers) in Vue frontend, causing bundle bloat or runtime errors
**Why it happens:** Most "structured logging" tutorials focus on Node.js/Express, not Vue/browser environments
**How to avoid:** Use vuejs3-logger (Vue-specific) or Pino's browser mode (if Pino is required). Default to Vue ecosystem libraries for frontend
**Warning signs:** Import errors for 'fs', 'stream', 'os' modules; large bundle size increases

### Pitfall 2: Strict Mode All-at-Once
**What goes wrong:** Enabling `"strict": true` generates thousands of errors, blocking development
**Why it happens:** Strict mode enables 8+ individual flags; large codebases accumulate type issues over time
**How to avoid:** Enable flags incrementally: noImplicitAny → strictNullChecks → remaining flags. Fix errors between phases
**Warning signs:** 100+ TypeScript errors after config change; team blocks on strict mode PR

### Pitfall 3: i18n Key Typos at Runtime
**What goes wrong:** Translation keys like `$t('survye.tittle')` (typo) fail silently or show key instead of text
**Why it happens:** JavaScript i18n files don't provide compile-time validation
**How to avoid:** Convert i18n files to TypeScript with `as const`, use Vue i18n TypeScript generics, enable IDE autocomplete
**Warning signs:** Missing translations in production, i18n keys showing as raw strings in UI

### Pitfall 4: Implicit `any` in Firebase Callbacks
**What goes wrong:** Firebase listener callbacks receive `any` typed parameters: `onSnapshot((snapshot) => ...)` - snapshot is implicitly any
**Why it happens:** Firebase SDK types don't always infer correctly without explicit generics
**How to avoid:** Use Firebase TypeScript generics: `onSnapshot<Survey>()`, or explicitly type callback parameters: `(snapshot: QuerySnapshot<Survey>)`
**Warning signs:** noImplicitAny errors in Firebase service files, type safety lost in listener code

### Pitfall 5: Quasar tsconfig.json Overwrite
**What goes wrong:** Editing `.quasar/tsconfig.json` directly; changes lost when Quasar regenerates config
**Why it happens:** Developers don't realize `.quasar/` is auto-generated
**How to avoid:** Quasar may support user tsconfig extension; research Quasar TypeScript config override mechanism before modifying
**Warning signs:** Strict mode flags disappear after `quasar dev` restart

## Code Examples

Verified patterns from official sources:

### Incremental Strict Flag Enabling
```json
// Source: https://www.typescriptlang.org/tsconfig/strict.html
// .quasar/tsconfig.json (or override location)
{
  "compilerOptions": {
    // Phase 1: Catch implicit any
    "noImplicitAny": true,

    // Phase 2: After Phase 1 complete
    "strictNullChecks": true,

    // Phase 3: Enable remaining strict flags
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,

    // Alternatively, enable all at once if codebase is small:
    // "strict": true
  }
}
```

### Structured Logger Setup
```typescript
// Source: https://github.com/MarcSchaetz/vuejs3-logger
// src/boot/logger.ts
import VueLogger from 'vuejs3-logger';

const isProduction = import.meta.env.PROD;

const options = {
  isEnabled: true,
  logLevel: isProduction ? 'error' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: !isProduction
};

export default ({ app }) => {
  app.use(VueLogger, options);
};
```

### Structured Logging with Context
```typescript
// Source: Derived from vuejs3-logger API documentation
// Replace: console.error('Login Error:', authError.code, authError.message)

// In Vue component
this.$log.error('Authentication failed', {
  operation: 'login',
  errorCode: authError.code,
  errorMessage: authError.message,
  userId: email || 'unknown'
});

// In composable/service (inject logger)
import { inject } from 'vue';

const logger = inject('vuejs3-logger');
logger.error('Firestore query failed', {
  collection: 'surveys',
  teamId: teamId,
  errorCode: error.code
});
```

### Type-Safe i18n Configuration
```typescript
// Source: https://vue-i18n.intlify.dev/guide/advanced/typescript
// src/i18n/index.ts
import { createI18n } from 'vue-i18n';
import csCZ from './cs-CZ';
import enUS from './en-US';

// Define message schema from Czech locale
type MessageSchema = typeof csCZ;

const i18n = createI18n<[MessageSchema], 'cs-CZ' | 'en-US'>({
  legacy: false,
  locale: 'cs-CZ',
  fallbackLocale: 'en-US',
  messages: {
    'cs-CZ': csCZ,
    'en-US': enUS
  }
});

export default i18n;
```

### Type-Safe i18n Usage
```typescript
// Source: https://vue-i18n.intlify.dev/guide/advanced/typescript
// In Vue component
import { useI18n } from 'vue-i18n';

// Generic type parameter enables autocomplete
const { t } = useI18n<{ message: MessageSchema }>();

// TypeScript validates these keys exist
const title = t('survey.title');              // ✓ Valid
const create = t('survey.create');            // ✓ Valid
const nested = t('survey.verification.title'); // ✓ Valid

// TypeScript error: key doesn't exist
const invalid = t('survey.nonexistent');      // ✗ Compile error
```

### Environment Variable Typing
```typescript
// Source: https://vite.dev/guide/env-and-mode
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Firebase Config Resolution
```typescript
// Source: Existing codebase + Vite env best practices
// src/firebase/config.ts

// BEFORE (with TODO comment):
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// AFTER (TODO resolved):
/**
 * Firebase Configuration
 *
 * Environment variables are loaded from:
 * - .env.local (local development, gitignored)
 * - .env.production (production build)
 *
 * Required variables (all prefixed with VITE_):
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * - VITE_FIREBASE_MEASUREMENT_ID
 *
 * See vite-env.d.ts for TypeScript definitions.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... rest of config
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| console.error everywhere | Structured logging with context | 2024-2025 | Production debugging requires structured logs for observability tools |
| JavaScript i18n files | TypeScript with resource schemas | Vue i18n v9+ (2022) | Compile-time validation prevents runtime translation errors |
| Loose TypeScript mode | Strict mode by default | TypeScript 6.0 (2026) | New projects assume strict; brownfield must migrate incrementally |
| Manual env var validation | Vite ImportMetaEnv typing | Vite 2.0+ (2021) | IDE autocomplete for environment variables |

**Deprecated/outdated:**
- **vuejs-logger** (original library): No Vue 3 support; use vuejs3-logger fork instead
- **Enabling strict without incremental plan**: Modern guidance emphasizes incremental flag enabling for existing codebases
- **Pino/Winston for browser**: Server-side loggers in frontend cause bundle bloat; use Vue-specific loggers

## Open Questions

1. **Quasar TypeScript Configuration Override**
   - What we know: `.quasar/tsconfig.json` is auto-generated
   - What's unclear: How to persistently override compiler options in Quasar projects
   - Recommendation: Research Quasar docs for tsconfig extension mechanism; may need root-level tsconfig.json that extends Quasar's generated config

2. **Existing `any` Types Scope**
   - What we know: 15 explicit `any` occurrences across 3 files (useFormValidation.ts, useSurveyStatusManager.ts, notificationService.ts)
   - What's unclear: Whether implicit `any` types exist (noImplicitAny will reveal)
   - Recommendation: Enable noImplicitAny first to discover full scope

3. **Vue i18n Schema Migration Impact**
   - What we know: i18n files are currently JavaScript with deeply nested structures
   - What's unclear: Whether converting to TypeScript with `as const` will require changes to dynamic key usage patterns
   - Recommendation: Test schema typing with one locale first; verify dynamic keys like `t(variableKey)` still work

4. **Logger Integration with Existing Error Hierarchy**
   - What we know: Project has AppError, AuthError, FirestoreError, ValidationError, ListenerError classes
   - What's unclear: Best pattern for integrating structured logger with error constructors (log on throw vs. log at catch site)
   - Recommendation: Log at catch site to include context (userId, teamId, operation) not available in error constructor

## Sources

### Primary (HIGH confidence)
- TypeScript Official Docs - [Strict Compiler Option](https://www.typescriptlang.org/tsconfig/strict.html)
- Vue i18n Official Docs - [TypeScript Support](https://vue-i18n.intlify.dev/guide/advanced/typescript)
- vuejs3-logger GitHub - [Installation and Configuration](https://github.com/MarcSchaetz/vuejs3-logger)
- Vite Official Docs - [Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- Pino Official Docs - [Browser API](https://github.com/pinojs/pino/blob/main/docs/browser.md)

### Secondary (MEDIUM confidence)
- Better Stack Community - [Pino vs Winston Comparison](https://betterstack.com/community/comparisons/pino-vs-winston/) (verified with official docs)
- OneUptime Blog - [TypeScript Strict Mode Configuration](https://oneuptime.com/blog/post/2026-01-24-typescript-strict-mode/view) (2026-01-24)
- Medium - [Incremental TypeScript Migration](https://kevinwil.de/incremental-migration/)
- SigNoz - [Pino Logger Complete Guide](https://signoz.io/guides/pino-logger/)

### Tertiary (LOW confidence)
- Various GitHub discussions on strict mode migration strategies (2024-2025)
- Community blog posts on Vue i18n TypeScript integration (unverified examples)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vue i18n and vuejs3-logger docs confirm recommendations
- Architecture: HIGH - TypeScript strict mode patterns verified with official docs; logging patterns from library documentation
- Pitfalls: MEDIUM-HIGH - Common pitfalls derived from community experience and official migration guides; Quasar tsconfig override needs verification

**Research date:** 2026-02-15
**Valid until:** 2026-03-17 (30 days - stable ecosystem, TypeScript/Vue i18n APIs unlikely to change)

**Research scope:**
- Files analyzed: 119 (50 TypeScript, 69 Vue)
- Console usage: 105 occurrences across 27 files
- Explicit `any` types: 15 occurrences across 3 files
- TODO comment: 1 in firebase/config.ts (line 7)
- Existing i18n setup: Vue i18n 9.14.5 with JavaScript locale files

# Phase 7: Test Infrastructure - Research

**Researched:** 2026-02-18
**Domain:** Firebase Emulator Suite + Firestore Security Rules Unit Testing + Vitest
**Confidence:** HIGH (stack verified against official Firebase docs, confirmed versions in installed packages)

## Summary

Phase 7 sets up the test infrastructure so developers can run `npm test` (or `yarn test`) against local Firebase emulators instead of the production Firebase project. The two deliverables are: (1) Firebase Auth and Firestore emulators configured and auto-started for tests, and (2) unit tests for all Firestore security rules.

The project already has Vitest 4.0.18, `@vue/test-utils` 2.4.6, and `happy-dom` 20.5.0 in devDependencies, with a `vitest.config.ts` that targets `src/**/__tests__/**/*.test.ts`. The security rules tests are a distinct concern from Vue component tests: they run in `node` environment against a live Firestore emulator process using `@firebase/rules-unit-testing`. The recommended pattern is to use `firebase emulators:exec --only firestore,auth "yarn vitest run"` as the `test:rules` npm script, which starts emulators, runs tests, and shuts down in one command.

The platform is MINGW64_NT (Windows with Git Bash). Firebase CLI 15.5.1 is installed and functional. Java 17 is present (minimum is Java 11). Node.js v22.13.1 meets the `@firebase/rules-unit-testing` v5 minimum of Node 20. There are no blocking platform incompatibilities for running `firebase emulators:exec` from Git Bash, though a known Windows issue causes a dangling CMD window when using `emulators:start` interactively — `emulators:exec` mitigates this in CI-style scripts.

**Primary recommendation:** Add `@firebase/rules-unit-testing` v5 as a dev dependency, add an `emulators` block to `firebase.json`, create a dedicated `vitest.rules.config.ts` with `environment: 'node'`, and wire the whole flow through `firebase emulators:exec --only firestore,auth "yarn vitest run --config vitest.rules.config.ts"`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@firebase/rules-unit-testing` | `^5.0.0` | Firestore/Auth rules unit tests against emulator | Official Firebase library; only library that supports mocking `request.auth` in security rules |
| `firebase` (already installed) | `^11.4.0` | Firebase SDK used in tests for Firestore operations | Already in project; used for `doc()`, `setDoc()`, `getDocs()` calls inside test cases |
| `vitest` (already installed) | `^4.0.18` | Test runner | Already configured in project |
| Firebase CLI (already installed) | `15.5.1` | Starts/stops local emulator processes | Required to run emulators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-admin` | `^13.x` | Admin SDK for seeding data without rules | Optional: useful for seeding fixture data in `beforeAll` hooks without bypassing through `withSecurityRulesDisabled` |
| `fs/promises` (built-in Node) | Node 22 | Read `firestore.rules` file at test runtime | Required by `initializeTestEnvironment` to load rules content |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@firebase/rules-unit-testing` | Firebase REST API testing | REST approach does not support mocking `request.auth.token` custom claims; rules-unit-testing is the only way |
| `firebase emulators:exec` | `vitest globalSetup` that spawns emulator process | `globalSetup` approach works but requires manually managing process lifecycle; `emulators:exec` is simpler and officially supported |
| Separate `vitest.rules.config.ts` | Single vitest config with `environmentMatchGlobs` | `environmentMatchGlobs` works but mixing `node` and `happy-dom` in one config is fragile; separate config is explicit |

**Installation:**
```bash
yarn add -D @firebase/rules-unit-testing
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── __tests__/              # Vue component tests (happy-dom, existing config)
└── (no rules tests here)

tests/
└── rules/                  # Firestore security rules tests (node environment)
    ├── helpers/
    │   └── setup.ts        # shared initializeTestEnvironment wrapper
    ├── surveys.rules.test.ts
    ├── teams.rules.test.ts
    ├── users.rules.test.ts
    ├── invitations.rules.test.ts
    └── notifications.rules.test.ts

vitest.rules.config.ts      # separate config for rules tests (environment: node)
```

**Why separate `tests/rules/` from `src/**/__tests__/`:**
Security rules tests run against a live emulator process and require `environment: 'node'`. Vue component tests use `environment: 'happy-dom'`. Mixing them in one config glob requires `environmentMatchGlobs`, which is error-prone. Separate configs are the explicit approach.

### Pattern 1: firebase.json Emulator Configuration
**What:** Add `emulators` block to existing `firebase.json`
**When to use:** Always — this tells Firebase CLI which emulators to start and on which ports

```json
{
  "firestore": {
    "database": "(default)",
    "location": "eur3",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist/spa",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### Pattern 2: Dedicated Vitest Config for Rules Tests
**What:** `vitest.rules.config.ts` with `environment: 'node'`
**When to use:** All security rules tests — they run in Node.js against a real emulator, not a browser mock

```typescript
// Source: https://vitest.dev/config/ + https://vitest.dev/guide/environment
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.rules.test.ts'],
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
```

**Why `environment: 'node'`:** The `@firebase/rules-unit-testing` library makes HTTP calls to the emulator REST API. Running in `happy-dom` or `jsdom` causes module resolution failures because the Firebase modular SDK resolves differently in browser vs Node contexts. Issue #6905 on firebase-js-sdk confirmed this was a Vite/browser-mode problem; the fix is `environment: 'node'`.

### Pattern 3: Test Environment Initialization
**What:** `initializeTestEnvironment` creates an isolated Firestore test environment with mocked auth
**When to use:** In `beforeAll` of every rules test file

```typescript
// Source: https://firebase.google.com/docs/rules/unit-tests
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'club-surveys-test',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})
```

### Pattern 4: Seeding Data and Asserting Rules
**What:** Use `withSecurityRulesDisabled` to seed fixture data, then test with authenticated/unauthenticated contexts

```typescript
// Source: https://firebase.google.com/docs/rules/unit-tests
describe('surveys collection', () => {
  const TEAM_ID = 'team-001'
  const POWER_USER_UID = 'power-uid'
  const MEMBER_UID = 'member-uid'
  const STRANGER_UID = 'stranger-uid'

  beforeEach(async () => {
    // Seed: create team document with members + powerusers
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'Test Team',
        creator: POWER_USER_UID,
        members: [POWER_USER_UID, MEMBER_UID],
        powerusers: [POWER_USER_UID],
      })
      await setDoc(doc(ctx.firestore(), `surveys/survey-001`), {
        teamId: TEAM_ID,
        title: 'Match vs Sparta',
        date: '2026-03-01',
        votes: {},
      })
    })
  })

  it('allows power user to read survey', async () => {
    const powerCtx = testEnv.authenticatedContext(POWER_USER_UID)
    const ref = doc(powerCtx.firestore(), 'surveys/survey-001')
    await assertSucceeds(getDoc(ref))
  })

  it('denies unauthenticated read of survey', async () => {
    const unauthedCtx = testEnv.unauthenticatedContext()
    const ref = doc(unauthedCtx.firestore(), 'surveys/survey-001')
    await assertFails(getDoc(ref))
  })

  it('allows team member to read survey', async () => {
    const memberCtx = testEnv.authenticatedContext(MEMBER_UID)
    const ref = doc(memberCtx.firestore(), 'surveys/survey-001')
    await assertSucceeds(getDoc(ref))
  })

  it('denies non-member read of survey', async () => {
    const strangerCtx = testEnv.authenticatedContext(STRANGER_UID)
    const ref = doc(strangerCtx.firestore(), 'surveys/survey-001')
    await assertFails(getDoc(ref))
  })
})
```

### Pattern 5: Mocking Custom Claims (Admin Token)
**What:** Pass token options to `authenticatedContext` to simulate custom claims like `admin: true`

```typescript
// Source: https://firebase.google.com/docs/rules/unit-tests
const adminCtx = testEnv.authenticatedContext('admin-uid', {
  admin: true,
  email: 'admin@example.com',
})
```

This matches the rule `request.auth.token.admin == true` used in `isAppAdmin()`.

### Pattern 6: npm Scripts Wiring
**What:** Package.json scripts that tie together emulator lifecycle and test execution

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:rules": "firebase emulators:exec --only firestore,auth \"yarn vitest run --config vitest.rules.config.ts\"",
    "test:rules:watch": "firebase emulators:start --only firestore,auth",
    "emulators:start": "firebase emulators:start --only firestore,auth"
  }
}
```

**Why `emulators:exec` for `test:rules`:** Starts emulators, runs the vitest process, and shuts down emulators on completion. No dangling processes. The test runner receives the exit code of the test script, so CI sees success/failure correctly.

### Anti-Patterns to Avoid
- **Using `environment: 'happy-dom'` for rules tests:** Causes Firebase module resolution to load browser CJS bundles instead of Node ES modules. Results in runtime errors like "Expected first argument to collection() to be a CollectionReference". Use `environment: 'node'`.
- **Single global `initializeTestEnvironment` in `beforeAll` shared across files without `clearFirestore`:** Tests bleed state into each other. Call `testEnv.clearFirestore()` in `afterEach`.
- **Using `connectFirestoreEmulator` from firebase client SDK in rules tests:** Rules tests use `@firebase/rules-unit-testing`'s `.firestore()` context object, not a manually connected Firestore instance. Do not mix the two.
- **Running rules tests without the emulator running:** `initializeTestEnvironment` will fail silently or with confusing errors. Always use `emulators:exec` or ensure emulators are running before running the test command.
- **Hardcoding `projectId: 'club-surveys'` (production ID) in test config:** Use a different ID like `'club-surveys-test'` to prevent any accidental production connection. The emulator accepts any string.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mocking `request.auth` in security rules tests | Custom auth mock object | `testEnv.authenticatedContext(uid, tokenOptions)` | Only `@firebase/rules-unit-testing` properly injects the auth token the Firestore emulator verifies |
| Seeding test data bypassing security rules | Custom admin setup | `testEnv.withSecurityRulesDisabled(async (ctx) => {...})` | Guaranteed bypass without race conditions or special admin tokens |
| Clearing Firestore between tests | DELETE requests to emulator REST API | `testEnv.clearFirestore()` | Official method; handles all collections atomically |
| Asserting that Firestore operations fail | `try/catch` with custom error matching | `assertFails(promise)` | `assertFails` also verifies the error is a permission-denied type, not a network or other error |
| Emulator lifecycle in tests | Custom Node.js child_process spawning | `firebase emulators:exec "..."` | Official Firebase CLI handles port binding, readiness checks, and cleanup |

**Key insight:** The `@firebase/rules-unit-testing` library exists precisely because rules testing with raw Firebase SDK is impossible — you cannot simulate `request.auth` through the client SDK. Any custom approach will be wrong.

---

## Common Pitfalls

### Pitfall 1: Wrong Vitest Environment for Rules Tests
**What goes wrong:** Using `environment: 'happy-dom'` (the current default in `vitest.config.ts`) for rules tests causes Vite to load the browser-bundle of Firebase, which is incompatible with `@firebase/rules-unit-testing`'s Node.js internals. Error: "Expected first argument to collection() to be a CollectionReference".
**Why it happens:** `happy-dom` activates Vite's SSR/browser transform mode, changing how Firebase package exports resolve.
**How to avoid:** Create a separate `vitest.rules.config.ts` with `environment: 'node'`. Do not add rules tests to the existing `vitest.config.ts` glob.
**Warning signs:** Import errors about CollectionReference or FirebaseFirestore at test startup.

### Pitfall 2: Missing `singleProjectMode` in firebase.json
**What goes wrong:** Emulator starts but `initializeTestEnvironment` with a test project ID throws "Project ID mismatch" or the emulator refuses connections because the project doesn't exist in Firebase.
**Why it happens:** Without `singleProjectMode: true`, the emulator tries to validate the project ID against Firebase.
**How to avoid:** Add `"singleProjectMode": true` to the `emulators` block in `firebase.json`.
**Warning signs:** `initializeTestEnvironment` hangs or throws on connection.

### Pitfall 3: `firestore.rules` Path in `initializeTestEnvironment`
**What goes wrong:** `readFileSync('firestore.rules', 'utf8')` resolves relative to the process CWD, not the test file. If tests run from a subdirectory, the path breaks.
**Why it happens:** Node `readFileSync` with a relative path uses `process.cwd()`.
**How to avoid:** Use `path.resolve(__dirname, '../../firestore.rules')` or `path.resolve(process.cwd(), 'firestore.rules')`. Confirm CWD is the project root when running via `yarn test:rules`.
**Warning signs:** `Error: ENOENT: no such file or directory, open 'firestore.rules'`.

### Pitfall 4: Windows Dangling CMD Window with `emulators:start`
**What goes wrong:** On MINGW64/Windows, `firebase emulators:start` opens a new CMD window that doesn't close when the main process exits. This blocks re-runs without manual cleanup.
**Why it happens:** Firebase CLI on Windows uses `cmd.exe` as a subprocess for the Java process.
**How to avoid:** Use `firebase emulators:exec "..."` instead of `emulators:start` in the `test:rules` npm script. The `exec` variant manages the subprocess lifecycle. For interactive development, use the `emulators:start` script separately, then run `yarn vitest run --config vitest.rules.config.ts` in another terminal.
**Warning signs:** Port 8080 already in use errors on the second test run. Hanging terminal after test completes.

### Pitfall 5: Data Bleed Between Tests
**What goes wrong:** One test creates a document and a later test fails because unexpected data exists (or was deleted).
**Why it happens:** The emulator persists data in memory across tests within a single `emulators:exec` run.
**How to avoid:** Call `await testEnv.clearFirestore()` in `afterEach`, not `afterAll`. This ensures each test starts with a clean state.
**Warning signs:** Tests pass individually but fail when run in full suite.

### Pitfall 6: Using Production Firebase SDK in Rules Tests
**What goes wrong:** Importing `getFirestore(app)` where `app = initializeApp(firebaseConfig)` and calling `connectFirestoreEmulator` instead of using `testEnv.authenticatedContext().firestore()`. The rule mocking doesn't apply.
**Why it happens:** Developers confuse two separate concerns: the app's emulator connection (for `src/firebase/config.ts`) vs the test environment's isolated Firestore context.
**How to avoid:** In rules test files, only use the Firestore instance from `testEnv.authenticatedContext(uid).firestore()` or `testEnv.unauthenticatedContext().firestore()`. Never import from `src/firebase/config.ts` in rules tests.
**Warning signs:** All `assertFails` assertions pass (meaning everything is denied), or all `assertSucceeds` assertions fail (meaning rules aren't applied).

---

## Code Examples

### Complete `initializeTestEnvironment` Setup
```typescript
// Source: https://firebase.google.com/docs/rules/unit-tests
// tests/rules/helpers/setup.ts
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'club-surveys-test',  // NOT the production project ID
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  })
}
```

### Authenticated Context with Custom Claim
```typescript
// Source: https://firebase.google.com/docs/rules/unit-tests
// Simulates isAppAdmin() rule: request.auth.token.admin == true
const adminCtx = testEnv.authenticatedContext('admin-uid', { admin: true })

// Simulates a regular user (no custom claims)
const memberCtx = testEnv.authenticatedContext('member-uid')

// Simulates unauthenticated request
const unauthedCtx = testEnv.unauthenticatedContext()
```

### Full Test File Structure
```typescript
// tests/rules/teams.rules.test.ts
import { describe, it, beforeAll, beforeEach, afterEach, afterAll, expect } from 'vitest'
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createTestEnv } from './helpers/setup'

let testEnv: RulesTestEnvironment

const TEAM_ID = 'team-001'
const CREATOR_UID = 'creator-uid'
const POWER_UID = 'power-uid'
const MEMBER_UID = 'member-uid'
const OUTSIDER_UID = 'outsider-uid'

beforeAll(async () => {
  testEnv = await createTestEnv()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('teams/{teamId} - read', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID, POWER_UID, MEMBER_UID],
        powerusers: [CREATOR_UID, POWER_UID],
      })
    })
  })

  it('allows team member to read team', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('denies outsider read of team', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('denies unauthenticated read of team', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('allows app admin to read team', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })
})
```

### Environment Variable for Emulator Host
```typescript
// @firebase/rules-unit-testing automatically reads FIRESTORE_EMULATOR_HOST
// firebase emulators:exec sets this automatically; if running manually:
// export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
```

---

## Collections Requiring Rule Coverage

Based on `firestore.rules`, the following collections need both allow and deny tests:

| Collection | Key Rules to Test |
|------------|------------------|
| `surveys/{surveyId}` | power user create/read/write/delete; member read; member update votes only; non-member deny; admin read/delete |
| `surveys/{surveyId}/votes/{voteId}` | member read; member create/update own vote (voteId == auth.uid); power user full access; non-member deny |
| `teams/{teamId}` | member read/write; outsider deny; creator/admin delete; create (self as creator/member/poweruser); update (join: add self only) |
| `teams/{teamId}/cashboxTransactions/{id}` | member read/write; non-member deny; admin read/delete |
| `teams/{teamId}/fineRules/{id}` | member read; power user write; outsider deny |
| `teams/{teamId}/fines/{id}` | member read; power user write; outsider deny |
| `teams/{teamId}/payments/{id}` | member read; power user write; outsider deny |
| `teams/{teamId}/cashboxHistory/{id}` | member read; power user write; outsider deny |
| `teams/{teamId}/auditLogs/{id}` | power user read; member create (actorUid == auth.uid, teamId matches); non-member deny; admin read/delete |
| `users/{userId}` | own read/write; other authenticated can read; unauthenticated deny |
| `teamInvitations/{id}` | power user create; invitee read; power user read; invitee update status; power user delete; admin read/delete |
| `notifications/{id}` | own read/write; any authenticated create; team creator/admin read/delete |
| `messages/{id}` | member read; power user create; team creator/admin delete |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@firebase/testing` (deprecated) | `@firebase/rules-unit-testing` | ~2021 | Old package removed; new package has `initializeTestEnvironment` API |
| `initializeTestApp` API | `initializeTestEnvironment` + contexts | v2.0 of rules-unit-testing | New API is more explicit about emulator connection; old API is gone |
| Jest as test runner | Vitest (already in project) | Project started with Vitest | No migration needed; Vitest 0.30+ fixed Firebase module resolution |
| `@firebase/rules-unit-testing` v4.0.x | v5.0.0 | Nov 2024 | v5 requires Node 20+ (project has Node 22); drops ES5 bundles |

**Deprecated/outdated:**
- `@firebase/testing`: Do not install. This is the legacy package fully replaced by `@firebase/rules-unit-testing`.
- `firebase.rules.testapp.initializeTestApp`: Old API, removed. Use `initializeTestEnvironment`.
- `clearFirestoreData` (standalone function): Replaced by `testEnv.clearFirestore()` method.

---

## Open Questions

1. **`firebase emulators:exec` on MINGW64 — script quoting**
   - What we know: `emulators:exec` works on Windows but the child script string must be properly quoted when passed from `package.json` via yarn on Git Bash
   - What's unclear: Whether `yarn test:rules` correctly passes `"yarn vitest run --config vitest.rules.config.ts"` through to the CLI without shell quoting issues on MINGW64
   - Recommendation: Test the script manually in Git Bash during implementation; if quoting fails, fallback to a `test-rules.sh` shell script instead of an inline string

2. **`@firebase/rules-unit-testing` v5 vs v4 compatibility with Firebase 11.4.0**
   - What we know: v5 updated peer deps to firebase@11.x and requires Node 20+; v4.0.1 was confirmed working with firebase@11.0.1
   - What's unclear: Whether v5.0.0 introduced any API changes beyond Node requirement
   - Recommendation: Install v5 first; if import errors appear, pin to v4.0.1

3. **Windows dangling CMD window with `emulators:exec`**
   - What we know: `emulators:start` leaves a dangling CMD window on Windows; `emulators:exec` is supposed to handle cleanup but the underlying issue (Java subprocess via cmd.exe) may still apply
   - What's unclear: Whether CLI 15.5.1 has fixed the CMD window behavior for `emulators:exec`
   - Recommendation: Treat this as a known risk; document in PLAN.md that if `emulators:exec` leaves orphaned Java processes, developers need to kill port 8080/9099 manually before the next run. Consider adding `GCLOUD_PROJECT=club-surveys-test` env var to prevent any accidental production project lookup.

---

## Sources

### Primary (HIGH confidence)
- Firebase official docs: `https://firebase.google.com/docs/rules/unit-tests` — `initializeTestEnvironment`, `RulesTestEnvironment`, `assertSucceeds`, `assertFails` API
- Firebase official docs: `https://firebase.google.com/docs/emulator-suite/install_and_configure` — emulator setup, firebase.json format
- Vitest official docs: `https://vitest.dev/config/globalsetup` — globalSetup file pattern
- Vitest official docs: `https://vitest.dev/guide/environment` — environment options (node/happy-dom/jsdom)
- `@firebase/rules-unit-testing` CHANGELOG: `https://github.com/firebase/firebase-js-sdk/blob/main/packages/rules-unit-testing/CHANGELOG.md` — v5.0.0 Node 20 requirement, v4.0.0 ES2017 requirement

### Secondary (MEDIUM confidence)
- GitHub firebase-js-sdk issue #6905: `https://github.com/firebase/firebase-js-sdk/issues/6905` — confirmed `environment: 'node'` fix for Vitest + Firebase module resolution
- StackBlitz example: `https://stackblitz.com/edit/vitejs-vite-eugcsg?file=index.test.ts` — working pattern with `initializeTestEnvironment` and `assertFails`
- Firebase quickstart-testing repo: `https://github.com/firebase/quickstart-testing` — v9 test examples (Mocha-based, patterns transferable)
- firebase-tools issue #5217: `https://github.com/firebase/firebase-tools/issues/5217` — Windows dangling CMD window behavior

### Tertiary (LOW confidence)
- Multiple WebSearch results confirming `firebase emulators:exec --only firestore,auth "..."` pattern for running tests — not from a single authoritative source but consistent across multiple developer articles
- GitHub Gist "Testing firebase rules with vitest": `https://gist.github.com/honungsburk/c78f40bfb41b5027eef3c4af1c8d6ea3` — could not fetch content (rate limited), but referenced in multiple community discussions as a working pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from package.json, Firebase CLI, and npm changelog
- Architecture patterns: HIGH — `initializeTestEnvironment` API from official Firebase docs; Vitest config from official Vitest docs
- Windows MINGW64 compatibility: MEDIUM — confirmed `emulators:exec` works in principle; specific quoting behavior in MINGW64 shell needs manual verification during implementation
- Pitfalls: HIGH — environment pitfall verified from GitHub issue #6905 (resolved in Vitest 0.30+, now on 4.0.18); data bleed pitfall from official docs warning

**Research date:** 2026-02-18
**Valid until:** 2026-05-18 (stable ecosystem, Firebase emulator API is stable, 90-day window reasonable)

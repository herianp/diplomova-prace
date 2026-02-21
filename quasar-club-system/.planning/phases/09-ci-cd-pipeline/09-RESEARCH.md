# Phase 9: CI/CD Pipeline - Research

**Researched:** 2026-02-19
**Domain:** GitHub Actions, Firebase Hosting deployment, Vitest coverage reporting in CI
**Confidence:** HIGH for GitHub Actions core patterns; MEDIUM for Firebase deploy action authentication details (WebFetch partial content)

## Summary

Phase 9 wires up two GitHub Actions workflows: a PR check workflow (lint + unit tests + coverage + build) and a deploy workflow (same checks plus Firebase Hosting deployment on master push). The project has no existing `.github/workflows/` directory and no CI configuration of any kind — everything is created from scratch.

The primary complication is the security rules test suite (`yarn test:rules`), which requires Java 17+ and the Firebase emulator to run. GitHub Actions `ubuntu-latest` runners include Java but it must be configured explicitly via `actions/setup-java@v4`. The local project uses `firebase-tools@13.35.1` (pinned for Java 17 compatibility) — this version is already in `devDependencies`, so `yarn install` makes it available without any global install needed. The emulator download (~200 MB) should be cached across CI runs to avoid repeated downloads.

Firebase Hosting deployment uses the official `FirebaseExtended/action-hosting-deploy@v0` action, which authenticates via a service account JSON secret (`FIREBASE_SERVICE_ACCOUNT`). `FIREBASE_TOKEN` (the old `firebase login:ci` token) still works through the generic `w9jds/firebase-action` but is less preferred — service account is the current recommended approach per the official action. Coverage reporting in PR comments uses `davelosert/vitest-coverage-report-action@v2`, which reads `coverage/coverage-final.json` and `coverage/coverage-summary.json` from vitest's `v8` reporter output. Coverage threshold enforcement is handled natively by Vitest (already configured at 70%): if thresholds fail, `yarn test:coverage` exits non-zero, which fails the job.

**Primary recommendation:** Two workflow files — `.github/workflows/ci.yml` (PR checks) and `.github/workflows/deploy.yml` (master deploy). Keep security rules tests in the CI workflow but make them a separate job to isolate Java dependency. Use `actions/setup-node@v4` with `cache: 'yarn'` for dependency caching. Cache Firebase emulator binaries with `actions/cache@v4`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `actions/checkout` | `v4` | Checkout repo in CI | Official GitHub action, required first step |
| `actions/setup-node` | `v4` | Node.js setup + yarn cache | Official; built-in `cache: 'yarn'` eliminates custom cache config |
| `actions/setup-java` | `v4` | JDK for Firebase emulator | Official; supports Temurin distribution, required for `firebase emulators:exec` |
| `actions/cache` | `v4` | Cache Firebase emulator binaries | Official; prevents re-downloading ~200 MB emulator on every run |
| `FirebaseExtended/action-hosting-deploy` | `v0` | Deploy to Firebase Hosting | Official Firebase action; service account auth |
| `davelosert/vitest-coverage-report-action` | `v2` | Post coverage report to PR | Most widely used vitest-specific action; reads vitest's coverage-final.json natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-tools` (already in devDependencies) | `13.35.1` | Firebase CLI in CI via yarn | Available after `yarn install` — no global install needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `FirebaseExtended/action-hosting-deploy` | `w9jds/firebase-action` + `FIREBASE_TOKEN` | `firebase login:ci` token works but service account is the officially recommended path; `action-hosting-deploy` is maintained by Firebase team |
| `davelosert/vitest-coverage-report-action` | Custom lcov upload + `romeovs/lcov-reporter-action` | The custom approach requires more config; vitest-coverage-report-action is built specifically for vitest and reads its output format |
| Job-level matrix | Separate workflow files | Matrix adds complexity; two focused workflow files (ci.yml, deploy.yml) are clearer |

**Installation:** No new packages needed. All tools are either GitHub Actions or already in devDependencies.

---

## Architecture Patterns

### Recommended File Structure
```
.github/
└── workflows/
    ├── ci.yml        # Triggers on PR: lint + unit tests + coverage + build + security rules
    └── deploy.yml    # Triggers on master push: same checks + Firebase Hosting deploy
```

### Pattern 1: PR CI Workflow (ci.yml)
**What:** Runs on every PR targeting master. Three jobs: `lint-and-build`, `unit-tests`, `security-rules-tests`. Jobs can run in parallel (lint-and-build and unit-tests are independent; security-rules-tests needs Java so isolated).
**When to use:** PR check — blocks merge if any job fails.

```yaml
# Source: https://docs.github.com/en/actions/writing-workflows
name: CI

on:
  pull_request:
    branches: [master]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn build

  unit-tests:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test:coverage
      - uses: davelosert/vitest-coverage-report-action@v2
        if: always()
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  security-rules-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Cache Firebase emulator binaries
        uses: actions/cache@v4
        with:
          path: ~/.cache/firebase/emulators
          key: firebase-emulators-${{ hashFiles('package.json') }}
      - run: yarn install --frozen-lockfile
      - run: yarn test:rules
```

### Pattern 2: Master Deploy Workflow (deploy.yml)
**What:** Runs on push to master. Re-runs the same checks, then deploys to Firebase Hosting only if all checks pass.
**When to use:** Production deployment — only on master.

```yaml
name: Deploy

on:
  push:
    branches: [master]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Cache Firebase emulator binaries
        uses: actions/cache@v4
        with:
          path: ~/.cache/firebase/emulators
          key: firebase-emulators-${{ hashFiles('package.json') }}
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test:coverage
      - run: yarn test:rules
      - run: yarn build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: club-surveys
```

### Pattern 3: Coverage Threshold Enforcement
**What:** Vitest's `thresholds` config (already in `vitest.config.ts`) causes `yarn test:coverage` to exit non-zero if thresholds are not met. No extra CI configuration needed.
**Key fact:** Thresholds are already set to 70% in `vitest.config.ts` for lines, functions, branches, statements. CI inherits this automatically.

```typescript
// Already configured in vitest.config.ts
thresholds: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70
}
```

### Pattern 4: vitest-coverage-report-action Setup
**What:** Reads `coverage/coverage-final.json` (for per-file detail) and `coverage/coverage-summary.json` (for summary). Both are produced by vitest's `v8` provider with `lcov` reporter. The project already has `reporter: ['text', 'lcov', 'html']` — but `json` and `json-summary` reporters must be added for the action to work.
**When to use:** On every PR run, even if tests fail (`if: always()`).

```typescript
// vitest.config.ts change needed: add json and json-summary reporters
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],  // add json, json-summary
  // ... rest unchanged
}
```

### Anti-Patterns to Avoid
- **Caching `node_modules`:** Don't cache `node_modules` directly. Cache the yarn cache directory (done automatically by `actions/setup-node` with `cache: 'yarn'`). `node_modules` caching breaks across OS and Node versions.
- **Global firebase-tools install:** Don't `npm install -g firebase-tools` in CI. The project has `firebase-tools@13.35.1` in devDependencies — after `yarn install`, `./node_modules/.bin/firebase` is available and `yarn test:rules` invokes it correctly.
- **Single monolithic job:** Don't put lint, tests, and deploy in one job. A lint failure should not block coverage reporting. Use separate jobs for parallelism and clearer failure attribution.
- **FIREBASE_TOKEN approach:** Don't use `firebase login:ci` token for the hosting deploy action. The `FirebaseExtended/action-hosting-deploy` action expects `firebaseServiceAccount`. Use service account JSON.
- **Running `yarn test:rules` without Java setup:** The emulator requires JDK. If `setup-java` step is omitted, `firebase emulators:exec` fails silently or throws JVM errors.
- **Skipping `--frozen-lockfile`:** Always use `yarn install --frozen-lockfile` in CI to prevent lock file drift. Without it, CI may install different versions than local.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage PR comments | Custom script parsing lcov | `davelosert/vitest-coverage-report-action@v2` | Handles diff coverage, per-file breakdowns, threshold icons — complex to replicate |
| Firebase Hosting deploy | `firebase deploy` with manual token | `FirebaseExtended/action-hosting-deploy@v0` | Handles OIDC auth, preview channels, deploy metadata — official and maintained |
| Dependency caching | Custom `actions/cache` with yarn paths | `actions/setup-node@v4` with `cache: 'yarn'` | Built-in cache handles yarn global cache dir correctly across platforms |
| Emulator binary caching | No caching (re-download each run) | `actions/cache@v4` on `~/.cache/firebase/emulators` | Emulator JARs are ~200 MB; without caching, every run downloads them |

**Key insight:** GitHub Actions marketplace has well-maintained actions for every step in this pipeline. Custom shell scripts should be limited to `yarn lint`, `yarn test`, `yarn build` — everything else uses a marketplace action.

---

## Common Pitfalls

### Pitfall 1: Firebase Emulator JVM Not Found
**What goes wrong:** `yarn test:rules` fails with `Error: Could not find java. Please install java to use the Firebase Emulator` or similar JVM path error.
**Why it happens:** `ubuntu-latest` includes Java but `actions/setup-java` is still needed to ensure the correct JDK version is on PATH before firebase-tools runs.
**How to avoid:** Always add `actions/setup-java@v4` with `distribution: 'temurin'` and `java-version: '17'` before the `yarn test:rules` step.
**Warning signs:** CI log shows `firebase emulators:exec` starting but immediately failing; no emulator UI log output.

### Pitfall 2: Coverage Report Action Missing JSON Reporter
**What goes wrong:** `davelosert/vitest-coverage-report-action` posts no comment or fails with "Coverage file not found".
**Why it happens:** The action requires `coverage/coverage-final.json` and `coverage/coverage-summary.json`. The current `vitest.config.ts` only has `['text', 'lcov', 'html']` reporters — `json` and `json-summary` are missing.
**How to avoid:** Add `'json'` and `'json-summary'` to the coverage `reporter` array in `vitest.config.ts`.
**Warning signs:** CI step for coverage action shows "Could not find coverage-final.json" or "No coverage data" in action logs.

### Pitfall 3: VITE_FIREBASE_API_KEY Missing in Build/Test
**What goes wrong:** `yarn build` or unit tests that touch `src/firebase/config.ts` fail because `import.meta.env.VITE_FIREBASE_API_KEY` is undefined.
**Why it happens:** Vite environment variables must be present at build time. The `.env` file is gitignored and not available in CI.
**How to avoid:** Store `VITE_FIREBASE_API_KEY` as a GitHub Actions secret and expose it via `env:` block on the job or step that runs `yarn build` and `yarn test`.
**Warning signs:** Build output shows undefined API key errors; Firebase SDK throws "Invalid API key" at module initialization.

### Pitfall 4: Emulator Port Already in Use
**What goes wrong:** `firebase emulators:exec` fails because port 8080 or 9099 is already bound.
**Why it happens:** On GitHub Actions ubuntu-latest runners this is uncommon (fresh VM per run) but can happen if the emulator process from a previous failed run wasn't cleaned up. More likely to happen locally than in CI.
**How to avoid:** Not a CI issue — but be aware the known local issue (residual Java process on port 8080) does not affect CI since each run gets a fresh VM.
**Warning signs:** `Error: listen EADDRINUSE: address already in use :::8080`.

### Pitfall 5: Firebase Service Account Secret Not Configured
**What goes wrong:** `FirebaseExtended/action-hosting-deploy` fails with authentication error.
**Why it happens:** The `FIREBASE_SERVICE_ACCOUNT` secret must be created manually in the GitHub repo settings. It is not auto-generated.
**How to avoid:** Generate service account via `firebase init hosting:github` (or GCP IAM console), download JSON, store as GitHub repository secret `FIREBASE_SERVICE_ACCOUNT`.
**Warning signs:** Action logs show "Error: Failed to authenticate to Firebase" or "Credential error".

### Pitfall 6: `yarn test:rules` Hangs in CI Without Timeout
**What goes wrong:** The `firebase emulators:exec` process hangs if the inner test command crashes before emulators can shut down gracefully.
**Why it happens:** If vitest crashes (e.g., OOM), `emulators:exec` may never receive the exit signal and the CI job hangs until timeout (default 6 hours).
**How to avoid:** Set `timeout-minutes: 15` on the security-rules job.
**Warning signs:** CI job runs for unexpectedly long time with no log output.

---

## Code Examples

### Complete CI Workflow
```yaml
# .github/workflows/ci.yml
# Source: GitHub Actions docs + Firebase Hosting docs + vitest-coverage-report-action README
name: CI

on:
  pull_request:
    branches: [master]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn build

  unit-tests:
    runs-on: ubuntu-latest
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test:coverage
      - uses: davelosert/vitest-coverage-report-action@v2
        if: always()
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  security-rules-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Cache Firebase emulator binaries
        uses: actions/cache@v4
        with:
          path: ~/.cache/firebase/emulators
          key: firebase-emulators-${{ hashFiles('package.json') }}
      - run: yarn install --frozen-lockfile
      - run: yarn test:rules
```

### Complete Deploy Workflow
```yaml
# .github/workflows/deploy.yml
# Source: FirebaseExtended/action-hosting-deploy README
name: Deploy to Firebase Hosting

on:
  push:
    branches: [master]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Cache Firebase emulator binaries
        uses: actions/cache@v4
        with:
          path: ~/.cache/firebase/emulators
          key: firebase-emulators-${{ hashFiles('package.json') }}
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test:coverage
      - run: yarn test:rules
      - run: yarn build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: club-surveys
```

### vitest.config.ts Coverage Reporter Fix
```typescript
// Add 'json' and 'json-summary' to enable vitest-coverage-report-action
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],  // json + json-summary required
  // ... rest unchanged
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `firebase login:ci` + FIREBASE_TOKEN | Service account JSON + `FIREBASE_SERVICE_ACCOUNT` | ~2022 (action-hosting-deploy v0.7+) | Service account is more granular, doesn't expire |
| `actions/cache@v2` | `actions/cache@v4` | 2023 | v4 has better performance and error handling |
| `actions/setup-node@v2` | `actions/setup-node@v4` | 2023 | v4 has better yarn v1 cache support |
| `actions/setup-java@v2` | `actions/setup-java@v4` | 2023 | v4 supports Temurin distribution properly |
| Caching `node_modules` | Caching yarn cache via `setup-node cache: 'yarn'` | 2021+ | node_modules caching causes subtle bugs across OS/Node versions |

**Deprecated/outdated:**
- `FIREBASE_TOKEN` via `firebase login:ci`: Still works with generic firebase-action but not recommended; service account preferred for `action-hosting-deploy`.
- `actions/cache@v2`, `v3`: Use v4.
- `temurin` spelled `adopt` or `adoptopenjdk`: Distribution name changed; use `temurin` for Eclipse Temurin (formerly AdoptOpenJDK).

---

## Open Questions

1. **Should `yarn test:rules` run in the CI workflow PR checks or only in deploy?**
   - What we know: The success criteria says "GitHub PR triggers automated workflow running lint, tests, and build checks" — "tests" arguably includes security rules tests.
   - What's unclear: Security rules tests add ~2 min and Java setup overhead per PR. It may be acceptable to skip on PRs and run only on master deploy.
   - Recommendation: Include in both for maximum safety (Phase 8 established these tests as part of the test suite). If PR cycle time becomes a concern, this can be relaxed later.

2. **Service account permission scope for `FIREBASE_SERVICE_ACCOUNT`?**
   - What we know: Firebase Hosting deployment requires "Firebase Hosting Admin" role on the service account. The `firebase init hosting:github` CLI command creates this automatically.
   - What's unclear: Whether the GCP project has the Firebase Hosting API enabled and whether the correct IAM roles are already attached.
   - Recommendation: Generate service account via `firebase init hosting:github` — this is the officially documented path and sets up permissions correctly.

3. **Does `ubuntu-latest` have Java pre-installed?**
   - What we know: `ubuntu-latest` (ubuntu-24.04 as of 2025) includes Java in the runner image, but the version may not be 17 and the PATH may not be set correctly for firebase-tools.
   - Recommendation: Always use `actions/setup-java@v4` explicitly; don't rely on pre-installed Java. This is deterministic and documented.

4. **Should the CI workflow use `concurrency` to cancel in-progress runs?**
   - What we know: For PRs, canceling older runs when new commits are pushed is good practice to avoid wasted compute.
   - Recommendation: Add `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` to ci.yml but NOT to deploy.yml (don't want to cancel an in-progress production deploy).

---

## Sources

### Primary (HIGH confidence)
- Official GitHub Actions docs (https://docs.github.com/en/actions) — workflow syntax, job/step structure, secrets access
- `actions/setup-node` README (https://github.com/actions/setup-node) — `cache: 'yarn'` built-in caching
- `actions/setup-java` README (https://github.com/actions/setup-java) — Temurin distribution, java-version parameter
- `FirebaseExtended/action-hosting-deploy` README (https://github.com/FirebaseExtended/action-hosting-deploy) — firebaseServiceAccount auth, v0.10.0 current version, projectId and channelId params
- `vitest.config.ts` in project — thresholds already at 70%, reporters already include lcov
- `package.json` in project — firebase-tools@13.35.1 in devDependencies, yarn as package manager, Node engine `>=18`

### Secondary (MEDIUM confidence)
- WebSearch: `davelosert/vitest-coverage-report-action@v2` — widely cited, requires json and json-summary reporters (multiple sources agree)
- WebSearch: yarn cache best practice — `actions/setup-node` with `cache: 'yarn'` confirmed as standard approach by multiple community sources
- WebSearch: Firebase emulator Java setup — `actions/setup-java@v4` with temurin/17 confirmed by multiple CI examples
- Firebase Hosting GitHub integration docs (https://firebase.google.com/docs/hosting/github-integration) — partial content retrieved; mentions service account approach

### Tertiary (LOW confidence)
- Firebase emulator binary cache path `~/.cache/firebase/emulators` — confirmed from Phase 7 research context and community examples, but not directly verified against official Firebase docs in this research session.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all actions are well-documented on GitHub Marketplace; project files confirm yarn, Node 22, firebase-tools in devDependencies
- Architecture (workflow structure): HIGH — GitHub Actions workflow YAML syntax is stable and well-documented
- Firebase deployment auth: MEDIUM — WebFetch confirmed service account is current approach but did not retrieve full official Firebase docs
- Pitfalls: HIGH — most are derived from direct project analysis (existing config, known Windows issues from prior phases) plus multiple corroborating community sources

**Research date:** 2026-02-19
**Valid until:** 2026-05-19 (GitHub Actions action versions are stable; check for major version bumps before planning if near deadline)

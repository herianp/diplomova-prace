# Technology Stack for Production Hardening

**Domain:** Vue 3 + Quasar + Firebase Production Hardening
**Researched:** 2026-02-14
**Confidence:** MEDIUM (based on training data through January 2025, verification recommended)

## Recommended Stack

### Testing Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vitest | ^4.0.18 (current) | Unit & integration testing | Already in use. Fast, native ESM support, Vue-aware, excellent TypeScript integration. Default choice for Vite-based projects. |
| @vue/test-utils | ^2.4.6 (current) | Vue component testing | Official Vue testing utilities. Essential for testing components with Composition API. |
| happy-dom | ^20.5.0 (current) | DOM environment for tests | Already in use. Lighter and faster than jsdom for most Vue testing scenarios. |
| @vitest/coverage-v8 | ^4.0.0 | Code coverage reporting | V8 coverage is faster and more accurate than Istanbul for Vite projects. Built-in Vitest integration. |
| @firebase/rules-unit-testing | ^3.0.4 | Firestore security rules testing | Official Firebase tool for unit testing security rules. Critical for validating rule correctness before deployment. |
| firebase-tools | ^13.23.1 | Firebase emulator suite | Official Firebase CLI. Run local emulators for Firestore, Auth, Functions for integration testing without hitting production. |
| msw | ^2.6.8 | API mocking | Modern Service Worker-based mocking. Better than traditional HTTP mocking for testing Firebase SDK calls and external APIs. |

### Error Handling & Monitoring

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @sentry/vue | ^8.48.0 | Error tracking & monitoring | Industry standard for Vue error tracking. Automatic error capture, breadcrumbs, performance monitoring. Free tier sufficient for small-to-medium apps. Better Vue integration than alternatives. |
| firebase/performance | 11.4.0 (in Firebase SDK) | Performance monitoring | Already available in your Firebase SDK. Zero-config performance tracking for Firebase apps. Tracks page loads, network requests, custom metrics. |
| firebase/analytics | 11.4.0 (in Firebase SDK) | User analytics | Already available. Integrates with Performance Monitoring. Track user behavior and correlate with errors. |

### TypeScript Hardening

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| typescript | ^5.7.3 | Type safety | Latest stable TypeScript. Already have basic setup, need strict mode enabled. |
| @typescript-eslint/parser | ^8.19.1 | TypeScript linting | Parse TypeScript for ESLint. Part of ESLint v9+ flat config. |
| @typescript-eslint/eslint-plugin | ^8.19.1 | TypeScript rules | Catch type-related bugs at lint time. Essential for eliminating implicit `any`. |
| vue-tsc | ^2.2.0 | Vue TypeScript checking | Type-check Vue SFCs. Run in CI to prevent type errors in production. |

### Security Testing & Validation

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| @firebase/rules-unit-testing | ^3.0.4 | Security rules testing | ALWAYS. Test every security rule scenario before deployment. |
| eslint-plugin-security | ^3.0.1 | Security linting | Detect common security anti-patterns in JavaScript/TypeScript code. |
| npm audit | Built-in | Dependency vulnerability scanning | Run in CI pipeline. Check for known vulnerabilities in dependencies. |
| firebase-tools | ^13.23.1 | Emulator-based security testing | Test auth flows, permission boundaries, and data access patterns locally. |

### Performance Optimization

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| vite-plugin-compression | ^0.5.1 | Gzip/Brotli compression | Pre-compress assets at build time. Reduces server load and improves load times. |
| rollup-plugin-visualizer | ^5.12.0 | Bundle analysis | Already available via Vite. Analyze bundle sizes to identify optimization opportunities. |
| lighthouse | ^12.2.1 | Performance auditing | Run Lighthouse CI in pipeline. Prevent performance regressions. |
| @firebase/performance | Built-in | Real User Monitoring (RUM) | Track actual user performance in production. Identify slow devices/networks. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Quasar Dev Tools | Quasar-specific debugging | Browser extension for debugging Quasar components. |
| Vue DevTools | Vue debugging | Essential for Composition API and Pinia store debugging. |
| Firebase Emulator UI | Local Firebase testing | Visual interface for emulator data. Included with firebase-tools. |
| Vite DevTools | Build analysis | Inspect module graph, understand import chains. |

## Installation

```bash
# Testing infrastructure
npm install -D @vitest/coverage-v8 @firebase/rules-unit-testing msw

# Error monitoring
npm install @sentry/vue

# TypeScript hardening
npm install -D typescript vue-tsc @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Security
npm install -D eslint-plugin-security

# Performance
npm install -D vite-plugin-compression lighthouse

# Firebase tools (likely already global, add as dev dep for CI)
npm install -D firebase-tools

# MSW for API mocking
npx msw init public/ --save
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Error Tracking | Sentry | Rollbar | If you already have Rollbar in other projects (consistency). Similar feature set. |
| Error Tracking | Sentry | BugSnag | If you need more affordable paid tiers for larger teams. |
| Error Tracking | Sentry | LogRocket | If you need session replay with every error (higher cost, privacy implications). |
| Testing Framework | Vitest | Jest | Never for new Vite projects. Jest requires complex config for ESM. Vitest is designed for Vite. |
| Coverage | V8 | Istanbul | Only if you have specific Istanbul tooling requirements. V8 is faster and more accurate. |
| DOM Environment | happy-dom | jsdom | If you hit happy-dom compatibility issues with specific libraries. jsdom is more complete but slower. |
| API Mocking | MSW | nock/axios-mock-adapter | Only for pure HTTP testing. MSW works at service worker level, closer to real browser behavior. |
| Security Rules Testing | @firebase/rules-unit-testing | Manual emulator testing | NEVER. Automated testing is essential for catching rule regressions. |
| Performance Monitoring | Firebase Performance | Sentry Performance | Sentry if you want unified error + performance in one tool. Firebase is zero-config for Firebase apps. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Jest | Requires complex ESM/Vite configuration, slow startup | Vitest (drop-in replacement with better Vite integration) |
| Karma | Deprecated, real browser overhead | Vitest with happy-dom or jsdom |
| Protractor | End-of-life, Angular-focused | Playwright or Cypress for E2E (if needed later) |
| Istanbul coverage with Vite | Slower, requires instrumentation | @vitest/coverage-v8 |
| @firebase/testing | Deprecated | @firebase/rules-unit-testing |
| Hardcoded Firebase config in tests | Security risk, flaky tests | Firebase Emulator Suite exclusively |
| console.log for error tracking | No aggregation, no stack traces, no context | Sentry or Firebase Crashlytics |
| Manual bundle size checking | Error-prone, not automated | rollup-plugin-visualizer + CI size budget |
| Any type in production code | Disables TypeScript benefits | Enable `strict: true` and fix all implicit any |

## Stack Patterns by Context

**If testing Firebase interactions:**
- Use Firebase Emulator Suite for integration tests
- Use MSW for mocking external APIs called alongside Firebase
- Use @firebase/rules-unit-testing for security rules
- NEVER test against production Firebase in automated tests

**If testing Vue components:**
- Use Vitest + @vue/test-utils for component logic
- Use happy-dom for fast DOM rendering
- Mock Firebase services using vi.mock()
- Test composables independently from components

**If implementing error tracking:**
- Use Sentry Vue integration for framework errors
- Use Firebase Performance for network/resource timing
- Configure Sentry to attach Firebase user context
- Set up source maps for production error tracking

**If optimizing bundle size:**
- Enable manual chunks in Vite config (already configured)
- Use dynamic imports for routes (verify current implementation)
- Analyze with rollup-plugin-visualizer
- Set bundle size budgets in CI

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vitest ^4.0.18 | Vue 3.4+, Vite 5+ | Current setup compatible |
| @sentry/vue ^8.48.0 | Vue 3.0+, Pinia 2.0+ | Requires Vite plugin for source maps |
| @firebase/rules-unit-testing ^3.0.4 | Firebase 11.x | Requires firebase-tools ^13.0 |
| MSW ^2.6.8 | Node 18+, modern browsers | Breaking changes from v1, check migration guide |
| @typescript-eslint/* ^8.x | ESLint 9+, TypeScript 5+ | Requires flat config (already using) |
| vue-tsc ^2.2.0 | Vue 3.4+, TypeScript 5+ | Compatible with current setup |

## Critical Configuration Notes

### TypeScript Strict Mode
Current codebase has implicit `any` types. Required changes:
```json
// tsconfig.json additions
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Vitest Coverage Thresholds
```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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

### Firebase Emulator Configuration
```json
// firebase.json additions
{
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
    }
  }
}
```

### Sentry Integration
```typescript
// src/boot/sentry.ts (new file needed)
import * as Sentry from '@sentry/vue'

export default ({ app, router }) => {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    environment: import.meta.env.MODE
  })
}
```

## Sources

**CONFIDENCE LEVELS NOTED:**
- HIGH: Vitest, @vue/test-utils, happy-dom (actively using in codebase)
- MEDIUM: Sentry, Firebase Performance, TypeScript tooling (industry standard, may have version updates)
- LOW: Specific version numbers (training data through Jan 2025, verify current versions)

**Training Data Sources (January 2025 cutoff):**
- Vue.js official documentation (error handling, production deployment)
- Vitest official documentation (testing patterns, coverage)
- Firebase official documentation (security rules testing, emulators, performance monitoring)
- Quasar Framework documentation (production builds, optimization)
- Sentry Vue integration documentation
- TypeScript documentation (strict mode configuration)

**Verification Recommended:**
- Check npm for latest stable versions of all packages
- Review Sentry Vue documentation for any API changes since Jan 2025
- Verify Firebase Emulator Suite compatibility with Firebase 11.4
- Check MSW v2 migration guide if upgrading from v1
- Verify TypeScript 5.7+ compatibility with current ESLint flat config

**Known Gaps:**
- Cannot verify if newer tools emerged between Jan 2025 - Feb 2026
- Package versions are based on training data, may be outdated
- Firebase Performance Monitoring configuration may have changed
- Quasar-specific testing patterns may have evolved

---
*Stack research for: Vue 3 + Quasar + Firebase Production Hardening*
*Researched: 2026-02-14*
*Overall Confidence: MEDIUM - Core recommendations solid, versions need verification*

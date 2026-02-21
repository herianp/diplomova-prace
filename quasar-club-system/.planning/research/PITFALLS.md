# Production Hardening Pitfalls

**Domain:** Vue 3 + Firebase Application Production Deployment
**Researched:** 2026-02-14
**Confidence:** HIGH (based on common production issues and project code analysis)

## Critical Pitfalls

Mistakes that cause production outages, data loss, or complete rewrites.

### Pitfall 1: Unmanaged Firebase Listener Lifecycles
**What goes wrong:** Memory leaks, runaway Firestore reads, user quota exhaustion, app slowdown over time

**Why it happens:**
- Firestore listeners (`onSnapshot`) continue running after component unmount
- No centralized tracking of active listeners
- Race conditions between auth listener and data listeners
- Multiple listeners created for same data source

**Current evidence in project:**
- Only 6 of 116 source files use `onUnmounted` hooks
- Manual timing buffers (100-300ms) between listener creation
- `authUnsubscribe` stored in store but cleanup not guaranteed
- Team/survey listeners recreated on every navigation

**Consequences:**
- Memory usage grows unbounded in long sessions
- Firestore quota exhausted (50K reads/day free tier)
- Firebase bill explosion if on paid plan
- App becomes unresponsive after 30+ minutes of use
- Stale listeners receive updates for irrelevant data

**Prevention:**
1. Create centralized `ListenerRegistry` singleton
2. Register every listener with unique ID and cleanup callback
3. Unregister all listeners on logout
4. Use `onBeforeUnmount` in every component that creates listeners
5. Avoid listener creation in loops or conditional blocks

**Detection:**
- Monitor Firebase console for unusual read patterns
- Track active listener count in app (dev tools)
- Memory profiling in Chrome DevTools (detached DOM nodes)
- User reports of "app getting slower over time"

**Example fix:**
```typescript
// Before (BAD)
onMounted(() => {
  const unsubscribe = onSnapshot(collection(db, 'surveys'), callback)
  // Lost reference to unsubscribe!
})

// After (GOOD)
const listenerRegistry = useListenerRegistry()
onMounted(() => {
  const unsubscribe = onSnapshot(collection(db, 'surveys'), callback)
  listenerRegistry.register('surveys', unsubscribe)
})
onBeforeUnmount(() => {
  listenerRegistry.unregister('surveys')
})
```

---

### Pitfall 2: Firestore Document Size Limits
**What goes wrong:** Writes fail silently or with cryptic errors when document exceeds 1MB

**Why it happens:**
- Storing unbounded arrays in documents (votes, members, messages)
- Adding new fields without considering cumulative size
- No validation or monitoring of document sizes

**Current evidence in project:**
- Survey votes stored as array in document: `votes: IVote[]`
- Team members array: `members: string[]` (40+ users already)
- No size checks before writes
- With 44 team members × 100+ surveys = potential for 4,400 vote entries
- Each vote object ~50 bytes = 220KB just for votes (22% of limit)

**Consequences:**
- Votes fail to save after ~200 members vote
- Error messages like "Document size exceeded 1MB" confuse users
- Data loss (failed writes not retried)
- Emergency migration required under pressure

**Prevention:**
1. **Migrate arrays to subcollections** for unbounded data (votes, members, messages)
2. Add document size monitoring in development
3. Set limits on array sizes and enforce in Firestore rules
4. Use batch writes to split data across documents when needed

**When to migrate:**
- Arrays that grow with user count: MIGRATE NOW
- Arrays that grow with content (surveys, messages): MIGRATE before 100 items
- Fixed-size arrays (settings, preferences): OK to keep in document

**Detection:**
- Monitor Firestore errors for "document size" messages
- Calculate document size before writes in development
- Set up alerts for documents approaching 800KB (80% of limit)

**Migration priority for this project:**
1. **HIGH PRIORITY:** Survey votes array → votes subcollection
2. **MEDIUM PRIORITY:** Team members array (OK for now at 44, but watch for growth)
3. **LOW PRIORITY:** Notifications (per-user, unlikely to exceed limit)

---

### Pitfall 3: Missing Error Boundaries
**What goes wrong:** Single uncaught error crashes entire application

**Why it happens:**
- No global `errorHandler` in Vue app
- Firebase operations throw but components don't catch
- Async errors escape try/catch blocks
- Error handling inconsistent across codebase

**Current evidence in project:**
- No global Vue `errorHandler` configured
- 31 files with try/catch vs 116 total files (27% coverage)
- 78 `console.error()` calls without user feedback
- No Sentry or error tracking integration
- Many async operations without .catch() handlers

**Consequences:**
- White screen of death for users
- No visibility into production errors
- Users force-refresh, lose unsaved work
- Support burden ("app is broken" with no details)

**Prevention:**
1. Add Vue global error handler in `main.ts`
2. Wrap all Firebase operations in try/catch at service layer
3. Add error boundaries for critical UI sections
4. Integrate Sentry or equivalent error tracking
5. Show user-friendly error messages, log technical details

**Detection:**
- User reports of blank screens
- Browser console errors in production
- Sentry error rate > 1% of sessions

**Example fix:**
```typescript
// main.ts
const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
  // Log to Sentry
  Sentry.captureException(err, { extra: { componentInfo: info } })
  // Show user notification
  Notify.create({
    type: 'negative',
    message: 'Something went wrong. Please try again.'
  })
}
```

---

### Pitfall 4: Race Conditions in Auth Flow
**What goes wrong:** Data loads before auth completes, permission-denied errors, infinite loading states

**Why it happens:**
- Data listeners start before auth state known
- No "auth ready" flag to gate data fetches
- Firebase auth state is asynchronous
- Router navigation happens before auth check completes

**Current evidence in project:**
- `isAuthReady` flag exists but may not be used consistently
- Manual timing buffers (100-300ms) suggest race condition workarounds
- Comments in code about permission-denied errors
- Team/notification listeners wait for auth but implementation fragile

**Consequences:**
- Firestore permission-denied errors in console
- Blank dashboards (data fetched for wrong user)
- Flashing UI (wrong data loaded then replaced)
- Login redirects fail, users stuck on loading screen

**Prevention:**
1. Set `isAuthReady` flag only after first auth state resolves
2. Gate all data listeners on `isAuthReady === true`
3. Use router guards that wait for auth
4. Add loading states that wait for auth before mounting components
5. Never rely on timing buffers (setTimeout) for synchronization

**Detection:**
- Firestore errors with code "permission-denied" during login
- Reports of "nothing loads after login"
- Intermittent failures that resolve on refresh

**Example fix:**
```typescript
// BEFORE (BAD - race condition)
onMounted(async () => {
  const surveys = await getSurveys() // May run before auth!
})

// AFTER (GOOD - wait for auth)
const authStore = useAuthStore()
watch(() => authStore.isAuthReady, (ready) => {
  if (ready && authStore.user) {
    getSurveys()
  }
}, { immediate: true })
```

---

### Pitfall 5: No Test Coverage for Critical Paths
**What goes wrong:** Regressions break login, survey creation, voting after code changes

**Why it happens:**
- Testing perceived as "extra work" for thesis project
- Manual testing seems sufficient with small user base
- Complexity of testing Firebase integration
- "It works on my machine" mentality

**Current evidence in project:**
- Only 5 test files in entire codebase
- Tests only for utilities, not critical user flows
- No E2E tests for auth, survey, voting flows
- No CI/CD to run tests automatically
- Test coverage: ~4.3% (5/116 files)

**Consequences:**
- Production hotfixes required after every release
- Fear of refactoring (might break something)
- Regression bugs found by users, not developers
- Time wasted manually testing same flows repeatedly

**Prevention:**
1. Set minimum test coverage threshold (70%)
2. Write tests for critical paths FIRST:
   - User login/logout
   - Survey creation
   - Voting flow
   - Team member permissions
3. Add CI/CD that fails if tests don't pass
4. Use Firebase emulator for integration tests
5. Add E2E tests with Playwright for happy paths

**Detection:**
- Bugs reported that tests should have caught
- Code changes require extensive manual testing
- Production hotfixes within 24 hours of releases

---

## Moderate Pitfalls

Issues that degrade user experience or create technical debt but don't cause outages.

### Pitfall 6: Inconsistent Error Messages
**What goes wrong:** Users see technical Firebase errors or inconsistent messaging

**Current evidence:**
- 78 console.error() calls with technical messages
- No centralized error message mapping
- Mix of English/Czech error messages
- Firebase error codes exposed to users (auth/wrong-password)

**Prevention:**
- Create error code → i18n key mapping
- Standardize error display through Quasar Notify
- Log technical details, show user-friendly messages
- Test error messages in both languages

### Pitfall 7: Missing Offline Handling
**What goes wrong:** App breaks completely when network is unavailable

**Current evidence:**
- No offline persistence enabled for Firestore
- No connection state monitoring
- No retry logic for failed operations
- Users on mobile/trains have poor experience

**Prevention:**
- Enable Firestore offline persistence
- Add connection state listener
- Show "offline" banner when disconnected
- Queue writes for when connection returns
- Implement retry with exponential backoff

### Pitfall 8: Hardcoded Configuration Values
**What goes wrong:** Can't change settings without redeploying

**Current evidence:**
- Season dates hardcoded (13/07/2025 - 30/06/2026)
- Feature flags would require code changes
- No A/B testing capability
- Vote deadline logic embedded in components

**Prevention:**
- Move configuration to Firestore collection
- Implement feature flag system
- Cache config locally with TTL
- Allow runtime updates for power users

### Pitfall 9: No Audit Trail
**What goes wrong:** Can't answer "who changed this survey?"

**Current evidence:**
- No audit logging anywhere in codebase
- Can't track survey modifications
- Can't prove who verified votes
- Dispute resolution requires guesswork

**Prevention:**
- Add AuditService for critical operations
- Log survey create/update/delete/verify
- Log team member changes
- Log cashbox transactions
- Include before/after state in audit logs

### Pitfall 10: Inadequate Loading States
**What goes wrong:** Users don't know if app is working or frozen

**Current evidence:**
- Some loading states implemented (Quasar)
- Inconsistent across components
- No skeleton loaders
- Long operations have no progress indication

**Prevention:**
- Standardize loading states with Quasar Loading
- Add skeleton loaders for lists
- Show progress for multi-step operations
- Timeout and show error after 30 seconds

---

## Minor Pitfalls

Quality-of-life issues that don't significantly impact functionality.

### Pitfall 11: Over-Fetching Data
**What goes wrong:** Loading entire team member list for every survey

**Prevention:** Use Firestore queries to fetch only needed fields

### Pitfall 12: No Analytics
**What goes wrong:** Can't answer "how many users vote on mobile?"

**Prevention:** Add Firebase Analytics with key events

### Pitfall 13: Missing Accessibility
**What goes wrong:** Screen readers don't work, keyboard navigation broken

**Prevention:** Audit with Lighthouse, add ARIA labels

### Pitfall 14: No Performance Budgets
**What goes wrong:** Bundle size grows unchecked

**Prevention:** Set bundle size limits in CI, monitor with Lighthouse

### Pitfall 15: Weak TypeScript
**What goes wrong:** Many `any` types defeat purpose of TypeScript

**Current evidence:**
- Implicit `any` in many places
- No strict mode enabled
- Type assertions instead of proper typing

**Prevention:**
- Enable `strict: true` in tsconfig
- Fix all implicit `any` types
- Use Zod for runtime validation

---

## Phase-Specific Warnings

Pitfalls to watch for when implementing specific production hardening features.

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Error Handling** | Creating too many error types, over-engineering | Start with 3-4 base types, expand as needed |
| **Listener Cleanup** | Cleaning up too aggressively, breaking functionality | Test logout → login flow extensively |
| **Testing** | Writing tests that pass but don't test real behavior | Use Firebase emulator, avoid excessive mocking |
| **CI/CD** | Deploying every commit to production | Use preview channels for PRs, main branch only to prod |
| **Data Migration** | Running migration on production first | ALWAYS test on staging copy first |
| **Audit Logging** | Logging too much, Firestore quota explosion | Log critical operations only, batch writes |
| **Monitoring** | Alert fatigue from too many notifications | Start with error tracking only, add more gradually |
| **Performance** | Premature optimization | Profile first, optimize based on data |
| **Type Safety** | Fixing all TypeScript errors at once | Enable strict mode, fix incrementally by module |
| **Offline Support** | Syncing conflicts when coming back online | Implement last-write-wins or user conflict resolution |

## Platform-Specific Gotchas

### Firebase Firestore
- **IN queries limited to 10 values** — already hit in project (team members > 30)
- **Listeners count against quota** — each user = multiple listeners
- **Rules don't catch client-side bugs** — still need validation
- **Timestamps are objects** — not dates, need conversion

### Vue 3 + Composition API
- **Refs need .value** — easy to forget in templates
- **Reactive unwrapping** — sometimes automatic, sometimes not
- **onUnmounted doesn't run on navigation** — need onBeforeUnmount
- **Computed not cached by default** — use computed() not function

### Quasar Framework
- **Notify position: 'top'** — can overlap header, use 'top-right'
- **Loading plugin** — must be registered in boot file
- **Dark mode** — can break custom CSS if not tested
- **Build for SPA** — different config than SSR/PWA

## Red Flags During Development

Warning signs that indicate pitfalls are about to happen:

- **Manual setTimeout** for coordination → Race condition, need proper async/await
- **Try/catch with empty block** → Hiding errors, will bite later
- **Console.log in production** → Need proper logging system
- **"Works on my machine"** → Missing environment config or test coverage
- **Copy-pasted Firebase code** → Should be in service layer
- **Incrementing counters in documents** → Use FieldValue.increment()
- **No loading state** → Users will think app is broken
- **Nested listeners** → Memory leak waiting to happen
- **Array.find() with no null check** → Will crash eventually
- **Type assertion as** → TypeScript can't help if wrong

## Emergency Checklists

### If App Crashes in Production
1. Check Firestore rules (permission-denied?)
2. Check browser console for error
3. Verify auth state (logged in?)
4. Check Firebase quota (out of reads?)
5. Rollback to previous deployment
6. Add error tracking ASAP

### If Firestore Quota Exceeded
1. Check listener count per user
2. Look for query loops
3. Check if old listeners cleaned up
4. Enable offline persistence
5. Add caching layer
6. Consider upgrade to paid plan

### If Data Migration Fails
1. STOP immediately, don't continue
2. Check for partial writes
3. Verify data integrity
4. Roll back migration
5. Test on staging copy
6. Add rollback script before retry

## Sources

**HIGH confidence (verified in codebase):**
- Listener lifecycle issues: analyzed 116 source files, found 6 with onUnmounted
- Test coverage: 5 test files, 116 source files = 4.3%
- Error handling: 31 files with try/catch, 78 console.error calls
- Firebase Firestore document limit: 1MB (official Firebase documentation, not likely to change)
- Array size issues: analyzed votes array, team members (44 users)

**MEDIUM confidence (based on training data + industry patterns):**
- Common Firebase pitfalls from documentation and community
- Vue 3 + Composition API gotchas from official docs
- Clean Architecture anti-patterns from experience
- Production deployment best practices

**Training data sources:**
- Firebase documentation (Firestore limits, best practices)
- Vue 3 documentation (lifecycle hooks, error handling)
- Clean Architecture principles (Robert C. Martin)
- SaaS production operations experience

**Gaps to validate:**
- Exact Firestore concurrent listener limits (training suggests ~1000)
- Latest Quasar framework gotchas (framework may have evolved)
- Current Firebase pricing tiers (may have changed)

---
*Pitfalls research for: Vue 3 + Firebase Production Hardening*
*Researched: 2026-02-14*
*Focus: Football club management system with 40+ users*

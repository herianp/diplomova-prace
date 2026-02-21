# Phase 06: Performance - Research

**Researched:** 2026-02-15
**Domain:** Frontend performance optimization, chart rendering, listener lifecycle, Firebase monitoring
**Confidence:** HIGH

## Summary

Phase 6 focuses on eliminating performance bottlenecks in the club management system through four targeted optimizations: lazy chart rendering, Firebase Performance Monitoring integration, listener cleanup verification, and pagination boundary enforcement. The application currently renders all 4 dashboard charts simultaneously on page load and accumulates listeners during team switching, causing memory bloat and UI lag.

The research reveals that the standard stack for these optimizations is well-established: VueUse's `useIntersectionObserver` composable for viewport-based lazy loading, Firebase Performance SDK for automatic web vitals tracking, the existing ListenerRegistry pattern for scope-based cleanup, and Firestore's cursor-based pagination with `hasMore` detection. All solutions integrate seamlessly with the existing Vue 3 + Quasar + Firebase 11.4.0 architecture without requiring new dependencies (VueUse is likely already available via Quasar ecosystem).

**Primary recommendation:** Implement lazy chart rendering first (highest user impact), then add Firebase Performance Monitoring (enables baseline measurement), verify listener cleanup (prevent regressions), and finally fix notification pagination (eliminate wasted queries). This sequence delivers immediate UI improvements while establishing monitoring infrastructure for ongoing optimization.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| VueUse | ^10.0.0+ | Intersection Observer composable | Industry-standard Vue 3 utility collection, provides `useIntersectionObserver` with automatic cleanup |
| Firebase Performance | 11.4.0 | Web vitals monitoring | Official Firebase SDK for automatic page load, FCP, LCP, CLS, FID tracking |
| Chart.js | 4.5.0 | Chart rendering | Already in package.json, used by DashboardComponent and ReportsCharts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| first-input-delay polyfill | latest | FID metric support | Required for Firebase Performance to track First Input Delay on browsers without native support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VueUse | Custom IntersectionObserver composable | VueUse provides battle-tested cleanup, reactive options, and TypeScript support; custom solution requires manual lifecycle management |
| Firebase Performance | Custom analytics | Firebase Performance provides automatic web vitals, zero-config setup, and Firebase Console integration; custom solution requires manual instrumentation |
| Intersection Observer | `v-lazy` directives | Intersection Observer is native browser API with better performance; directives add framework-specific overhead |

**Installation:**
```bash
# VueUse (check if already installed via Quasar)
yarn add @vueuse/core

# Firebase Performance (already in firebase 11.4.0)
# No additional install needed, use getPerformance from firebase/performance
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── composables/
│   └── useChartLazyLoad.ts      # Reusable lazy load composable for charts
├── firebase/
│   └── performance.ts           # Performance monitoring initialization
├── components/
│   ├── dashboard/
│   │   ├── VotingChart.vue      # Lazy-loaded with useChartLazyLoad
│   │   └── SurveyTypesChart.vue # Lazy-loaded with useChartLazyLoad
│   └── reports/
│       └── ReportsCharts.vue    # Lazy-loaded with useChartLazyLoad
└── services/
    └── listenerRegistry.ts      # Existing - verify cleanup
```

### Pattern 1: Lazy Chart Rendering with Intersection Observer
**What:** Render charts only when their container enters the viewport, not on component mount
**When to use:** Dashboard with multiple charts, reports page with 4 charts
**Example:**
```typescript
// Source: VueUse documentation + Firebase official docs
// composables/useChartLazyLoad.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

export function useChartLazyLoad() {
  const chartContainer = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  const hasRendered = ref(false)

  const { stop } = useIntersectionObserver(
    chartContainer,
    ([entry]) => {
      if (entry.isIntersecting && !hasRendered.value) {
        isVisible.value = true
        hasRendered.value = true
        // Stop observing after first render to prevent re-renders
        stop()
      }
    },
    {
      threshold: 0.1, // Trigger when 10% visible
      rootMargin: '50px' // Pre-load 50px before entering viewport
    }
  )

  onUnmounted(() => {
    stop() // Cleanup observer
  })

  return {
    chartContainer,
    isVisible,
    hasRendered
  }
}
```

**Usage in chart component:**
```vue
<template>
  <div ref="chartContainer" class="chart-wrapper">
    <canvas v-if="isVisible" ref="chartCanvas"></canvas>
    <q-skeleton v-else type="rect" height="200px" />
  </div>
</template>

<script setup>
import { watch, nextTick } from 'vue'
import { useChartLazyLoad } from '@/composables/useChartLazyLoad'

const { chartContainer, isVisible } = useChartLazyLoad()

// Create chart only after isVisible becomes true
watch(isVisible, async (visible) => {
  if (visible) {
    await nextTick()
    createChart() // Existing chart creation logic
  }
})
</script>
```

### Pattern 2: Firebase Performance Monitoring Integration
**What:** Initialize Firebase Performance SDK to automatically track web vitals (FCP, LCP, CLS, FID)
**When to use:** Application-wide, initialized once in firebase/config.ts
**Example:**
```typescript
// Source: https://firebase.google.com/docs/perf-mon/get-started-web
// firebase/performance.ts
import { getPerformance } from 'firebase/performance'
import { app } from './config'

// Initialize Performance Monitoring
// Automatically tracks: page load times, FCP, LCP, CLS, network requests
export const perf = getPerformance(app)

// Export for custom trace creation if needed
export { trace } from 'firebase/performance'
```

**Updated firebase/config.ts:**
```typescript
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getPerformance } from "firebase/performance"

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const db = getFirestore(app)
const auth = getAuth(app)
const perf = getPerformance(app) // Add performance monitoring

export { analytics, db, auth, perf }
```

**First Input Delay Polyfill (index.html):**
```html
<!-- Add before app bundle for FID tracking -->
<script defer src="https://unpkg.com/first-input-delay"></script>
```

### Pattern 3: Listener Cleanup Verification
**What:** Verify ListenerRegistry correctly cleans up team-scoped listeners during team switching
**When to use:** Team switching (teamStore), component unmount
**Example:**
```typescript
// Source: Existing listenerRegistry.ts + Vue 3 lifecycle best practices
// composables/useTeamUseCases.ts - VERIFY existing cleanup

// CURRENT IMPLEMENTATION (Phase 02-03):
watch(() => teamStore.currentTeam, (newTeam, oldTeam) => {
  if (oldTeam && newTeam?.id !== oldTeam.id) {
    // Cleanup team-scoped listeners before switching
    listenerRegistry.unregisterByScope('team')
  }

  if (newTeam) {
    // Register new team listeners
    setSurveysListener(newTeam.id)
    // Other team-specific listeners
  }
})

// VERIFICATION STRATEGY:
// 1. Use __listenerDebug in dev console:
//    window.__listenerDebug.getDebugInfo()
//    Expected: only 'auth' and 'teams' persist across switches
//    'surveys', 'notifications', 'messages', 'cashbox-*' should reset
//
// 2. Add test case:
//    - Switch from Team A to Team B
//    - Check listener count before/after
//    - Verify no duplicate listeners
```

### Pattern 4: Pagination Boundary Enforcement
**What:** Stop fetching notifications when `hasMore` is false, prevent infinite load attempts
**When to use:** NotificationsPage loadMoreNotifications
**Example:**
```typescript
// Source: https://firebase.google.com/docs/firestore/query-data/query-cursors
// CURRENT IMPLEMENTATION (notificationFirebase.ts lines 58-87):
const loadMoreNotifications = async (userId, lastDoc, pageSize) => {
  const snapshot = await getDocs(query(..., startAfter(lastDoc), limit(pageSize)))

  return {
    notifications: snapshot.docs.map(...),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize // CORRECT PATTERN
  }
}

// VERIFICATION NEEDED IN NotificationsPage.vue:
const loadMoreNotifications = async () => {
  // BUG CHECK: Does component check hasMore before calling?
  if (!lastDoc || !hasMore.value) return // VERIFY THIS EXISTS

  loadingMore.value = true

  const result = await notificationFirebase.loadMoreNotifications(...)

  notifications.value.push(...result.notifications)
  lastDoc = result.lastDoc
  hasMore.value = result.hasMore // VERIFY THIS UPDATES
}

// CURRENT IMPLEMENTATION (NotificationsPage.vue lines 296-325):
// ✓ Checks hasMore before calling (line 297)
// ✓ Updates hasMore after response (line 310)
// VERIFICATION PASSED - no changes needed, just document behavior
```

### Anti-Patterns to Avoid
- **Loading all charts on mount:** Creates 4 simultaneous Chart.js instances, blocks main thread, wastes memory for off-screen charts
- **Forgetting chart.destroy():** Chart.js stores internal data that survives component destruction; always destroy in onUnmounted
- **Polling pagination:** Calling loadMore repeatedly when hasMore is false generates pointless Firestore queries
- **Global listener accumulation:** Registering listeners without scope-based cleanup causes memory leaks during team switches
- **Skipping rootMargin:** Loading charts exactly when visible feels sluggish; use 50-100px rootMargin for perceived performance

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intersection Observer lifecycle | Custom observer with manual cleanup | VueUse `useIntersectionObserver` | VueUse handles observer creation, cleanup, reactive options, multiple targets, and edge cases (component unmount, observer support detection) |
| Web vitals tracking | Custom performance.mark() instrumentation | Firebase Performance SDK | Automatic FCP, LCP, CLS, FID tracking, no manual instrumentation, Firebase Console dashboard, historical data storage |
| Chart memory management | Custom ref cleanup logic | Chart.js destroy() + onUnmounted | Chart.js destroy() releases internal _meta data, clears event listeners, and frees canvas context; manual cleanup misses internal state |
| Pagination cursors | Offset-based pagination (skip/limit) | Firestore startAfter cursors | Offset pagination rescans skipped documents on every request (O(n) cost), cursors skip directly to position (O(1) seek), critical for >1000 documents |

**Key insight:** Performance optimization has well-established solutions that handle edge cases you'll discover too late in custom implementations. Intersection Observer requires handling rootMargin, threshold arrays, disconnection, and multiple targets; Firebase Performance handles batching, retries, network conditions, and cross-browser web vitals differences. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Chart.js Memory Leaks from Missing destroy()
**What goes wrong:** Charts consume 2-5MB each; without destroy(), memory accumulates during navigation, causing browser slowdowns after 10-20 page views
**Why it happens:** Chart.js stores canvas context, datasets, plugins, and internal state in memory; component destruction doesn't automatically release these
**How to avoid:** Always call chart.destroy() in onUnmounted hook before setting chart reference to null
**Warning signs:** Browser DevTools Memory Profiler shows "Detached HTMLCanvasElement" nodes growing over time, UI becomes sluggish after repeated navigation

### Pitfall 2: Intersection Observer Without stop()
**What goes wrong:** Observer continues monitoring elements after component unmounts, triggering callbacks on destroyed components, causing "Cannot read property of undefined" errors
**Why it happens:** IntersectionObserver lifecycle is independent of Vue component lifecycle; must manually disconnect
**How to avoid:** VueUse `useIntersectionObserver` returns `stop()` function - call in onUnmounted or use returned stop function when done observing
**Warning signs:** Console errors after navigating away from dashboard, increasing number of active observers in DevTools

### Pitfall 3: Re-rendering Charts on Every Intersection
**What goes wrong:** Chart re-creates on every scroll past threshold, causing flickering and wasted CPU
**Why it happens:** Intersection callback fires on both enter AND exit; without `hasRendered` flag, chart rebuilds repeatedly
**How to avoid:** Track `hasRendered` flag, call `stop()` after first render, use `once` pattern for one-time lazy load
**Warning signs:** Chart flickers during scroll, DevTools Performance shows repeated chart creation, CPU spikes on scroll

### Pitfall 4: Pagination Without hasMore Guard
**What goes wrong:** "Load More" button triggers queries even when all data is loaded, generating empty Firestore requests that cost money and show perpetual loading spinner
**Why it happens:** UI doesn't disable button based on hasMore flag, or hasMore never becomes false due to incorrect detection (using `!== 0` instead of `< pageSize`)
**How to avoid:** Check `if (!lastDoc || !hasMore.value) return` at start of loadMore function, disable button with `v-if="hasMore"`, set `hasMore = snapshot.docs.length === pageSize` (not `> 0`)
**Warning signs:** "Load More" button never disappears, Firestore console shows queries returning 0 documents, loading spinner stuck on last page

### Pitfall 5: Lazy Loading Without Skeleton
**What goes wrong:** Blank space where chart will render causes layout shift (poor CLS score), users unsure if content is loading
**Why it happens:** `v-if="isVisible"` removes element from DOM before intersection, leaving no placeholder
**How to avoid:** Use `v-if/v-else` pair: `<canvas v-if="isVisible">` / `<q-skeleton v-else>` with same dimensions
**Warning signs:** Firebase Performance shows high CLS scores, content "jumps" as charts load, users report "broken" charts

## Code Examples

Verified patterns from official sources:

### Lazy-Loaded Chart Component
```vue
<!-- Source: VueUse + Chart.js best practices -->
<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-icon name="bar_chart" size="sm" color="primary" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
      </div>

      <div ref="chartContainer" class="chart-container" style="height: 300px;">
        <canvas v-if="isVisible" ref="chartCanvas"></canvas>
        <q-skeleton v-else type="rect" height="300px" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Chart as ChartJS } from 'chart.js'

const props = defineProps({
  title: String,
  data: Array
})

const chartContainer = ref(null)
const chartCanvas = ref(null)
const isVisible = ref(false)
const hasRendered = ref(false)
let chartInstance = null

// Intersection observer with cleanup
const { stop } = useIntersectionObserver(
  chartContainer,
  ([entry]) => {
    if (entry.isIntersecting && !hasRendered.value) {
      isVisible.value = true
      hasRendered.value = true
      stop() // Stop observing after first render
    }
  },
  {
    threshold: 0.1,
    rootMargin: '50px'
  }
)

// Create chart when visible
watch(isVisible, async (visible) => {
  if (visible && chartCanvas.value) {
    await nextTick()

    const ctx = chartCanvas.value.getContext('2d')
    chartInstance = new ChartJS(ctx, {
      type: 'bar',
      data: props.data,
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
})

// Cleanup chart and observer
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  stop()
})
</script>
```

### Firebase Performance Initialization
```typescript
// Source: https://firebase.google.com/docs/perf-mon/get-started-web
// firebase/config.ts
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getPerformance } from "firebase/performance"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'club-surveys.firebaseapp.com',
  projectId: 'club-surveys',
  storageBucket: 'club-surveys.firebasestorage.app',
  messagingSenderId: '376776441448',
  appId: '1:376776441448:web:5bf51db3be287c171fc5dd',
  measurementId: 'G-SYRS8JZF7B'
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const db = getFirestore(app)
const auth = getAuth(app)

// Initialize Performance Monitoring (automatic web vitals tracking)
const perf = getPerformance(app)

export { analytics, db, auth, perf }
```

### Pagination Boundary Pattern
```typescript
// Source: https://firebase.google.com/docs/firestore/query-data/query-cursors
// NotificationsPage.vue - VERIFICATION (already correct)
const loadMoreNotifications = async () => {
  // Guard: Stop if no cursor or no more data
  if (!lastDoc || !hasMore.value) return

  loadingMore.value = true

  try {
    const result = await notificationFirebase.loadMoreNotifications(
      currentUser.value.uid,
      lastDoc,
      pageSize
    )

    // Append new results
    notifications.value.push(...result.notifications)

    // Update cursor and hasMore flag
    lastDoc = result.lastDoc
    hasMore.value = result.hasMore

  } catch (error) {
    // Error handling
  } finally {
    loadingMore.value = false
  }
}
```

### Listener Cleanup Verification
```typescript
// Source: Existing listenerRegistry.ts + Vue 3 best practices
// Development debugging in browser console:
window.__listenerDebug.getActive()
// Expected before team switch: ['auth', 'teams', 'surveys', 'notifications', ...]

// Switch team in UI

window.__listenerDebug.getActive()
// Expected after team switch: ['auth', 'teams', 'surveys', 'notifications', ...]
// Should be SAME listener IDs, not duplicated

window.__listenerDebug.getDebugInfo()
// Shows age in seconds - verify 'surveys' resets to 0-2 seconds after switch
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual IntersectionObserver setup | VueUse `useIntersectionObserver` | VueUse 4.0+ (2020) | Automatic cleanup, reactive options, TypeScript support |
| Custom performance tracking | Firebase Performance SDK | Firebase 9.0+ (2021) | Zero-config web vitals, automatic network monitoring, Firebase Console integration |
| Offset-based pagination (skip/limit) | Cursor-based pagination (startAfter) | Firestore best practices (2019) | O(1) seek vs O(n) scan, critical at scale |
| chart.clear() + redraw | chart.destroy() + new Chart() | Chart.js 2.0+ (2016) | Prevents memory leaks from internal _meta accumulation |
| Global window listeners | Scoped listener registry | Vue 3 + Composition API (2020) | Prevents memory leaks during SPA navigation |

**Deprecated/outdated:**
- **v-lazy directives for charts:** IntersectionObserver API is now standard (95%+ browser support), provides better performance and control
- **Firebase Performance compat API:** Modular SDK (firebase/performance) is current, compat mode deprecated in Firebase 9.0+
- **Chart.js global Chart object:** ES modules (import { Chart as ChartJS }) preferred for tree-shaking
- **Manual web vitals calculation:** Firebase Performance tracks FCP, LCP, CLS, FID automatically; manual performance.mark() is outdated

## Open Questions

1. **Is VueUse already installed via Quasar ecosystem?**
   - What we know: Quasar Framework often includes VueUse utilities
   - What's unclear: Whether @vueuse/core is in package.json or needs explicit install
   - Recommendation: Check `yarn list @vueuse/core` before installing; if missing, add as dependency

2. **Should we add custom performance traces for specific operations?**
   - What we know: Firebase Performance supports custom traces via `trace()` API
   - What's unclear: Whether team switching, survey creation, or chart rendering need custom instrumentation beyond automatic tracking
   - Recommendation: Start with automatic web vitals only; add custom traces in Phase 7 if Firebase Console shows bottlenecks

3. **Do we need to lazy-load ReportsPage charts differently?**
   - What we know: ReportsPage has 4 charts (participation, types, monthly, ranking) that all mount simultaneously
   - What's unclear: Whether users typically scroll through all charts vs only viewing top ones
   - Recommendation: Use same lazy-load pattern; analytics will show if users engage with bottom charts

4. **Should notification pagination be infinite scroll instead of "Load More" button?**
   - What we know: Current pattern uses manual button, hasMore logic is correct
   - What's unclear: Whether users prefer automatic infinite scroll
   - Recommendation: Keep "Load More" button (PRF-04 mentions pagination boundary, not infinite scroll); consider infinite scroll in future UX iteration

## Sources

### Primary (HIGH confidence)
- Firebase Performance Monitoring - Get started (web): https://firebase.google.com/docs/perf-mon/get-started-web
- VueUse useIntersectionObserver: https://vueuse.org/core/useintersectionobserver/
- Firestore Query Cursors (Pagination): https://firebase.google.com/docs/firestore/query-data/query-cursors
- Chart.js Performance Optimization: https://www.chartjs.org/docs/latest/general/performance.html
- Existing codebase: listenerRegistry.ts (Phase 02-03 implementation)
- Existing codebase: notificationFirebase.ts (pagination implementation)

### Secondary (MEDIUM confidence)
- VueUse Intersection Observer composable guide: https://medium.com/@lukas.viliams/vue-3-intersection-observer-composable-b4be821c88c7
- Vue 3 lifecycle cleanup best practices: https://coreui.io/answers/how-to-use-onunmounted-in-vue/
- Chart.js memory leak discussions: https://github.com/chartjs/Chart.js/issues/4291
- Firestore pagination patterns: https://makerkit.dev/blog/tutorials/pagination-react-firebase-firestore

### Tertiary (LOW confidence - flagged for validation)
- Vue watchers memory leaks: https://bryceandy.com/posts/the-hidden-reason-your-vue-watchers-leak-memory-and-how-to-avoid-it
- Chart.js destroy best practices: https://www.scichart.com/documentation/js/current/MemoryBestPractices.html

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - VueUse, Firebase Performance, Chart.js destroy() are well-documented, stable APIs with extensive adoption
- Architecture: HIGH - Intersection Observer pattern verified in VueUse docs, Firebase Performance initialization is official SDK, pagination pattern matches existing notificationFirebase.ts
- Pitfalls: HIGH - Chart.js memory leaks documented in GitHub issues, intersection observer cleanup is VueUse best practice, pagination boundary enforcement verified in existing code

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable ecosystem, Firebase and VueUse have predictable release cycles)

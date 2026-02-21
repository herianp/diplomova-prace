---
phase: 06-performance
plan: 01
subsystem: performance-monitoring
tags: [lazy-loading, firebase-performance, intersection-observer, chart-optimization]
dependency_graph:
  requires: []
  provides:
    - firebase-performance-monitoring
    - lazy-chart-rendering
    - intersection-observer-composable
  affects:
    - reports-charts-component
tech_stack:
  added:
    - "@vueuse/core@14.2.1"
    - "firebase/performance"
    - "first-input-delay (CDN polyfill)"
  patterns:
    - "Intersection Observer API for lazy rendering"
    - "Composable pattern for reusable lazy load logic"
    - "Skeleton placeholder pattern (no layout shift)"
key_files:
  created:
    - "src/composables/useChartLazyLoad.ts"
  modified:
    - "src/firebase/config.ts"
    - "src/components/reports/ReportsCharts.vue"
    - "package.json"
    - "index.html"
decisions:
  - summary: "Use VueUse intersection observer instead of native API"
    rationale: "VueUse provides Vue 3 reactive wrapper with automatic cleanup"
  - summary: "Threshold 0.1 with 50px rootMargin for early chart rendering"
    rationale: "Starts chart creation slightly before full visibility for smooth UX"
  - summary: "hasRendered flag prevents re-observation after first intersection"
    rationale: "Charts persist after scrolling away - no destroy/recreate cycle"
  - summary: "Individual visibility watchers per chart instead of single observer"
    rationale: "Enables independent lifecycle control and filter-based re-rendering"
metrics:
  duration_minutes: 4.4
  tasks_completed: 2
  commits: 3
  files_created: 1
  files_modified: 6
  completed_date: "2026-02-15"
---

# Phase 06 Plan 01: Performance Monitoring & Lazy Charts Summary

**One-liner:** Lazy Chart.js rendering via Intersection Observer + Firebase Performance baseline monitoring with automatic web vitals tracking (FCP, LCP, CLS, FID).

## What Was Built

### Infrastructure
- **Firebase Performance Monitoring**: Initialized in `src/firebase/config.ts` with automatic web vitals tracking
- **FID Polyfill**: Added `first-input-delay` CDN script to `index.html` for accurate First Input Delay measurement
- **VueUse Integration**: Installed `@vueuse/core` (v14.2.1) for reactive intersection observer

### Composable
- **`useChartLazyLoad`**: Reusable composable providing:
  - `chartContainer` ref for intersection observer target
  - `isVisible` reactive flag for conditional rendering
  - `hasRendered` flag to prevent re-observation
  - Automatic cleanup on component unmount
  - Configuration: `threshold: 0.1`, `rootMargin: '50px'`

### ReportsCharts Component
- **4 independent lazy load instances** (participation, types, trend, ranking)
- **Skeleton placeholders** (`q-skeleton`) shown before charts enter viewport
- **Visibility watchers** trigger Chart.js creation on intersection
- **Conditional rendering** prevents all 4 charts from instantiating simultaneously on mount
- **Preserved Chart.js cleanup** - existing `destroyAllCharts()` in `onUnmounted` unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Variable scope issues causing eslint no-undef errors**
- **Found during:** Task 1 build verification
- **Issue:** Variables declared inside try blocks referenced in catch blocks (4 files)
  - NotificationsDropdown.vue: `unreadIds` undefined in catch
  - NotificationsPage.vue: `unreadIds` undefined in catch
  - SettingsPage.vue: `currentUser` not defined (should be `user`)
  - SingleTeamPage.vue: `members` undefined in catch
- **Fix:** Moved variable declarations outside try blocks for proper scope
- **Files modified:**
  - `src/components/notifications/NotificationsDropdown.vue`
  - `src/pages/NotificationsPage.vue`
  - `src/pages/SettingsPage.vue`
  - `src/pages/SingleTeamPage.vue`
- **Commit:** 967c2b6

These were pre-existing bugs blocking the build pipeline - auto-fixed per Rule 1 (blocking issues).

## Implementation Details

### Chart Rendering Flow
**Before (synchronous):**
1. Component mounts
2. `onMounted` → `createAllCharts()`
3. All 4 Chart.js instances created simultaneously
4. Main thread blocked during canvas rendering

**After (lazy):**
1. Component mounts → skeletons shown
2. Intersection observer watches each chart container
3. Chart enters viewport → `isVisible` becomes true
4. Watcher triggers individual `create*Chart()` function
5. Chart.js instance created on-demand
6. Observer stops after first render (via `hasRendered` flag)

### Data Flow
```
ReportsCharts.vue
  ├─ useChartLazyLoad (participation) → participationVisible
  │   └─ watch(participationVisible) → createParticipationChart()
  ├─ useChartLazyLoad (types) → typesVisible
  │   └─ watch(typesVisible) → createSurveyTypesChart()
  ├─ useChartLazyLoad (trend) → trendVisible
  │   └─ watch(trendVisible) → createMonthlyTrendChart()
  └─ useChartLazyLoad (ranking) → rankingVisible
      └─ watch(rankingVisible) → createPlayerRankingChart()
```

### Firebase Performance Monitoring
- **Automatic metrics tracked:**
  - FCP (First Contentful Paint)
  - LCP (Largest Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - FID (First Input Delay) - via polyfill
- **No custom traces added** (per plan - baseline monitoring only)
- **Console access:** Firebase Console → Performance → Web Vitals

## Testing Performed

### Build Verification
- `yarn build` succeeded with no TypeScript or linting errors
- VueUse package confirmed installed: `@vueuse/core@14.2.1`
- Firebase Performance import verified in `config.ts`
- Skeleton placeholders confirmed in template (4 instances)

### Code Verification
- `useChartLazyLoad` import present in ReportsCharts.vue
- 4 independent lazy load instances created
- All chart containers have `ref` attributes
- All canvases have `v-if` conditional rendering
- All skeletons have matching heights (400px for participation/ranking, 300px for types/trend)

## Success Criteria Met

- ✅ **PRF-01**: Charts in ReportsCharts.vue render lazily via intersection observer (not all 4 on mount)
- ✅ **PRF-02**: Firebase Performance Monitoring initialized, automatic web vitals tracking active
- ✅ No TypeScript or build errors introduced
- ✅ Chart.js destroy() cleanup preserved in onUnmounted

## Known Limitations

1. **Initial viewport chart still renders immediately**: The participation chart (top of page) will render on mount since it's in the initial viewport. This is expected behavior - lazy loading targets below-the-fold content.

2. **No custom performance traces**: Per plan scope, only automatic web vitals are tracked. Custom traces for Firebase operations or chart rendering time are deferred to future optimization phases.

3. **Filter/player changes recreate all visible charts**: When filters or selected player change, all currently visible charts are destroyed and recreated. Incremental chart updates (via Chart.js `.update()`) could reduce this overhead but are out of scope.

## Files Modified

### Created (1)
- `src/composables/useChartLazyLoad.ts` - Reusable lazy load composable

### Modified (6)
- `src/firebase/config.ts` - Added Performance Monitoring initialization
- `src/components/reports/ReportsCharts.vue` - Integrated lazy loading with 4 instances
- `package.json` - Added `@vueuse/core` dependency
- `index.html` - Added FID polyfill script
- `yarn.lock` - Updated with VueUse dependencies
- 4 Vue files (bug fixes) - Fixed variable scope issues

## Commits

| Hash    | Type    | Message                                                    |
| ------- | ------- | ---------------------------------------------------------- |
| 06909e6 | feat    | implement lazy chart loading with intersection observer    |
| 967c2b6 | fix     | resolve variable scope issues in catch blocks              |
| 46ddcf4 | feat    | install VueUse and initialize Firebase Performance         |

## Next Steps

This plan establishes the foundation for Phase 06 performance optimization:

1. **Plan 06-02** (next): Lighthouse audit + Quasar optimization (code splitting, lazy routes, bundle analysis)
2. **Future optimization**: Custom Firebase Performance traces for API calls, chart rendering time, listener setup
3. **Future enhancement**: Chart.js incremental updates instead of destroy/recreate on filter changes

## Self-Check: PASSED

### Files Created
✅ `src/composables/useChartLazyLoad.ts` exists

### Files Modified
✅ `src/firebase/config.ts` contains `getPerformance` import
✅ `src/components/reports/ReportsCharts.vue` contains `useChartLazyLoad` imports
✅ `package.json` contains `@vueuse/core` dependency
✅ `index.html` contains FID polyfill script

### Commits
✅ 06909e6: Lazy chart loading implementation
✅ 967c2b6: Variable scope bug fixes
✅ 46ddcf4: VueUse + Firebase Performance installation

### Build
✅ `yarn build` completed successfully with no errors

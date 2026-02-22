---
phase: quick-3
plan: 01
subsystem: UI/UX
tags: [charts, dialog, weather, i18n, spacing]
dependency_graph:
  requires: []
  provides: [consistent-chart-spacing, player-dialog-scroll, weather-chip-on-survey-cards]
  affects: [ReportsCharts, PlayersComponent, SurveyCard]
tech_stack:
  added: [Open-Meteo API, useWeatherService composable]
  patterns: [module-level cache, reactive ref async update]
key_files:
  created:
    - src/composable/useWeatherService.ts
  modified:
    - src/components/reports/ReportsCharts.vue
    - src/components/players/PlayersComponent.vue
    - src/components/new/SurveyCard.vue
    - src/i18n/en-US/index.ts
    - src/i18n/cs-CZ/index.ts
decisions:
  - Weather chip silently no-ops on API error — weather is nice-to-have, not critical
  - Module-level cache prevents repeated API calls across multiple SurveyCard instances
  - Chip placed between date text and status chip in a q-gutter-xs row for clean layout
metrics:
  duration: ~8 minutes
  completed: 2026-02-22
  tasks_completed: 2
  files_modified: 5
---

# Quick Task 3: Fix ReportsCharts Chart Overlap, PlayersComponent Dialog, and SurveyCard Weather Chip

**One-liner:** Consistent q-mb-lg spacing on all 4 chart cards, scrollable 85vh player dialog, and Open-Meteo weather chip on upcoming survey cards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix ReportsCharts spacing and PlayersComponent dialog | 21eba3c | ReportsCharts.vue, PlayersComponent.vue |
| 2 | Create weather composable and add weather chip to SurveyCard | 70763f3 | useWeatherService.ts, SurveyCard.vue, en-US/index.ts, cs-CZ/index.ts |

## What Was Built

### Task 1 — ReportsCharts spacing + PlayersComponent dialog

**ReportsCharts.vue:** Added `q-mb-lg` class to the Survey Types card (line 29), Monthly Trend card (line 45), and Player Ranking card (line 61). The participation chart (line 13) already had the class. All four cards now have consistent bottom margin.

**PlayersComponent.vue:** Updated the `q-dialog` element with `position="standard"` for proper centering. Updated the `q-card` with `class="q-ma-md"` and `style="max-height: 85vh"`. Wrapped all scrollable content sections (stats grid, doughnut chart, progress bars, finances) in a `<div style="max-height: calc(85vh - 130px); overflow-y: auto;">`. The header and close button remain outside the scroll area.

### Task 2 — Weather composable + SurveyCard weather chip

**useWeatherService.ts:** New composable with:
- Module-level `ForecastCache` object (outside composable function) — shared across all instances, 30-minute TTL
- `getWeatherForDate(dateString)` returns a `Ref<WeatherData | null>`
- Range check: only fetches for dates 0–15 days from today (using Luxon)
- Fetches from Open-Meteo: Prague coordinates (lat 50.08, lon 14.42), 16-day daily forecast
- Maps weathercodes to Material icons and i18n category keys
- Silent try/catch — weather failure never breaks the UI

**SurveyCard.vue:** Imported `useWeatherService`, called `getWeatherForDate(props.survey.date)` in setup. Added `q-chip` with `v-if="weather"` between date text div and status chip, wrapped both chips in `div.row.items-center.q-gutter-xs`.

**i18n:** Added `weather.forecast` and `weather.code.{category}` keys (8 categories) to both `en-US/index.ts` and `cs-CZ/index.ts`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/composable/useWeatherService.ts` — created, verified exists
- `src/components/reports/ReportsCharts.vue` — all 4 chart cards have q-mb-lg
- `src/components/players/PlayersComponent.vue` — dialog has max-height 85vh with scrollable content div
- `src/components/new/SurveyCard.vue` — weather chip added with v-if guard
- `src/i18n/en-US/index.ts` — weather key added before rateLimits
- `src/i18n/cs-CZ/index.ts` — weather key added before rateLimits
- Commit 21eba3c — verified in git log
- Commit 70763f3 — verified in git log
- TypeScript check: only pre-existing SurveyTag.vue error (unrelated to this task)

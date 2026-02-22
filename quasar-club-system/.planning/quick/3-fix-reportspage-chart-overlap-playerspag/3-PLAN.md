---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/reports/ReportsCharts.vue
  - src/components/players/PlayersComponent.vue
  - src/composable/useWeatherService.ts
  - src/components/new/SurveyCard.vue
  - src/i18n/en-US/index.ts
  - src/i18n/cs-CZ/index.ts
autonomous: true
requirements: [QF-3]
must_haves:
  truths:
    - "All four chart cards in ReportsCharts have consistent bottom margin spacing"
    - "Player detail dialog has margin from viewport edges and scrolls when content overflows"
    - "SurveyCard shows weather chip with icon and temperature for surveys within 16-day forecast range"
    - "Weather chip does not appear for surveys outside forecast range"
    - "Weather translations exist in both en-US and cs-CZ"
  artifacts:
    - path: "src/components/reports/ReportsCharts.vue"
      provides: "Consistent chart card spacing"
    - path: "src/components/players/PlayersComponent.vue"
      provides: "Dialog with margin and scroll"
    - path: "src/composable/useWeatherService.ts"
      provides: "Weather data fetching composable"
    - path: "src/components/new/SurveyCard.vue"
      provides: "Weather chip on survey cards"
  key_links:
    - from: "src/components/new/SurveyCard.vue"
      to: "src/composable/useWeatherService.ts"
      via: "import and call"
      pattern: "useWeatherService"
---

<objective>
Fix three UI issues: chart card spacing overlap in ReportsCharts, player detail dialog margin/scroll in PlayersComponent, and add weather forecast chip to SurveyCard.

Purpose: Improve visual polish and add useful weather context for upcoming surveys.
Output: Fixed spacing, improved dialog, weather-enabled survey cards.
</objective>

<execution_context>
@C:/Users/Developer/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Developer/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/reports/ReportsCharts.vue
@src/components/players/PlayersComponent.vue
@src/components/new/SurveyCard.vue
@src/i18n/en-US/index.ts
@src/i18n/cs-CZ/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix ReportsCharts spacing and PlayersComponent dialog</name>
  <files>src/components/reports/ReportsCharts.vue, src/components/players/PlayersComponent.vue</files>
  <action>
**ReportsCharts.vue:**
- Add `q-mb-lg` class to ALL chart card q-card elements, not just the first one. Currently only the participation chart card (line 13) has `q-mb-lg`. Add it to the Survey Types card (line 29), Monthly Trend card (line 45), and Player Ranking card (line 61). This ensures consistent vertical spacing between all chart rows.

**PlayersComponent.vue:**
- On the `q-dialog` element (line 104), add `position="standard"` to ensure proper centering.
- On the `q-card` inside the dialog (line 105), update the style to: `style="min-width: 400px; max-width: 600px; width: 90vw; max-height: 85vh;"` and add `class="q-ma-md"`.
- Wrap ALL content between the header q-card-section and the close q-card-actions in a `q-scroll-area` with `style="max-height: calc(85vh - 130px);"` OR simpler: add `class="scroll"` and `style="max-height: calc(85vh - 120px); overflow-y: auto;"` to a wrapping div around the stats grid, doughnut chart, progress bars, and finances sections.
- Actually, simplest approach: keep the q-card as-is but add `max-height: 85vh` to style and add Quasar's built-in scroll by wrapping the card sections (from stats grid through finances, NOT header or close button) in a `<div style="max-height: calc(85vh - 130px); overflow-y: auto;">`.
  </action>
  <verify>
Run `npx vue-tsc --noEmit` to check for type errors. Visually: all chart cards should have equal bottom margins; dialog should not extend beyond viewport and should scroll if content overflows.
  </verify>
  <done>All four ReportsCharts cards have `q-mb-lg` class. PlayersComponent dialog has max-height constraint with scrollable content area and margin from edges.</done>
</task>

<task type="auto">
  <name>Task 2: Create weather composable and add weather chip to SurveyCard</name>
  <files>src/composable/useWeatherService.ts, src/components/new/SurveyCard.vue, src/i18n/en-US/index.ts, src/i18n/cs-CZ/index.ts</files>
  <action>
**Create src/composable/useWeatherService.ts:**
- Export a composable `useWeatherService()` that:
  - Maintains a module-level cache (outside composable function) of fetched forecast data with a timestamp, re-fetch if older than 30 minutes.
  - Provides a function `getWeatherForDate(dateString: string): Ref<{icon: string, tempMax: number, tempMin: number, description: string} | null>` that:
    1. Checks if the date is within the next 16 days from today (use Luxon DateTime).
    2. If not in range, returns ref(null).
    3. If in range, fetches (or uses cached) forecast from Open-Meteo: `https://api.open-meteo.com/v1/forecast?latitude=50.08&longitude=14.42&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Prague&forecast_days=16`
    4. Finds the matching date in the response `daily.time` array.
    5. Maps the weathercode to a Material icon name:
       - 0: `wb_sunny` (clear)
       - 1-3: `cloud` (partly cloudy)
       - 45, 48: `foggy` (fog)
       - 51, 53, 55, 56, 57, 61, 63, 65, 66, 67: `water_drop` (rain/drizzle)
       - 71, 73, 75, 77: `ac_unit` (snow)
       - 80, 81, 82: `grain` (showers)
       - 95, 96, 99: `thunderstorm` (thunderstorm)
       - default: `cloud` (unknown)
    6. Maps weathercode to i18n translation key `weather.code.{category}` where category is: clear, partlyCloudy, fog, rain, snow, showers, thunderstorm, unknown.
    7. Returns a reactive ref that updates when fetch completes.
  - Use `async` fetch with try/catch, on error return null silently (weather is nice-to-have, not critical).
  - Import `DateTime` from `luxon`.

**Update src/components/new/SurveyCard.vue:**
- Import `useWeatherService` from `@/composable/useWeatherService`.
- Import `useI18n` (already imported).
- In script setup, call `const { getWeatherForDate } = useWeatherService()` and `const weather = getWeatherForDate(props.survey.date)`.
- In the template, after the status chip (inside the first `row items-center justify-between q-mb-sm` div), add a weather chip that only renders when `weather` is not null:
  ```html
  <q-chip
    v-if="weather"
    :icon="weather.icon"
    color="blue-1"
    text-color="blue-8"
    dense
    :size="isMobile ? 'sm' : undefined"
  >
    {{ weather.tempMax }}° / {{ weather.tempMin }}°
  </q-chip>
  ```
- Place this chip between the date div and the status chip. Wrap both chips + weather in a div with `class="row items-center q-gutter-xs"` if needed to keep layout clean, or place the weather chip right after the date text div.

**Update src/i18n/en-US/index.ts:**
- Add a `weather` key at the top level (after `rateLimits`):
  ```
  weather: {
    forecast: "Weather forecast",
    code: {
      clear: "Clear sky",
      partlyCloudy: "Partly cloudy",
      fog: "Foggy",
      rain: "Rain",
      snow: "Snow",
      showers: "Showers",
      thunderstorm: "Thunderstorm",
      unknown: "Unknown"
    }
  }
  ```

**Update src/i18n/cs-CZ/index.ts:**
- Add matching `weather` key:
  ```
  weather: {
    forecast: "Předpověď počasí",
    code: {
      clear: "Jasno",
      partlyCloudy: "Polojasno",
      fog: "Mlha",
      rain: "Déšť",
      snow: "Sníh",
      showers: "Přeháňky",
      thunderstorm: "Bouřka",
      unknown: "Neznámé"
    }
  }
  ```
  </action>
  <verify>
Run `npx vue-tsc --noEmit` to check for type errors. Verify the weather composable compiles. Check that survey cards for dates within 16 days show a weather chip with icon and temperature range.
  </verify>
  <done>Weather composable fetches and caches Open-Meteo data. SurveyCard shows weather chip (icon + temp range) for surveys within 16-day forecast range. Both en-US and cs-CZ have weather translation keys.</done>
</task>

</tasks>

<verification>
- All chart cards in ReportsCharts.vue have consistent `q-mb-lg` spacing
- Player detail dialog scrolls on small viewports and has margin from edges
- Weather chip appears on SurveyCards with dates within 16 days
- Weather chip does not appear for past or far-future surveys
- No TypeScript compilation errors
- Both language files have weather translations
</verification>

<success_criteria>
1. ReportsCharts page shows evenly spaced chart cards with no overlap
2. PlayersComponent dialog has max-height of 85vh with scrollable content
3. Survey cards display weather forecast chip with Material icon and temperature for upcoming surveys within forecast range
4. App compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-reportspage-chart-overlap-playerspag/3-SUMMARY.md`
</output>

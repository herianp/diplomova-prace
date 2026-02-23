# Quick Task 5: Fix weather to show hourly temperature at survey time

## Goal
Switch weather service from daily forecast (min/max temps) to hourly forecast so SurveyCard shows the actual temperature at the survey's scheduled time. Also fix the "weather changes on reload" bug caused by cache being memory-only.

## Context
- Current API: `daily=temperature_2m_max,temperature_2m_min,weathercode` → shows "18° / 8°"
- Desired: `hourly=temperature_2m,weather_code` → shows "14°" (temp at survey hour)
- Survey has `date` (YYYY-MM-DD) and `time` (HH:MM) fields
- Cache resets on reload (module-level Map) → causes different data on reload
- Open-Meteo hourly supports up to 16 days forecast

## Tasks

### Task 1: Rewrite useWeatherService to use hourly API
**Files:** `src/composable/useWeatherService.ts`
**Action:**
- Change API URL to use `hourly=temperature_2m,weather_code` instead of daily
- Update `WeatherData` interface: replace `tempMax/tempMin` with single `temp` field
- Update `getWeatherForDate` to accept `time` parameter (HH:MM) and find the matching hourly slot
- Update `ForecastCache` interface for hourly data structure
- Use `sessionStorage` for cache persistence across route navigations (fixes reload bug)
- Keep per-location cache keying

### Task 2: Update SurveyCard to pass time and display single temperature
**Files:** `src/components/new/SurveyCard.vue`
**Action:**
- Pass `props.survey.time` to `getWeatherForDate`
- Update weather chip template from `{{ weather.tempMax }}° / {{ weather.tempMin }}°` to `{{ weather.temp }}°`

### Task 3: Update i18n if needed
**Files:** `src/i18n/cs-CZ/index.ts`, `src/i18n/en-US/index.ts`
**Action:** No changes needed — existing weather code translations still apply.

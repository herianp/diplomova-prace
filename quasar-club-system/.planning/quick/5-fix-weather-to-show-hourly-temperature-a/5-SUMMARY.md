# Quick Task 5: Summary

## What changed

### useWeatherService.ts (rewritten)
- **API**: Switched from `daily` to `hourly` forecast (`hourly=temperature_2m,weather_code`)
- **WeatherData interface**: Replaced `tempMax`/`tempMin` with single `temp` field
- **getWeatherForDate**: Now accepts `time` parameter (HH:MM) — finds the exact hourly slot matching the survey time
- **Cache persistence**: Added `sessionStorage` backup so cache survives route navigations and soft reloads (fixes "weather changes on reload" bug)
- **Cache key**: Still per-location (`"lat,lng"`)

### SurveyCard.vue
- Passes `props.survey.time` to `getWeatherForDate`
- Weather chip now shows `14°` instead of `18° / 8°`

## Bugs fixed
1. **Weather showed daily min/max** instead of actual temperature at survey hour
2. **Weather changed on page reload** because in-memory cache was lost — now persisted in sessionStorage with 30min TTL

## Commit
- `093812b` feat(quick-5): show hourly weather at survey time instead of daily min/max

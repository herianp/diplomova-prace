---
phase: quick-4
plan: 01
subsystem: team-settings
tags: [team, settings, chat, weather, geocoding, firestore]
dependency_graph:
  requires: []
  provides: [team-settings-subcollection, chat-toggle, location-aware-weather]
  affects: [SingleTeamPage, MessagesComponent, SurveyCard, teamFirebase, teamStore, useTeamUseCases]
tech_stack:
  added: [Nominatim geocoding API]
  patterns: [Firestore subcollection settings, per-location weather cache Map]
key_files:
  created: []
  modified:
    - src/interfaces/interfaces.ts
    - src/services/teamFirebase.ts
    - src/stores/teamStore.ts
    - src/composable/useTeamUseCases.ts
    - src/pages/SingleTeamPage.vue
    - src/components/MessagesComponent.vue
    - src/composable/useWeatherService.ts
    - src/components/new/SurveyCard.vue
    - firestore.rules
    - src/i18n/cs-CZ/index.ts
    - src/i18n/en-US/index.ts
decisions:
  - Team settings stored in teams/{teamId}/settings/general subcollection (not on team document itself)
  - Prague (50.08, 14.42) as default coords when no team settings configured
  - Module-level Map cache keyed by "lat,lng" replaces single cache object in weather service
  - Settings loaded directly in SingleTeamPage and MessagesComponent (not via reactive listener)
metrics:
  duration: ~15 minutes
  completed: 2026-02-23
  tasks_completed: 3
  files_modified: 11
---

# Quick Task 4: Team Settings with chatEnabled Toggle — Summary

**One-liner:** Team settings subcollection with chatEnabled toggle and Nominatim geocoding for location-aware weather forecasts.

## What Was Built

Power users can configure team settings on SingleTeamPage: toggle chat on/off and geocode a team address. The chat toggle disables message sending app-wide. Weather forecasts on SurveyCard now use team-configured coordinates instead of hardcoded Prague.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ITeamSettings interface, Firebase service, store state, Firestore rules, i18n | c7a2b50 | interfaces.ts, teamFirebase.ts, teamStore.ts, useTeamUseCases.ts, firestore.rules, cs-CZ/index.ts, en-US/index.ts |
| 2 | Settings UI on SingleTeamPage, chatEnabled in MessagesComponent | ea04182 | SingleTeamPage.vue, MessagesComponent.vue |
| 3 | Weather service accepts lat/lng, SurveyCard uses team coords | 696c222 | useWeatherService.ts, SurveyCard.vue |

## Architecture

- **ITeamSettings interface** (`interfaces.ts`): `{ chatEnabled: boolean, address: { name, latitude, longitude } }`
- **Firestore path**: `teams/{teamId}/settings/general`
- **Firestore rules**: members can read, power users can create/update settings
- **teamStore.currentTeamSettings**: nullable ref, cleared on team change
- **Weather caching**: `Map<string, ForecastCache>` keyed by `"${lat},${lng}"` replaces single cache

## Key Links

- `SingleTeamPage` → `teamFirebase.getTeamSettings/updateTeamSettings` + `teamStore.setCurrentTeamSettings`
- `MessagesComponent` → `teamStore.currentTeamSettings.chatEnabled` (defaults true when null)
- `SurveyCard` → reads `teamStore.currentTeamSettings?.address` → passes to `getWeatherForDate(date, lat, lng)`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 11 modified files verified present. All 3 task commits verified in git log.

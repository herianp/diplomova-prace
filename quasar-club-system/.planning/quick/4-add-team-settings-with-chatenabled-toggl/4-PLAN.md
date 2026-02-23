---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/interfaces/interfaces.ts
  - src/services/teamFirebase.ts
  - src/stores/teamStore.ts
  - src/composable/useTeamUseCases.ts
  - src/pages/SingleTeamPage.vue
  - src/composable/useWeatherService.ts
  - src/components/new/SurveyCard.vue
  - src/components/MessagesComponent.vue
  - firestore.rules
  - src/i18n/cs-CZ/index.ts
  - src/i18n/en-US/index.ts
autonomous: true
requirements: [SETTINGS-01, SETTINGS-02, SETTINGS-03]
must_haves:
  truths:
    - "Power users can toggle chatEnabled on/off in team settings on SingleTeamPage"
    - "Power users can set a team address that gets geocoded to lat/lng via Nominatim"
    - "Team settings persist in Firestore subcollection teams/{teamId}/settings/general"
    - "When chatEnabled is false, message input is disabled with a banner for all users including power users"
    - "SurveyCard weather chip uses team location coordinates instead of hardcoded Prague"
    - "Weather service accepts lat/lng parameters and caches per location"
  artifacts:
    - path: "src/interfaces/interfaces.ts"
      provides: "ITeamSettings interface"
      contains: "ITeamSettings"
    - path: "src/services/teamFirebase.ts"
      provides: "getTeamSettings, updateTeamSettings functions"
      exports: ["getTeamSettings", "updateTeamSettings"]
    - path: "firestore.rules"
      provides: "Settings subcollection security rules"
      contains: "settings"
  key_links:
    - from: "src/pages/SingleTeamPage.vue"
      to: "src/services/teamFirebase.ts"
      via: "getTeamSettings/updateTeamSettings calls"
      pattern: "teamFirebase\\.(get|update)TeamSettings"
    - from: "src/components/new/SurveyCard.vue"
      to: "src/composable/useWeatherService.ts"
      via: "getWeatherForDate with lat/lng params"
      pattern: "getWeatherForDate.*latitude|longitude"
    - from: "src/components/MessagesComponent.vue"
      to: "src/stores/teamStore.ts"
      via: "currentTeamSettings.chatEnabled check"
      pattern: "chatEnabled"
---

<objective>
Add team settings feature with chatEnabled toggle and team address/location.

Purpose: Allow power users to configure team-specific settings (chat on/off, team location for weather). Team location replaces hardcoded Prague coordinates in weather forecasts on SurveyCard.

Output: Working team settings UI on SingleTeamPage, chat toggle affecting MessagesComponent, location-aware weather on SurveyCard.
</objective>

<execution_context>
@C:/Users/Developer/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Developer/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/interfaces/interfaces.ts
@src/services/teamFirebase.ts
@src/stores/teamStore.ts
@src/composable/useTeamUseCases.ts
@src/pages/SingleTeamPage.vue
@src/composable/useWeatherService.ts
@src/components/new/SurveyCard.vue
@src/components/MessagesComponent.vue
@firestore.rules
@src/i18n/cs-CZ/index.ts
@src/i18n/en-US/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add ITeamSettings interface, Firebase service, store state, Firestore rules, and i18n translations</name>
  <files>
    src/interfaces/interfaces.ts
    src/services/teamFirebase.ts
    src/stores/teamStore.ts
    src/composable/useTeamUseCases.ts
    firestore.rules
    src/i18n/cs-CZ/index.ts
    src/i18n/en-US/index.ts
  </files>
  <action>
    1. **interfaces.ts** - Add after the ITeam interface:
       ```typescript
       export interface ITeamSettings {
         chatEnabled: boolean
         address: {
           name: string
           latitude: number
           longitude: number
         }
       }
       ```
       Default values should be: chatEnabled=true, address={name:'', latitude:50.08, longitude:14.42} (Prague fallback).

    2. **teamFirebase.ts** - Add two functions inside useTeamFirebase():
       - `getTeamSettings(teamId: string): Promise<ITeamSettings>` - reads `teams/{teamId}/settings/general` doc. If doc doesn't exist, return default settings (chatEnabled:true, Prague coords). Use `getDoc` from Firestore.
       - `updateTeamSettings(teamId: string, settings: ITeamSettings): Promise<void>` - uses `setDoc` with merge:true to write to `teams/{teamId}/settings/general`. Import `setDoc` from firebase/firestore. Wrap with mapFirestoreError and logger like existing functions.
       Return both from the composable's return object.

    3. **teamStore.ts** - Add:
       - `currentTeamSettings` ref of type `ITeamSettings | null` (initial null)
       - `setCurrentTeamSettings(settings: ITeamSettings | null)` mutation
       - Clear it in `clearData()`
       - Export both in return object
       - Import ITeamSettings from interfaces

    4. **useTeamUseCases.ts** - Add:
       - `loadTeamSettings(teamId: string): Promise<void>` - calls teamFirebase.getTeamSettings, sets result via teamStore.setCurrentTeamSettings
       - `saveTeamSettings(teamId: string, settings: ITeamSettings): Promise<void>` - calls teamFirebase.updateTeamSettings, then updates store. Show notifyError on failure.
       - Import ITeamSettings
       - Return both new functions

    5. **firestore.rules** - Inside `match /teams/{teamId}` block (after auditLogs subcollection), add:
       ```
       // Subcollection: settings - members read, power users write
       match /settings/{settingId} {
         allow read: if request.auth != null &&
           get(/databases/$(database)/documents/teams/$(teamId)).data.members.hasAny([request.auth.uid]);
         allow create, update: if request.auth != null &&
           get(/databases/$(database)/documents/teams/$(teamId)).data.powerusers.hasAny([request.auth.uid]);
         allow read: if isAppAdmin();
       }
       ```

    6. **i18n cs-CZ/index.ts** - Add inside the `team` object, after the `single` object:
       ```
       settings: {
         title: 'Nastaveni tymu',
         chatEnabled: 'Povolit chat',
         chatEnabledHint: 'Kdyz je vypnuto, nikdo nemuze odesilat zpravy',
         address: 'Adresa tymu',
         addressPlaceholder: 'Zadejte adresu...',
         searchAddress: 'Vyhledat adresu',
         latitude: 'Zemepisna sirka',
         longitude: 'Zemepisna delka',
         saveSuccess: 'Nastaveni tymu ulozeno',
         saveError: 'Nepodarilo se ulozit nastaveni tymu',
         loadError: 'Nepodarilo se nacist nastaveni tymu',
         chatDisabled: 'Chat je docasne vypnut spravcem tymu'
       }
       ```
       Use proper Czech diacritics (e.g. "Nastaveni tymu" -> "Nastaven\u00ed t\u00fdmu", etc.). The actual strings must have proper Czech characters like: "Nastaven\u00ed t\u00fdmu", "Povolit chat", "Kdy\u017e je vypnuto, nikdo nem\u016f\u017ee odes\u00edlat zpr\u00e1vy", "Adresa t\u00fdmu", "Zadejte adresu...", "Vyhledat adresu", "Zem\u011bpisn\u00e1 \u0161\u00ed\u0159ka", "Zem\u011bpisn\u00e1 d\u00e9lka", "Nastaven\u00ed t\u00fdmu ulo\u017eeno", "Nepoda\u0159ilo se ulo\u017eit nastaven\u00ed t\u00fdmu", "Nepoda\u0159ilo se na\u010d\u00edst nastaven\u00ed t\u00fdmu", "Chat je do\u010dasn\u011b vypnut spr\u00e1vcem t\u00fdmu".

    7. **i18n en-US/index.ts** - Add matching English translations inside the `team` object:
       ```
       settings: {
         title: 'Team Settings',
         chatEnabled: 'Enable Chat',
         chatEnabledHint: 'When disabled, no one can send messages',
         address: 'Team Address',
         addressPlaceholder: 'Enter address...',
         searchAddress: 'Search Address',
         latitude: 'Latitude',
         longitude: 'Longitude',
         saveSuccess: 'Team settings saved',
         saveError: 'Failed to save team settings',
         loadError: 'Failed to load team settings',
         chatDisabled: 'Chat is temporarily disabled by team admin'
       }
       ```

    Also add to messages translations in BOTH language files:
       - `chatDisabled: 'Chat je docasne vypnut spravcem tymu'` (cs, with diacritics) / `'Chat is temporarily disabled by team admin'` (en)
       These go inside the existing `messages` object.
  </action>
  <verify>
    Run `npx tsc --noEmit 2>&1 | head -20` to check TypeScript compiles without errors. Verify the firestore.rules file has valid syntax by checking no unmatched braces.
  </verify>
  <done>
    ITeamSettings interface exists, teamFirebase has get/update settings functions, teamStore has currentTeamSettings state, useTeamUseCases has load/save settings, Firestore rules allow members to read and power users to write settings subcollection, both language files have team.settings and messages.chatDisabled translations.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add settings UI on SingleTeamPage and disable chat when chatEnabled is false</name>
  <files>
    src/pages/SingleTeamPage.vue
    src/components/MessagesComponent.vue
  </files>
  <action>
    1. **SingleTeamPage.vue** - Add a Team Settings section visible only to power users, placed BETWEEN the team management section (invite/pending) and the danger zone:

       - Import `useTeamUseCases` (already partially imported for deleteTeam - destructure `loadTeamSettings` and `saveTeamSettings` from it too)
       - Import `ITeamSettings` from interfaces
       - Add state: `teamSettings = ref(null)`, `savingSettings = ref(false)`, `addressSearch = ref('')`, `searchingAddress = ref(false)`
       - In `loadTeam()`, after `loadPendingInvitations()`, call `await loadSettingsData()` (for power users)
       - Add `loadSettingsData()` function: calls `teamFirebase.getTeamSettings(teamId.value)` and sets `teamSettings.value` to the result. On error, show notify negative with t('team.settings.loadError').
       - Add `saveSettings()` function: sets savingSettings=true, calls `teamFirebase.updateTeamSettings(teamId.value, teamSettings.value)`, shows positive notify t('team.settings.saveSuccess') on success or negative t('team.settings.saveError') on failure. Also update `teamStore.setCurrentTeamSettings(teamSettings.value)`. Finally savingSettings=false.
       - Add `searchAddress()` function: sets searchingAddress=true, calls Nominatim API: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressSearch.value)}&format=json&limit=1` with fetch. On success (results.length > 0), set `teamSettings.value.address = { name: results[0].display_name, latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }`. On empty results, show negative notify "Address not found" / "Adresa nenalezena". Set searchingAddress=false in finally. Add `User-Agent: QuasarClubSystem/1.0` header to fetch request (Nominatim requires it).
       - Import `useTeamStore` and get `teamStore` instance.

       Template for the settings section (inside `v-if="isCurrentUserPowerUser"` check, as a new `<div class="col-12 q-mt-lg">` before the danger zone):
       ```html
       <q-card flat bordered>
         <q-card-section>
           <div class="text-h6 q-mb-md">
             <q-icon name="settings" class="q-mr-sm" />
             {{ $t('team.settings.title') }}
           </div>

           <!-- Chat Toggle -->
           <q-toggle
             v-model="teamSettings.chatEnabled"
             :label="$t('team.settings.chatEnabled')"
             color="primary"
           />
           <div class="text-caption text-grey-6 q-ml-xl q-mb-md">
             {{ $t('team.settings.chatEnabledHint') }}
           </div>

           <!-- Address Section -->
           <div class="text-subtitle2 q-mb-sm">{{ $t('team.settings.address') }}</div>
           <div class="row q-gutter-sm q-mb-md">
             <div class="col">
               <q-input
                 v-model="addressSearch"
                 :placeholder="$t('team.settings.addressPlaceholder')"
                 outlined
                 dense
                 @keydown.enter.prevent="searchAddress"
               />
             </div>
             <div class="col-auto">
               <q-btn
                 :label="$t('team.settings.searchAddress')"
                 icon="search"
                 color="primary"
                 outline
                 dense
                 :loading="searchingAddress"
                 @click="searchAddress"
               />
             </div>
           </div>

           <!-- Current address display -->
           <div v-if="teamSettings.address?.name" class="text-body2 q-mb-sm">
             <q-icon name="place" color="primary" /> {{ teamSettings.address.name }}
           </div>
           <div class="row q-gutter-sm q-mb-md">
             <q-input
               v-model.number="teamSettings.address.latitude"
               :label="$t('team.settings.latitude')"
               type="number"
               outlined
               dense
               class="col"
               step="0.01"
             />
             <q-input
               v-model.number="teamSettings.address.longitude"
               :label="$t('team.settings.longitude')"
               type="number"
               outlined
               dense
               class="col"
               step="0.01"
             />
           </div>

           <!-- Save Button -->
           <q-btn
             :label="$t('common.save')"
             icon="save"
             color="primary"
             unelevated
             :loading="savingSettings"
             @click="saveSettings"
           />
         </q-card-section>
       </q-card>
       ```

       Wrap the settings card in a `<div v-if="isCurrentUserPowerUser && teamSettings" class="col-12 q-mt-lg">`.

    2. **MessagesComponent.vue** - Modify to check chatEnabled:
       - Import `useTeamStore` (already imported) - access `teamStore.currentTeamSettings`
       - Add computed: `isChatEnabled = computed(() => teamStore.currentTeamSettings?.chatEnabled !== false)` (default true if settings not loaded)
       - In `onMounted`, after `waitForTeam()` and before `loadMessages()`, load team settings if not already loaded:
         ```
         if (!teamStore.currentTeamSettings && currentTeam.value?.id) {
           const { useTeamFirebase } = await import('@/services/teamFirebase')
           // Actually simpler: import useTeamUseCases at top and call loadTeamSettings
         }
         ```
         Actually, import `useTeamUseCases` at top and in onMounted call `loadTeamSettings(currentTeam.value.id)` if `teamStore.currentTeamSettings` is null. This ensures settings are available.
       - Change the message input visibility condition from `v-if="isPowerUser"` to `v-if="isPowerUser && isChatEnabled"`
       - Change the non-power-user banner `v-else` to show when either not power user OR chat is disabled. Replace the `v-else` block with:
         ```html
         <div v-if="!isPowerUser || !isChatEnabled" class="no-permission q-mt-md">
           <q-banner rounded class="bg-blue-1 text-blue-8">
             <template v-slot:avatar>
               <q-icon name="info" />
             </template>
             {{ !isChatEnabled ? $t('messages.chatDisabled') : $t('messages.powerUserOnly') }}
           </q-banner>
         </div>
         ```
         IMPORTANT: Remove the original `v-else` banner and replace with this explicit `v-if` so both conditions (not power user, chat disabled) show appropriate message. The message input section should use `v-if="isPowerUser && isChatEnabled"` and NOT be connected to the banner via v-else.
       - Also add `messages.chatDisabled` key to both i18n files (already handled in Task 1).
  </action>
  <verify>
    Run `quasar dev` and navigate to `/team/:teamId` page as a power user. Verify:
    1. Settings card appears with chat toggle and address fields
    2. Typing an address and clicking search geocodes it
    3. Saving settings persists to Firestore (check Firebase console: teams/{id}/settings/general)
    4. Toggle chatEnabled off, navigate to Messages page - input area should be hidden, banner shows "Chat is temporarily disabled"
    5. Toggle chatEnabled back on - input area reappears for power users
  </verify>
  <done>
    SingleTeamPage shows team settings section for power users with chatEnabled toggle and address geocoding via Nominatim. MessagesComponent hides message input and shows disabled banner when chatEnabled is false. Settings persist in Firestore.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update weather service and SurveyCard to use team location coordinates</name>
  <files>
    src/composable/useWeatherService.ts
    src/components/new/SurveyCard.vue
  </files>
  <action>
    1. **useWeatherService.ts** - Modify to accept location parameters and cache per location:
       - Change the module-level cache from a single object to a `Map<string, ForecastCache>`:
         ```typescript
         const cacheMap = new Map<string, ForecastCache>()
         ```
       - Modify `fetchForecast` to accept `latitude: number, longitude: number` params:
         ```typescript
         async function fetchForecast(latitude: number, longitude: number): Promise<ForecastCache['data']> {
           const cacheKey = `${latitude},${longitude}`
           const cached = cacheMap.get(cacheKey)
           const now = Date.now()
           if (cached?.data && now - cached.fetchedAt < CACHE_TTL_MS) {
             return cached.data
           }
           try {
             const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Prague&forecast_days=16`
             const response = await fetch(url)
             if (!response.ok) return null
             const json = await response.json()
             cacheMap.set(cacheKey, { data: json, fetchedAt: now })
             return json
           } catch {
             return null
           }
         }
         ```
       - Modify `getWeatherForDate` signature to accept optional coords:
         ```typescript
         function getWeatherForDate(dateString: string, latitude = 50.08, longitude = 14.42): Ref<WeatherData | null>
         ```
       - Pass latitude and longitude to fetchForecast call inside getWeatherForDate.
       - Remove the old single `cache` const.

    2. **SurveyCard.vue** - Pass team coordinates to weather service:
       - Import `useTeamStore` (already imported)
       - Get team settings from store: `const teamSettings = computed(() => teamStore.currentTeamSettings)` (add `computed` to existing import if not there - it already is imported)
       - Replace the weather call:
         ```javascript
         const { getWeatherForDate } = useWeatherService()
         const weather = computed(() => {
           const lat = teamSettings.value?.address?.latitude ?? 50.08
           const lng = teamSettings.value?.address?.longitude ?? 14.42
           return getWeatherForDate(props.survey.date, lat, lng).value
         })
         ```
         Wait - this won't work because getWeatherForDate returns a ref and is async internally. Better approach:

         Keep the existing pattern but pass coords. Since teamSettings may load after component mount, use a watchEffect:
         ```javascript
         import { watchEffect } from 'vue'

         const { getWeatherForDate } = useWeatherService()
         const weather = ref(null)

         watchEffect(() => {
           const lat = teamStore.currentTeamSettings?.address?.latitude ?? 50.08
           const lng = teamStore.currentTeamSettings?.address?.longitude ?? 14.42
           const result = getWeatherForDate(props.survey.date, lat, lng)
           // Watch the returned ref
           watch(result, (val) => { weather.value = val }, { immediate: true })
         })
         ```

         Actually simplest approach: just read coords at component setup time (they'll usually be loaded by the time surveys render since team loads first). Keep it simple:
         ```javascript
         const { getWeatherForDate } = useWeatherService()
         const lat = teamStore.currentTeamSettings?.address?.latitude ?? 50.08
         const lng = teamStore.currentTeamSettings?.address?.longitude ?? 14.42
         const weather = getWeatherForDate(props.survey.date, lat, lng)
         ```
         This mirrors the existing pattern (line 176) but adds lat/lng. The fallback to Prague (50.08, 14.42) ensures it works even without settings loaded. Import `watch` is already available.
  </action>
  <verify>
    1. Run `quasar dev`, set a team address to a different city (e.g., "Brno, Czech Republic") in team settings
    2. Check SurveyCard weather chips - they should show weather for the configured location
    3. If no team settings exist, weather should still show (Prague fallback)
    4. Verify no TypeScript errors: `npx tsc --noEmit 2>&1 | head -20`
  </verify>
  <done>
    Weather service accepts lat/lng parameters with per-location caching. SurveyCard reads team settings coordinates from teamStore and passes them to weather service. Falls back to Prague (50.08, 14.42) when no settings configured.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit`
2. App runs: `quasar dev` starts without errors
3. Power user sees settings section on SingleTeamPage with chat toggle and address fields
4. Address search via Nominatim returns and populates lat/lng fields
5. Saving settings creates teams/{id}/settings/general document in Firestore
6. Toggling chatEnabled off disables message sending on MessagesPage for all users
7. Weather on SurveyCard uses team location coords (or Prague fallback)
8. Non-power users do NOT see settings section on SingleTeamPage
9. Firestore rules: members can read settings, only power users can write
</verification>

<success_criteria>
- Team settings subcollection (teams/{id}/settings/general) stores chatEnabled and address
- Power users can configure settings on SingleTeamPage
- Chat toggle controls message sending across the app
- Weather forecasts use team-configured coordinates
- Firestore rules properly secure the settings subcollection
- Both CS and EN translations present
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-team-settings-with-chatenabled-toggl/4-SUMMARY.md`
</output>

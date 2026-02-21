---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/admin/AdminComponent.vue
  - src/enums/routesEnum.ts
  - src/router/routes.js
  - src/components/new/CustomDrawer.vue
  - src/pages/PlayersPage.vue
  - src/components/players/PlayersComponent.vue
  - src/i18n/cs-CZ/index.ts
  - src/i18n/en-US/index.ts
autonomous: true
requirements: [QUICK-01]

must_haves:
  truths:
    - "Admin page has consistent padding/spacing matching Dashboard, Reports, etc."
    - "Players link appears in sidebar navigation between Reports and Cashbox"
    - "Players page shows a responsive grid of player cards with avatar, name, email"
    - "Clicking a player card opens a dialog with stats (participation rate, attendance rate, vote breakdown), a doughnut chart, and fines/payments balance"
    - "Search bar filters players by name/email"
  artifacts:
    - path: "src/components/admin/AdminComponent.vue"
      provides: "Admin container padding fix"
      contains: "admin-container"
    - path: "src/pages/PlayersPage.vue"
      provides: "Thin page wrapper"
      contains: "PlayersComponent"
    - path: "src/components/players/PlayersComponent.vue"
      provides: "Player cards grid + detail dialog"
      min_lines: 150
    - path: "src/enums/routesEnum.ts"
      provides: "PLAYERS route enum entry"
      contains: "PLAYERS"
    - path: "src/router/routes.js"
      provides: "Players route registration"
      contains: "PlayersPage"
  key_links:
    - from: "src/components/new/CustomDrawer.vue"
      to: "RouteEnum.PLAYERS"
      via: "topLinks array entry"
      pattern: "PLAYERS"
    - from: "src/components/players/PlayersComponent.vue"
      to: "useTeamMemberUtils"
      via: "composable import"
      pattern: "useTeamMemberUtils"
    - from: "src/components/players/PlayersComponent.vue"
      to: "useCashboxUseCases"
      via: "composable import for fines/payments"
      pattern: "useCashboxUseCases"
---

<objective>
Fix admin page styling to match other pages (add container padding) and create a new PlayersPage with a searchable player cards grid and a detail popup dialog showing stats, chart, and financial balance.

Purpose: Consistent UI across all pages and a dedicated player overview for team management.
Output: Fixed AdminComponent styling + new PlayersPage with PlayersComponent (cards grid + detail dialog).
</objective>

<execution_context>
@C:/Users/Developer/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Developer/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/admin/AdminComponent.vue
@src/components/DashboardComponent.vue (container padding pattern)
@src/components/team/TeamPlayerCardsComponent.vue (card design pattern)
@src/composable/useTeamMemberUtils.ts (member loading, stats, search)
@src/composable/useCashboxUseCases.ts (fines/payments data)
@src/enums/routesEnum.ts
@src/router/routes.js
@src/components/new/CustomDrawer.vue
@src/pages/DashboardPage.vue (thin wrapper pattern)
@src/i18n/en-US/index.ts
@src/i18n/cs-CZ/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix admin page padding and add Players route/nav</name>
  <files>
    src/components/admin/AdminComponent.vue
    src/enums/routesEnum.ts
    src/router/routes.js
    src/components/new/CustomDrawer.vue
  </files>
  <action>
1. In AdminComponent.vue, change root `<div>` (line 2) to `<div class="admin-container">`. Add scoped style block:
```css
.admin-container {
  width: 100%;
  padding: 1rem;
}
@media (min-width: 600px) {
  .admin-container {
    padding: 1.5rem;
  }
}
```

2. In routesEnum.ts, add entry after CASHBOX:
```
PLAYERS: { path: '/players', name: 'players' },
```

3. In routes.js, add route inside MainLayout children (after REPORTS line, before CASHBOX):
```js
{ path: RouteEnum.PLAYERS.path, name: RouteEnum.PLAYERS.name, component: () => import("pages/PlayersPage.vue") },
```

4. In CustomDrawer.vue, add Players entry in topLinks array between Reports and Cashbox (index 4):
```js
{ title: "Players", icon: "person", route: RouteEnum.PLAYERS.path },
```
  </action>
  <verify>Run `quasar dev` -- admin page should have padding matching dashboard. /players route should resolve (will 404 until Task 2). Drawer should show Players link between Reports and Cashbox.</verify>
  <done>Admin page has .admin-container with responsive padding. PLAYERS route registered in enum, router, and drawer nav.</done>
</task>

<task type="auto">
  <name>Task 2: Create PlayersPage and PlayersComponent with cards grid and detail dialog</name>
  <files>
    src/pages/PlayersPage.vue
    src/components/players/PlayersComponent.vue
    src/i18n/en-US/index.ts
    src/i18n/cs-CZ/index.ts
  </files>
  <action>
1. Create `src/pages/PlayersPage.vue` following thin wrapper pattern:
```vue
<template>
  <div class="view">
    <PlayersComponent />
  </div>
</template>
<script setup>
import PlayersComponent from "@/components/players/PlayersComponent.vue";
</script>
```

2. Create `src/components/players/PlayersComponent.vue` with the following structure:

**Template:**
- Root div with class `players-container` (same padding pattern as dashboard-container)
- Header row: title "Players" (text-h5 bold) + text-caption description + member count chip
- Search bar: `q-input` with outlined, dense, debounce="300", clearable, prepend search icon, v-model searchTerm
- Loading state: `q-spinner` centered when loading
- Cards grid: `div.row.q-col-gutter-md` with `div.col-12.col-sm-6.col-md-4.col-lg-3` per card
- Each card: `q-card` flat bordered with class `player-card`, clickable (`@click="openDetail(member)"`)
  - `q-card-section` centered: `q-avatar` (60px, primary, person icon or photoURL img), text-h6 displayName, text-caption email
  - Bottom row: two small chips showing participation rate (%) and attendance rate (%) with icons "how_to_reg" and "event_available"
- Detail dialog: `q-dialog` v-model `showDetail`, persistent=false
  - `q-card` style min-width 400px, max-width 600px
  - Card section header: avatar + name + email + close btn
  - Card section stats: 4 mini metric boxes in a 2x2 grid (totalSurveys, yesVotes, noVotes, unvoted) -- use simple div boxes with bg-grey-2 rounded padding, not MetricCard component (too heavy for dialog)
  - Card section chart: canvas ref for a Doughnut chart showing Yes/No/Unvoted breakdown (green/red/grey colors matching existing chart palette)
  - Card section rates: two `q-linear-progress` bars -- participation rate (color primary) and attendance rate (color positive) with labels
  - Card section finances: show totalFined, totalPaid, balance using simple colored text (positive=green, negative=red). Only show if fines/payments data is available.
  - Close button at bottom

**Script setup (TypeScript):**
- Import and use: `useTeamMemberUtils()` for loadTeamMembers, getMemberDisplayName, filterMembers, sortMembersByName, getMemberStats
- Import and use: `useReadiness()` -- call `waitForTeam()` on mounted
- Import and use: `useTeamStore()` -- get currentTeam, surveys
- Import and use: `useSurveyUseCases()` -- call `setSurveysListener` on mounted to ensure surveys are loaded
- Import and use: `useCashboxUseCases()` -- call `listenToFines()` and `listenToPayments()` on mounted, use returned refs to compute per-player balance
- Import Chart from 'chart.js/auto'
- Refs: members, searchTerm, showDetail, selectedMember, selectedStats, chartRef, chartInstance, fines, payments
- On mounted: waitForTeam, then loadTeamMembers(currentTeam.members), setSurveysListener, listenToFines, listenToPayments
- Computed `filteredMembers`: pipe members through filterMembers(searchTerm) then sortMembersByName
- `openDetail(member)`: set selectedMember, compute getMemberStats from surveys, compute player balance from fines/payments, set showDetail=true, nextTick -> render doughnut chart on chartRef canvas
- `getPlayerBalance(playerId)`: filter fines/payments by playerId, sum amounts, return { totalFined, totalPaid, balance: totalPaid - totalFined }
- Chart: Doughnut with data [yesVotes, noVotes, unvoted], colors ['#21BA45','#C10015','#9E9E9E'], no legend, compact size
- Destroy chart instance before creating new one (if chartInstance exists, call .destroy())
- On unmount: destroy chart instance

**Scoped styles:**
```css
.players-container { width: 100%; padding: 1rem; }
@media (min-width: 600px) { .players-container { padding: 1.5rem; } }
.player-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
.player-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
```

3. Add i18n translations:

**en-US** -- add `players` section:
```
players: {
  title: "Players",
  description: "Team members overview",
  search: "Search players...",
  noPlayers: "No team members found",
  noResults: "No players match your search",
  detail: {
    stats: "Statistics",
    totalSurveys: "Total Surveys",
    yesVotes: "Yes Votes",
    noVotes: "No Votes",
    unvoted: "Unvoted",
    participationRate: "Participation Rate",
    attendanceRate: "Attendance Rate",
    voteBreakdown: "Vote Breakdown",
    finances: "Finances",
    totalFined: "Total Fined",
    totalPaid: "Total Paid",
    balance: "Balance",
    close: "Close"
  }
}
```

**cs-CZ** -- add `players` section:
```
players: {
  title: "Hraci",
  description: "Prehled clenu tymu",
  search: "Hledat hrace...",
  noPlayers: "Zadni clenove tymu nenalezeni",
  noResults: "Zadni hraci neodpovidaji hledani",
  detail: {
    stats: "Statistiky",
    totalSurveys: "Celkem ankety",
    yesVotes: "Ano hlasy",
    noVotes: "Ne hlasy",
    unvoted: "Nehlasovano",
    participationRate: "Mira ucastni",
    attendanceRate: "Mira dochazky",
    voteBreakdown: "Rozlozeni hlasu",
    finances: "Finance",
    totalFined: "Celkem pokutovano",
    totalPaid: "Celkem zaplaceno",
    balance: "Zustatek",
    close: "Zavrit"
  }
}
```
Use proper Czech diacritics (e.g. "Hraci" -> "Hraci" with proper hacky/carky as appropriate for Czech language).
  </action>
  <verify>
1. Navigate to /players -- page renders with player cards grid
2. Search filters cards by name/email in real time
3. Click a card -- detail dialog opens with stats, doughnut chart, progress bars, and finance info
4. Dialog closes on close button or clicking outside
5. Responsive: cards stack on mobile (1 col), 2 on sm, 3 on md, 4 on lg
6. No console errors
  </verify>
  <done>PlayersPage renders team members as searchable card grid. Clicking a card opens detail dialog with stats (participation/attendance rates), doughnut chart (yes/no/unvoted), and financial balance. Czech and English translations work.</done>
</task>

</tasks>

<verification>
1. Admin page at /admin has consistent padding matching /dashboard
2. Players link appears in drawer navigation between Reports and Cashbox
3. /players page loads and shows all team members as cards
4. Search filters players correctly
5. Player detail dialog shows accurate stats from survey data
6. Doughnut chart renders correctly in dialog
7. Financial section shows fines/payments balance
8. Both English and Czech translations display correctly
</verification>

<success_criteria>
- AdminComponent has .admin-container with responsive padding identical to DashboardComponent pattern
- PLAYERS route in enum, router, and drawer nav (between Reports and Cashbox)
- PlayersComponent renders searchable responsive card grid
- Player detail dialog shows stats, chart, rates, and finances
- No TypeScript or runtime errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-admin-page-styling-and-create-player/1-SUMMARY.md`
</output>

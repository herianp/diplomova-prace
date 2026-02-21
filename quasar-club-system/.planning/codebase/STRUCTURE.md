# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
quasar-club-system/
├── src/                           # Source code root
│   ├── App.vue                    # Root component with router-view
│   ├── boot/                      # Quasar boot files (run before app)
│   │   └── i18n.js               # i18n initialization
│   ├── components/                # Reusable Vue components
│   │   ├── admin/                # Admin-specific components
│   │   ├── base/                 # Base/foundational components
│   │   ├── cashbox/              # Cashbox module components
│   │   ├── dashboard/            # Dashboard module components (metrics, charts, graphs)
│   │   ├── graphs/               # Chart/graph components (VotingChart, RecentSurveysGraph)
│   │   ├── messages/             # Messages module components
│   │   ├── modal/                # Modal/dialog components
│   │   ├── new/                  # New/recently added components (LoginFormNew, CustomDrawer, TeamDropdown)
│   │   ├── notifications/        # Notifications module components
│   │   ├── reports/              # Reports module components
│   │   ├── survey/               # Survey module components
│   │   ├── team/                 # Team module components
│   │   ├── DashboardComponent.vue
│   │   ├── CashboxComponent.vue
│   │   ├── MessagesComponent.vue
│   │   ├── ReportsComponent.vue
│   │   ├── SurveyComponent.vue
│   │   ├── TeamComponent.vue
│   │   ├── HeaderBanner.vue
│   │   ├── LanguageSwitcher.vue
│   │   ├── UserAvatarMenu.vue
│   │   └── VoteStats.vue
│   ├── composable/                # Vue composables (hooks)
│   │   ├── __tests__/            # Unit tests for composables
│   │   ├── useAuthUseCases.ts    # Auth business logic
│   │   ├── useAuthComposable.ts  # Auth UI delegation with routing
│   │   ├── useTeamUseCases.ts    # Team business logic
│   │   ├── useSurveyUseCases.ts  # Survey business logic
│   │   ├── useAdminUseCases.ts   # Admin operations
│   │   ├── useCashboxUseCases.ts # Cashbox business logic
│   │   ├── useAdminComposable.ts # Admin UI delegation
│   │   ├── useNotificationsComposable.ts # Notifications UI
│   │   ├── useChartHelpers.ts    # Chart data formatting
│   │   ├── useDateHelpers.ts     # Date utilities
│   │   ├── useSurveyFilters.ts   # Survey filtering logic
│   │   ├── useSurveyMetrics.ts   # Survey statistics calculation
│   │   ├── useSurveyStatusManager.ts # Survey status management
│   │   ├── useTeamMemberUtils.ts # Team member helpers
│   │   ├── useScreenComposable.ts # Screen/responsive helpers
│   │   ├── useFormValidation.ts  # Form validation helpers
│   │   └── useReadiness.ts       # Readiness flag checks
│   ├── config/                    # Configuration files
│   ├── css/                       # Global styles
│   ├── enums/                     # Enum constants
│   │   ├── routesEnum.ts         # All route definitions
│   │   ├── SurveyTypes.ts        # Survey type enums
│   │   └── daysEnum.ts           # Day of week enums
│   ├── firebase/                  # Firebase configuration
│   │   └── config.ts             # Firebase SDK initialization
│   ├── i18n/                      # Internationalization (translations)
│   │   ├── cs-CZ/                # Czech translations
│   │   ├── en-US/                # English translations
│   │   └── index.js              # i18n loader
│   ├── interfaces/                # TypeScript interfaces
│   │   └── interfaces.ts         # All domain model interfaces
│   ├── layouts/                   # Page layouts
│   │   ├── AuthLayout.vue        # Layout for login/register (no header)
│   │   └── MainLayout.vue        # Main app layout (header, drawer, router-view)
│   ├── pages/                     # Page components (one per route)
│   │   ├── AboutPage.vue
│   │   ├── AdminPage.vue
│   │   ├── CashboxPage.vue
│   │   ├── DashboardPage.vue
│   │   ├── ErrorNotFound.vue
│   │   ├── HomePage.vue
│   │   ├── IndexPage.vue
│   │   ├── LoginPage.vue
│   │   ├── MessagesPage.vue
│   │   ├── NotificationsPage.vue
│   │   ├── RegisterPage.vue
│   │   ├── ReportsPage.vue
│   │   ├── SettingsPage.vue
│   │   ├── SingleTeamPage.vue
│   │   ├── SurveyPage.vue
│   │   ├── SurveyVerificationPage.vue
│   │   └── TeamsPage.vue
│   ├── router/                    # Vue Router configuration
│   │   ├── index.js              # Router initialization with auth guard
│   │   └── routes.js             # Route definitions
│   ├── services/                  # Firebase data access layer
│   │   ├── authFirebase.ts       # Auth & user Firestore operations
│   │   ├── teamFirebase.ts       # Team Firestore operations
│   │   ├── surveyFirebase.ts     # Survey Firestore operations
│   │   ├── cashboxFirebase.ts    # Cashbox Firestore operations
│   │   ├── messageFirebase.ts    # Messages Firestore operations
│   │   ├── notificationFirebase.ts # Notifications Firestore operations
│   │   └── adminFirebase.ts      # Admin Firestore operations
│   ├── stores/                    # Pinia state management
│   │   ├── authStore.ts          # Auth state (user, isAdmin, readiness)
│   │   ├── teamStore.ts          # Team state (teams, surveys, currentTeam)
│   │   └── index.js              # Store exports
│   ├── utils/                     # Utility functions
│   │   ├── __tests__/            # Unit tests for utils
│   │   ├── firestoreUtils.ts     # Firestore query helpers
│   │   ├── surveyStatusUtils.ts  # Survey status utilities
│   │   └── voteUtils.ts          # Vote calculation utilities
│   └── assets/                    # Static assets (images, etc)
│
├── .planning/                     # GSD planning documents
│   └── codebase/                 # Codebase analysis
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── archive/                       # Archived scripts (historical)
│
├── quasar.config.js              # Quasar framework configuration
├── vite.config.ts                # Vite build configuration
├── eslint.config.js              # ESLint configuration
├── .prettierrc.json              # Prettier formatting rules
├── firebase.json                 # Firebase project config
├── firestore.indexes.json        # Firestore index definitions
├── package.json                  # Dependencies and scripts
└── .env.example                  # Environment variables template
```

## Directory Purposes

**`src/components/`:**
- Purpose: Reusable Vue SFC components organized by feature module
- Contains: UI components, forms, modals, charts, filters
- Subdirectories by domain: admin, cashbox, dashboard, survey, team, notifications, messages, reports
- Naming: PascalCase.vue
- Special subdirs: `new/` contains recently added/refactored components, `modal/` for dialog components, `base/` for foundational elements
- Pattern: Components are presentation-only, logic delegated to composables

**`src/composable/`:**
- Purpose: Vue composition API hooks (functions, not components)
- Contains: Business logic (UseCases), UI delegation (Composables), utility helpers (pure functions)
- Naming Pattern:
  - `use*UseCases.ts`: Business logic orchestration (no routing, no UI side effects)
  - `use*Composable.ts`: UI delegation with routing and component state
  - `use*Helpers.ts`: Pure utility functions (reusable across features)
- Test location: `__tests__/` subfolder for composable unit tests

**`src/firebase/`:**
- Purpose: Firebase SDK initialization
- Contains: Only `config.ts` - sets up auth, firestore, analytics
- Environment variables: Uses `VITE_FIREBASE_API_KEY` from `.env`

**`src/i18n/`:**
- Purpose: Internationalization configuration and translation files
- Contains: Language-specific message dictionaries in JSON
- Structure: `cs-CZ/` (Czech) and `en-US/` (English) folders
- Loaded in: `src/boot/i18n.js`
- Usage: `{{ $t('key.path') }}` in templates, `useI18n()` in scripts

**`src/layouts/`:**
- Purpose: Template layouts for route groups
- Contains: Two layouts used by router:
  - `AuthLayout.vue`: For unauthenticated pages (login, register) - no header/drawer
  - `MainLayout.vue`: For authenticated pages - includes header, drawer, notifications, team dropdown
- Pattern: Router assigns layout to route group, then route components render inside

**`src/pages/`:**
- Purpose: Page components - one per route (file per route convention)
- Contains: Thin wrapper components that use feature components
- Naming: `{FeatureName}Page.vue`
- Pattern: Page delegates to feature component (e.g., `DashboardPage.vue` renders `DashboardComponent.vue`)
- Responsibility: Route definition only, no business logic

**`src/router/`:**
- Purpose: Vue Router configuration
- Files:
  - `index.js`: Initializes router, sets up auth guard, calls `initializeAuth` on startup
  - `routes.js`: Array of route definitions with layout associations
- Pattern: Routes are lazy-loaded via dynamic import, split into two groups (auth, main)

**`src/services/`:**
- Purpose: Firebase database access layer (data access objects)
- Contains: One file per domain entity (team, survey, auth, cashbox, etc)
- Pattern: Each file exports a composition function `useXxxFirebase()` that returns methods
- Responsibility: Pure database operations, no business logic, no routing
- Listener Management: Returns Unsubscribe functions from listeners
- Error Handling: Logs errors, re-throws or handles gracefully (permission errors)

**`src/stores/`:**
- Purpose: Pinia state management (reactive state only)
- Contains: Two stores (auth, team) using Setup Store pattern
- Pattern: Function composition API style - return state refs and setter functions
- Responsibility: State mutations only, no business logic
- Listener Storage: Stores unsubscribe functions for cleanup on logout
- Example: `authStore` has `user`, `isAdmin`, `isAuthReady`, `authUnsubscribe` refs plus setters

**`src/utils/`:**
- Purpose: Reusable utility functions
- Contains: Pure functions, no side effects, no store access
- Files: `firestoreUtils.ts`, `surveyStatusUtils.ts`, `voteUtils.ts`
- Pattern: Imported where needed, not via composables
- Test location: `__tests__/` subfolder

**`src/interfaces/`:**
- Purpose: TypeScript type definitions and domain models
- Contains: `interfaces.ts` with all IUser, ITeam, ISurvey, IVote, enums like SurveyStatus
- Pattern: Shared across all layers for type safety

**`src/enums/`:**
- Purpose: Static enum values and configuration constants
- Files:
  - `routesEnum.ts`: All application routes (path, name pairs)
  - `SurveyTypes.ts`: Survey type categories
  - `daysEnum.ts`: Day of week translations

## Key File Locations

**Entry Points:**
- `src/App.vue`: Root component (router-view only)
- `src/main.ts` (Quasar): App creation (generated by Quasar CLI, not visible in src)
- `src/router/index.js`: Router setup and auth initialization
- `src/boot/i18n.js`: i18n setup before app runs
- `src/firebase/config.ts`: Firebase SDK initialization

**State Management:**
- `src/stores/authStore.ts`: Auth state (user, admin, readiness flags)
- `src/stores/teamStore.ts`: Team state (teams, surveys, currentTeam, listener cleanup)

**Data Access:**
- `src/services/authFirebase.ts`: Auth operations (login, register, profile)
- `src/services/teamFirebase.ts`: Team CRUD and member operations
- `src/services/surveyFirebase.ts`: Survey CRUD, voting, verification
- `src/services/cashboxFirebase.ts`: Fine rules, fines, payments
- `src/services/notificationFirebase.ts`: Notification operations
- `src/services/messageFirebase.ts`: Message operations

**Business Logic:**
- `src/composable/useAuthUseCases.ts`: Auth workflow (init, signin, signup, signout)
- `src/composable/useTeamUseCases.ts`: Team listener setup, team selection
- `src/composable/useSurveyUseCases.ts`: Survey CRUD with notifications
- `src/composable/useAdminUseCases.ts`: Admin operations
- `src/composable/useCashboxUseCases.ts`: Cashbox operations

**UI Delegation:**
- `src/composable/useAuthComposable.ts`: Auth UI with routing
- `src/composable/useNotificationsComposable.ts`: Notification UI
- `src/composable/useAdminComposable.ts`: Admin UI

**Helper Utilities:**
- `src/composable/useChartHelpers.ts`: Chart data transformation
- `src/composable/useDateHelpers.ts`: Date formatting and calculations
- `src/composable/useSurveyFilters.ts`: Survey filtering and date ranges
- `src/composable/useSurveyMetrics.ts`: Vote counts, percentages, statistics
- `src/composable/useTeamMemberUtils.ts`: Team member utilities
- `src/utils/firestoreUtils.ts`: Firestore query helpers
- `src/utils/voteUtils.ts`: Vote calculation utilities

**Core Domain Types:**
- `src/interfaces/interfaces.ts`: All TypeScript interfaces (IUser, ITeam, ISurvey, IVote, etc)
- `src/enums/routesEnum.ts`: Route definitions with paths and names

## Naming Conventions

**Files:**
- Vue components: `PascalCase.vue` (e.g., `LoginPage.vue`, `DashboardComponent.vue`)
- TypeScript files: `camelCase.ts` (e.g., `authStore.ts`, `useAuthUseCases.ts`)
- Composables: `use{FeatureName}{Pattern}.ts` where Pattern is UseCases, Composable, or Helpers
- Utilities: `{featureName}Utils.ts` (e.g., `voteUtils.ts`)

**Directories:**
- Feature modules: `{feature}/` in PascalCase plural (e.g., `components/dashboard/`, `components/survey/`)
- Lowercase for generic folders: `stores/`, `services/`, `composable/`, `utils/`, `config/`

**TypeScript:**
- Interfaces: `I{EntityName}` (e.g., `IUser`, `ITeam`, `ISurvey`)
- Enums: PascalCase (e.g., `SurveyStatus`, `FineRuleTrigger`)
- Functions: camelCase (e.g., `loginUser`, `createTeam`)
- Variables: camelCase (e.g., `currentUser`, `teamStore`)
- Constants: UPPER_SNAKE_CASE (rarely used, mostly enums)
- Refs/Reactive: camelCase in `<script>`, in templates via `v-model` or `{{ variable }}`

**Routes:**
- Path: lowercase with hyphens (e.g., `/dashboard`, `/survey-verification`)
- Name: PascalCase in RouteEnum (e.g., `RouteEnum.DASHBOARD`, `RouteEnum.LOGIN`)

**Components:**
- Props: camelCase
- Events: kebab-case emitted from components (e.g., `@filters-changed`), camelCase in defineEmits
- Classes: kebab-case for CSS classes

## Where to Add New Code

**New Feature (e.g., Reports):**
- Components: Create `src/components/reports/` with feature components
- Firebase Service: `src/services/reportsFirebase.ts` with Firestore queries
- Use Cases: `src/composable/useReportsUseCases.ts` with business logic
- UI Composable: `src/composable/useReportsComposable.ts` with routing
- Store: Add state to `src/stores/teamStore.ts` (if part of team domain)
- Page: `src/pages/ReportsPage.vue` renders `src/components/ReportsComponent.vue`
- Route: Add to `src/router/routes.js` and `src/enums/routesEnum.ts`
- Types: Add interfaces to `src/interfaces/interfaces.ts`
- Tests: Add tests to `src/composable/__tests__/`

**New Component/Module:**
- Location: `src/components/{domain}/{ComponentName}.vue`
- Use composables for logic: `const { data, methods } = use{Domain}Composable()`
- Props for data input, emits for user actions
- Keep template-only logic minimal
- Delegate state management to composables
- Example pattern:
  ```vue
  <template>
    <div>{{ filteredData }}</div>
  </template>
  <script setup>
  import { use{Domain}Composable } from '@/composable/use{Domain}Composable'
  const { filteredData, handleClick } = use{Domain}Composable()
  </script>
  ```

**New Utility/Helper:**
- For pure functions: Create `src/composable/use{Feature}Helpers.ts`
- For Firestore utilities: Add to or create `src/utils/firestoreUtils.ts`
- For calculations: Create `src/utils/{feature}Utils.ts`
- Import wherever needed, no store access
- Add unit tests to `src/composable/__tests__/` or `src/utils/__tests__/`

**New Page/Route:**
- Create page: `src/pages/{FeatureName}Page.vue`
- Create feature component: `src/components/{feature}/{FeatureName}Component.vue`
- Add route to: `src/router/routes.js`
- Add to enum: `src/enums/routesEnum.ts`
- Page delegates to component, component uses composables
- Follow existing page pattern (thin wrapper)

**New Service (Firebase Operations):**
- Create: `src/services/{feature}Firebase.ts`
- Export: `export function use{Feature}Firebase() { ... }`
- Return: Object with domain methods (createX, getX, updateX, deleteX, listener)
- Listeners: Return Unsubscribe functions, managed by use cases
- Error Handling: Log and re-throw, except permission errors (graceful degradation)
- No business logic, only database operations

**Tests:**
- Location: Co-located with implementation
  - Composables: `src/composable/__tests__/{feature}.spec.ts`
  - Utils: `src/utils/__tests__/{feature}.spec.ts`
- Framework: Vitest
- Run: `npm run test` or `npm run test:watch`

## Special Directories

**`src/components/new/`:**
- Purpose: Recently added or refactored components
- Examples: `LoginFormNew.vue`, `CustomDrawer.vue`, `TeamDropdown.vue`
- Pattern: Components in this directory are actively maintained (newer implementations)
- Convention: May have "New" suffix to avoid naming conflicts during migration
- Generated: No (manually organized)
- Committed: Yes

**`archive/`:**
- Purpose: Historical scripts (user creation, team setup)
- Examples: User creation scripts from earlier development phases
- Generated: No (manually created for archival)
- Committed: Yes (for reference)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (npm/yarn generates)
- Committed: No (.gitignore)

**`.planning/codebase/`:**
- Purpose: GSD planning documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, and other analysis docs
- Generated: No (manually created by GSD agents)
- Committed: Yes

**`src/config/`:**
- Purpose: Application configuration files
- May contain: Feature flags, default values, API endpoints
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-14*

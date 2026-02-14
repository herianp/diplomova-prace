# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Clean Architecture with Separation of Concerns

The application follows a layered architecture pattern that separates concerns across multiple tiers:
- **Presentation Layer**: Vue components that handle UI rendering and user interaction
- **UI Delegation Layer**: Composables that manage component-level logic and routing
- **Business Logic Layer**: Use Cases that orchestrate business workflows
- **Data Layer**: Firebase services that handle database operations
- **State Management**: Pinia stores for reactive state-only storage

**Key Characteristics:**
- Unidirectional data flow: Components → UI Composables → Use Cases → Firebase Services → Pinia Stores
- Clean separation between data access, business logic, and UI presentation
- Setup Store pattern for Pinia (no business logic in stores, only state mutations)
- Firebase listeners managed at composable level (use cases), not in stores
- Real-time data synchronization via Firestore onSnapshot listeners

## Layers

**Presentation Layer (Pages & Components):**
- Purpose: Render UI and collect user input
- Location: `src/pages/`, `src/components/`
- Contains: Vue SFC components with minimal logic (UI-only responsibility)
- Depends on: UI Composables, Pinia stores for computed properties
- Used by: Router, parent components
- Example: `src/pages/LoginPage.vue` renders form, calls composable for login
- Example: `src/components/DashboardComponent.vue` displays dashboard with components like `DashboardMetrics`, `VotingChart`

**UI Composables Layer (UI Delegation):**
- Purpose: Delegate page/component logic, integrate routing, handle user interactions
- Location: `src/composable/use*Composable.ts`
- Contains: Component-specific orchestration with navigation side effects
- Depends on: Use Cases, Router, Vue composition API
- Used by: Pages and components
- Pattern: Wraps use cases, adds routing and UI-specific behavior
- Example: `src/composable/useAuthComposable.ts` wraps `useAuthUseCases` and adds router.push() for navigation
- Example: `src/composable/useTeamComposable.ts` (if exists) handles team selection UI logic

**Use Cases Layer (Business Logic):**
- Purpose: Orchestrate business workflows and manage listeners
- Location: `src/composable/use*UseCases.ts`
- Contains: Business logic, Firebase listener setup, data coordination
- Depends on: Firebase services, Pinia stores
- Used by: UI Composables, Router guards
- Pattern: Pure business logic (no routing, no component concerns)
- Example: `src/composable/useAuthUseCases.ts` - handles auth flow, team listener setup
- Example: `src/composable/useSurveyUseCases.ts` - manages survey operations, notifications
- Listener Management: Sets up and stores Firestore unsubscribe functions in stores
- Example: `src/composable/useTeamUseCases.ts` calls `teamFirebase.getTeamsByUserId()` and stores listener for cleanup

**Firebase Services Layer (Data Access):**
- Purpose: Pure Firebase database operations (Firestore + Authentication)
- Location: `src/services/*Firebase.ts`
- Contains: Database queries, mutations, listener setup, authentication
- Depends on: Firebase SDK, interfaces/types
- Used by: Use Cases only (never called directly from components)
- Pattern: No business logic - just database operations
- Files: `authFirebase.ts`, `teamFirebase.ts`, `surveyFirebase.ts`, `cashboxFirebase.ts`, `messageFirebase.ts`, `notificationFirebase.ts`, `adminFirebase.ts`
- Listener Pattern: Returns Unsubscribe functions that are managed by use cases/stores
- Error Handling: Logs errors with context, throws to let use cases handle
- Permission Errors: `surveyFirebase.ts` handles permission-denied gracefully by calling callback with empty array

**State Management Layer (Pinia Stores):**
- Purpose: Provide reactive state and pure state mutations
- Location: `src/stores/`
- Contains: State refs, setter functions only (no business logic)
- Pattern: Setup Store pattern (function-based composition API style)
- Files: `authStore.ts`, `teamStore.ts`
- State Mutations: Simple setters with no side effects
- Listener Management: Stores unsubscribe functions for cleanup
- Example: `authStore.setUser()`, `authStore.setAuthReady()` - pure mutations
- Cleanup: `authStore.cleanup()`, `teamStore.clearData()` - unsubscribe from all listeners

## Data Flow

**User Authentication Flow:**

1. Router init calls `useAuthUseCases.initializeAuth()`
2. `initializeAuth()` sets up Firebase auth listener via `authFirebase.authStateListener()`
3. When user detected: `authStore.setUser()` updates store state
4. Admin claim checked, `authStore.setAdmin()` set
5. `authStore.setAuthReady(true)` signals auth is ready
6. `useTeamUseCases.setTeamListener()` is called (in use case, not in store)
7. Team listener established, surveys listener established
8. Route guard `Router.beforeEach()` waits for `isAuthReady` and `isTeamReady` before allowing navigation
9. If not logged in, redirect to LOGIN_PATH; if logged in, redirect to DASHBOARD

**Survey Voting Flow:**

1. User interacts with survey component
2. Component calls `useSurveyUseCases.voteOnSurvey()` or `addSurveyVoteUseCase()`
3. Use case validates vote state (checks for existing votes)
4. Calls `surveyFirebase.addVote()` or `surveyFirebase.addSurveyVote()`
5. Firebase service updates Firestore votes array
6. Real-time listener in `teamStore.surveys` updates via `setSurveys()`
7. Component re-renders with updated vote state (computed properties watch store)

**Survey Creation with Notifications:**

1. Component calls `useSurveyUseCases.addSurvey()`
2. Use case fetches team members from Firestore
3. Calls `surveyFirebase.addSurvey()` to create survey
4. Use case calls `useNotifications.createSurveyNotification()` for each team member
5. Survey listener updates store automatically
6. UI updates reactively

**Team Selection Flow:**

1. User selects team from TeamDropdown component
2. Component calls `useTeamComposable.selectTeam()` or similar
3. Which calls `useTeamUseCases.getTeamByIdAndSetCurrentTeam()`
4. Use case fetches team data and updates `teamStore.setCurrentTeam()`
5. Uses existing survey listener already established for that team
6. Components watching `teamStore.currentTeam` re-render with new team data

**State Management:**

- **Auth State**: `authStore.user`, `authStore.isAdmin`, `authStore.isAuthReady` - persisted via Firebase auth listener
- **Team State**: `teamStore.teams`, `teamStore.currentTeam`, `teamStore.surveys` - real-time synced via Firestore listeners
- **Survey State**: `teamStore.editedSurvey` - transient, edited in form then synced via listener
- **Readiness Flags**: `authStore.isAuthReady`, `authStore.isTeamReady` - signal when async initialization complete
- **Listener Cleanup**: Stored in stores (`authStore.authUnsubscribe`, `teamStore.unsubscribeTeams`, `teamStore.unsubscribeSurveys`) for cleanup on logout

## Key Abstractions

**Use Cases (Business Logic Orchestration):**
- Purpose: Represent user workflows and business rules
- Examples: `useAuthUseCases`, `useTeamUseCases`, `useSurveyUseCases`, `useAdminUseCases`, `useCashboxUseCases`
- Pattern: Export functions that compose Firebase operations with state mutations
- Timing Control: Handle async coordination (e.g., auth must be ready before team setup)
- Example: `setTeamListener()` returns Promise that resolves when first data arrives

**Firebase Services (Data Access Objects):**
- Purpose: Abstract Firestore collections and Authentication operations
- Pattern: Single responsibility per service file (one domain entity)
- Listener Pattern: All real-time listeners return Unsubscribe functions
- Composition: `useXxxFirebase()` returns object with domain methods
- Examples:
  - `authFirebase.ts`: `loginUser`, `registerUser`, `authStateListener`
  - `teamFirebase.ts`: `createTeam`, `deleteTeam`, `getTeamsByUserId`
  - `surveyFirebase.ts`: `getSurveysByTeamId`, `addSurvey`, `updateSurvey`, `addVote`
  - `cashboxFirebase.ts`: `getFineRules`, `addFine`, `addPayment`

**UI Composables (Component Orchestration):**
- Purpose: Provide reactive computed properties and action methods for components
- Pattern: Wrap use cases, add component-specific behavior, provide clean API
- Example: `useAuthComposable.loginUser()` calls `useAuthUseCases.signIn()` then `router.push()`
- Reactive Bindings: Export computed properties so template reactivity works
- Example: `useAuthComposable` exports `currentUser = computed(() => authStore.user)`

**Utility Composables (Pure Helpers):**
- Purpose: Reusable logic shared across components
- Location: `src/composable/use*.ts` (non-UseCase, non-Composable files)
- Examples: `useChartHelpers.ts`, `useDateHelpers.ts`, `useSurveyFilters.ts`, `useSurveyMetrics.ts`
- Pattern: Pure functions, no side effects, no store access

**Interfaces/Types (Type Contracts):**
- Purpose: Define domain models and data structures
- Location: `src/interfaces/interfaces.ts`
- Contains: `IUser`, `ITeam`, `ISurvey`, `IVote`, `INotification`, `IMessage`, `IFineRule`, `IFine`, `IPayment`
- Enums: `SurveyStatus`, `FineRuleTrigger`
- Pattern: All domain objects typed for type safety

**Enums (Configuration Constants):**
- Location: `src/enums/`
- Purpose: Define static enum values for navigation, survey types, days
- Examples: `routesEnum.ts` (all available routes), `SurveyTypes.ts`, `daysEnum.ts`

## Entry Points

**Main Application Entry:**
- Location: `src/App.vue`
- Triggers: Quasar app initialization
- Responsibilities: Root layout with router-view

**Router Initialization:**
- Location: `src/router/index.js`
- Triggers: Vue app creation
- Responsibilities:
  - Call `useAuthUseCases.initializeAuth()` once (before any routes)
  - Setup route guards in `beforeEach`
  - Wait for `isAuthReady` before proceeding
  - Redirect to LOGIN if not authenticated
  - Redirect to DASHBOARD if authenticated and accessing public route

**Layout Components:**
- **AuthLayout** (`src/layouts/AuthLayout.vue`): Renders login/register pages (no header/drawer)
- **MainLayout** (`src/layouts/MainLayout.vue`): Renders authenticated pages with header, drawer, notifications, team dropdown

**Boot Configuration:**
- Location: `src/boot/i18n.js`
- Purpose: Initialize i18n before app runs
- Sets default locale to Czech (cs-CZ), fallback to English

**Firebase Initialization:**
- Location: `src/firebase/config.ts`
- Purpose: Initialize Firebase app, Firestore, Authentication
- Uses environment variables: `VITE_FIREBASE_API_KEY`

## Error Handling

**Strategy:** Layered error handling with escalation

**Firebase Services Layer:**
- Pattern: Try-catch with logging and re-throw
- Logs: Context prefix with operation name (e.g., "Login Error: ", "Error creating team: ")
- Permission Errors in Listeners: Special handling - log warning and continue with empty data instead of crashing
- Example from `surveyFirebase.ts`: Permission-denied calls callback with empty array instead of failing

**Use Cases Layer:**
- Pattern: Let Firebase errors bubble up, add business logic validation before calling Firebase
- Error Wrapping: Can add context about which business operation failed
- Example: `useSurveyUseCases.addSurvey()` wraps firebase call, adds team member lookup and notification creation

**UI Composables Layer:**
- Pattern: Catch errors, display to user via Quasar notifications
- Example: `useAuthComposable.loginUser()` catches error and throws for page to handle
- Page Level: Component catches and displays error via `$q.notify()`

**Component Level:**
- Pattern: Wrap async operations in try-catch, display errors to user
- Loading States: Use `isLoading` from store to show spinners during operations
- Example: LoginPage validates inputs before calling composable

**Firestore Permission Errors:**
- Listeners (onSnapshot) have error callbacks that log and continue
- Prevents app crash when user lacks permissions to collection
- Gracefully degrades by returning empty data

**Validation:**
- Form validation in components using `useFormValidation` composable
- Type safety via TypeScript interfaces
- Database rules at Firestore level enforce access control

## Cross-Cutting Concerns

**Logging:**
- Uses `console.error()` and `console.warn()` with context prefixes
- Error prefixes include operation name and Firebase error code
- No centralized logging framework (console only)
- Used for debugging permission issues, network errors, listener failures

**Validation:**
- Component level: Form inputs validated before submission
- Database level: Firestore security rules enforce access control
- Type level: TypeScript interfaces ensure data shape
- Composable: `useFormValidation()` provides validation helpers

**Authentication:**
- Firebase Authentication (email/password)
- Custom claims for admin status checked via JWT
- Auth state persisted in authStore, synced with Firebase listener
- Route guards prevent access to protected routes
- Automatic redirect on logout

**Timing & Readiness:**
- Flags in store: `isAuthReady`, `isTeamReady` signal when async init complete
- Router waits for `isAuthReady` before allowing navigation
- Auth listener setup waits before setting team listener
- Small delays (100-300ms) built into timing to ensure proper sequencing
- Prevents race conditions with rapid user interactions

**Real-time Synchronization:**
- Firestore `onSnapshot` listeners auto-update store state
- All UI updates driven by store changes (computed properties)
- Listeners established once during auth init, persisted throughout session
- Unsubscribe functions stored in store for cleanup on logout
- Multiple listeners active: teams, surveys, notifications, messages

**State Cleanup:**
- On logout: `authStore.cleanup()` called which unsubscribes all auth listeners
- On logout: `teamStore.clearData()` called which unsubscribes all team/survey listeners
- Router navigates to HOME which redirects to LOGIN

**i18n (Internationalization):**
- Booted in `src/boot/i18n.js` before app runs
- Default locale: Czech (cs-CZ)
- Messages in: `src/i18n/cs-CZ/`, `src/i18n/en-US/`
- Components use `{{ $t('key.path') }}` in templates
- Global injection allows `$t()` everywhere
- Language switching via LanguageSwitcher component (stores preference in localStorage)

**Build Optimization:**
- Manual chunks in production: firebase, charts, vue, quasar, luxon
- Lazy route loading: All page components imported with dynamic import
- Source maps disabled in production
- Minification enabled
- Target: Modern browsers (ES2022)

---

*Architecture analysis: 2026-02-14*

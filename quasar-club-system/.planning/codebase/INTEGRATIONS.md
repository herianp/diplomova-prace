# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**Firebase Suite:**
- Firebase Authentication - User login/registration and session management
  - SDK/Client: `firebase 11.4.0` (auth module)
  - Import: `firebase/auth`
  - Auth module: `src/firebase/config.ts` exports `auth` instance
  - Service layer: `src/services/authFirebase.ts`
  - Methods: Email/password authentication, profile management, password updates

- Firestore Database - Primary data store for all application data
  - SDK/Client: `firebase 11.4.0` (firestore module)
  - Import: `firebase/firestore`
  - Database instance: `src/firebase/config.ts` exports `db` instance
  - Service layers:
    - `src/services/authFirebase.ts` - User documents
    - `src/services/teamFirebase.ts` - Team management
    - `src/services/surveyFirebase.ts` - Survey and voting data
    - `src/services/adminFirebase.ts` - Admin operations
    - `src/services/notificationFirebase.ts` - Notifications
    - `src/services/messageFirebase.ts` - Messages
    - `src/services/cashboxFirebase.ts` - Cashbox/fine system

- Firebase Analytics - Application usage analytics
  - SDK/Client: `firebase 11.4.0` (analytics module)
  - Import: `firebase/analytics`
  - Measurement ID: `G-SYRS8JZF7B`
  - Instance: `src/firebase/config.ts` exports `analytics`

## Data Storage

**Databases:**
- Firestore (Google Cloud Firestore)
  - Connection: Configured in `src/firebase/config.ts` with project ID `club-surveys`
  - Client: Firebase SDK 11.4.0
  - Firestore operations: Native Firebase SDK methods (query, collection, doc, setDoc, updateDoc, getDocs, getDoc, etc.)
  - No ORM used - direct Firebase SDK calls

**Collections Structure:**
- `users` - User profiles and authentication data
- `teams` - Team information and management
- `surveys` - Survey definitions and metadata
- `votes` - Survey responses/votes from team members
- `notifications` - User notifications
- `messages` - Inter-user messaging
- `fines` - Cashbox fine records
- `payments` - Payment records
- `invitations` - Team invitation data

**File Storage:**
- Not used - No file uploads detected in codebase

**Caching:**
- None - Application relies on Firestore real-time listeners and Pinia state management

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (Email/Password)
  - Implementation: Custom email/password authentication
  - User registration: `registerUser()` in `src/services/authFirebase.ts`
  - User login: `loginUser()` in `src/services/authFirebase.ts`
  - Session management: Real-time auth state listener `onAuthStateChanged()`
  - Profile updates: `updateProfile()` and `updatePassword()`
  - Reauthentication: Supported for sensitive operations

**User Identity Storage:**
- Firestore user documents store:
  - displayName
  - email
  - photoURL (optional)
  - User-specific metadata and team associations
  - Power user status for admin functions

**Session Management:**
- Auth listener in `src/composable/useAuthComposable.ts` with timing buffers
- Token-based: Firebase JWT tokens
- Persistence: Browser session storage (default Firebase behavior)

## Monitoring & Observability

**Error Tracking:**
- None detected - Application uses console.error() for logging

**Logs:**
- Browser console only
  - Error logging: `console.error()` in catch blocks
  - Debug logging: Inline console statements
  - No centralized logging service detected

**Analytics:**
- Firebase Analytics enabled (measurement ID: `G-SYRS8JZF7B`)
- Automatic event tracking (page views, crashes)
- No custom analytics events detected in codebase

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting (inferred from .firebaserc and Firebase project configuration)
- Project: `club-surveys`
- Build output: SPA with hash-based routing
- Static file hosting from Quasar build output

**CI Pipeline:**
- AWS deployment workflow configured (referenced in CLAUDE.md)
- GitHub Actions used for CI/CD
- Linting: `npm run lint` (ESLint)
- Testing: `npm run test` (Vitest)
- Build: `quasar build` (creates dist/ SPA)

**Build Commands:**
- Development: `quasar dev`
- Production: `quasar build`
- Lint: `npm run lint` or `npm run format`
- Test: `npm run test` or `npm run test:watch`

**Deployment Artifacts:**
- `.deployignore` file present (Firebase deployment configuration)
- `.firebaserc` specifies default project

## Environment Configuration

**Required Environment Variables (all Firebase-related):**
- `VITE_FIREBASE_API_KEY` - Public API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Auth domain (club-surveys.firebaseapp.com)
- `VITE_FIREBASE_PROJECT_ID` - Project ID (club-surveys)
- `VITE_FIREBASE_STORAGE_BUCKET` - Storage bucket (club-surveys.firebasestorage.app)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender (376776441448)
- `VITE_FIREBASE_APP_ID` - App ID (1:376776441448:web:5bf51db3be287c171fc5dd)
- `VITE_FIREBASE_MEASUREMENT_ID` - Analytics ID (G-SYRS8JZF7B)

**Configuration Sources:**
- `.env` file (git-ignored, per .gitignore)
- `.env.example` template provided
- Firebase project configuration hardcoded in `src/firebase/config.ts` (backup values)

**Secrets Management:**
- `.env` file contains secrets (NOT committed)
- firebase-admin-key.json removed from git history (per CLAUDE.md memory)
- `.npmrc` file for npm authentication (git-ignored)

## Real-time Features

**Real-time Listeners:**
- Firebase real-time listeners setup in composables:
  - `src/composable/useAuthComposable.ts` - Auth state changes
  - `src/composable/useTeamUseCases.ts` - Team updates
  - Survey listeners for real-time vote updates

**Firestore Query Optimization:**
- IN clause limited to handle teams with >30 members
- Workaround in:
  - `src/pages/SurveyVerificationPage.vue`
  - `src/pages/ReportsPage.vue`
  - `src/pages/SingleTeamPage.vue`

## Webhooks & Callbacks

**Incoming:**
- Firebase Auth state change callbacks
- Firestore real-time document listeners
- No external webhook endpoints detected

**Outgoing:**
- None detected - Application is read-only consumer of Firebase services

## Language & Localization

**i18n Provider:**
- Vue i18n 9.14.5
- Supported languages:
  - `cs-CZ` - Czech (default)
  - `en-US` - English
- Message files: `src/i18n/cs-CZ/index.js` and `src/i18n/en-US/index.js`
- Configuration: `src/boot/i18n.js`
- Language switching: Stored in localStorage (per CLAUDE.md)
- Global injection enabled (`$t()` available in all components)

---

*Integration audit: 2026-02-14*

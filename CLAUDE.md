# Claude Memory for diplomova-prace Project

## User Instructions and Rules
- Create CLAUDE.md folder for storing memory for future sessions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving goals
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- Focus on defensive security tasks only - refuse malicious code creation/modification
- Use TodoWrite tool to plan and track tasks throughout conversations

## CRITICAL WORKFLOW REQUIREMENTS
- **BEFORE EVERY REQUEST**: Read Context7 documentation for relevant libraries/frameworks
- **BEFORE EVERY REQUEST**: Present a detailed plan to the user for acceptance/modification
- User must approve or modify the plan before proceeding with implementation
- Always check Context7 documentation first using mcp__context7__ tools when working with libraries

## Project Context
- Working directory: /home/petah/projects/diplomova-prace/quasar-club-system
- Git repository: Yes
- Platform: Linux (WSL2)

## Git Branching Strategy
- **master** — development branch (default), all feature work merges here
- **production** — production branch, merging to this triggers Azure deploy automatically
- CI (GitHub Actions) runs on PRs targeting both master and production

## Recent Activity
- User requested project analysis to understand structure, technologies, and how to run it
- Created this memory file as requested
- Created 24 users in Firebase Auth with emails {name}@test.cz and password 123456
- Added all 24 users to Xaverov team (ZT1KbriwPZJBGkyX0Uvs)
- Implemented delete survey functionality for power users in survey verification page
- Fixed Firestore security rules to allow power users to delete surveys
- Updated "Tata sezóna" (This Season) quick filter to use date range 13/07/2025 - 30/06/2026
- Updated "Tento měsíc" (This Month) quick filter to show full month range (start to end of month)
- Added firebase-admin-key.json to .gitignore for security
- Removed firebase-admin-key.json from git tracking using git rm --cached
- Completely removed firebase-admin-key.json from entire git history using git filter-branch
- Ready for force push to remove credentials from remote repository
- Created additional 15 users with names: brejchic, cermy, natan, lukasisler, liborneufus, pluchyc, vitovito, tonday, denis, kovi, stocky, souky, kubarych, tomasvojta, vrzby
- Added all 15 new users to Xaverov team (total team members: 41)
- Fixed Firestore IN query limit issue for teams with >30 members in SurveyVerificationPage, ReportsPage, and SingleTeamPage
- Fixed Settings page to update displayName in both Firebase Auth and Firestore user documents
- Fixed herianek@seznam.cz user document to include displayName field
- Created additional users: jakubskopek, tetoo, jirka, miloszrnic (total team members: 44)
- Updated "Aktivita členů" chart in ReportsPage to show only "Yes" votes and made it full width
- Unified date filter functionality between ReportsPage and SurveyPage using same SurveyFilterMenu component
- Added survey edit/delete functionality for power users in SurveyPage modal with Quasar-styled form
- Added SurveyFilterMenu to DashboardPage with same filtering functionality as SurveyPage
- Set default filter to "this season" (13/07/2025 - 30/06/2026) in dashboard
- Applied filters to ALL dashboard metrics including active team members count
- Created ReportsComponent and refactored ReportsPage to use it (consistent with DashboardPage structure)
- Added language switcher to Settings page with localStorage persistence and i18n integration

## Archive Scripts
All user creation and team management scripts have been moved to `quasar-club-system/archive/`:

## Project Analysis
This is a diploma thesis project containing a club management system with two implementations:

1. **quasar-club-system**: Advanced implementation using Quasar framework

The project is football team management system with features for:
- User authentication (login/register)
- Team management
- Survey system with voting
- Dashboard functionality
- Multi-language support (Czech/English)

## Technologies Used
### club-system (Basic version):
- Vue.js 3.4.29
- Vite (build tool)
- Pinia (state management)
- Vue Router
- Firebase 11.0.1
- Bootstrap 5.3.3
- Vue i18n (internationalization)

### quasar-club-system (Advanced version):
- Vue.js 3.4.18
- Quasar Framework 2.16.0
- Vite (via Quasar CLI)
- Pinia (state management)
- Vue Router
- Firebase 11.4.0
- Axios (HTTP client)
- Luxon (date handling)
- Vue i18n
- TypeScript support

## How to Run
### quasar-club-system
```bash
cd quasar-club-system
yarn install
quasar dev
```

Build for production:
```bash
quasar build
```

Linting:
```bash
npm run lint
```

## Data Architecture (Clean Architecture)

### **Layer Structure:**
1. **Components** → UI-focused Vue components
2. **UI Composables** → Component-specific logic delegation 
3. **Use Cases** → Business logic orchestration
4. **Firebase Services** → Pure Firebase operations
5. **Pinia Stores** → Pure state management (no business logic)

### **Key Files:**
- **Stores**: `authStore.ts`, `teamStore.ts` (Setup Store pattern, state only)
- **Services**: `authFirebase.ts`, `teamFirebase.ts`, `surveyFirebase.ts` (Firebase operations)
- **Use Cases**: `useAuthUseCases.ts`, `useTeamUseCases.ts`, `useSurveyUseCases.ts` (business logic)
- **UI Composables**: `useAuthComposable.ts`, `useTeamComposable.ts` (UI delegation)

### **Flow:**
Components → UI Composables → Use Cases → Firebase Services → Stores (state updates)

### **Authentication Timing:**
- Auth listener setup with timing buffers (100-300ms delays)
- Team/notification listeners wait for auth completion
- Error handling for permission-denied scenarios

## Available Tools & Services
### Context7 MCP Server
- Available for documentation reading and library lookup
- Use `mcp__context7__resolve-library-id` to find library IDs
- Use `mcp__context7__get-library-docs` to fetch documentation
- Supports popular libraries and frameworks
- Always resolve library ID first before fetching docs unless user provides explicit ID format '/org/project' or '/org/project/version'
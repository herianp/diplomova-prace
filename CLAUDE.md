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
- Working directory: /home/petah/projects/diplomova-prace
- Git repository: Yes
- Platform: Linux (WSL2)
- Main branch: master

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

## Archive Scripts
Scripts used for user creation and team management have been moved to `quasar-club-system/archive/`:
- `create-users.js` - Script to create Firebase users using Admin SDK
- `add-users-to-team.js` - Script to add users to specific team
- `create-users-cli.sh` - Alternative CLI-based user creation script
- `create-users-simple.js` - Simple user creation template
- `package-scripts.json` - Package file for script dependencies

These scripts are no longer needed for regular development but kept for reference.

## Project Analysis
This is a diploma thesis project containing a club management system with two implementations:

1. **club-system**: Basic Vue.js implementation with Vite
2. **quasar-club-system**: Advanced implementation using Quasar framework

The project appears to be a club/sports team management system with features for:
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
### club-system:
```bash
cd club-system
npm install
npm run dev
```

### quasar-club-system (Recommended):
```bash
cd quasar-club-system
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

Linting:
```bash
npm run lint
```

## Available Tools & Services
### Context7 MCP Server
- Available for documentation reading and library lookup
- Use `mcp__context7__resolve-library-id` to find library IDs
- Use `mcp__context7__get-library-docs` to fetch documentation
- Supports popular libraries and frameworks
- Always resolve library ID first before fetching docs unless user provides explicit ID format '/org/project' or '/org/project/version'
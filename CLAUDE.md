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
# Phase 14 Context: Rate Limiting & User Quotas

## Limit Scope & Actions

### Rate-limited actions (5 total):
| Action | Default Limit | Window Type | Notes |
|--------|---------------|-------------|-------|
| Team creation | 5 | Absolute (total) | Max teams a user can ever create |
| Messages | 50 | Time-windowed (per week) | Resets weekly |
| Join requests | 5 | Absolute (concurrent pending) | Max pending at once, not per-time |
| Survey creation | 10 | Time-windowed (per week) | Resets weekly |
| Fines (per team) | 500 | Time-windowed (per day) | Max fine items per team per day, count-based not amount-based |

### Key decisions:
- **Global limits only** — one set of limits for all users, no per-user overrides
- **Mix of absolute and time-windowed** limits depending on the action
- Fines limit is per-team, not per-user (a team can create max 500 fine items per day)

## Enforcement Mechanism

### Decisions:
- **Client-side enforcement only** — sufficient for honest users, simpler implementation
- No Firestore security rules or Cloud Functions for enforcement
- Check limits in Vue composable before allowing the action
- If limit exceeded, prevent the action and show feedback

### Config storage:
- **Firestore `rateLimits` collection** — single document with all limit configurations
- Real-time listener so admin changes propagate immediately to all clients
- Admin UI reads/writes this document

### Usage counting:
- **Counter fields on the user document** (no extra collection)
- Fields: `usage.teamsCreated`, `usage.messagesThisWeek`, `usage.messagesWeekStart`, `usage.surveysThisWeek`, `usage.surveysWeekStart`
- For fines: counter on team document (`usage.finesToday`, `usage.finesDateStart`)
- Client checks counter + date, resets counter if window expired before incrementing
- Increment counter on each action (client-side write after successful action)

## Admin UI Design

### Structure:
- New **"Rate Limits" tab** in existing Admin page (alongside Users tab)
- **Table layout** with columns: Action, Limit, Window, Edit button
- **Inline edit**: click pencil icon → cell becomes number input → Enter/checkmark to save
- Save writes to Firestore `rateLimits` document immediately

### Table rows:
```
| Action              | Limit | Window  | [Edit] |
|---------------------|-------|---------|--------|
| Team creation       | 5     | total   | ✎     |
| Messages            | 50    | /week   | ✎     |
| Join requests       | 5     | pending | ✎     |
| Surveys             | 10    | /week   | ✎     |
| Fines (per team)    | 500   | /day    | ✎     |
```

## User Feedback on Limits

### When limit is reached:
- **Disable the action button** (e.g., "Create Team" becomes greyed out)
- **Show tooltip on hover** explaining the limit and when it resets
- Example: "You've created 5 teams (maximum). This limit is permanent."
- Example: "Message limit reached (50/week). Resets on Monday."
- Example: "Survey limit reached (10/week). Resets in 3 days."

### Reset information:
- **Always show when the limit resets** in the tooltip/message
- For absolute limits: say "This limit is permanent" or "Contact admin"
- For weekly limits: show "Resets on [next Monday]" or "Resets in X days"
- For daily limits: show "Resets tomorrow" or "Resets at midnight"

## Deferred Ideas

None captured during discussion.

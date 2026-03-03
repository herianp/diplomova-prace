# Phase 19 Context: Voting Cutoff Settings & Disabled Voting

## Phase Goal
Add a team setting for voting cutoff (X hours before survey time) that automatically disables voting when the cutoff passes. Players see a "Voting closed" state instead of vote buttons.

## Decisions

### 1. New Setting: `votingCutoffHours`
- **Field**: `ITeamSettings.votingCutoffHours: number | null`
- **null** = disabled (no early cutoff, current behavior — voting until survey time)
- **Options**: 1, 2, 3, 5, 8, 12, 24 hours
- **Default**: `null` (backwards compatible — no change for existing teams)

### 2. Settings UI Location
- In `SingleTeamPage.vue`, under the existing team settings section (after chat toggle)
- Use `q-select` dropdown with predefined hour options + "Disabled" option
- Same pattern as chat toggle: label + hint text below

### 3. Voting Cutoff Logic
- New utility function `isVotingClosed(survey, cutoffHours)` in `surveyStatusUtils.ts`
- Returns `true` when `surveyDateTime - cutoffHours <= now` (but survey hasn't started yet)
- This is SEPARATE from `isExpired` — cutoff happens before the survey time
- `isExpired` = survey time has passed (existing behavior, untouched)
- `isVotingClosed` = cutoff has passed but survey hasn't started yet

### 4. UI When Voting is Closed
- Show "Voting closed" chip (orange/warning color, `lock_clock` icon) + time context text (e.g. "Closed 2h before start")
- This replaces the vote buttons in `SurveyActions.vue` — new `votingClosed` prop
- Different from "Expired" chip (grey) — voting closed is a softer state
- **Survey card background**: Use grey background (same as expired/closed surveys) when voting is closed
- **No extra message** for unvoted players — just the chip is enough, they missed it
- **Shows everywhere**: voting closed state appears on all survey cards (dashboard, survey page, etc.)

### 5. Voting Closes in Warning
- When voting is still open but approaching cutoff, show a subtle text hint on the survey card
- Example: "Voting closes in 2h" — shown when within the cutoff window
- No push notifications — just on-screen visual info on the card

### 6. Where Cutoff is Checked
- `SurveyCard.vue`: compute `isVotingClosed` using team settings + survey date/time
- Pass as new `votingClosed` prop to `SurveyActions.vue`
- `addSurveyVote()` in `SurveyCard.vue`: guard check to prevent voting
- **Use case enforcement**: `voteOnSurvey()` in `useSurveyUseCases.ts` also checks cutoff — defense in depth against browser console bypasses
- `SurveyActions.vue`: show different chip for "voting closed" vs "expired"

### 7. Vote Changes After Cutoff
- **Full lock** — once cutoff passes, ALL voting is blocked
- Players who already voted cannot change their vote
- Players who haven't voted cannot submit a new vote
- Vote buttons disappear for everyone (replaced by "Voting closed" chip)

### 8. Power Users Exempt
- Power users can still vote after cutoff (they manage the team)
- Only regular members are affected by the cutoff

## Deferred to Phase 20
- Late voting logic (vote after cutoff with `isLate` flag)
- Late vote visual indicators
- Power user decision on whether late votes count
- Push notification reminders for approaching cutoff

## Technical Constraints
- `ITeamSettings` change requires updating defaults in `teamFirebase.ts`
- Team settings are loaded into `teamStore.currentTeamSettings` — already available in `SurveyCard.vue`
- No Firestore rule changes needed (settings subcollection rules already exist)
- Use case guard needs access to team settings (via teamStore or passed parameter)

# Phase 10: Onboarding Wizard & Route Guarding - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Intercept teamless users with route guards and guide them through a multi-step wizard that collects their display name and presents two paths: create a new team or browse existing teams to join. The wizard itself handles the flow; actual team creation logic and join request system are in Phases 11 and 12.

</domain>

<decisions>
## Implementation Decisions

### Wizard Layout & Steps
- Use Quasar QStepper with 3 steps
- Step 1: Welcome — app logo with 3-4 feature highlight icons/bullets (surveys, reports, team management)
- Step 2: Display name — set or confirm display name
- Step 3: Team choice — choose between "Create team" or "Browse teams"
- Full-page layout — no sidebar, no navigation visible during onboarding
- Completely clean experience, focused on the wizard only

### Display Name Step
- Pre-fill from Firebase Auth displayName if it already exists, otherwise empty
- Setting display name is optional but nudged ("Your teammates will see this name")
- No avatar/profile picture — just the name field
- Updates both Firebase Auth displayName and Firestore user document

### Path Selection UX
- Two big cards side-by-side with icon, title, and description
- "Create a Team" card and "Browse Teams" card
- Selecting a card replaces the cards inline (still in step 3) with the relevant form/list
- A back button/link to return to the card selection from either the create form or browse list
- Create team form appears inline in step 3 when that card is selected
- Browse teams list appears inline in step 3 when that card is selected

### Route Guard Behavior
- After successful team creation or team join, show a brief "You're all set!" success screen with a "Go to dashboard" button
- Navigation completely hidden during onboarding (no sidebar, no top nav — except possibly a minimal bar with logo + logout)
- Pending join request state: Claude's discretion on best UX (e.g., stay on onboarding with status message, allow creating a team or requesting another)

### Claude's Discretion
- Redirect style (hard redirect vs other) for teamless users hitting protected routes
- Handling of the "pending join request" limbo state
- Exact icons and copy for welcome step feature highlights
- Loading/transition animations between steps
- Mobile responsiveness details

</decisions>

<specifics>
## Specific Ideas

- 3-step QStepper: Welcome → Display Name → Team Choice
- Feature highlights on welcome should cover the main app capabilities (surveys/attendance, reports, team management)
- The two big cards in step 3 should feel like a clear fork in the road — equal visual weight
- Inline switching in step 3 keeps the flow contained without adding stepper steps dynamically

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-onboarding-wizard-route-guarding*
*Context gathered: 2026-02-21*

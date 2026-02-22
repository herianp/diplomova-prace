---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/TeamComponent.vue
autonomous: true
requirements: []
must_haves:
  truths:
    - "Create Team button is visible for all authenticated users, not just power users"
    - "Join Request Management section is visible for all users on the Teams page"
    - "Non-power-users see 'no pending requests' in the Join Request Management section"
    - "Non-power-users can open the Create Team dialog and create a team"
  artifacts:
    - path: "src/components/TeamComponent.vue"
      provides: "Teams page with always-visible Create button and JoinRequestManagement"
  key_links: []
---

<objective>
Fix TeamsPage UI inconsistency: Remove power-user-only guards from "Create Team" button and JoinRequestManagement section so all users see a consistent page layout regardless of their role.

Purpose: When users switch teams, the Teams page UI should not have elements appearing/disappearing based on power user status. Any user should be able to create a team (per project decision), and JoinRequestManagement already handles the empty state gracefully.
Output: Updated TeamComponent.vue with consistent UI for all users.
</objective>

<execution_context>
@C:/Users/Developer/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Developer/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/TeamComponent.vue
@src/components/team/JoinRequestManagement.vue
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove power-user guards from TeamComponent.vue</name>
  <files>src/components/TeamComponent.vue</files>
  <action>
    In TeamComponent.vue, make two changes:

    1. Line 5: Remove `v-if="isCurrentUserPowerUser"` from the JoinRequestManagement q-card wrapper. The section should always render. Non-power-users will see "no pending requests" (the listener already sets pendingJoinRequests to [] for non-power-users, and JoinRequestManagement has a built-in empty state).

    2. Line 37: Remove `v-if="isCurrentUserPowerUser"` from the Create Team q-btn. All users should be able to create teams (per project decision: "Allow any user to create teams").

    Do NOT remove the `isCurrentUserPowerUser` import/destructure from useAuthComposable — it may be used elsewhere or needed later. Actually, check if it is used anywhere else in the component. If `isCurrentUserPowerUser` is only used in these two v-if guards, remove it from the destructure to keep the code clean.
  </action>
  <verify>
    Run `cd C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system && npx vue-tsc --noEmit --pretty 2>&1 | head -20` to verify no TypeScript errors.
    Visually inspect the file to confirm no remaining `isCurrentUserPowerUser` references in the template.
  </verify>
  <done>
    TeamComponent.vue renders JoinRequestManagement section and Create Team button for all users unconditionally. No `v-if="isCurrentUserPowerUser"` guards remain in the template.
  </done>
</task>

</tasks>

<verification>
- Open the app as a non-power-user and navigate to Teams page
- Verify "Create Team" button is visible in the page header
- Verify "Join Request Management" section appears with "no pending requests" message
- Open the app as a power-user and verify both elements still work correctly
- Verify the Create Team dialog opens and functions for non-power-users
</verification>

<success_criteria>
- All users see a consistent Teams page layout with Create Team button and Join Request Management section
- No TypeScript compilation errors
- Existing power-user functionality (approve/decline requests) still works
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-teamspage-ui-show-create-team-and-jo/2-SUMMARY.md`
</output>

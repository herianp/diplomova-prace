# Phase 12: Team Discovery & Join Requests - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse all existing teams and send join requests. Team power users can approve or decline those requests. Approved users become team members. This completes the "browse teams" path in the onboarding wizard and adds a standalone teams page.

</domain>

<decisions>
## Implementation Decisions

### Team browse list
- Show team name + member count per team (minimal)
- Alphabetical sort order (A-Z by team name)
- Available in two places: onboarding wizard step 3 (replace browse placeholder) AND a standalone /teams page
- Simple text filter at the top to filter teams by name as typed
- Anyone can browse (including users who already have a team)
- Users can be members of multiple teams (multi-team support)
- Teams where user has a pending request show a "Request Pending" badge with join button disabled
- Teams where user is already a member show a "Member" badge

### Join request flow
- Tapping a team shows a confirmation dialog: "Send join request to [Team Name]?" with Send/Cancel
- After sending: toast notification ("Join request sent to [Team Name]") AND inline badge update to "Request Pending"
- User can cancel a pending request (Cancel Request action on teams with pending badge)
- Max 5 simultaneous pending requests per user
- Declined users can re-request to the same team (no cooldown)

### Request management (power user side)
- Notification badge on a sidebar menu item for pending join requests
- Simple list view: user name + email + Approve/Decline buttons per row
- No bulk actions — each request handled individually
- Actions are audited (who approved/declined) — visible on admin page

### Request lifecycle
- Declined requests show "Declined" status — no reason provided
- Declined/cancelled request documents kept in Firestore with status field (not deleted) for audit
- Requesting user has a "My Requests" section (in settings or profile) showing pending and past requests with status

### Claude's Discretion
- Approval notification method (real-time Firestore listener vs next page load)
- Exact placement of "My Requests" section (settings page vs profile)
- Loading states and error handling details
- Mobile responsiveness of the browse list and request management views

</decisions>

<specifics>
## Specific Ideas

- Power user actions should be audited so they're visible on the admin page
- Browse list is reusable between wizard and standalone page (same component)
- "Request Pending" and "Member" badges should be visually distinct states on team list items

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-team-discovery-join-requests*
*Context gathered: 2026-02-22*

# Phase 27: Admin User Deletion with Cascade Handling and Team Creator Reassignment - Research

**Researched:** 2026-03-06
**Domain:** Firebase Admin SDK, Cloud Functions, Firestore soft-delete patterns
**Confidence:** HIGH

## Summary

This phase introduces admin user deletion as a soft-delete operation with Firebase Auth cleanup via a Cloud Function. The project currently has no Cloud Functions directory -- this will be the first Cloud Function. The existing codebase has well-established patterns for admin operations (AdminComponent tabs, AdminTeamsTab delete dialog, useAdminUseCases/useAdminComposable layers) that directly inform the implementation structure.

The key technical challenge is introducing a Cloud Function callable from the client that uses `firebase-admin` to delete the Auth account while the Firestore user document is preserved with soft-delete fields. Creator conflict resolution is a client-side dialog flow that orchestrates multiple Firestore updates before triggering the Cloud Function.

**Primary recommendation:** Use Firebase Cloud Functions v2 (2nd gen) with TypeScript for the callable function, deploy to `europe-west1` to match the Firestore `eur3` location, and follow the existing clean architecture pattern for client-side code.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Soft-delete: User document preserved with `status: 'deleted'` and `deletedAt: Date` fields
- User uid stays in team `members[]` and `powerusers[]` arrays -- UI resolves display via soft-delete flag
- All votes, messages, notifications, join requests, cashbox entries preserved -- no cleanup
- Firebase Auth account is FULLY DELETED (not disabled) via Cloud Function
- Cloud Function is callable (not HTTP trigger) -- admin triggers from client
- Creator conflict: single dialog listing ALL affected teams with per-team action choice (delete team or reassign creator)
- Any team member eligible as new creator (not restricted to power users)
- New creator auto-promoted to power user if not already
- Non-creator users: simple confirm dialog
- Creator users: creator-conflict dialog REPLACES simple confirm (single dialog, not two-step)
- Soft-deleted users hidden from admin users tab by default with filter toggle to show
- Soft-delete is one-way -- no restore capability in this phase

### Claude's Discretion
- Visual treatment of deleted user names in UI (strikethrough, grayed out, badge)
- Cloud Function error handling and rollback strategy
- Exact filter toggle implementation for showing deleted users
- Loading states during deletion process

### Deferred Ideas (OUT OF SCOPE)
- User restore/un-delete capability
- "User left team" flow (voluntary leave with history tracking)
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-functions | ^6.x (v2) | Cloud Function runtime | 2nd gen callable functions with built-in auth context |
| firebase-admin | ^13.x | Server-side Auth deletion | Only way to delete Auth accounts programmatically |
| firebase/functions (client) | via firebase ^11.4.0 | `httpsCallable` client SDK | Already in project dependencies, just import getFunctions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase-tools | 13.35.1 (existing devDep) | Deploy functions | Already in project for emulators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloud Function | HTTP endpoint | Callable has built-in auth token validation, simpler |
| Soft-delete with status field | Hard delete user doc | Loses all display name resolution for historical data |
| Keep uid in team arrays | Remove uid from arrays | Would break historical vote/message display |

**Installation (functions directory):**
```bash
cd functions
npm init -y
npm install firebase-functions firebase-admin
npm install -D typescript @types/node
```

**Client-side (no new deps needed):**
```typescript
// Already available via firebase ^11.4.0
import { getFunctions, httpsCallable } from 'firebase/functions'
```

## Architecture Patterns

### Cloud Function Project Structure
```
quasar-club-system/
  functions/
    src/
      index.ts          # Export all functions
      deleteUser.ts      # Callable function: soft-delete + Auth delete
    package.json
    tsconfig.json
  firebase.json          # Add "functions" config section
```

### Pattern 1: Callable Cloud Function with Admin Verification
**What:** A callable function that verifies the caller has the `admin` custom claim before executing
**When to use:** Any admin-only server-side operation
**Example:**
```typescript
// functions/src/deleteUser.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp()

export const deleteUserAccount = onCall(
  { region: 'europe-west1' },
  async (request) => {
    // Verify caller is admin
    if (!request.auth?.token?.admin) {
      throw new HttpsError('permission-denied', 'Only admins can delete users')
    }

    const { uid } = request.data
    if (!uid) {
      throw new HttpsError('invalid-argument', 'User UID is required')
    }

    const db = getFirestore()
    const auth = getAuth()

    // Step 1: Soft-delete in Firestore
    await db.doc(`users/${uid}`).update({
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: request.auth.uid,
    })

    // Step 2: Delete Firebase Auth account
    await auth.deleteUser(uid)

    return { success: true }
  }
)
```
**Source:** [Firebase Callable Functions docs](https://firebase.google.com/docs/functions/callable), [Firebase Admin manage-users docs](https://firebase.google.com/docs/auth/admin/manage-users)

### Pattern 2: Client-Side Callable Invocation
**What:** Client calls the Cloud Function using `httpsCallable`
**When to use:** Triggering the server-side deletion from AdminUsersTab
**Example:**
```typescript
// src/services/adminFirebase.ts (extend existing)
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions(undefined, 'europe-west1')

const deleteUserAccount = async (uid: string): Promise<void> => {
  const deleteUser = httpsCallable(functions, 'deleteUserAccount')
  await deleteUser({ uid })
}
```

### Pattern 3: Creator Conflict Resolution (Client-Side Orchestration)
**What:** Before calling the Cloud Function, client resolves creator conflicts by updating teams
**When to use:** When deleting a user who is the `creator` field on one or more teams
**Example flow:**
```typescript
// useAdminUseCases.ts
const deleteUserAsAdmin = async (
  uid: string,
  creatorResolutions: Array<{ teamId: string; action: 'delete' | 'reassign'; newCreatorUid?: string }>
) => {
  // Step 1: Resolve creator conflicts
  for (const resolution of creatorResolutions) {
    if (resolution.action === 'delete') {
      await teamFirebase.deleteTeam(resolution.teamId) // existing cascade
    } else if (resolution.action === 'reassign' && resolution.newCreatorUid) {
      await adminFirebase.reassignTeamCreator(resolution.teamId, resolution.newCreatorUid)
    }
  }

  // Step 2: Call Cloud Function for soft-delete + Auth deletion
  await adminFirebase.deleteUserAccount(uid)
}
```

### Pattern 4: Soft-Deleted User Display Resolution
**What:** UI checks user `status` field to display deleted user names differently
**When to use:** Everywhere user names are resolved from UIDs (votes, messages, cashbox, reports)
**Recommended approach:** Add `status` and `deletedAt` to IUser interface. The existing `useTeamMemberUtils.getMemberDisplayName()` can be extended to handle deleted users. Since UIDs stay in team arrays, the existing `loadTeamMembers()` will still load deleted user docs.

```typescript
// Recommended: extend getMemberDisplayName
const getMemberDisplayName = (member: ITeamMember): string => {
  if (member.status === 'deleted') {
    return `${member.displayName || member.email || 'Unknown'} (deleted)`
  }
  return member.displayName || member.email || `Member ${member.uid.substring(0, 8)}...`
}
```

**Visual treatment recommendation (Claude's discretion):** Use a combination of grayed-out text color (`text-grey-6`) and a small "(deleted)" suffix. Strikethrough is too aggressive for historical data display. A badge would add visual clutter in tables/lists.

### Anti-Patterns to Avoid
- **Removing UID from team arrays on delete:** Breaks historical vote/message attribution and participation stats
- **Doing Auth deletion from the client:** Client SDK can only delete the currently signed-in user, not other users
- **Two-step dialog for creators:** CONTEXT.md explicitly says single dialog replaces simple confirm
- **Hard-deleting user Firestore document:** Loses display name for all historical references

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth account deletion | Client-side auth deletion | `firebase-admin.getAuth().deleteUser(uid)` via Cloud Function | Client SDK cannot delete other users |
| Admin authorization check in Cloud Function | Custom token verification | `request.auth.token.admin` in callable | Built-in by callable protocol |
| Team cascade delete | New delete logic | Existing `teamFirebase.deleteTeam()` | Already handles surveys, votes, messages, notifications, invitations, subcollections |
| Batch Firestore operations | Manual batch splitting | Existing `deleteCollectionInBatches()` pattern | Already handles >499 doc batches |

**Key insight:** The existing team cascade delete in `teamFirebase.deleteTeam()` is fully reusable for the "delete team" option in creator conflict resolution. No new cascade logic needed.

## Common Pitfalls

### Pitfall 1: Cloud Function Region Mismatch
**What goes wrong:** Client calls function in `us-central1` (default) but function is deployed to `europe-west1`
**Why it happens:** `getFunctions()` defaults to `us-central1`; Firestore is in `eur3` (Europe)
**How to avoid:** Always pass region to both server (`{ region: 'europe-west1' }`) and client (`getFunctions(undefined, 'europe-west1')`)
**Warning signs:** "Function not found" errors or high latency

### Pitfall 2: Firestore Rules Blocking Cloud Function Writes
**What goes wrong:** Cloud Function uses Admin SDK which bypasses security rules, but client-side Firestore writes for creator reassignment need proper rules
**Why it happens:** Current rules only allow team members to write to team docs
**How to avoid:** The Cloud Function uses Admin SDK (bypasses rules). Creator reassignment updates (changing `creator` field, adding to `powerusers`) must go through the Cloud Function OR use admin custom claim in security rules
**Warning signs:** Permission denied errors during reassignment

### Pitfall 3: Race Condition Between Soft-Delete and Auth Delete
**What goes wrong:** Auth delete succeeds but Firestore soft-delete fails, leaving orphaned state
**Why it happens:** Two independent operations without transaction
**How to avoid:** Do Firestore soft-delete FIRST, then Auth delete. If Auth delete fails, the user doc is soft-deleted but Auth still exists (recoverable state). If Firestore fails first, nothing is deleted (clean rollback). The Cloud Function should handle this ordering.
**Warning signs:** Users stuck in inconsistent state

### Pitfall 4: Soft-Deleted User Can Still Log In
**What goes wrong:** If only Firestore is soft-deleted but Auth deletion fails, user can still authenticate
**Why it happens:** Auth account still exists
**How to avoid:** Add a check in the auth listener (`useAuthUseCases.initializeAuth`) that reads the user doc and blocks access if `status === 'deleted'`. This is a safety net for the edge case where Auth deletion fails.
**Warning signs:** Deleted users still appearing in active sessions

### Pitfall 5: Firebase Functions Not in firebase.json
**What goes wrong:** `firebase deploy --only functions` fails
**Why it happens:** No `functions` config in firebase.json
**How to avoid:** Add functions config to firebase.json:
```json
{
  "functions": {
    "source": "functions",
    "predeploy": "npm --prefix functions run build"
  }
}
```

### Pitfall 6: Admin Users Tab Showing Deleted Users by Default
**What goes wrong:** Soft-deleted users clutter the admin view
**Why it happens:** `getAllUsers()` returns all user documents
**How to avoid:** Filter by `status !== 'deleted'` by default, add toggle to show deleted users

## Code Examples

### firebase.json Update
```json
{
  "firestore": { ... },
  "hosting": { ... },
  "storage": { ... },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": "npm --prefix functions run build"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

### IUser Interface Extension
```typescript
// src/interfaces/interfaces.ts
export interface IUser {
  uid: string
  email: string | null
  name?: string
  displayName?: string
  createdAt: Date
  photoURL?: string
  onboardingCompleted?: boolean
  status?: 'active' | 'deleted'  // NEW
  deletedAt?: Date               // NEW
  deletedBy?: string             // NEW - admin who deleted
}
```

### AuditOperation Extension
```typescript
// Add to AuditOperation type
export type AuditOperation =
  | 'survey.create'
  | 'survey.update'
  | 'survey.delete'
  | 'fine.create'
  | 'fine.update'
  | 'fine.delete'
  | 'member.remove'
  | 'vote.verify'
  | 'joinRequest.approve'
  | 'joinRequest.decline'
  | 'user.delete'           // NEW
  | 'team.reassignCreator'  // NEW
```

### Admin Firestore Rules Update for User Soft-Delete
```
// users collection - add admin write access
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  allow read: if request.auth != null;
  // Admin can update user status (soft-delete) - only needed if doing from client
  // Note: Cloud Function uses Admin SDK which bypasses rules
  allow update: if isAppAdmin();
}
```

### Creator Conflict Detection
```typescript
// In useAdminUseCases.ts or useAdminComposable.ts
const getTeamsWhereUserIsCreator = (uid: string, teams: ITeam[]): ITeam[] => {
  return teams.filter(team => team.creator === uid)
}

const getTeamMembersExcluding = (team: ITeam, excludeUid: string): string[] => {
  return team.members.filter(uid => uid !== excludeUid)
}
```

### Client-Side Filter Toggle for Deleted Users
```typescript
// In useAdminComposable.ts
const showDeletedUsers = ref(false)

const filteredUsers = computed(() => {
  let users = allUsers.value
  if (!showDeletedUsers.value) {
    users = users.filter(u => u.status !== 'deleted')
  }
  const q = userSearchQuery.value.toLowerCase().trim()
  if (!q) return users
  return users.filter((user) =>
    (user.displayName || user.name || '').toLowerCase().includes(q) ||
    (user.email || '').toLowerCase().includes(q)
  )
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloud Functions 1st gen | Cloud Functions 2nd gen (v2) | 2023 GA | Better scaling, concurrency options, region config in function definition |
| `functions.https.onCall` | `onCall` from `firebase-functions/v2/https` | 2023 | New import paths, options object for config |
| `admin.auth()` | `getAuth()` from `firebase-admin/auth` | firebase-admin v10+ | Modular Admin SDK imports |

**Deprecated/outdated:**
- `firebase-functions` 1st gen `functions.https.onCall` still works but v2 is recommended for new functions
- `admin.initializeApp()` still works but modular `initializeApp()` from `firebase-admin/app` is preferred

## Open Questions

1. **Emulator testing for Cloud Functions**
   - What we know: The project uses Firebase emulators for Firestore and Auth testing
   - What's unclear: Whether adding functions emulator will conflict with existing test setup (port 8080 issue already noted in STATE.md)
   - Recommendation: Add functions emulator on port 5001, test manually first

2. **Deleted user display in non-admin contexts**
   - What we know: Soft-deleted users stay in team member arrays, their user docs are preserved
   - What's unclear: Whether all UI components that display member names need updating in this phase or if that can be incremental
   - Recommendation: Update `useTeamMemberUtils.getMemberDisplayName()` centrally -- this covers most display contexts automatically

3. **Firestore security rules for creator reassignment**
   - What we know: Cloud Function bypasses rules for user doc updates
   - What's unclear: Whether creator reassignment (updating team `creator` field) should happen in the Cloud Function or client-side
   - Recommendation: Do it in the Cloud Function since it needs Admin SDK anyway and avoids complex rule additions. Pass the full resolution plan as Cloud Function input.

## Sources

### Primary (HIGH confidence)
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable) - callable function setup, auth context, error handling
- [Firebase Admin Manage Users](https://firebase.google.com/docs/auth/admin/manage-users) - deleteUser API
- [Firebase Cloud Functions TypeScript](https://firebase.google.com/docs/functions/typescript) - TypeScript project setup
- [Firebase Cloud Functions locations](https://firebase.google.com/docs/functions/locations) - region configuration
- Codebase analysis: `teamFirebase.ts`, `adminFirebase.ts`, `useAdminUseCases.ts`, `useAdminComposable.ts`, `AdminComponent.vue`, `AdminTeamsTab.vue`, `AdminUsersTab.vue`, `interfaces.ts`, `firestore.rules`, `firebase.json`

### Secondary (MEDIUM confidence)
- [Firebase Functions Get Started](https://firebase.google.com/docs/functions/get-started) - project initialization

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase Cloud Functions v2 is well-documented and the project already uses Firebase 11.4.0
- Architecture: HIGH - Clean architecture pattern is established, extension points are clear from codebase analysis
- Pitfalls: HIGH - Common Firebase issues are well-documented, codebase-specific risks identified from code review

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable Firebase APIs, 30-day window)

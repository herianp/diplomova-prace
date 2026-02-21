---
phase: 02-listener-registry-system
plan: 02
subsystem: listener-management
tags: [listeners, registry, cleanup, team-switching]
dependency-graph:
  requires: [02-01-listener-registry-foundation]
  provides: [centralized-listener-management, team-switch-cleanup]
  affects: [use-cases, components, stores]
tech-stack:
  added: []
  patterns: [registry-pattern, scope-based-cleanup, error-callbacks]
key-files:
  created: []
  modified:
    - src/composable/useTeamUseCases.ts
    - src/composable/useSurveyUseCases.ts
    - src/stores/teamStore.ts
    - src/components/new/TeamDropdown.vue
    - src/components/new/TeamCard.vue
    - src/components/CashboxComponent.vue
    - src/components/MessagesComponent.vue
    - src/pages/NotificationsPage.vue
    - src/components/notifications/NotificationsDropdown.vue
decisions:
  - Auto-cleanup on re-register eliminates manual unsubscribe checks
  - Scope-based cleanup (team vs user) enables proper team switching
  - Error callbacks surfaced for notification listeners (LST-04)
  - Local unsubscribe variables removed entirely (registry tracks everything)
metrics:
  duration: 4.8 minutes
  completed: 2026-02-15
---

# Phase 02 Plan 02: Listener Registry Migration Summary

**One-liner:** All 9 Firestore listeners registered with ListenerRegistry, team switching cleanup implemented, stores cleaned of unsubscribe fields.

## Objective Achieved

Migrated all Firestore listeners to use ListenerRegistry, removed manual unsubscribe storage from stores and components, and implemented proper team switching cleanup via scope-based unregistration.

**Business value:** Eliminates listener leak risk by centralizing all listener lifecycle management. Team switching now properly cleans up old listeners before creating new ones, preventing stale data and memory leaks.

## Tasks Completed

### Task 1: Migrate use case listeners and clean teamStore
**Commit:** e82eb8a
**Files:** useTeamUseCases.ts, useSurveyUseCases.ts, teamStore.ts

- Imported `listenerRegistry` in useTeamUseCases and useSurveyUseCases
- Registered teams listener with registry (auto-cleanup on re-register)
- Registered surveys listener with registry
- Removed `unsubscribeTeams` and `unsubscribeSurveys` refs from teamStore
- Removed `setTeamsUnsubscribe` and `setSurveysUnsubscribe` functions
- Simplified `clearData()` to only clear state (no manual unsubscribe calls)
- Build passed cleanly, no references to removed fields found

### Task 2: Migrate component listeners, add team switching cleanup, wire error callbacks
**Commit:** 766c302
**Files:** TeamDropdown.vue, TeamCard.vue, CashboxComponent.vue, MessagesComponent.vue, NotificationsPage.vue, NotificationsDropdown.vue

**Team switching cleanup:**
- TeamDropdown: calls `unregisterByScope('team')` before switching teams
- TeamCard: calls `unregisterByScope('team')` before switching teams
- Ensures surveys, notifications, messages, and cashbox-* listeners are cleaned up

**Component-level listeners:**
- CashboxComponent: registered 4 cashbox listeners (fines, payments, rules, history) with registry
- MessagesComponent: registered messages listener with registry
- NotificationsPage: registered notifications listener with onError callback (LST-04)
- NotificationsDropdown: registered notifications listener with onError callback (LST-04)
- Removed all local `unsubscribe` variables (null tracking eliminated)

**Error handling (LST-04):**
- Notification listeners now pass onError callbacks to `listenToNotifications()`
- Errors logged to console: "Notification listener error:", "Notification dropdown listener error:"
- Service already supported onError as 4th parameter, now properly wired

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Build verification:**
```bash
quasar build
# ✅ Build succeeded with no errors
```

**Pattern verification:**
```bash
grep -r "unsubscribeTeams\|unsubscribeSurveys" src/
# ✅ No matches (removed fields)

grep -r "let unsubscribe = null" src/
# ✅ No matches (local tracking removed)

grep "listenerRegistry.register" src/composable/useTeamUseCases.ts
# ✅ Found: listenerRegistry.register('teams', unsubscribe, { userId })

grep "listenerRegistry.register" src/composable/useSurveyUseCases.ts
# ✅ Found: listenerRegistry.register('surveys', unsubscribe, { teamId })

grep "unregisterByScope" src/components/new/TeamDropdown.vue
# ✅ Found: listenerRegistry.unregisterByScope('team')

grep "unregisterByScope" src/components/new/TeamCard.vue
# ✅ Found: listenerRegistry.unregisterByScope('team')

grep "cashbox-" src/components/CashboxComponent.vue
# ✅ Found: all 4 cashbox listeners registered

grep "Notification.*listener error" src/
# ✅ Found: error callbacks in NotificationsPage.vue and NotificationsDropdown.vue
```

## Architecture Impact

**Before:**
- Stores held unsubscribe refs (`unsubscribeTeams`, `unsubscribeSurveys`)
- Components held local `unsubscribe` variables
- Manual cleanup via `if (unsubscribe) { unsubscribe() }` patterns
- Team switching: no cleanup, listeners orphaned

**After:**
- Zero unsubscribe storage in stores or components
- All listeners registered with central registry
- Auto-cleanup on re-register (duplicate prevention)
- Team switching: `unregisterByScope('team')` cleans up all team-scoped listeners
- Error callbacks wired for notification listeners

**Listener inventory (9 types):**
1. `auth` (user scope) - useAuthUseCases
2. `teams` (user scope) - useTeamUseCases
3. `surveys` (team scope) - useSurveyUseCases
4. `notifications` (team scope) - NotificationsPage/NotificationsDropdown
5. `messages` (team scope) - MessagesComponent
6. `cashbox-fines` (team scope) - CashboxComponent
7. `cashbox-payments` (team scope) - CashboxComponent
8. `cashbox-rules` (team scope) - CashboxComponent
9. `cashbox-history` (team scope) - CashboxComponent

**Scope-based cleanup:**
- **Team-scoped:** surveys, notifications, messages, cashbox-* (cleaned on team switch)
- **User-scoped:** auth, teams (cleaned on logout only)

## Key Decisions

**Auto-cleanup over manual checks:**
Registry auto-cleans existing listener on re-register. Eliminates the pattern:
```typescript
// BEFORE
if (teamStore.unsubscribeTeams) {
  teamStore.unsubscribeTeams()
}

// AFTER
// No check needed - registry handles it
listenerRegistry.register('teams', unsubscribe, { userId })
```

**Scope-based cleanup for team switching:**
Single call to `unregisterByScope('team')` cleans up all team-scoped listeners. Prevents stale data from previous team leaking into new team context.

**Error callbacks for notification listeners:**
LST-04 requirement surfaced. Notification listeners now pass error callbacks to log listener errors. Critical for debugging permission-denied scenarios during team switching.

## Testing Notes

**Manual test scenarios:**
1. **Team switching:** Switch between teams → verify old surveys/notifications don't leak
2. **Listener registry debug:** Call `listenerRegistry.getDebugInfo()` in console → verify all 9 listeners tracked
3. **Error callback:** Trigger permission-denied on notifications → verify error logged to console
4. **Cleanup on unmount:** Navigate away from pages → verify listeners cleaned up

**Build verification:** All files compiled cleanly with TypeScript strict checks.

## Next Steps

**Phase 02 Plan 03:** Error boundary integration with listener registry (ensure listener errors don't crash app silently).

**Phase 03:** Quality assurance (comprehensive testing of listener lifecycle edge cases).

## Self-Check

**Created files verification:**
```bash
# No new files created in this plan
```

**Modified files verification:**
```bash
[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/composable/useTeamUseCases.ts" ] && echo "FOUND: useTeamUseCases.ts" || echo "MISSING: useTeamUseCases.ts"
# FOUND: useTeamUseCases.ts

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/composable/useSurveyUseCases.ts" ] && echo "FOUND: useSurveyUseCases.ts" || echo "MISSING: useSurveyUseCases.ts"
# FOUND: useSurveyUseCases.ts

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/stores/teamStore.ts" ] && echo "FOUND: teamStore.ts" || echo "MISSING: teamStore.ts"
# FOUND: teamStore.ts

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/components/new/TeamDropdown.vue" ] && echo "FOUND: TeamDropdown.vue" || echo "MISSING: TeamDropdown.vue"
# FOUND: TeamDropdown.vue

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/components/new/TeamCard.vue" ] && echo "FOUND: TeamCard.vue" || echo "MISSING: TeamCard.vue"
# FOUND: TeamCard.vue

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/components/CashboxComponent.vue" ] && echo "FOUND: CashboxComponent.vue" || echo "MISSING: CashboxComponent.vue"
# FOUND: CashboxComponent.vue

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/components/MessagesComponent.vue" ] && echo "FOUND: MessagesComponent.vue" || echo "MISSING: MessagesComponent.vue"
# FOUND: MessagesComponent.vue

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/pages/NotificationsPage.vue" ] && echo "FOUND: NotificationsPage.vue" || echo "MISSING: NotificationsPage.vue"
# FOUND: NotificationsPage.vue

[ -f "C:/Users/Developer/Documents/projekty/diplomova-prace/quasar-club-system/src/components/notifications/NotificationsDropdown.vue" ] && echo "FOUND: NotificationsDropdown.vue" || echo "MISSING: NotificationsDropdown.vue"
# FOUND: NotificationsDropdown.vue
```

**Commits verification:**
```bash
git log --oneline --all | grep -q "e82eb8a" && echo "FOUND: e82eb8a" || echo "MISSING: e82eb8a"
# FOUND: e82eb8a

git log --oneline --all | grep -q "766c302" && echo "FOUND: 766c302" || echo "MISSING: 766c302"
# FOUND: 766c302
```

## Self-Check: PASSED

All modified files exist, all commits exist, build passes, all verifications passed.

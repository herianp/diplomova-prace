import { ref, onMounted, Ref } from 'vue'
import { DateTime } from 'luxon'
import { i18n } from '@/boot/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useRateLimitStore } from '@/stores/rateLimitStore'
import { useRateLimitFirebase } from '@/services/rateLimitFirebase'
import { useJoinRequestFirebase } from '@/services/joinRequestFirebase'
import { listenerRegistry } from '@/services/listenerRegistry'
import { IRateLimitConfig } from '@/interfaces/interfaces'

// ============================================================
// Types
// ============================================================

export type RateLimitAction = 'teamCreation' | 'messages' | 'joinRequests' | 'surveys' | 'fines'

export interface RateLimitContext {
  teamId?: string
}

export interface RateLimitResult {
  allowed: boolean
  current: number
  limit: number
  resetInfo: string
}

interface ActionConfig {
  scope: 'user' | 'team'
  field: string
  weekStartField?: string
  dateStartField?: string
  windowType: 'total' | 'weekly' | 'daily' | 'concurrent'
}

// ============================================================
// Action mapping
// ============================================================

const actionConfig: Record<RateLimitAction, ActionConfig> = {
  teamCreation: { scope: 'user', field: 'teamsCreated', windowType: 'total' },
  messages: { scope: 'user', field: 'messagesThisWeek', weekStartField: 'messagesWeekStart', windowType: 'weekly' },
  joinRequests: { scope: 'user', field: 'pendingJoinRequests', windowType: 'concurrent' },
  surveys: { scope: 'user', field: 'surveysThisWeek', weekStartField: 'surveysWeekStart', windowType: 'weekly' },
  fines: { scope: 'team', field: 'finesToday', dateStartField: 'finesDateStart', windowType: 'daily' },
}

// ============================================================
// Composable
// ============================================================

export function useRateLimiter() {
  const t = (i18n.global as any).t as (key: string, named?: Record<string, unknown>) => string
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const rateLimitStore = useRateLimitStore()
  const rateLimitFirebase = useRateLimitFirebase()
  const joinRequestFirebase = useJoinRequestFirebase()

  /**
   * Format reset info string based on window type and stored start values.
   */
  const formatResetInfo = (
    windowType: ActionConfig['windowType'],
    weekStart?: Date | null,
    dateStart?: Date | null
  ): string => {
    switch (windowType) {
      case 'total':
        return t('rateLimits.resetPermanent')

      case 'weekly': {
        // Next Monday = current week start + 7 days
        const nextMonday = DateTime.now().startOf('week').plus({ weeks: 1 })
        return t('rateLimits.resetWeekly', { date: nextMonday.toLocaleString(DateTime.DATE_SHORT) })
      }

      case 'daily':
        return t('rateLimits.resetDaily')

      case 'concurrent':
        return t('rateLimits.resetConcurrent')

      default:
        return ''
    }
  }

  /**
   * Ensure the rate limit config is loaded and real-time listener is active.
   * First call loads config + starts listener. Subsequent calls return cached config.
   */
  const ensureConfigLoaded = async (): Promise<IRateLimitConfig> => {
    if (rateLimitStore.isLoaded && rateLimitStore.config) {
      return rateLimitStore.config
    }
    const config = await rateLimitFirebase.getRateLimitConfig()
    rateLimitStore.setConfig(config)

    // Start real-time listener so admin changes propagate immediately
    if (!listenerRegistry.isActive('rateLimits')) {
      const unsubscribe = rateLimitFirebase.setRateLimitListener((updated) => {
        rateLimitStore.setConfig(updated)
      })
      listenerRegistry.register('rateLimits', unsubscribe, { scope: 'global' })
    }

    return config
  }

  /**
   * Check if an action is allowed for the current user/team.
   * Returns detailed result including current usage, limit, and reset info.
   */
  const checkLimit = async (
    action: RateLimitAction,
    context?: RateLimitContext
  ): Promise<RateLimitResult> => {
    const config = await ensureConfigLoaded()
    const cfg = actionConfig[action]
    const limit = config[action as keyof IRateLimitConfig]

    // ---- Concurrent check (join requests — derived from query) ----
    if (cfg.windowType === 'concurrent') {
      const userId = authStore.user?.uid
      if (!userId) {
        return { allowed: false, current: 0, limit, resetInfo: formatResetInfo('concurrent') }
      }
      const pendingCount = await joinRequestFirebase.countPendingRequestsByUser(userId)
      const allowed = pendingCount < limit
      return {
        allowed,
        current: pendingCount,
        limit,
        resetInfo: formatResetInfo('concurrent'),
      }
    }

    // ---- Team creation — count actual teams from store ----
    if (action === 'teamCreation') {
      const userId = authStore.user?.uid
      if (!userId) {
        return { allowed: false, current: 0, limit, resetInfo: formatResetInfo('total') }
      }
      const current = teamStore.teams.filter(team => team.creator === userId).length
      const allowed = current < limit
      return {
        allowed,
        current,
        limit,
        resetInfo: formatResetInfo('total'),
      }
    }

    // ---- User-scoped actions ----
    if (cfg.scope === 'user') {
      const userId = authStore.user?.uid
      if (!userId) {
        return { allowed: false, current: 0, limit, resetInfo: formatResetInfo(cfg.windowType) }
      }

      const usage = await rateLimitFirebase.getUserUsage(userId)

      if (cfg.windowType === 'weekly' && cfg.weekStartField) {
        // Check if weekly window has expired
        const storedWeekStart = usage[cfg.weekStartField]
        const currentMonday = DateTime.now().startOf('week')

        if (storedWeekStart) {
          const storedDate = storedWeekStart instanceof Date
            ? DateTime.fromJSDate(storedWeekStart)
            : (storedWeekStart as { toDate?: () => Date }).toDate
              ? DateTime.fromJSDate((storedWeekStart as { toDate: () => Date }).toDate())
              : DateTime.fromMillis((storedWeekStart as { seconds: number }).seconds * 1000)

          if (currentMonday > storedDate) {
            // Window expired — reset counter
            await rateLimitFirebase.resetWeeklyCounter(userId, cfg.field, cfg.weekStartField)
            const allowed = 0 < limit
            return {
              allowed,
              current: 0,
              limit,
              resetInfo: formatResetInfo('weekly'),
            }
          }
        } else {
          // No weekStart stored yet — treat as fresh window
          await rateLimitFirebase.resetWeeklyCounter(userId, cfg.field, cfg.weekStartField)
          return {
            allowed: true,
            current: 0,
            limit,
            resetInfo: formatResetInfo('weekly'),
          }
        }

        const current = (usage[cfg.field] as number) ?? 0
        const allowed = current < limit
        return {
          allowed,
          current,
          limit,
          resetInfo: formatResetInfo('weekly'),
        }
      }

      // Total window (e.g. teamCreation)
      const current = (usage[cfg.field] as number) ?? 0
      const allowed = current < limit
      return {
        allowed,
        current,
        limit,
        resetInfo: formatResetInfo('total'),
      }
    }

    // ---- Team-scoped actions (fines) ----
    if (cfg.scope === 'team') {
      const teamId = context?.teamId ?? teamStore.currentTeam?.id
      if (!teamId) {
        return { allowed: false, current: 0, limit, resetInfo: formatResetInfo(cfg.windowType) }
      }

      const usage = await rateLimitFirebase.getTeamUsage(teamId)

      if (cfg.windowType === 'daily' && cfg.dateStartField) {
        const storedDateStart = usage[cfg.dateStartField]
        const todayStr = DateTime.now().toISODate()

        if (storedDateStart) {
          let storedStr: string
          if (storedDateStart instanceof Date) {
            storedStr = DateTime.fromJSDate(storedDateStart).toISODate() ?? ''
          } else if (typeof storedDateStart === 'object' && (storedDateStart as { toDate?: () => Date }).toDate) {
            storedStr = DateTime.fromJSDate((storedDateStart as { toDate: () => Date }).toDate()).toISODate() ?? ''
          } else if (typeof storedDateStart === 'object' && (storedDateStart as { seconds: number }).seconds) {
            storedStr = DateTime.fromMillis((storedDateStart as { seconds: number }).seconds * 1000).toISODate() ?? ''
          } else {
            storedStr = ''
          }

          if (todayStr !== storedStr) {
            // Day changed — reset counter
            await rateLimitFirebase.resetDailyCounter(teamId, cfg.field, cfg.dateStartField)
            return {
              allowed: true,
              current: 0,
              limit,
              resetInfo: formatResetInfo('daily'),
            }
          }
        } else {
          // No dateStart stored yet — initialize
          await rateLimitFirebase.resetDailyCounter(teamId, cfg.field, cfg.dateStartField)
          return {
            allowed: true,
            current: 0,
            limit,
            resetInfo: formatResetInfo('daily'),
          }
        }

        const current = (usage[cfg.field] as number) ?? 0
        const allowed = current < limit
        return {
          allowed,
          current,
          limit,
          resetInfo: formatResetInfo('daily'),
        }
      }
    }

    // Fallback — should not reach here for valid actions
    return { allowed: true, current: 0, limit, resetInfo: '' }
  }

  /**
   * Increment usage counter after a successful action.
   * Not needed for concurrent (joinRequests) — count is derived from query.
   */
  const incrementUsage = async (
    action: RateLimitAction,
    context?: RateLimitContext
  ): Promise<void> => {
    const cfg = actionConfig[action]

    // Concurrent limits are query-derived — no increment
    if (cfg.windowType === 'concurrent') return

    if (cfg.scope === 'user') {
      const userId = authStore.user?.uid
      if (!userId) return
      await rateLimitFirebase.incrementUserUsage(userId, cfg.field)
    } else if (cfg.scope === 'team') {
      const teamId = context?.teamId ?? teamStore.currentTeam?.id
      if (!teamId) return
      await rateLimitFirebase.incrementTeamUsage(teamId, cfg.field)
    }
  }

  /**
   * Reactive helper for binding to UI components.
   * Checks the limit on mount and exposes reactive refs.
   */
  const useActionLimitStatus = (
    action: RateLimitAction,
    context?: RateLimitContext
  ): {
    isLimited: Ref<boolean>
    limitInfo: Ref<string>
    current: Ref<number>
    limit: Ref<number>
  } => {
    const isLimited = ref(false)
    const limitInfo = ref('')
    const current = ref(0)
    const limit = ref(0)

    const refresh = async () => {
      try {
        const result = await checkLimit(action, context)
        isLimited.value = !result.allowed
        limitInfo.value = result.resetInfo
        current.value = result.current
        limit.value = result.limit
      } catch {
        // On error, do not block the user
        isLimited.value = false
      }
    }

    onMounted(() => {
      void refresh()
    })

    return { isLimited, limitInfo, current, limit }
  }

  return {
    checkLimit,
    incrementUsage,
    formatResetInfo,
    useActionLimitStatus,
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger to prevent console output during tests
vi.mock('src/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

import { ListenerRegistry } from '../listenerRegistry'

describe('ListenerRegistry', () => {
  let registry: ListenerRegistry

  beforeEach(() => {
    registry = new ListenerRegistry()
  })

  describe('register', () => {
    it('adds a listener and getCount() returns 1', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      expect(registry.getCount()).toBe(1)
    })

    it('marks listener as active after registration', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      expect(registry.isActive('auth')).toBe(true)
    })

    it('stores context passed on registration', () => {
      const unsubscribe = vi.fn()
      registry.register('teams', unsubscribe, { userId: 'user-123' })
      const debugInfo = registry.getDebugInfo()
      const entry = debugInfo.find(d => d.id === 'teams')
      expect(entry?.context).toEqual({ userId: 'user-123' })
    })

    it('auto-cleans up old listener when re-registering same id', () => {
      const oldUnsubscribe = vi.fn()
      const newUnsubscribe = vi.fn()

      registry.register('auth', oldUnsubscribe)
      registry.register('auth', newUnsubscribe)

      // Old unsubscribe should have been called once (auto-cleanup)
      expect(oldUnsubscribe).toHaveBeenCalledTimes(1)
      // New listener is still active
      expect(registry.isActive('auth')).toBe(true)
      // Count remains 1 (not 2)
      expect(registry.getCount()).toBe(1)
    })

    it('registers multiple listeners with different ids', () => {
      registry.register('auth', vi.fn())
      registry.register('teams', vi.fn())
      registry.register('surveys', vi.fn())
      expect(registry.getCount()).toBe(3)
    })
  })

  describe('unregister', () => {
    it('calls the unsubscribe function', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      registry.unregister('auth')
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })

    it('returns true when listener was found and removed', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      const result = registry.unregister('auth')
      expect(result).toBe(true)
    })

    it('reduces count to 0 after removing the only listener', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      registry.unregister('auth')
      expect(registry.getCount()).toBe(0)
    })

    it('marks listener as inactive after unregistration', () => {
      const unsubscribe = vi.fn()
      registry.register('auth', unsubscribe)
      registry.unregister('auth')
      expect(registry.isActive('auth')).toBe(false)
    })

    it('returns false when listener does not exist', () => {
      const result = registry.unregister('auth')
      expect(result).toBe(false)
    })

    it('does not throw when unregistering non-existent listener', () => {
      expect(() => registry.unregister('surveys')).not.toThrow()
    })

    it('swallows errors thrown by unsubscribe function and still removes listener', () => {
      const errorUnsubscribe = vi.fn(() => {
        throw new Error('Firebase unsubscribe error')
      })
      registry.register('auth', errorUnsubscribe)

      // Should not throw even though unsubscribe throws
      expect(() => registry.unregister('auth')).not.toThrow()
      // Listener should still be removed
      expect(registry.isActive('auth')).toBe(false)
      expect(registry.getCount()).toBe(0)
    })
  })

  describe('unregisterAll', () => {
    it('calls all unsubscribe functions', () => {
      const unsub1 = vi.fn()
      const unsub2 = vi.fn()
      const unsub3 = vi.fn()
      registry.register('auth', unsub1)
      registry.register('teams', unsub2)
      registry.register('surveys', unsub3)

      registry.unregisterAll()

      expect(unsub1).toHaveBeenCalledTimes(1)
      expect(unsub2).toHaveBeenCalledTimes(1)
      expect(unsub3).toHaveBeenCalledTimes(1)
    })

    it('results in count of 0', () => {
      registry.register('auth', vi.fn())
      registry.register('teams', vi.fn())
      registry.register('surveys', vi.fn())

      registry.unregisterAll()

      expect(registry.getCount()).toBe(0)
    })

    it('works on an empty registry without error', () => {
      expect(() => registry.unregisterAll()).not.toThrow()
    })
  })

  describe('unregisterByScope', () => {
    it('unregisters team-scoped listeners (surveys, notifications, messages, cashbox-*)', () => {
      const unsubSurveys = vi.fn()
      const unsubNotifications = vi.fn()
      const unsubMessages = vi.fn()
      const unsubCashboxFines = vi.fn()
      const unsubCashboxPayments = vi.fn()
      const unsubCashboxRules = vi.fn()
      const unsubCashboxHistory = vi.fn()
      const unsubAuth = vi.fn()
      const unsubTeams = vi.fn()

      registry.register('surveys', unsubSurveys)
      registry.register('notifications', unsubNotifications)
      registry.register('messages', unsubMessages)
      registry.register('cashbox-fines', unsubCashboxFines)
      registry.register('cashbox-payments', unsubCashboxPayments)
      registry.register('cashbox-rules', unsubCashboxRules)
      registry.register('cashbox-history', unsubCashboxHistory)
      registry.register('auth', unsubAuth)
      registry.register('teams', unsubTeams)

      registry.unregisterByScope('team')

      expect(unsubSurveys).toHaveBeenCalledTimes(1)
      expect(unsubNotifications).toHaveBeenCalledTimes(1)
      expect(unsubMessages).toHaveBeenCalledTimes(1)
      expect(unsubCashboxFines).toHaveBeenCalledTimes(1)
      expect(unsubCashboxPayments).toHaveBeenCalledTimes(1)
      expect(unsubCashboxRules).toHaveBeenCalledTimes(1)
      expect(unsubCashboxHistory).toHaveBeenCalledTimes(1)
      // auth and teams should NOT be unsubscribed
      expect(unsubAuth).not.toHaveBeenCalled()
      expect(unsubTeams).not.toHaveBeenCalled()
    })

    it('leaves auth and teams active after team scope cleanup', () => {
      registry.register('surveys', vi.fn())
      registry.register('auth', vi.fn())
      registry.register('teams', vi.fn())

      registry.unregisterByScope('team')

      expect(registry.isActive('surveys')).toBe(false)
      expect(registry.isActive('auth')).toBe(true)
      expect(registry.isActive('teams')).toBe(true)
    })

    it('unregisters user-scoped listeners (auth, teams)', () => {
      const unsubAuth = vi.fn()
      const unsubTeams = vi.fn()
      const unsubSurveys = vi.fn()

      registry.register('auth', unsubAuth)
      registry.register('teams', unsubTeams)
      registry.register('surveys', unsubSurveys)

      registry.unregisterByScope('user')

      expect(unsubAuth).toHaveBeenCalledTimes(1)
      expect(unsubTeams).toHaveBeenCalledTimes(1)
      // surveys should NOT be unsubscribed
      expect(unsubSurveys).not.toHaveBeenCalled()
    })

    it('leaves team-scoped listeners active after user scope cleanup', () => {
      registry.register('auth', vi.fn())
      registry.register('surveys', vi.fn())

      registry.unregisterByScope('user')

      expect(registry.isActive('auth')).toBe(false)
      expect(registry.isActive('surveys')).toBe(true)
    })

    it('skips already-inactive listeners during scope cleanup', () => {
      // Only register auth, leave teams unregistered
      const unsubAuth = vi.fn()
      registry.register('auth', unsubAuth)

      // Should not throw even though teams is not registered
      expect(() => registry.unregisterByScope('user')).not.toThrow()
      expect(unsubAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('isActive', () => {
    it('returns false for unregistered listener', () => {
      expect(registry.isActive('auth')).toBe(false)
    })

    it('returns true after registration', () => {
      registry.register('auth', vi.fn())
      expect(registry.isActive('auth')).toBe(true)
    })

    it('returns false after unregistration', () => {
      registry.register('auth', vi.fn())
      registry.unregister('auth')
      expect(registry.isActive('auth')).toBe(false)
    })
  })

  describe('getActiveListeners', () => {
    it('returns empty array when no listeners registered', () => {
      expect(registry.getActiveListeners()).toEqual([])
    })

    it('returns array of registered listener IDs', () => {
      registry.register('auth', vi.fn())
      registry.register('teams', vi.fn())
      const active = registry.getActiveListeners()
      expect(active).toContain('auth')
      expect(active).toContain('teams')
      expect(active.length).toBe(2)
    })

    it('does not include unregistered listener IDs', () => {
      registry.register('auth', vi.fn())
      registry.register('teams', vi.fn())
      registry.unregister('auth')
      const active = registry.getActiveListeners()
      expect(active).not.toContain('auth')
      expect(active).toContain('teams')
    })
  })

  describe('getDebugInfo', () => {
    it('returns array with metadata for each active listener', () => {
      registry.register('auth', vi.fn(), { userId: 'user-1' })
      registry.register('surveys', vi.fn(), { teamId: 'team-1' })

      const debug = registry.getDebugInfo()
      expect(debug).toHaveLength(2)

      const authInfo = debug.find(d => d.id === 'auth')
      expect(authInfo).toBeDefined()
      expect(authInfo?.context).toEqual({ userId: 'user-1' })
      expect(typeof authInfo?.ageSeconds).toBe('number')
      expect(authInfo?.ageSeconds).toBeGreaterThanOrEqual(0)
    })

    it('returns empty array when no listeners registered', () => {
      expect(registry.getDebugInfo()).toEqual([])
    })

    it('ageSeconds is a non-negative number', () => {
      registry.register('auth', vi.fn())
      const debug = registry.getDebugInfo()
      expect(debug[0]?.ageSeconds).toBeGreaterThanOrEqual(0)
    })

    it('returns context with default empty object when no context provided', () => {
      registry.register('auth', vi.fn())
      const debug = registry.getDebugInfo()
      expect(debug[0]?.context).toEqual({})
    })
  })

  describe('getCount', () => {
    it('returns 0 when no listeners registered', () => {
      expect(registry.getCount()).toBe(0)
    })

    it('returns correct count after multiple register/unregister operations', () => {
      registry.register('auth', vi.fn())
      expect(registry.getCount()).toBe(1)

      registry.register('teams', vi.fn())
      expect(registry.getCount()).toBe(2)

      registry.register('surveys', vi.fn())
      expect(registry.getCount()).toBe(3)

      registry.unregister('teams')
      expect(registry.getCount()).toBe(2)

      registry.unregister('auth')
      expect(registry.getCount()).toBe(1)

      registry.unregisterAll()
      expect(registry.getCount()).toBe(0)
    })
  })
})

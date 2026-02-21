import { Unsubscribe } from 'firebase/firestore'
import { createLogger } from 'src/utils/logger'

const log = createLogger('listenerRegistry')

/**
 * Listener ID type covering all listener categories in the app
 */
export type ListenerId =
  | 'auth'
  | 'teams'
  | 'surveys'
  | 'notifications'
  | 'messages'
  | 'cashbox-fines'
  | 'cashbox-payments'
  | 'cashbox-rules'
  | 'cashbox-history'

/**
 * Metadata for a registered listener
 */
export interface ListenerMetadata {
  id: ListenerId
  unsubscribe: Unsubscribe
  createdAt: number
  context: Record<string, unknown>
}

/**
 * Centralized registry for managing real-time listener lifecycle
 *
 * Responsibilities:
 * - Track all active listeners by ID
 * - Prevent duplicate listeners (auto-cleanup old on re-register)
 * - Provide scope-based cleanup (team vs user)
 * - Enable debugging via getDebugInfo()
 */
export class ListenerRegistry {
  private listeners: Map<ListenerId, ListenerMetadata> = new Map()

  /**
   * Register a listener. If listener with same ID exists, auto-cleanup old one first.
   * @param id - Unique listener identifier
   * @param unsubscribe - Cleanup function returned by Firebase listener
   * @param context - Optional metadata for debugging (e.g., userId, teamId)
   */
  register(
    id: ListenerId,
    unsubscribe: Unsubscribe,
    context: Record<string, unknown> = {}
  ): void {
    // Auto-cleanup existing listener with same ID
    if (this.listeners.has(id)) {
      log.warn('Auto-cleanup: listener already exists, removing old one', { id })
      this.unregister(id)
    }

    this.listeners.set(id, {
      id,
      unsubscribe,
      createdAt: Date.now(),
      context
    })

    log.debug('Registered listener', { id, ...context })
  }

  /**
   * Unregister a listener by ID
   * @param id - Listener identifier to remove
   * @returns true if listener was found and removed, false otherwise
   */
  unregister(id: ListenerId): boolean {
    const metadata = this.listeners.get(id)
    if (!metadata) {
      return false
    }

    try {
      metadata.unsubscribe()
    } catch (error) {
      log.error('Error unsubscribing listener', { id, error: error instanceof Error ? error.message : String(error) })
    }

    this.listeners.delete(id)
    log.debug('Unregistered listener', { id })
    return true
  }

  /**
   * Unregister all active listeners
   */
  unregisterAll(): void {
    log.info('Unregistering all listeners', { count: this.listeners.size })
    const ids = Array.from(this.listeners.keys())
    ids.forEach(id => this.unregister(id))
  }

  /**
   * Unregister listeners by scope
   * @param scope - 'team' for team-scoped listeners, 'user' for user-scoped listeners
   *
   * Team-scoped: surveys, notifications, messages, cashbox-*
   * User-scoped: auth, teams
   */
  unregisterByScope(scope: 'team' | 'user'): void {
    const teamScopedIds: ListenerId[] = [
      'surveys',
      'notifications',
      'messages',
      'cashbox-fines',
      'cashbox-payments',
      'cashbox-rules',
      'cashbox-history'
    ]

    const userScopedIds: ListenerId[] = ['auth', 'teams']

    const idsToUnregister = scope === 'team' ? teamScopedIds : userScopedIds

    log.info('Unregistering scoped listeners', { scope })
    idsToUnregister.forEach(id => {
      if (this.isActive(id)) {
        this.unregister(id)
      }
    })
  }

  /**
   * Check if a listener is currently active
   * @param id - Listener identifier
   * @returns true if listener exists, false otherwise
   */
  isActive(id: ListenerId): boolean {
    return this.listeners.has(id)
  }

  /**
   * Get array of active listener IDs
   * @returns Array of ListenerId
   */
  getActiveListeners(): ListenerId[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * Get debug information for all active listeners
   * @returns Array of debug info objects with id, ageSeconds, and context
   */
  getDebugInfo(): Array<{ id: ListenerId; ageSeconds: number; context: Record<string, unknown> }> {
    const now = Date.now()
    return Array.from(this.listeners.values()).map(metadata => ({
      id: metadata.id,
      ageSeconds: Math.round((now - metadata.createdAt) / 1000),
      context: metadata.context
    }))
  }

  /**
   * Get count of active listeners
   * @returns Number of active listeners
   */
  getCount(): number {
    return this.listeners.size
  }
}

/**
 * Module-level singleton instance
 */
export const listenerRegistry = new ListenerRegistry()

// Expose debug interface in development mode
if (import.meta.env.DEV) {
  (window as any).__listenerDebug = {
    getActive: () => listenerRegistry.getActiveListeners(),
    getDebugInfo: () => listenerRegistry.getDebugInfo(),
    getCount: () => listenerRegistry.getCount()
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { AuthError } from '@/errors'

// --- Hoisted mock functions (vi.hoisted ensures these are available before vi.mock factories run) ---

const {
  mockPush,
  mockNotifyError,
  mockNotifySuccess,
  mockLoginUser,
  mockLogoutUser,
  mockRegisterUser,
  mockAuthStateListener,
  mockAuthStateReady,
  mockGetCurrentUser,
  mockRefreshUser,
  mockSetTeamListener
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockNotifyError: vi.fn(),
  mockNotifySuccess: vi.fn(),
  mockLoginUser: vi.fn(),
  mockLogoutUser: vi.fn(),
  mockRegisterUser: vi.fn(),
  mockAuthStateListener: vi.fn(),
  mockAuthStateReady: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockRefreshUser: vi.fn(),
  mockSetTeamListener: vi.fn()
}))

// --- Module mocks ---

vi.mock('@/firebase/config', () => ({ db: {}, auth: {}, analytics: {}, perf: {} }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/services/notificationService', () => ({
  notifyError: mockNotifyError,
  notifySuccess: mockNotifySuccess
}))

vi.mock('src/utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

vi.mock('@/services/authFirebase', () => ({
  useAuthFirebase: () => ({
    loginUser: mockLoginUser,
    logoutUser: mockLogoutUser,
    registerUser: mockRegisterUser,
    authStateListener: mockAuthStateListener,
    authStateReady: mockAuthStateReady,
    getCurrentUser: mockGetCurrentUser,
    refreshUser: mockRefreshUser
  })
}))

vi.mock('@/services/listenerRegistry', () => ({
  listenerRegistry: { register: vi.fn(), unregister: vi.fn(), unregisterAll: vi.fn() }
}))

vi.mock('@/composable/useTeamUseCases', () => ({
  useTeamUseCases: () => ({ setTeamListener: mockSetTeamListener })
}))

// --- Import after mocks are declared ---
import { useAuthUseCases } from '../useAuthUseCases'
import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { listenerRegistry } from '@/services/listenerRegistry'

// --- Mock user factory ---
const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@test.cz',
  displayName: 'Test User',
  getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
  ...overrides
})

describe('useAuthUseCases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Default: auth listener returns a no-op unsubscribe
    mockAuthStateListener.mockReturnValue(vi.fn())
  })

  // ─── signIn ───────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('success: sets authStore.user and resolves with user', async () => {
      const mockUser = createMockUser()
      mockLoginUser.mockResolvedValue(mockUser)

      const { signIn } = useAuthUseCases()
      const authStore = useAuthStore()

      const result = await signIn('test@test.cz', '123456')

      expect(result).toStrictEqual(mockUser)
      expect(authStore.user).toStrictEqual(mockUser)
      expect(authStore.isLoading).toBe(false)
    })

    it('success: loading is true during call, false after completion', async () => {
      const mockUser = createMockUser()
      const loadingStates: boolean[] = []

      mockLoginUser.mockImplementation(async () => {
        const authStore = useAuthStore()
        loadingStates.push(authStore.isLoading)
        return mockUser
      })

      const { signIn } = useAuthUseCases()
      await signIn('test@test.cz', '123456')

      expect(loadingStates[0]).toBe(true)
      const authStore = useAuthStore()
      expect(authStore.isLoading).toBe(false)
    })

    it('failure (AuthError wrong-password): sets user null, calls notifyError, re-throws', async () => {
      const err = new AuthError('auth/wrong-password', 'Wrong password')
      mockLoginUser.mockRejectedValue(err)

      const { signIn } = useAuthUseCases()
      const authStore = useAuthStore()

      await expect(signIn('test@test.cz', 'wrong')).rejects.toThrow(AuthError)

      expect(authStore.user).toBeNull()
      expect(authStore.isLoading).toBe(false)
      expect(mockNotifyError).toHaveBeenCalledWith('Wrong password', expect.objectContaining({ retry: false }))
    })

    it('failure (AuthError network): notifyError called with retry option', async () => {
      const err = new AuthError('auth/network-request-failed', 'Network error')
      mockLoginUser.mockRejectedValue(err)

      const { signIn } = useAuthUseCases()

      await expect(signIn('test@test.cz', '123456')).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('Network error', expect.objectContaining({ retry: true, onRetry: expect.any(Function) }))
    })

    it('failure (generic Error): calls notifyError with errors.unexpected, re-throws', async () => {
      const err = new Error('Something went wrong')
      mockLoginUser.mockRejectedValue(err)

      const { signIn } = useAuthUseCases()

      await expect(signIn('test@test.cz', '123456')).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ─── signUp ───────────────────────────────────────────────────────────────

  describe('signUp', () => {
    it('success: registerUser resolves → authStore.user set, loading false', async () => {
      const mockUser = createMockUser()
      mockRegisterUser.mockResolvedValue(mockUser)

      const { signUp } = useAuthUseCases()
      const authStore = useAuthStore()

      const result = await signUp('test@test.cz', '123456', 'Test User')

      expect(result).toStrictEqual(mockUser)
      expect(authStore.user).toStrictEqual(mockUser)
      expect(authStore.isLoading).toBe(false)
    })

    it('failure: registerUser rejects with AuthError → user null, notifyError called, re-throws', async () => {
      const err = new AuthError('auth/email-already-in-use', 'Email already in use')
      mockRegisterUser.mockRejectedValue(err)

      const { signUp } = useAuthUseCases()
      const authStore = useAuthStore()

      await expect(signUp('test@test.cz', '123456')).rejects.toThrow(AuthError)

      expect(authStore.user).toBeNull()
      expect(authStore.isLoading).toBe(false)
      expect(mockNotifyError).toHaveBeenCalledWith('Email already in use', expect.objectContaining({ retry: false }))
    })

    it('failure (generic Error): notifyError called with errors.unexpected', async () => {
      const err = new Error('Unknown registration error')
      mockRegisterUser.mockRejectedValue(err)

      const { signUp } = useAuthUseCases()

      await expect(signUp('test@test.cz', '123456')).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ─── signOut ──────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('success: logoutUser resolves → authStore.user null, teamStore cleared', async () => {
      mockLogoutUser.mockResolvedValue(undefined)

      const authStore = useAuthStore()
      authStore.setUser(createMockUser() as any)
      const teamStore = useTeamStore()

      const { signOut } = useAuthUseCases()
      await signOut()

      expect(authStore.user).toBeNull()
      expect(teamStore.teams).toHaveLength(0)
    })

    it('failure: logoutUser rejects with AuthError → notifyError called, error re-thrown', async () => {
      const err = new AuthError('auth/network-request-failed', 'Network error')
      mockLogoutUser.mockRejectedValue(err)

      const { signOut } = useAuthUseCases()

      await expect(signOut()).rejects.toThrow(AuthError)

      expect(mockNotifyError).toHaveBeenCalledWith('Network error', expect.objectContaining({ retry: true, onRetry: expect.any(Function) }))
    })

    it('failure (generic Error): notifyError called with errors.unexpected', async () => {
      const err = new Error('Unexpected logout failure')
      mockLogoutUser.mockRejectedValue(err)

      const { signOut } = useAuthUseCases()

      await expect(signOut()).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ─── initializeAuth ───────────────────────────────────────────────────────

  describe('initializeAuth', () => {
    it('with null user: authStore.isAuthReady set true, no team listener setup', async () => {
      mockAuthStateReady.mockResolvedValue(null)

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()

      await initializeAuth()

      expect(authStore.isAuthReady).toBe(true)
      expect(authStore.user).toBeNull()
      expect(mockSetTeamListener).not.toHaveBeenCalled()
    })

    it('with user: authStore.user set, isAuthReady true after call', async () => {
      const mockUser = createMockUser()
      mockAuthStateReady.mockResolvedValue(mockUser)

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()

      await initializeAuth()

      expect(authStore.user).toStrictEqual(mockUser)
      expect(authStore.isAuthReady).toBe(true)
    })

    it('with admin user: authStore.isAdmin true when admin claim present', async () => {
      const mockUser = createMockUser({
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: true } })
      })
      mockAuthStateReady.mockResolvedValue(mockUser)

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()

      await initializeAuth()

      expect(authStore.isAdmin).toBe(true)
    })

    it('with non-admin user: authStore.isAdmin remains false', async () => {
      const mockUser = createMockUser({
        getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} })
      })
      mockAuthStateReady.mockResolvedValue(mockUser)

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()

      await initializeAuth()

      expect(authStore.isAdmin).toBe(false)
    })

    it('auth listener registered: listenerRegistry.register called with "auth"', async () => {
      mockAuthStateReady.mockResolvedValue(null)

      const { initializeAuth } = useAuthUseCases()

      await initializeAuth()

      expect(listenerRegistry.register).toHaveBeenCalledWith('auth', expect.any(Function))
    })

    it('authStateListener is called once during initializeAuth', async () => {
      mockAuthStateReady.mockResolvedValue(null)

      const { initializeAuth } = useAuthUseCases()

      await initializeAuth()

      expect(mockAuthStateListener).toHaveBeenCalledTimes(1)
    })
  })

  // ─── session persistence (page reload) ────────────────────────────────────

  describe('session persistence on page reload', () => {
    it('auth listener callback fires with user → authStore.user set and setTeamListener called', async () => {
      mockAuthStateReady.mockResolvedValue(null)
      mockSetTeamListener.mockResolvedValue(undefined)

      let capturedCallback: ((user: any) => Promise<void>) | null = null
      mockAuthStateListener.mockImplementation((callback: (user: any) => Promise<void>) => {
        capturedCallback = callback
        return vi.fn()
      })

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()

      await initializeAuth()

      const mockUser = createMockUser()
      await capturedCallback!(mockUser)

      expect(authStore.user).toStrictEqual(mockUser)
      expect(mockSetTeamListener).toHaveBeenCalledWith('test-uid')
    })

    it('auth listener callback fires with null → user cleared, router.push called', async () => {
      mockAuthStateReady.mockResolvedValue(null)

      let capturedCallback: ((user: any) => Promise<void>) | null = null
      mockAuthStateListener.mockImplementation((callback: (user: any) => Promise<void>) => {
        capturedCallback = callback
        return vi.fn()
      })

      const { initializeAuth } = useAuthUseCases()
      const authStore = useAuthStore()
      authStore.setUser(createMockUser() as any)

      await initializeAuth()
      await capturedCallback!(null)

      expect(authStore.user).toBeNull()
      expect(mockPush).toHaveBeenCalled()
    })

    it('auth listener callback with null → listenerRegistry.unregisterAll called', async () => {
      mockAuthStateReady.mockResolvedValue(null)

      let capturedCallback: ((user: any) => Promise<void>) | null = null
      mockAuthStateListener.mockImplementation((callback: (user: any) => Promise<void>) => {
        capturedCallback = callback
        return vi.fn()
      })

      const { initializeAuth } = useAuthUseCases()

      await initializeAuth()
      await capturedCallback!(null)

      expect(listenerRegistry.unregisterAll).toHaveBeenCalled()
    })
  })

  // ─── refreshCurrentUser ───────────────────────────────────────────────────

  describe('refreshCurrentUser', () => {
    it('success: refreshUser resolves with user → authStore.user updated', async () => {
      const mockUser = createMockUser()
      mockRefreshUser.mockResolvedValue(mockUser)

      const { refreshCurrentUser } = useAuthUseCases()
      const authStore = useAuthStore()

      await refreshCurrentUser()

      expect(authStore.user).toStrictEqual(mockUser)
    })

    it('failure (AuthError): notifyError called, error re-thrown', async () => {
      const err = new AuthError('auth/user-token-expired', 'Token expired')
      mockRefreshUser.mockRejectedValue(err)

      const { refreshCurrentUser } = useAuthUseCases()

      await expect(refreshCurrentUser()).rejects.toThrow(AuthError)

      expect(mockNotifyError).toHaveBeenCalledWith('Token expired', expect.any(Object))
    })

    it('failure (generic Error): notifyError called with errors.unexpected', async () => {
      const err = new Error('Unexpected refresh error')
      mockRefreshUser.mockRejectedValue(err)

      const { refreshCurrentUser } = useAuthUseCases()

      await expect(refreshCurrentUser()).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('errors.unexpected')
    })

    it('failure (network AuthError): notifyError called with retry option', async () => {
      const err = new AuthError('auth/network-request-failed', 'Network error')
      mockRefreshUser.mockRejectedValue(err)

      const { refreshCurrentUser } = useAuthUseCases()

      await expect(refreshCurrentUser()).rejects.toThrow()

      expect(mockNotifyError).toHaveBeenCalledWith('Network error', expect.objectContaining({ retry: true, onRetry: expect.any(Function) }))
    })
  })
})

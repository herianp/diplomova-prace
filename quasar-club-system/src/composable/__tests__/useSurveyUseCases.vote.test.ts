import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { FirestoreError } from '@/errors'

// ============================================================
// Mocks
// ============================================================

vi.mock('@/firebase/config', () => ({ db: {}, auth: {}, analytics: {}, perf: {} }))

vi.mock('@/services/notificationService', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn()
}))

vi.mock('src/utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

vi.mock('@/services/listenerRegistry', () => ({
  listenerRegistry: { register: vi.fn(), unregister: vi.fn(), unregisterAll: vi.fn() }
}))

const mockAddOrUpdateVote = vi.fn()
const mockGetSurveysByTeamId = vi.fn()

vi.mock('@/services/surveyFirebase', () => ({
  useSurveyFirebase: () => ({
    addOrUpdateVote: mockAddOrUpdateVote,
    getSurveysByTeamId: mockGetSurveysByTeamId,
    getSurveyById: vi.fn(),
    addSurvey: vi.fn(),
    updateSurvey: vi.fn(),
    deleteSurvey: vi.fn(),
    updateSurveyStatus: vi.fn(),
    verifySurvey: vi.fn(),
    updateSurveyVotes: vi.fn()
  })
}))

vi.mock('@/composable/useNotificationsComposable', () => ({
  useNotifications: () => ({ createSurveyNotification: vi.fn() })
}))

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn()
}))

// ============================================================
// Imports (after mocks)
// ============================================================

import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { useTeamStore } from '@/stores/teamStore'
import { notifyError } from '@/services/notificationService'
import { SurveyTypes } from '@/enums/SurveyTypes'
import { SurveyStatus } from '@/interfaces/interfaces'

// ============================================================
// Helpers
// ============================================================

const makeSurvey = (overrides = {}) => ({
  id: 'survey-1',
  title: 'Training Wednesday',
  teamId: 't1',
  date: '2026-02-18',
  dateTime: new Date('2026-02-18T18:00:00'),
  description: 'Wednesday training',
  time: '18:00',
  type: SurveyTypes.Training,
  votes: [],
  status: SurveyStatus.ACTIVE,
  ...overrides
})

// ============================================================
// TST-04: voteOnSurvey
// ============================================================

describe('useSurveyUseCases - voteOnSurvey (TST-04)', () => {
  let teamStore: ReturnType<typeof useTeamStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    teamStore = useTeamStore()
    vi.clearAllMocks()
    mockAddOrUpdateVote.mockResolvedValue(undefined)
  })

  // ------------------------------------------------------------------
  // New vote (survey exists, no prior votes)
  // ------------------------------------------------------------------
  it('calls addOrUpdateVote with correct args when survey exists and user has not voted', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])

    const { voteOnSurvey } = useSurveyUseCases()
    await voteOnSurvey('survey-1', 'user-1', true)

    expect(mockAddOrUpdateVote).toHaveBeenCalledOnce()
    expect(mockAddOrUpdateVote).toHaveBeenCalledWith('survey-1', 'user-1', true, [])
  })

  // ------------------------------------------------------------------
  // Update vote (user already voted, changing from false to true)
  // ------------------------------------------------------------------
  it('calls addOrUpdateVote with existing votes array when user updates their vote', async () => {
    const existingVotes = [{ userUid: 'user-1', vote: false }]
    const survey = makeSurvey({ votes: existingVotes })
    teamStore.setSurveys([survey])

    const { voteOnSurvey } = useSurveyUseCases()
    await voteOnSurvey('survey-1', 'user-1', true)

    expect(mockAddOrUpdateVote).toHaveBeenCalledOnce()
    expect(mockAddOrUpdateVote).toHaveBeenCalledWith('survey-1', 'user-1', true, existingVotes)
  })

  // ------------------------------------------------------------------
  // Survey not in store
  // ------------------------------------------------------------------
  it('does not call addOrUpdateVote when survey is not found in store', async () => {
    teamStore.setSurveys([])

    const { voteOnSurvey } = useSurveyUseCases()
    await voteOnSurvey('nonexistent', 'user-1', true)

    expect(mockAddOrUpdateVote).not.toHaveBeenCalled()
  })

  // ------------------------------------------------------------------
  // Firebase error — transient (unavailable) → retry option
  // ------------------------------------------------------------------
  it('calls notifyError with retry:true for transient FirestoreError (unavailable)', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    mockAddOrUpdateVote.mockRejectedValueOnce(
      new FirestoreError('unavailable', 'write', 'Service unavailable')
    )

    const { voteOnSurvey } = useSurveyUseCases()

    await expect(voteOnSurvey('survey-1', 'user-1', true)).rejects.toThrow('Service unavailable')
    expect(notifyError).toHaveBeenCalledOnce()
    expect(notifyError).toHaveBeenCalledWith(
      'Service unavailable',
      { retry: true, onRetry: expect.any(Function) }
    )
  })

  // ------------------------------------------------------------------
  // Firebase error — transient (deadline-exceeded) → retry option
  // ------------------------------------------------------------------
  it('calls notifyError with retry:true for transient FirestoreError (deadline-exceeded)', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    mockAddOrUpdateVote.mockRejectedValueOnce(
      new FirestoreError('deadline-exceeded', 'write', 'Deadline exceeded')
    )

    const { voteOnSurvey } = useSurveyUseCases()

    await expect(voteOnSurvey('survey-1', 'user-1', true)).rejects.toThrow('Deadline exceeded')
    expect(notifyError).toHaveBeenCalledWith(
      'Deadline exceeded',
      { retry: true, onRetry: expect.any(Function) }
    )
  })

  // ------------------------------------------------------------------
  // Firebase error — permanent (permission-denied) → no retry
  // ------------------------------------------------------------------
  it('calls notifyError WITHOUT retry option for permanent FirestoreError (permission-denied)', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    mockAddOrUpdateVote.mockRejectedValueOnce(
      new FirestoreError('permission-denied', 'write', 'Permission denied')
    )

    const { voteOnSurvey } = useSurveyUseCases()

    await expect(voteOnSurvey('survey-1', 'user-1', true)).rejects.toThrow('Permission denied')
    expect(notifyError).toHaveBeenCalledWith(
      'Permission denied',
      { retry: false, onRetry: undefined }
    )
  })

  // ------------------------------------------------------------------
  // Firebase error — generic Error
  // ------------------------------------------------------------------
  it('calls notifyError with errors.unexpected for generic (non-FirestoreError) errors', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    mockAddOrUpdateVote.mockRejectedValueOnce(new Error('unknown network failure'))

    const { voteOnSurvey } = useSurveyUseCases()

    await expect(voteOnSurvey('survey-1', 'user-1', true)).rejects.toThrow('unknown network failure')
    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })

  // ------------------------------------------------------------------
  // Error is re-thrown
  // ------------------------------------------------------------------
  it('re-throws error after notifyError so callers can handle it', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    const originalError = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockAddOrUpdateVote.mockRejectedValueOnce(originalError)

    const { voteOnSurvey } = useSurveyUseCases()

    await expect(voteOnSurvey('survey-1', 'user-1', true)).rejects.toBe(originalError)
  })

  // ------------------------------------------------------------------
  // Multiple surveys in store — finds correct one
  // ------------------------------------------------------------------
  it('finds the correct survey when multiple surveys are in the store', async () => {
    const survey1 = makeSurvey({ id: 'survey-1', votes: [{ userUid: 'user-2', vote: true }] })
    const survey2 = makeSurvey({ id: 'survey-2', votes: [] })
    teamStore.setSurveys([survey1, survey2])

    const { voteOnSurvey } = useSurveyUseCases()
    await voteOnSurvey('survey-2', 'user-1', false)

    expect(mockAddOrUpdateVote).toHaveBeenCalledWith('survey-2', 'user-1', false, [])
  })
})

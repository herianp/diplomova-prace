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
const mockAddSurvey = vi.fn()
const mockUpdateSurvey = vi.fn()
const mockDeleteSurvey = vi.fn()
const mockUpdateSurveyStatus = vi.fn()
const mockVerifySurvey = vi.fn()
const mockUpdateSurveyVotes = vi.fn()
const mockGetSurveyById = vi.fn()

vi.mock('@/services/surveyFirebase', () => ({
  useSurveyFirebase: () => ({
    addOrUpdateVote: mockAddOrUpdateVote,
    getSurveysByTeamId: mockGetSurveysByTeamId,
    getSurveyById: mockGetSurveyById,
    addSurvey: mockAddSurvey,
    updateSurvey: mockUpdateSurvey,
    deleteSurvey: mockDeleteSurvey,
    updateSurveyStatus: mockUpdateSurveyStatus,
    verifySurvey: mockVerifySurvey,
    updateSurveyVotes: mockUpdateSurveyVotes
  })
}))

const { mockCreateSurveyNotification } = vi.hoisted(() => ({
  mockCreateSurveyNotification: vi.fn()
}))

vi.mock('@/composable/useNotificationsComposable', () => ({
  useNotifications: () => ({ createSurveyNotification: mockCreateSurveyNotification })
}))

const { mockGetDoc, mockDoc } = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockDoc: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  getDoc: mockGetDoc,
  doc: mockDoc
}))

// ============================================================
// Imports (after mocks)
// ============================================================

import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { notifyError } from '@/services/notificationService'
import { listenerRegistry } from '@/services/listenerRegistry'
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

const makeUser = (overrides = {}) => ({
  uid: 'user-uid-1',
  email: 'user@test.cz',
  displayName: 'Test User',
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

  // ------------------------------------------------------------------
  // Concurrent vote test (ROADMAP success criterion 2)
  // ------------------------------------------------------------------
  it('handles concurrent votes on same survey without data loss', async () => {
    const survey = makeSurvey({ votes: [] })
    teamStore.setSurveys([survey])
    mockAddOrUpdateVote.mockResolvedValue(undefined)

    const { voteOnSurvey } = useSurveyUseCases()
    await Promise.all([
      voteOnSurvey('survey-1', 'user-1', true),
      voteOnSurvey('survey-1', 'user-2', false)
    ])

    expect(mockAddOrUpdateVote).toHaveBeenCalledTimes(2)
    expect(mockAddOrUpdateVote).toHaveBeenCalledWith('survey-1', 'user-1', true, [])
    expect(mockAddOrUpdateVote).toHaveBeenCalledWith('survey-1', 'user-2', false, [])
  })
})

// ============================================================
// setSurveysListener
// ============================================================

describe('useSurveyUseCases - setSurveysListener', () => {
  let teamStore: ReturnType<typeof useTeamStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    teamStore = useTeamStore()
    vi.clearAllMocks()
  })

  it('calls getSurveysByTeamId with teamId and callback, registers listener with registry', () => {
    const mockUnsubscribe = vi.fn()
    mockGetSurveysByTeamId.mockReturnValue(mockUnsubscribe)

    const { setSurveysListener } = useSurveyUseCases()
    setSurveysListener('team-1')

    expect(mockGetSurveysByTeamId).toHaveBeenCalledWith('team-1', expect.any(Function))
    expect(listenerRegistry.register).toHaveBeenCalledWith('surveys', mockUnsubscribe, { teamId: 'team-1' })
  })

  it('callback from getSurveysByTeamId updates teamStore surveys', () => {
    let capturedCallback: ((surveys: any[]) => void) | null = null
    mockGetSurveysByTeamId.mockImplementation((_teamId: string, cb: (surveys: any[]) => void) => {
      capturedCallback = cb
      return vi.fn()
    })

    const { setSurveysListener } = useSurveyUseCases()
    setSurveysListener('team-1')

    const surveys = [makeSurvey({ id: 'survey-1' })]
    capturedCallback!(surveys)

    expect(teamStore.surveys).toEqual(surveys)
  })
})

// ============================================================
// getSurveyById
// ============================================================

describe('useSurveyUseCases - getSurveyById', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('returns the survey from firebase when found', async () => {
    const survey = makeSurvey({ id: 's1' })
    mockGetSurveyById.mockResolvedValue(survey)

    const { getSurveyById } = useSurveyUseCases()
    const result = await getSurveyById('s1')

    expect(mockGetSurveyById).toHaveBeenCalledWith('s1')
    expect(result).toEqual(survey)
  })
})

// ============================================================
// deleteSurvey
// ============================================================

describe('useSurveyUseCases - deleteSurvey', () => {
  let teamStore: ReturnType<typeof useTeamStore>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    teamStore = useTeamStore()
    authStore = useAuthStore()
    vi.clearAllMocks()
    mockDeleteSurvey.mockResolvedValue(undefined)
  })

  it('success with user: calls deleteSurvey with surveyId and auditContext containing actor info', async () => {
    const survey = makeSurvey({ id: 'survey-1', title: 'Training Wednesday', teamId: 't1' })
    teamStore.setSurveys([survey])
    authStore.setUser(makeUser({ uid: 'user-uid-1', displayName: 'Test User' }) as any)

    const { deleteSurvey } = useSurveyUseCases()
    await deleteSurvey('survey-1')

    expect(mockDeleteSurvey).toHaveBeenCalledWith(
      'survey-1',
      expect.objectContaining({
        actorUid: 'user-uid-1',
        actorDisplayName: 'Test User',
        surveyTitle: 'Training Wednesday'
      })
    )
  })

  it('success without user: calls deleteSurvey with (surveyId, undefined)', async () => {
    const survey = makeSurvey({ id: 'survey-1' })
    teamStore.setSurveys([survey])
    authStore.setUser(null)

    const { deleteSurvey } = useSurveyUseCases()
    await deleteSurvey('survey-1')

    expect(mockDeleteSurvey).toHaveBeenCalledWith('survey-1', undefined)
  })

  it('FirestoreError: calls notifyError WITHOUT retry (destructive op), re-throws', async () => {
    const survey = makeSurvey({ id: 'survey-1' })
    teamStore.setSurveys([survey])
    const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockDeleteSurvey.mockRejectedValueOnce(err)

    const { deleteSurvey } = useSurveyUseCases()
    await expect(deleteSurvey('survey-1')).rejects.toBe(err)

    // Destructive operations: no retry option
    expect(notifyError).toHaveBeenCalledWith('Service unavailable')
    expect(notifyError).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ retry: true }))
  })

  it('generic error: calls notifyError with errors.unexpected, re-throws', async () => {
    const survey = makeSurvey({ id: 'survey-1' })
    teamStore.setSurveys([survey])
    const err = new Error('Unexpected error')
    mockDeleteSurvey.mockRejectedValueOnce(err)

    const { deleteSurvey } = useSurveyUseCases()
    await expect(deleteSurvey('survey-1')).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })
})

// ============================================================
// addSurvey
// ============================================================

describe('useSurveyUseCases - addSurvey', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockDoc.mockReturnValue({ id: 'team-ref' })
  })

  it('success with team members: calls addSurvey with members and creates notification', async () => {
    const newSurvey = makeSurvey({ teamId: 'team-1' })
    const surveyData = makeSurvey({ id: 'new-survey-id' })
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ members: ['u1', 'u2'] })
    })
    mockAddSurvey.mockResolvedValue(surveyData)
    mockCreateSurveyNotification.mockResolvedValue(undefined)

    const { addSurvey } = useSurveyUseCases()
    await addSurvey(newSurvey)

    expect(mockAddSurvey).toHaveBeenCalledWith(newSurvey, ['u1', 'u2'])
    expect(mockCreateSurveyNotification).toHaveBeenCalledWith(surveyData, ['u1', 'u2'])
  })

  it('success with no members: createSurveyNotification is NOT called', async () => {
    const newSurvey = makeSurvey({ teamId: 'team-1' })
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({})
    })
    mockAddSurvey.mockResolvedValue(makeSurvey())

    const { addSurvey } = useSurveyUseCases()
    await addSurvey(newSurvey)

    expect(mockAddSurvey).toHaveBeenCalledWith(newSurvey, [])
    expect(mockCreateSurveyNotification).not.toHaveBeenCalled()
  })

  it("success when team doc doesn't exist: calls addSurvey with empty members array", async () => {
    const newSurvey = makeSurvey({ teamId: 'team-1' })
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined
    })
    mockAddSurvey.mockResolvedValue(makeSurvey())

    const { addSurvey } = useSurveyUseCases()
    await addSurvey(newSurvey)

    expect(mockAddSurvey).toHaveBeenCalledWith(newSurvey, [])
    expect(mockCreateSurveyNotification).not.toHaveBeenCalled()
  })

  it('FirestoreError (transient unavailable): notifyError called with retry:true, re-throws', async () => {
    const newSurvey = makeSurvey({ teamId: 'team-1' })
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ members: [] }) })
    const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockAddSurvey.mockRejectedValueOnce(err)

    const { addSurvey } = useSurveyUseCases()
    await expect(addSurvey(newSurvey)).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith(
      'Service unavailable',
      expect.objectContaining({ retry: true, onRetry: expect.any(Function) })
    )
  })
})

// ============================================================
// updateSurvey
// ============================================================

describe('useSurveyUseCases - updateSurvey', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUpdateSurvey.mockResolvedValue(undefined)
  })

  it('success: calls updateSurvey with surveyId and partial data', async () => {
    const partial = { title: 'Updated Title' }
    const { updateSurvey } = useSurveyUseCases()
    await updateSurvey('survey-1', partial)

    expect(mockUpdateSurvey).toHaveBeenCalledWith('survey-1', partial)
  })

  it('FirestoreError (transient): notifyError with retry:true, re-throws', async () => {
    const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockUpdateSurvey.mockRejectedValueOnce(err)

    const { updateSurvey } = useSurveyUseCases()
    await expect(updateSurvey('survey-1', {})).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith(
      'Service unavailable',
      expect.objectContaining({ retry: true, onRetry: expect.any(Function) })
    )
  })

  it('generic error: notifyError with errors.unexpected, re-throws', async () => {
    const err = new Error('Network failure')
    mockUpdateSurvey.mockRejectedValueOnce(err)

    const { updateSurvey } = useSurveyUseCases()
    await expect(updateSurvey('survey-1', {})).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })
})

// ============================================================
// updateSurveyStatus
// ============================================================

describe('useSurveyUseCases - updateSurveyStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUpdateSurveyStatus.mockResolvedValue(undefined)
  })

  it('success: calls updateSurveyStatus with surveyId, status, and verifiedBy', async () => {
    const { updateSurveyStatus } = useSurveyUseCases()
    await updateSurveyStatus('survey-1', SurveyStatus.ACTIVE, 'user-uid')

    expect(mockUpdateSurveyStatus).toHaveBeenCalledWith('survey-1', SurveyStatus.ACTIVE, 'user-uid')
  })

  it('FirestoreError (transient): notifyError with retry:true, re-throws', async () => {
    const err = new FirestoreError('deadline-exceeded', 'write', 'Deadline exceeded')
    mockUpdateSurveyStatus.mockRejectedValueOnce(err)

    const { updateSurveyStatus } = useSurveyUseCases()
    await expect(updateSurveyStatus('survey-1', SurveyStatus.ACTIVE)).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith(
      'Deadline exceeded',
      expect.objectContaining({ retry: true, onRetry: expect.any(Function) })
    )
  })

  it('generic error: notifyError with errors.unexpected, re-throws', async () => {
    const err = new Error('Unknown error')
    mockUpdateSurveyStatus.mockRejectedValueOnce(err)

    const { updateSurveyStatus } = useSurveyUseCases()
    await expect(updateSurveyStatus('survey-1', SurveyStatus.ACTIVE)).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })
})

// ============================================================
// verifySurvey
// ============================================================

describe('useSurveyUseCases - verifySurvey', () => {
  let teamStore: ReturnType<typeof useTeamStore>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    teamStore = useTeamStore()
    authStore = useAuthStore()
    vi.clearAllMocks()
    mockVerifySurvey.mockResolvedValue(undefined)
  })

  it('success with user and survey in store: calls verifySurvey with auditContext', async () => {
    const survey = makeSurvey({ id: 'survey-1', teamId: 't1' })
    teamStore.setSurveys([survey])
    authStore.setUser(makeUser({ uid: 'user-uid-1', displayName: 'Verifier' }) as any)

    const updatedVotes = [{ userUid: 'user-1', vote: true }]
    const { verifySurvey } = useSurveyUseCases()
    await verifySurvey('survey-1', 'user-uid-1', updatedVotes)

    expect(mockVerifySurvey).toHaveBeenCalledWith(
      'survey-1',
      'user-uid-1',
      updatedVotes,
      expect.objectContaining({ actorDisplayName: 'Verifier', teamId: 't1' })
    )
  })

  it('success without user: auditContext is undefined', async () => {
    authStore.setUser(null)

    const { verifySurvey } = useSurveyUseCases()
    await verifySurvey('survey-1', 'user-uid-1', [])

    expect(mockVerifySurvey).toHaveBeenCalledWith('survey-1', 'user-uid-1', [], undefined)
  })

  it('FirestoreError (transient): notifyError with retry:true, re-throws', async () => {
    const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockVerifySurvey.mockRejectedValueOnce(err)

    const { verifySurvey } = useSurveyUseCases()
    await expect(verifySurvey('survey-1', 'user-uid-1', [])).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith(
      'Service unavailable',
      expect.objectContaining({ retry: true, onRetry: expect.any(Function) })
    )
  })

  it('generic error: notifyError with errors.unexpected, re-throws', async () => {
    const err = new Error('Unknown error')
    mockVerifySurvey.mockRejectedValueOnce(err)

    const { verifySurvey } = useSurveyUseCases()
    await expect(verifySurvey('survey-1', 'user-uid-1', [])).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })
})

// ============================================================
// updateSurveyVotes
// ============================================================

describe('useSurveyUseCases - updateSurveyVotes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUpdateSurveyVotes.mockResolvedValue(undefined)
  })

  it('success: calls updateSurveyVotes with surveyId and votes', async () => {
    const votes = [{ userUid: 'user-1', vote: true }]
    const { updateSurveyVotes } = useSurveyUseCases()
    await updateSurveyVotes('survey-1', votes)

    expect(mockUpdateSurveyVotes).toHaveBeenCalledWith('survey-1', votes)
  })

  it('FirestoreError (transient): notifyError with retry:true, re-throws', async () => {
    const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
    mockUpdateSurveyVotes.mockRejectedValueOnce(err)

    const votes = [{ userUid: 'user-1', vote: true }]
    const { updateSurveyVotes } = useSurveyUseCases()
    await expect(updateSurveyVotes('survey-1', votes)).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith(
      'Service unavailable',
      expect.objectContaining({ retry: true, onRetry: expect.any(Function) })
    )
  })

  it('generic error: notifyError with errors.unexpected, re-throws', async () => {
    const err = new Error('Unexpected error')
    mockUpdateSurveyVotes.mockRejectedValueOnce(err)

    const votes = [{ userUid: 'user-1', vote: true }]
    const { updateSurveyVotes } = useSurveyUseCases()
    await expect(updateSurveyVotes('survey-1', votes)).rejects.toBe(err)

    expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
  })
})

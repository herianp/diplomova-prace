import { describe, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createTestEnv } from './helpers/setup'

let testEnv: RulesTestEnvironment

const TEAM_ID = 'team-001'
const POWER_UID = 'power-uid'
const MEMBER_UID = 'member-uid'
const OUTSIDER_UID = 'outsider-uid'
const SURVEY_ID = 'survey-001'

const TEAM_DATA = {
  name: 'FC Test',
  creator: POWER_UID,
  members: [POWER_UID, MEMBER_UID],
  powerusers: [POWER_UID],
}

const SURVEY_DATA = {
  teamId: TEAM_ID,
  title: 'Match vs Sparta',
  date: '2026-03-01',
  votes: {},
}

beforeAll(async () => {
  testEnv = await createTestEnv()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

// ─── surveys - read ──────────────────────────────────────────────────────────

describe('surveys/{surveyId} - read', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
    })
  })

  it('allows power user to read survey', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('allows team member to read survey', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('denies outsider read of survey', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('denies unauthenticated read of survey', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('allows app admin to read survey', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })
})

// ─── surveys - create ────────────────────────────────────────────────────────

describe('surveys/{surveyId} - create', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows power user to create survey', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `surveys/new-survey`), {
        teamId: TEAM_ID,
        title: 'New Match',
        date: '2026-04-01',
        votes: {},
      })
    )
  })

  it('denies member (non-power) from creating survey', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `surveys/member-survey`), {
        teamId: TEAM_ID,
        title: 'Unauthorized Survey',
        date: '2026-04-01',
        votes: {},
      })
    )
  })
})

// ─── surveys - update ────────────────────────────────────────────────────────

describe('surveys/{surveyId} - update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
    })
  })

  it('allows power user to update survey (any field)', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), { title: 'Updated Title' })
    )
  })

  it('allows member to update votes field', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    // Use updateDoc so Firestore rules evaluate this as 'update' (not 'create')
    // The rule allows member update when request.resource.data.votes != null
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), {
        votes: { [MEMBER_UID]: 'yes' },
      })
    )
  })

  it('denies outsider update of survey', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), { title: 'Hacked' })
    )
  })
})

// ─── surveys - delete ────────────────────────────────────────────────────────

describe('surveys/{surveyId} - delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
    })
  })

  it('allows power user to delete survey', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('allows app admin to delete survey', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })

  it('denies member (non-power) from deleting survey', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`)))
  })
})

// ─── surveys/votes subcollection - read ──────────────────────────────────────

describe('surveys/{surveyId}/votes/{voteId} - read', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    })
  })

  it('allows team member to read votes', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`))
    )
  })

  it('denies outsider read of votes', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      getDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`))
    )
  })
})

// ─── surveys/votes subcollection - create/update ─────────────────────────────

describe('surveys/{surveyId}/votes/{voteId} - create/update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
    })
  })

  it('allows member to create own vote (voteId == auth.uid)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    )
  })

  it('allows member to update own vote', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    })
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'no',
        votedAt: '2026-03-01T11:00:00Z',
      })
    )
  })

  it('denies member from creating vote with different voteId (voteId != auth.uid)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    // Try to create a vote document with a different voteId (OUTSIDER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${OUTSIDER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    )
  })

  it('allows power user to create/update any vote', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    // Power user can write a vote with any voteId
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    )
  })
})

// ─── surveys/votes subcollection - delete ────────────────────────────────────

describe('surveys/{surveyId}/votes/{voteId} - delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}`), SURVEY_DATA)
      await setDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`), {
        vote: 'yes',
        votedAt: '2026-03-01T10:00:00Z',
      })
    })
  })

  it('allows power user to delete vote', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`))
    )
  })

  it('allows app admin to delete vote', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(
      deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`))
    )
  })

  it('denies member from deleting own vote (no delete rule for members)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(
      deleteDoc(doc(ctx.firestore(), `surveys/${SURVEY_ID}/votes/${MEMBER_UID}`))
    )
  })
})

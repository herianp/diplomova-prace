import { describe, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createTestEnv } from './helpers/setup'

let testEnv: RulesTestEnvironment

const TEAM_ID = 'team-001'
const CREATOR_UID = 'creator-uid'
const POWER_UID = 'power-uid'
const MEMBER_UID = 'member-uid'
const OUTSIDER_UID = 'outsider-uid'

const TEAM_DATA = {
  name: 'FC Test',
  creator: CREATOR_UID,
  members: [CREATOR_UID, POWER_UID, MEMBER_UID],
  powerusers: [CREATOR_UID, POWER_UID],
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

// ─── cashboxTransactions: member read+write, admin read/delete ────────────────

describe('teams/{teamId}/cashboxTransactions - Pattern A (member read+write)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`), {
        amount: 100,
        description: 'Test transaction',
        createdAt: '2026-03-01T10:00:00Z',
      })
    })
  })

  it('allows member to read cashboxTransaction', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`))
    )
  })

  it('denies outsider read of cashboxTransaction', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`))
    )
  })

  it('denies unauthenticated read of cashboxTransaction', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`))
    )
  })

  it('allows member to write cashboxTransaction', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-new`), {
        amount: 200,
        description: 'New transaction',
        createdAt: '2026-03-02T10:00:00Z',
      })
    )
  })

  it('allows admin to read cashboxTransaction', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`))
    )
  })

  it('allows admin to delete cashboxTransaction', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(
      deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/cashboxTransactions/tx-001`))
    )
  })
})

// ─── Pattern B subcollections: member read, power user write ─────────────────
// Covers: fineRules, fines, payments, cashboxHistory

const patternBCollections = ['fineRules', 'fines', 'payments', 'cashboxHistory'] as const

for (const subcol of patternBCollections) {
  const docId = `${subcol}-001`

  describe(`teams/{teamId}/${subcol} - Pattern B (member read, power user write)`, () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
        await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`), {
          name: `Test ${subcol} item`,
          amount: 50,
          createdAt: '2026-03-01T10:00:00Z',
        })
      })
    })

    it(`allows member to read ${subcol}`, async () => {
      const ctx = testEnv.authenticatedContext(MEMBER_UID)
      await assertSucceeds(
        getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })

    it(`denies outsider read of ${subcol}`, async () => {
      const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
      await assertFails(
        getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })

    it(`denies unauthenticated read of ${subcol}`, async () => {
      const ctx = testEnv.unauthenticatedContext()
      await assertFails(
        getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })

    it(`allows power user to create ${subcol} item`, async () => {
      const ctx = testEnv.authenticatedContext(POWER_UID)
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/new-item`), {
          name: `New ${subcol} item`,
          amount: 75,
          createdAt: '2026-03-02T10:00:00Z',
        })
      )
    })

    it(`allows power user to update ${subcol} item`, async () => {
      const ctx = testEnv.authenticatedContext(POWER_UID)
      await assertSucceeds(
        updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`), {
          amount: 100,
        })
      )
    })

    it(`allows power user to delete ${subcol} item`, async () => {
      const ctx = testEnv.authenticatedContext(POWER_UID)
      await assertSucceeds(
        deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })

    it(`denies member (non-power) from writing ${subcol}`, async () => {
      const ctx = testEnv.authenticatedContext(MEMBER_UID)
      await assertFails(
        setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/member-item`), {
          name: 'Unauthorized item',
          amount: 30,
          createdAt: '2026-03-02T10:00:00Z',
        })
      )
    })

    it(`allows admin to read ${subcol} item`, async () => {
      const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
      await assertSucceeds(
        getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })

    it(`allows admin to delete ${subcol} item`, async () => {
      const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
      await assertSucceeds(
        deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/${subcol}/${docId}`))
      )
    })
  })
}

// ─── auditLogs: power user read, authenticated member create with validation ──

describe('teams/{teamId}/auditLogs - unique pattern (power read, validated create)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`), {
        teamId: TEAM_ID,
        actorUid: POWER_UID,
        action: 'CREATE_FINE',
        createdAt: '2026-03-01T10:00:00Z',
      })
    })
  })

  it('allows power user to read audit logs', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`))
    )
  })

  it('denies regular member from reading audit logs', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`))
    )
  })

  it('denies outsider from reading audit logs', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`))
    )
  })

  it('allows authenticated member to create audit log with matching teamId and actorUid', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-new`), {
        teamId: TEAM_ID,
        actorUid: MEMBER_UID,
        action: 'SOME_ACTION',
        createdAt: '2026-03-02T10:00:00Z',
      })
    )
  })

  it('denies create with mismatched actorUid (actorUid != auth.uid)', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-fake`), {
        teamId: TEAM_ID,
        actorUid: OUTSIDER_UID, // mismatched: not auth.uid
        action: 'FAKE_ACTION',
        createdAt: '2026-03-02T10:00:00Z',
      })
    )
  })

  it('denies create with mismatched teamId', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    // Parent teamId is TEAM_ID but data.teamId is different
    await assertFails(
      setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-wrong-team`), {
        teamId: 'wrong-team-id', // mismatched: doesn't match parent teamId
        actorUid: MEMBER_UID,
        action: 'SOME_ACTION',
        createdAt: '2026-03-02T10:00:00Z',
      })
    )
  })

  it('allows admin to read audit logs', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`))
    )
  })

  it('allows admin to delete audit logs', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(
      deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}/auditLogs/log-001`))
    )
  })
})

import { describe, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createTestEnv } from './helpers/setup'

let testEnv: RulesTestEnvironment

const TEAM_ID = 'team-001'
const POWER_UID = 'power-uid'
const INVITEE_UID = 'invitee-uid'
const OUTSIDER_UID = 'outsider-uid'

const TEAM_DATA = {
  name: 'FC Test',
  creator: POWER_UID,
  members: [POWER_UID],
  powerusers: [POWER_UID],
}

const INVITE_ID = 'invite-001'
const INVITE_DATA = {
  teamId: TEAM_ID,
  inviteeId: INVITEE_UID,
  status: 'pending',
  invitedBy: POWER_UID,
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

// ─── teamInvitations - create ─────────────────────────────────────────────────

describe('teamInvitations/{invitationId} - create', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows power user to create invitation (with valid teamId)', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        teamId: TEAM_ID,
        inviteeId: INVITEE_UID,
        status: 'pending',
        invitedBy: POWER_UID,
      })
    )
  })

  it('denies non-power-user from creating invitation', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `teamInvitations/invite-fake`), {
        teamId: TEAM_ID,
        inviteeId: OUTSIDER_UID,
        status: 'pending',
        invitedBy: OUTSIDER_UID,
      })
    )
  })
})

// ─── teamInvitations - read ───────────────────────────────────────────────────

describe('teamInvitations/{invitationId} - read', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), INVITE_DATA)
    })
  })

  it('allows invitee to read own invitation', async () => {
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })

  it('allows power user to read team invitation', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })

  it('denies outsider from reading invitation', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })
})

// ─── teamInvitations - update ─────────────────────────────────────────────────

describe('teamInvitations/{invitationId} - update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), INVITE_DATA)
    })
  })

  it('allows invitee to accept invitation (update status to accepted)', async () => {
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        status: 'accepted',
      })
    )
  })

  it('allows invitee to decline invitation (update status to declined)', async () => {
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        status: 'declined',
      })
    )
  })

  it('denies invitee from setting invalid status (e.g., cancelled)', async () => {
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        status: 'cancelled',
      })
    )
  })

  it('denies outsider from updating invitation', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        status: 'accepted',
      })
    )
  })

  it('denies update of already accepted invitation (status is not pending)', async () => {
    // Re-seed with status: 'accepted'
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        ...INVITE_DATA,
        status: 'accepted',
      })
    })
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), {
        status: 'declined',
      })
    )
  })
})

// ─── teamInvitations - delete ─────────────────────────────────────────────────

describe('teamInvitations/{invitationId} - delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`), INVITE_DATA)
    })
  })

  it('allows power user to delete (cancel) invitation', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })

  it('denies invitee from deleting invitation', async () => {
    const ctx = testEnv.authenticatedContext(INVITEE_UID)
    await assertFails(deleteDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })

  it('allows admin to delete invitation', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `teamInvitations/${INVITE_ID}`)))
  })
})

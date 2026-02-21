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

describe('teams/{teamId} - read', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows team member to read team', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('allows power user to read team', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('denies outsider read of team', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('denies unauthenticated read of team', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('allows app admin to read team', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(getDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })
})

describe('teams/{teamId} - write (member update)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows team member to update team', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    // Member write is allowed via read+write rule for members
    // This is a generic write (not join-via-update), using the member write rule
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), { name: 'FC Updated' })
    )
  })

  it('denies outsider write to team', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), { name: 'FC Hacked' })
    )
  })
})

describe('teams/{teamId} - create', () => {
  it('allows user to create team with self as creator/member/poweruser', async () => {
    const ctx = testEnv.authenticatedContext(CREATOR_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `teams/new-team`), {
        name: 'New Team',
        creator: CREATOR_UID,
        members: [CREATOR_UID],
        powerusers: [CREATOR_UID],
      })
    )
  })

  it('denies creating team without self as creator', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `teams/fake-team`), {
        name: 'Fake Team',
        creator: CREATOR_UID, // setting someone else as creator
        members: [OUTSIDER_UID, CREATOR_UID],
        powerusers: [CREATOR_UID],
      })
    )
  })

  it('denies creating team without self in members', async () => {
    const ctx = testEnv.authenticatedContext(CREATOR_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `teams/invalid-team`), {
        name: 'Invalid Team',
        creator: CREATOR_UID,
        members: [OUTSIDER_UID], // self not in members
        powerusers: [CREATOR_UID],
      })
    )
  })
})

describe('teams/{teamId} - delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows creator to delete team', async () => {
    const ctx = testEnv.authenticatedContext(CREATOR_UID)
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('allows app admin to delete team', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  // Note: The read+write rule grants full write access to any team member,
  // so members (even non-creator) can delete. The delete rule is an additional
  // grant for creator/admin. Outsiders cannot delete.
  it('denies outsider from deleting team', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })

  it('denies unauthenticated from deleting team', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(deleteDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`)))
  })
})

describe('teams/{teamId} - join via update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      // Seed team with only creator as member (no OUTSIDER_UID yet)
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID],
        powerusers: [CREATOR_UID],
      })
    })
  })

  it('allows user to add themselves to members array (accept invitation)', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID, OUTSIDER_UID], // adds self
        powerusers: [CREATOR_UID],
      })
    )
  })

  it('denies adding someone else to members array', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID, MEMBER_UID], // adds a different user, not self
        powerusers: [CREATOR_UID],
      })
    )
  })

  it('denies removing existing member during join', async () => {
    // First add an extra member
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID, POWER_UID],
        powerusers: [CREATOR_UID],
      })
    })

    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), {
        name: 'FC Test',
        creator: CREATOR_UID,
        members: [CREATOR_UID, OUTSIDER_UID], // removes POWER_UID and adds self
        powerusers: [CREATOR_UID],
      })
    )
  })
})

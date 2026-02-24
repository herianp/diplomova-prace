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

// ─── notifications - own access ───────────────────────────────────────────────

describe('notifications/{notificationId} - own access', () => {
  const NOTIF_ID = 'notif-001'
  const NOTIF_DATA = {
    userId: MEMBER_UID,
    teamId: TEAM_ID,
    message: 'Test notification',
  }

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`), NOTIF_DATA)
    })
  })

  it('allows owner to read own notification', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })

  it('allows owner to write own notification', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`), {
        ...NOTIF_DATA,
        message: 'Updated notification',
      })
    )
  })

  it('denies other user from reading notification', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })

  it('denies unauthenticated read of notification', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })
})

// ─── notifications - create ───────────────────────────────────────────────────

describe('notifications/{notificationId} - create', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows any authenticated user to create notification', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `notifications/new-notif`), {
        userId: MEMBER_UID,
        teamId: TEAM_ID,
        message: 'System notification',
      })
    )
  })
})

// ─── notifications - team creator/admin delete ────────────────────────────────

describe('notifications/{notificationId} - team creator/admin delete', () => {
  const NOTIF_ID = 'notif-delete-001'
  const NOTIF_DATA = {
    userId: MEMBER_UID,
    teamId: TEAM_ID,
    message: 'Notification to delete',
  }

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`), NOTIF_DATA)
    })
  })

  it('allows team creator to delete notification', async () => {
    const ctx = testEnv.authenticatedContext(CREATOR_UID)
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })

  it('allows admin to delete notification', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })

  it('denies member (non-creator) from deleting other user notification', async () => {
    // POWER_UID is a power user but not the team creator
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertFails(deleteDoc(doc(ctx.firestore(), `notifications/${NOTIF_ID}`)))
  })
})

// ─── messages - read ──────────────────────────────────────────────────────────

describe('messages/{messageId} - read', () => {
  const MSG_ID = 'msg-001'
  const MSG_DATA = {
    teamId: TEAM_ID,
    authorId: POWER_UID,
    text: 'Hello team!',
    createdAt: new Date().toISOString(),
  }

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `messages/${MSG_ID}`), MSG_DATA)
    })
  })

  it('allows team member to read message', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })

  it('denies outsider from reading message', async () => {
    const ctx = testEnv.authenticatedContext(OUTSIDER_UID)
    await assertFails(getDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })

  it('denies unauthenticated read of message', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })
})

// ─── messages - create ────────────────────────────────────────────────────────

describe('messages/{messageId} - create', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
    })
  })

  it('allows power user to create message with authorId == auth.uid', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `messages/msg-new`), {
        teamId: TEAM_ID,
        authorId: POWER_UID,
        text: 'New message',
        createdAt: new Date().toISOString(),
      })
    )
  })

  it('denies power user from creating message with authorId != auth.uid', async () => {
    const ctx = testEnv.authenticatedContext(POWER_UID)
    await assertFails(
      setDoc(doc(ctx.firestore(), `messages/msg-fake`), {
        teamId: TEAM_ID,
        authorId: MEMBER_UID, // mismatched: not auth.uid
        text: 'Impersonated message',
        createdAt: new Date().toISOString(),
      })
    )
  })

  it('allows regular member to create message with authorId == auth.uid', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `messages/msg-member`), {
        teamId: TEAM_ID,
        authorId: MEMBER_UID,
        text: 'Member message',
        createdAt: new Date().toISOString(),
      })
    )
  })
})

// ─── messages - delete ────────────────────────────────────────────────────────

describe('messages/{messageId} - delete', () => {
  const MSG_ID = 'msg-del-001'
  const MSG_DATA = {
    teamId: TEAM_ID,
    authorId: POWER_UID,
    text: 'Message to delete',
    createdAt: new Date().toISOString(),
  }

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `teams/${TEAM_ID}`), TEAM_DATA)
      await setDoc(doc(ctx.firestore(), `messages/${MSG_ID}`), MSG_DATA)
    })
  })

  it('allows team creator to delete message', async () => {
    const ctx = testEnv.authenticatedContext(CREATOR_UID)
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })

  it('allows admin to delete message', async () => {
    const ctx = testEnv.authenticatedContext('admin-uid', { admin: true })
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })

  it('denies member from deleting message', async () => {
    const ctx = testEnv.authenticatedContext(MEMBER_UID)
    await assertFails(deleteDoc(doc(ctx.firestore(), `messages/${MSG_ID}`)))
  })
})

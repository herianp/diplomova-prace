import { describe, it, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createTestEnv } from './helpers/setup'

let testEnv: RulesTestEnvironment

const USER_A_UID = 'user-a'
const USER_B_UID = 'user-b'

beforeAll(async () => {
  testEnv = await createTestEnv()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('users/{userId} - own access', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        email: 'a@test.cz',
        displayName: 'User A',
        teamId: 'team-001',
      })
      await setDoc(doc(ctx.firestore(), `users/${USER_B_UID}`), {
        email: 'b@test.cz',
        displayName: 'User B',
        teamId: 'team-001',
      })
    })
  })

  it('allows user to read own document', async () => {
    const ctx = testEnv.authenticatedContext(USER_A_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `users/${USER_A_UID}`)))
  })

  it('allows user to write own document', async () => {
    const ctx = testEnv.authenticatedContext(USER_A_UID)
    // Use setDoc (merge: false) to test write permission - creates or overwrites own document
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        email: 'a@test.cz',
        displayName: 'User A Updated',
        teamId: 'team-001',
      })
    )
  })
})

describe('users/{userId} - other user access', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        email: 'a@test.cz',
        displayName: 'User A',
        teamId: 'team-001',
      })
    })
  })

  it('allows authenticated user to read another user document', async () => {
    // USER_B reads USER_A's document - allowed for team management lookups
    const ctx = testEnv.authenticatedContext(USER_B_UID)
    await assertSucceeds(getDoc(doc(ctx.firestore(), `users/${USER_A_UID}`)))
  })

  it('denies authenticated user from writing another user document', async () => {
    // USER_B cannot write to USER_A's document
    const ctx = testEnv.authenticatedContext(USER_B_UID)
    await assertFails(
      updateDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        displayName: 'Hacked Name',
      })
    )
  })
})

describe('users/{userId} - unauthenticated', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        email: 'a@test.cz',
        displayName: 'User A',
        teamId: 'team-001',
      })
    })
  })

  it('denies unauthenticated read of user document', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(ctx.firestore(), `users/${USER_A_UID}`)))
  })

  it('denies unauthenticated write of user document', async () => {
    const ctx = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(ctx.firestore(), `users/${USER_A_UID}`), {
        email: 'hacked@test.cz',
        displayName: 'Hacked User',
      })
    )
  })
})

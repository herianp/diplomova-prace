import { FirebaseError } from 'firebase/app'
import { AuthError, FirestoreError } from './index'

/**
 * Mapping of Firebase Auth error codes to i18n keys
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/wrong-password': 'errors.auth.wrongPassword',
  'auth/invalid-credential': 'errors.auth.invalidCredential',
  'auth/user-not-found': 'errors.auth.userNotFound',
  'auth/email-already-in-use': 'errors.auth.emailInUse',
  'auth/weak-password': 'errors.auth.weakPassword',
  'auth/network-request-failed': 'errors.auth.networkFailed',
  'auth/too-many-requests': 'errors.auth.tooManyRequests',
  'auth/requires-recent-login': 'errors.auth.requiresRecentLogin'
}

/**
 * Mapping of Firestore error codes to i18n keys
 */
const FIRESTORE_ERROR_MAP: Record<string, string> = {
  'permission-denied': 'errors.firestore.permissionDenied',
  'unavailable': 'errors.firestore.unavailable',
  'not-found': 'errors.firestore.notFound',
  'already-exists': 'errors.firestore.alreadyExists',
  'failed-precondition': 'errors.firestore.failedPrecondition'
}

/**
 * Maps Firebase Auth error to typed AuthError with i18n key
 */
export function mapFirebaseAuthError(error: unknown): AuthError {
  const firebaseError = error as FirebaseError
  const code = firebaseError.code || 'unknown'
  const i18nKey = AUTH_ERROR_MAP[code] || 'errors.auth.unknown'

  return new AuthError(code, i18nKey, {
    originalMessage: firebaseError.message
  })
}

/**
 * Maps Firestore error to typed FirestoreError with i18n key
 */
export function mapFirestoreError(
  error: unknown,
  operation: 'read' | 'write' | 'delete'
): FirestoreError {
  const firebaseError = error as FirebaseError
  let code = firebaseError.code || 'unknown'

  // Strip 'firestore/' prefix if present
  if (code.startsWith('firestore/')) {
    code = code.substring('firestore/'.length)
  }

  const i18nKey = FIRESTORE_ERROR_MAP[code] || 'errors.firestore.unknown'

  return new FirestoreError(code, operation, i18nKey, {
    originalMessage: firebaseError.message
  })
}

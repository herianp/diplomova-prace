export default {
  auth: {
    wrongPassword: 'Incorrect password. Please try again.',
    invalidCredential: 'Invalid credentials.',
    userNotFound: 'User not found.',
    emailInUse: 'Email is already registered.',
    weakPassword: 'Password is too weak. Must be at least 6 characters.',
    networkFailed: 'Network error. Check your internet connection.',
    tooManyRequests: 'Too many attempts. Please wait a moment.',
    requiresRecentLogin: 'Please sign in again to complete this action.',
    unknown: 'Unknown authentication error.'
  },
  firestore: {
    permissionDenied: 'You do not have permission for this operation.',
    unavailable: 'Database is temporarily unavailable.',
    notFound: 'Data not found.',
    alreadyExists: 'Data already exists.',
    failedPrecondition: 'Operation cannot be completed.',
    unknown: 'Unknown database error.'
  },
  validation: {
    required: 'This field is required.',
    invalidFormat: 'Invalid format.'
  },
  listener: {
    failed: 'Live updates failed.'
  },
  unexpected: 'Unexpected error. Please try again.',
  maxRetriesReached: 'Maximum retry attempts reached'
}

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

interface CreatorResolution {
  teamId: string;
  action: 'delete' | 'reassign';
  newCreatorUid?: string;
}

interface DeleteUserRequest {
  uid: string;
  creatorResolutions?: CreatorResolution[];
}

export const deleteUserAccount = onCall(
  { region: 'europe-west1' },
  async (request) => {
    // Verify caller is admin
    if (!request.auth?.token?.admin) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can delete user accounts.'
      );
    }

    const { uid, creatorResolutions } = request.data as DeleteUserRequest;

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'The uid of the user to delete is required.'
      );
    }

    const db = getFirestore();

    // Step 1: Process creator resolutions if provided
    if (creatorResolutions && creatorResolutions.length > 0) {
      for (const resolution of creatorResolutions) {
        if (resolution.action === 'reassign') {
          if (!resolution.newCreatorUid) {
            throw new HttpsError(
              'invalid-argument',
              `Reassign action for team ${resolution.teamId} requires newCreatorUid.`
            );
          }

          const teamRef = db.collection('teams').doc(resolution.teamId);
          await teamRef.update({
            creator: resolution.newCreatorUid,
            powerusers: FieldValue.arrayUnion(resolution.newCreatorUid),
          });
        }
        // For action: 'delete', team deletion is handled client-side
        // before calling this Cloud Function
      }
    }

    // Step 2: Soft-delete user in Firestore
    try {
      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: request.auth.uid,
      });
    } catch (error) {
      console.error('Failed to soft-delete user in Firestore:', error);
      throw new HttpsError(
        'internal',
        'Failed to update user document in Firestore.'
      );
    }

    // Step 3: Delete Firebase Auth account
    try {
      await getAuth().deleteUser(uid);
    } catch (error) {
      // Auth deletion failed after Firestore update - recoverable state
      // The user is already marked as deleted in Firestore
      // Admin can retry or manually delete from Firebase Console
      console.warn(
        `Auth deletion failed for user ${uid} after Firestore soft-delete. ` +
          'User is marked as deleted in Firestore but Auth account remains.',
        error
      );
    }

    return { success: true };
  }
);

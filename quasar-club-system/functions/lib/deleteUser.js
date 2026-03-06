"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
exports.deleteUserAccount = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    // Verify caller is admin
    if (!request.auth?.token?.admin) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can delete user accounts.');
    }
    const { uid, creatorResolutions } = request.data;
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'The uid of the user to delete is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    // Step 1: Process creator resolutions if provided
    if (creatorResolutions && creatorResolutions.length > 0) {
        for (const resolution of creatorResolutions) {
            if (resolution.action === 'reassign') {
                if (!resolution.newCreatorUid) {
                    throw new https_1.HttpsError('invalid-argument', `Reassign action for team ${resolution.teamId} requires newCreatorUid.`);
                }
                const teamRef = db.collection('teams').doc(resolution.teamId);
                await teamRef.update({
                    creator: resolution.newCreatorUid,
                    powerusers: firestore_1.FieldValue.arrayUnion(resolution.newCreatorUid),
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
    }
    catch (error) {
        console.error('Failed to soft-delete user in Firestore:', error);
        throw new https_1.HttpsError('internal', 'Failed to update user document in Firestore.');
    }
    // Step 3: Delete Firebase Auth account
    try {
        await (0, auth_1.getAuth)().deleteUser(uid);
    }
    catch (error) {
        // Auth deletion failed after Firestore update - recoverable state
        // The user is already marked as deleted in Firestore
        // Admin can retry or manually delete from Firebase Console
        console.warn(`Auth deletion failed for user ${uid} after Firestore soft-delete. ` +
            'User is marked as deleted in Firestore but Auth account remains.', error);
    }
    return { success: true };
});
//# sourceMappingURL=deleteUser.js.map
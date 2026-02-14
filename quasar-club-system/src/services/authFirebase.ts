import { auth, db } from "@/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  getAuth,
  Unsubscribe
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { IUser } from "@/interfaces/interfaces";
import { mapFirebaseAuthError } from '@/errors/errorMapper'
import { AuthError } from '@/errors'

export function useAuthFirebase() {
  const authStateListener = (callback: (user: User | null) => void): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
  };

  const loginUser = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error('Login Error:', authError.code, authError.message)
      throw authError
    }
  };

  const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error('Logout Error:', authError.message)
      throw authError
    }
  };

  const registerUser = async (email: string, password: string, name?: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUserInFirestore(user, name);

      return user;
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error('Registration Error:', authError.code, authError.message)
      throw authError
    }
  };

  const createUserInFirestore = async (user: User, name?: string): Promise<void> => {
    const userDoc: IUser = {
      uid: user.uid,
      email: user.email,
      name: name || "",
      displayName: user.displayName || name || "",
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, "users", user.uid), userDoc);
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error("Error adding user to Firestore:", authError.message)
      throw authError
    }
  };

  const getCurrentUser = (): User | null => {
    const auth = getAuth();
    return auth.currentUser;
  };

  const refreshUser = async (): Promise<User | null> => {
    const auth = getAuth();
    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser;
    }
    return null;
  };

  const getUserFromFirestore = async (uid: string): Promise<IUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data() as IUser;
      }
      return null;
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error("Error getting user from Firestore:", authError.message)
      throw authError
    }
  };

  const updateUserProfile = async (uid: string, displayName: string): Promise<void> => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('No authenticated user');

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName });

      // Update Firestore user document
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { displayName });
    } catch (error: unknown) {
      const authError = mapFirebaseAuthError(error)
      console.error('Error updating user profile:', authError.message)
      throw authError
    }
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const auth = getAuth();
    if (!auth.currentUser?.email) {
      throw new AuthError('no-user', 'errors.auth.noUser')
    }

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password after successful reauthentication
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: unknown) {
      // Map Firebase error to AuthError with proper i18n key
      throw mapFirebaseAuthError(error)
    }
  };

  return {
    authStateListener,
    loginUser,
    logoutUser,
    registerUser,
    createUserInFirestore,
    getCurrentUser,
    refreshUser,
    getUserFromFirestore,
    updateUserProfile,
    changeUserPassword
  };
}

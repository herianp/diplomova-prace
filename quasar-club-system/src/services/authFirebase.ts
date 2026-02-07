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

export function useAuthFirebase() {
  const authStateListener = (callback: (user: User | null) => void): Unsubscribe => {
    return onAuthStateChanged(auth, callback);
  };

  const loginUser = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error(`Login Error: ${error.code} - ${error.message}`);
      throw error;
    }
  };

  const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error(`Logout Error: ${error.message}`);
      throw error;
    }
  };

  const registerUser = async (email: string, password: string, name?: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUserInFirestore(user, name);

      return user;
    } catch (error) {
      console.error(`Registration Error: ${error.code} - ${error.message}`);
      throw error;
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
      console.log("User registered and added to Firestore:", userDoc);
    } catch (error) {
      console.error("Error adding user to Firestore:", error);
      throw error;
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
    } catch (error) {
      console.error("Error getting user from Firestore:", error);
      throw error;
    }
  };

  const updateUserProfile = async (uid: string, displayName: string): Promise<void> => {
    const auth = getAuth();
    if (!auth.currentUser) throw new Error('No authenticated user');

    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, { displayName });

    // Update Firestore user document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { displayName });
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const auth = getAuth();
    if (!auth.currentUser?.email) throw new Error('No authenticated user');

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update password
    await updatePassword(auth.currentUser, newPassword);
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

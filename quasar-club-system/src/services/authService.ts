import { auth, db } from "@/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// **Auth Listener** - Checks if a user is logged in
export const authStateListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// **Login Function**
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error(`Login Error: ${error.code} - ${error.message}`);
    throw error;
  }
};

// **Logout Function**
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error(`Logout Error: ${error.message}`);
    throw error;
  }
};

// **Register a New User**
export const registerUser = async (email: string, password: string, name?: string) => {
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

// **Create User in Firestore**
const createUserInFirestore = async (user: User, name?: string) => {
  const userDoc = {
    uid: user.uid,
    email: user.email,
    name: name || "",
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

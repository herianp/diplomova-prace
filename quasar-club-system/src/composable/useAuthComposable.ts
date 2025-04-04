import { computed } from 'vue'
import { auth, db } from '@/firebase/config'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { RouteEnum } from '../enums/routesEnum'
import { useAuthStore } from '../stores/authStore'
import { useTeamStore } from '../stores/teamStore'

// Composable
export function useAuthComposable() {
  const authStore = useAuthStore();
  const { clearData } = useTeamStore();

  const currentUser = computed(() => authStore.user)

  // 🔄 Listen to auth state
  const authStateListener = () => {
    return onAuthStateChanged(auth, user => {
      authStore.setUser(user);
    })
  }

  // 🔐 Login
  const loginUser = async (email: string, password: string) => {
    try {
      authStore.setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      authStore.setUser(userCredential.user);
      this.router.push(RouteEnum.DASHBOARD.path);
    } catch (error: any) {
      console.error(`Login Error: ${error.code} - ${error.message}`)
      throw error
    } finally {
      authStore.setLoading(false);
    }
  }

  // 🚪 Logout
  const logoutUser = async () => {
    try {
      await signOut(auth)
      authStore.setUser(null)
      clearData();
      this.router.push(RouteEnum.LOGIN.path);
      console.log('User signed out successfully')
    } catch (error: any) {
      console.error(`Logout Error: ${error.message}`)
      throw error
    }
  }

  // 🆕 Register new user
  const registerUser = async (email: string, password: string, name?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await createUserInFirestore(user, name)
      authStore.setUser(user);
      this.router.push(RouteEnum.DASHBOARD.path);
    } catch (error: any) {
      console.error(`Registration Error: ${error.code} - ${error.message}`)
      throw error
    }
  }

  // 🧾 Create Firestore user
  const createUserInFirestore = async (user: User, name?: string) => {
    const userDoc = {
      uid: user.uid,
      email: user.email,
      name: name || '',
      createdAt: new Date(),
    }

    try {
      await setDoc(doc(db, 'users', user.uid), userDoc)
      console.log('User registered and added to Firestore:', userDoc)
    } catch (error) {
      console.error('Error adding user to Firestore:', error)
      throw error
    }
  }

  return {
    currentUser,
    authStateListener,
    loginUser,
    logoutUser,
    registerUser,
  }
}

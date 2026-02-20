// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getPerformance } from "firebase/performance";

/**
 * Firebase Configuration
 *
 * Uses Vite environment variables for API key (VITE_FIREBASE_API_KEY).
 * Other config values are non-secret project identifiers.
 *
 * Environment setup:
 * - Development: Set VITE_FIREBASE_API_KEY in .env.local (gitignored)
 * - Production: Set VITE_FIREBASE_API_KEY in deployment environment
 *
 * SDKs in use: firebase/app, firebase/auth, firebase/firestore, firebase/analytics
 */

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'club-surveys.firebaseapp.com',
  projectId: 'club-surveys',
  storageBucket: 'club-surveys.firebasestorage.app',
  messagingSenderId: '376776441448',
  appId: '1:376776441448:web:5bf51db3be287c171fc5dd',
  measurementId: 'G-SYRS8JZF7B'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Authentication and get a reference to the service
const auth = getAuth(app);

/**
 * Initialize Performance Monitoring (automatic web vitals: FCP, LCP, CLS, FID)
 * Only in production — the SDK spams console with retry errors in dev/localhost.
 */
const perf = import.meta.env.PROD ? getPerformance(app) : null;

export { analytics, db, auth, perf };

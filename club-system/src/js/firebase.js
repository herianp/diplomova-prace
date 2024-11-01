// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const apiKey = process.env.FIREBASE_API_KEY;

const firebaseConfig = {
    apiKey: apiKey,
    authDomain: "club-surveys.firebaseapp.com",
    projectId: "club-surveys",
    storageBucket: "club-surveys.firebasestorage.app",
    messagingSenderId: "376776441448",
    appId: "1:376776441448:web:5bf51db3be287c171fc5dd",
    measurementId: "G-SYRS8JZF7B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

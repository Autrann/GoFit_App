// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtKLqeCFlUSVAW5GODDup-F_4a1MGGPww",
  authDomain: "gofit-8b38e.firebaseapp.com",
  projectId: "gofit-8b38e",
  storageBucket: "gofit-8b38e.firebasestorage.app",
  messagingSenderId: "502660062606",
  appId: "1:502660062606:web:835cc35b76f496ed4f58df",
  measurementId: "G-DJ8LYBYWZS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);


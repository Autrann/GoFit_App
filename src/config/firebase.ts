import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence está disponible en el bundle de React Native
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validación preventiva para evitar crash silencioso si GitHub Actions no inyectó los Secrets
if (!firebaseConfig.apiKey) {
  console.error(
    '🚨 ERROR CRÍTICO: EXPO_PUBLIC_FIREBASE_API_KEY es undefined. Verifica tus Secrets en GitHub Actions.'
  );
}

// Evita inicializar la app dos veces en recargas rápidas
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

//Inicializamos Auth con persistencia en AsyncStorage (Elimina el warning y mantiene la sesión abierta)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Si ya estaba inicializado previamente, recuperamos la instancia
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration Firebase (à remplacer par vos propres identifiants)
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopment123456789",
  authDomain: "pointage-app-noisy.firebaseapp.com",
  projectId: "pointage-app-noisy",
  storageBucket: "pointage-app-noisy.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore
export const db = getFirestore(app);

// Initialisation de l'authentification
export const auth = getAuth(app);

export default app;

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration Firebase (à remplacer par vos propres identifiants lors du déploiement)
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAAcArWv37e499EyreInkP9CmMzZCWNtHc",
    authDomain: "pointage-app-noisy.firebaseapp.com",
    projectId: "pointage-app-noisy",
    storageBucket: "pointage-app-noisy.firebasestorage.app",
    messagingSenderId: "187624415462",
    appId: "1:187624415462:web:96848422f4bd63953e9b27",
    measurementId: "G-SVF8EKENDQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore
export const db = getFirestore(app);

// Initialisation de l'authentification
export const auth = getAuth(app);

export default app;

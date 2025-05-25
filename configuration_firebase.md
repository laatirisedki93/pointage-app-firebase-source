# Configuration Firebase pour l'application de pointage

## 1. Création du projet Firebase

Pour configurer Firebase pour notre application de pointage, nous devons suivre ces étapes :

1. Créer un nouveau projet Firebase
2. Configurer Firestore Database
3. Configurer Firebase Authentication
4. Générer les clés d'API
5. Configurer les règles de sécurité

## 2. Structure Firestore

Nous allons utiliser la structure suivante pour notre base de données Firestore :

### Collection "agents"
```
agents/
  ├── [agent_id]/
  │     ├── nom: string
  │     ├── ip: string
  │     └── dateCreation: timestamp
```

### Collection "pointages"
```
pointages/
  ├── [pointage_id]/
  │     ├── agentId: string (référence à un agent si connu)
  │     ├── ip: string
  │     ├── type: string ("entree" ou "sortie")
  │     ├── timestamp: timestamp
  │     ├── date: string (format YYYY-MM-DD)
  │     ├── latitude: number (optionnel)
  │     ├── longitude: number (optionnel)
  │     └── adresse: string
```

### Collection "parametres"
```
parametres/
  ├── admin/
  │     └── motDePasse: string (hashé)
```

## 3. Configuration Firebase dans l'application

```javascript
// Configuration Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "pointage-app-xxxxx.firebaseapp.com",
  projectId: "pointage-app-xxxxx",
  storageBucket: "pointage-app-xxxxx.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
```

## 4. Règles de sécurité Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Accès en lecture seule aux agents pour tous
    match /agents/{agent} {
      allow read: if true;
      allow write: if request.auth != null; // Seuls les utilisateurs authentifiés peuvent modifier
    }
    
    // Accès aux pointages
    match /pointages/{pointage} {
      allow read: if request.auth != null; // Seuls les utilisateurs authentifiés peuvent lire
      allow create: if true; // Tout le monde peut créer un pointage
      allow update, delete: if request.auth != null; // Seuls les utilisateurs authentifiés peuvent modifier
    }
    
    // Paramètres admin protégés
    match /parametres/{param} {
      allow read, write: if request.auth != null; // Seuls les utilisateurs authentifiés peuvent accéder
    }
  }
}
```

## 5. Dépendances à installer

```bash
npm install firebase
# ou
pnpm add firebase
```

## 6. Initialisation des données

Pour initialiser les données de base dans Firebase, nous devrons créer un script qui :
1. Crée un utilisateur admin par défaut
2. Initialise les paramètres de base
3. Migre les données existantes si nécessaire

## 7. Authentification admin

Nous utiliserons Firebase Authentication avec la méthode email/password pour l'authentification admin. Un compte admin par défaut sera créé lors de l'initialisation.

## 8. Sécurité et performances

- Indexation des champs fréquemment utilisés pour les requêtes
- Limitation des lectures/écritures pour optimiser les coûts
- Mise en cache des données fréquemment utilisées
- Gestion des erreurs de connexion

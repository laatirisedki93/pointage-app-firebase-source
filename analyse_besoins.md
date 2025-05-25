# Analyse des besoins - Application de Pointage avec Firebase

## 1. Objectifs principaux

1. **Stockage centralisé des données** : Remplacer le localStorage par une base de données Firebase pour permettre l'accès aux données depuis n'importe quel appareil.
2. **Restriction des actions après pointage** : Empêcher toute navigation ou action après qu'un agent a effectué son pointage.

## 2. Structure des données Firebase

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

## 3. Règles de sécurité Firebase

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Accès en lecture seule aux agents pour tous
    match /agents/{agent} {
      allow read: if true;
      allow write: if false; // Seules les fonctions admin peuvent modifier
    }
    
    // Accès en écriture aux pointages pour permettre l'enregistrement
    match /pointages/{pointage} {
      allow read: if false; // Seules les fonctions admin peuvent lire
      allow create: if true; // Tout le monde peut créer un pointage
      allow update, delete: if false; // Personne ne peut modifier ou supprimer
    }
    
    // Paramètres admin protégés
    match /parametres/{param} {
      allow read, write: if false; // Seules les fonctions admin peuvent accéder
    }
  }
}
```

## 4. Fonctionnalités à développer

### Page QR Admin
- Aucun changement dans la génération du QR code
- Le QR code continue de pointer vers `/pointage?token=QR-YYYY-MM-DD&type=entree|sortie`

### Page de Pointage
- Enregistrement des données dans Firebase au lieu du localStorage
- Suppression de tous les liens de navigation (retour à l'accueil, etc.)
- Désactivation de la possibilité de revenir en arrière (via JavaScript)
- Affichage d'un message de confirmation simple sans autres options
- Style visuel indiquant clairement que le pointage est terminé

### Page Admin
- Authentification maintenue avec mot de passe stocké dans Firebase
- Lecture des pointages depuis Firebase au lieu du localStorage
- Maintien de la gestion des agents (ajout/modification/suppression)
- Maintien de l'export CSV avec les données de Firebase

## 5. Sécurité et authentification

- Authentification admin via Firebase Authentication
- Protection des routes admin côté client et côté serveur
- Stockage sécurisé du mot de passe admin

## 6. Expérience utilisateur

### Pour les agents
- Interface simplifiée pour le pointage
- Aucune possibilité de navigation après pointage
- Message clair indiquant le succès du pointage

### Pour les administrateurs
- Interface complète de gestion
- Tableau de bord avec données en temps réel
- Fonctionnalités d'export et de gestion des agents

## 7. Considérations techniques

- Utilisation de Firebase Firestore pour le stockage des données
- Utilisation de Firebase Hosting pour le déploiement
- Configuration des règles de sécurité Firebase
- Optimisation des requêtes pour limiter les coûts
- Gestion des erreurs et de la connectivité réseau

## 8. Livrables attendus

- Code source complet avec intégration Firebase
- Build prêt à déployer
- Documentation d'utilisation mise à jour
- Guide de déploiement Firebase

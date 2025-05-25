# Guide d'utilisation - Application de Pointage avec Firebase

## Introduction

Cette application de pointage pour la Ville de Noisy-le-Sec permet aux agents de pointer leur entrée et leur sortie en scannant un QR code. Contrairement à la version précédente, cette nouvelle version utilise Firebase comme base de données centralisée, ce qui permet :

1. D'accéder aux données de pointage depuis n'importe quel appareil
2. De synchroniser les pointages en temps réel
3. D'empêcher toute navigation après le pointage des agents

## Fonctionnalités principales

### QR Code dynamique (/qr-admin)
- Affiche un QR code qui change automatiquement entre entrée et sortie selon l'heure
- QR code d'entrée le matin
- QR code de sortie à 16h30 du lundi au jeudi
- QR code de sortie à 15h00 le vendredi
- Design avec logo officiel de la mairie

### Page de pointage (/pointage)
- Détecte l'IP publique, la position GPS et l'adresse exacte
- Enregistre l'heure du scan et le type de pointage (entrée/sortie)
- Vérifie si l'IP a déjà pointé ce jour-là pour ce type
- Empêche toute navigation après le pointage (restriction post-pointage)

### Administration (/admin)
- Protégée par mot de passe (par défaut : admin123)
- Tableau des pointages avec données en temps réel
- Gestion des agents (association IP <-> nom)
- Export CSV des données de pointage
- Statistiques de pointage

## Accès à l'application

- **Page d'accueil** : `/`
- **QR Admin** : `/qr-admin`
- **Administration** : `/login` puis `/admin`

## Authentification

- **Email** : admin@noisy-le-sec.fr
- **Mot de passe initial** : admin123
- Vous pouvez changer le mot de passe depuis l'interface d'administration

## Gestion des agents

1. Connectez-vous à l'interface d'administration
2. Cliquez sur "Ajouter un agent"
3. Entrez le nom de l'agent et son adresse IP
4. Cliquez sur "Ajouter"
5. Les noms des agents apparaîtront dans le tableau des pointages

## Export des données

1. Connectez-vous à l'interface d'administration
2. Cliquez sur "Exporter en CSV"
3. Le fichier CSV contenant tous les pointages sera téléchargé automatiquement

## Déploiement sur Netlify

### Option 1 : Déploiement direct du build

1. Décompressez le fichier `pointage-app-firebase-build.zip`
2. Connectez-vous à votre compte Netlify
3. Cliquez sur "Add new site" puis "Deploy manually"
4. Glissez-déposez le dossier décompressé dans la zone de dépôt
5. Attendez quelques secondes que le déploiement se termine

### Option 2 : Déploiement via GitHub

1. Décompressez le fichier `pointage-app-firebase-source.zip`
2. Créez un nouveau dépôt GitHub
3. Importez les fichiers décompressés dans ce dépôt
4. Dans Netlify, cliquez sur "Add new site" puis "Import an existing project"
5. Sélectionnez GitHub et choisissez votre dépôt
6. Configurez les paramètres de build :
   - Build command : `pnpm run build`
   - Publish directory : `dist`
7. Cliquez sur "Deploy site"

## Configuration Firebase

Cette application utilise Firebase pour le stockage centralisé des données. Pour utiliser votre propre projet Firebase :

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez Firestore Database et Authentication
3. Remplacez les identifiants Firebase dans le fichier `src/firebase/config.ts`
4. Redéployez l'application

## Remarques importantes

- Les données sont stockées dans Firebase Firestore, ce qui permet un accès depuis n'importe quel appareil
- L'authentification admin est gérée par Firebase Authentication
- Les agents ne peuvent pas naviguer après avoir effectué leur pointage
- Le QR code change automatiquement selon l'heure et le jour de la semaine

## Support technique

Pour toute question ou assistance, veuillez contacter le service informatique de la Ville de Noisy-le-Sec.

---

© 2025 - Ville de Noisy-le-Sec - Tous droits réservés
# pointage-app-firebase-source

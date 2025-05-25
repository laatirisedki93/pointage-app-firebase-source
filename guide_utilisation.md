# Guide d'utilisation - Système de Pointage avec Codes Personnels

## Introduction

L'application de pointage pour la Ville de Noisy-le-Sec a été améliorée pour résoudre deux problèmes majeurs :

1. **Problème d'identification par IP** : Auparavant, plusieurs agents sur le même réseau WiFi ne pouvaient pas pointer individuellement car l'application utilisait l'adresse IP pour les identifier.

2. **Problème de géolocalisation** : Le message "Adresse non disponible" apparaissait fréquemment lors du pointage.

Ces problèmes ont été résolus grâce à l'implémentation d'un système de codes personnels et à l'amélioration de la gestion de la géolocalisation.

## Nouvelles fonctionnalités

### Système de codes personnels

Chaque agent dispose désormais d'un code personnel à 4 chiffres qui lui permet de s'identifier de manière unique, indépendamment de l'adresse IP utilisée. Cela permet à plusieurs agents de pointer depuis le même réseau WiFi.

### Amélioration de la géolocalisation

Le délai d'attente pour la récupération de la position GPS a été augmenté et la gestion des erreurs a été améliorée pour réduire les cas où le message "Adresse non disponible" apparaît.

## Guide d'utilisation

### Pour les administrateurs

1. **Connexion à l'interface d'administration**
   - Accédez à `/login`
   - Connectez-vous avec les identifiants administrateur

2. **Gestion des agents**
   - Dans l'interface d'administration, vous pouvez ajouter, modifier et supprimer des agents
   - Pour chaque agent, vous devez spécifier :
     - Nom de l'agent
     - Adresse IP (pour compatibilité avec les anciens pointages)
     - Code personnel à 4 chiffres (unique pour chaque agent)
   - Vous pouvez générer automatiquement un code unique en cliquant sur "Générer un code"

3. **Consultation des pointages**
   - Le tableau des pointages affiche désormais le code personnel et le nom de l'agent pour chaque pointage
   - Les anciens pointages (sans code personnel) restent visibles et sont associés aux agents par leur adresse IP

4. **Exportation des données**
   - L'exportation CSV inclut désormais les codes personnels et les noms des agents

### Pour les agents

1. **Processus de pointage**
   - Scannez le QR code d'entrée ou de sortie comme auparavant
   - Vous serez invité à saisir votre code personnel à 4 chiffres
   - Après validation du code, le pointage sera enregistré
   - Les détails du pointage s'afficheront à l'écran

2. **En cas d'erreur**
   - Si vous saisissez un code incorrect, un message d'erreur s'affichera
   - Si vous avez déjà pointé aujourd'hui pour ce type (entrée ou sortie), un message vous en informera

## Déploiement

Pour déployer cette nouvelle version de l'application :

1. Décompressez l'archive `pointage-app-firebase-build.zip`
2. Déployez le contenu sur votre serveur web ou sur Netlify
3. Assurez-vous que les règles de redirection sont correctement configurées (fichier `_redirects`)

## Migration des données

Les données existantes (pointages et agents) sont compatibles avec la nouvelle version. Les agents existants devront se voir attribuer un code personnel lors de leur première utilisation de la nouvelle version.

## Support

En cas de problème ou pour toute question, veuillez contacter le service informatique de la Ville de Noisy-le-Sec.

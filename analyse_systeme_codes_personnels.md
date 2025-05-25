# Conception du système de codes personnels pour les agents

## Structure de données

### Modification de la collection "agents"
La collection "agents" existante sera modifiée pour inclure un code personnel unique pour chaque agent :

```typescript
interface AgentMapping {
  id?: string;
  ip: string;
  nom: string;
  codePersonnel: string; // Nouveau champ pour le code personnel
  dateCreation: string;
}
```

### Caractéristiques des codes personnels
- Format : Numérique à 4 chiffres pour faciliter la saisie sur mobile
- Unicité : Chaque code doit être unique dans la base de données
- Validation : Le code doit être validé côté serveur et côté client
- Sécurité : Le code sera stocké en clair dans Firestore (suffisant pour ce cas d'usage)

### Modification de la collection "pointages"
La collection "pointages" sera modifiée pour inclure le code personnel et le nom de l'agent :

```typescript
interface PointageData {
  ip: string;
  codePersonnel: string; // Nouveau champ
  nomAgent: string;      // Nouveau champ
  latitude: number | null;
  longitude: number | null;
  address: string;
  timestamp: string;
  type: 'entree' | 'sortie';
  token: string;
  date: string;
}
```

## Interface d'administration

### Gestion des codes personnels
L'interface d'administration sera modifiée pour permettre :
- L'attribution d'un code personnel à chaque agent
- La vérification de l'unicité du code
- La génération automatique de codes uniques
- La modification des codes existants

### Migration des données existantes
Pour les agents existants, un processus de migration sera mis en place :
- Attribution automatique de codes personnels uniques
- Conservation de l'association IP/nom existante
- Possibilité de modifier les codes attribués

## Processus de pointage

### Modification du flux de pointage
1. L'agent scanne le QR code (inchangé)
2. L'application demande le code personnel de l'agent
3. Validation du code personnel dans la base de données
4. Si le code est valide, enregistrement du pointage avec le code et le nom de l'agent
5. Si le code est invalide, affichage d'un message d'erreur

### Vérification des pointages existants
La vérification des pointages existants sera modifiée pour utiliser le code personnel au lieu de l'IP :
- Recherche des pointages par code personnel et date
- Conservation de l'IP pour des raisons de traçabilité

## Avantages du nouveau système
- Identification unique des agents, même sur un réseau partagé
- Meilleure sécurité (l'agent doit connaître son code)
- Flexibilité accrue (un agent peut pointer depuis différents appareils)
- Statistiques plus précises par agent

# Busway Africa — Admin Dashboard

Webapp d'administration pour Busway Africa, connectée au **même projet Firebase**
que l'app Flutter mobile.

## Stack

- React + Vite
- React Router (navigation)
- Firebase (Auth + Firestore, temps réel via `onSnapshot`)

## Installation

```bash
cd busway-admin
npm install
cp .env.example .env.local
```

Remplis `.env.local` avec les identifiants de ton projet Firebase
(Console Firebase → Paramètres du projet → Général → Config SDK).
Ce sont les mêmes identifiants Firebase que ceux utilisés dans l'app Flutter.

```bash
npm run dev
```

## Créer ton premier compte admin

1. Dans la Console Firebase → Authentication, crée un utilisateur (email + mot de passe),
   ou utilise un compte existant de l'app mobile.
2. Dans Firestore, va dans la collection `users` → document avec l'UID de ce compte
   → ajoute (ou modifie) le champ :
   ```
   role: "admin"
   ```
3. Connecte-toi sur le dashboard avec cet email/mot de passe.

Sans ce champ `role: "admin"`, la connexion sera automatiquement refusée
(voir `src/context/AuthContext.jsx`), même si l'email/mot de passe est correct.

## Déployer les règles de sécurité Firestore

Le fichier `firestore.rules` à la racine contient les règles qui empêchent
un utilisateur non-admin d'accéder aux données sensibles, même s'il
essaie de contourner l'interface et d'appeler Firestore directement.

```bash
firebase deploy --only firestore:rules
```

(nécessite d'avoir initialisé Firebase CLI sur ton projet — `firebase init`
si ce n'est pas déjà fait dans ton repo Busway Africa)

## Structure Firestore attendue

Le dashboard lit les collections suivantes (déjà utilisées côté app mobile,
adapte les noms de champs si les tiens diffèrent) :

- `users` — champ `role` ("admin" ou absent)
- `bookings` — `departure`, `destination`, `clientName`, `clientPhone`, `status`, `amount`, `travelDate`, `createdAt`
- `buses` — `plateNumber`, `departure`, `destination`, `seatCount`, `status`
- `drivers` — `fullName`, `phone`, `status` ("pending", "active", "rejected")
- `parcels` — `reference`, `senderName`, `receiverName`, `departure`, `destination`, `status`

## Déploiement

Comme pour JEN, déploiement recommandé sur Vercel :

```bash
npm run build
```

Puis connecte le repo GitHub à Vercel, ou utilise `vercel --prod` directement.
Pense à ajouter les variables d'environnement (`VITE_FIREBASE_*`) dans les
paramètres du projet Vercel.

## Prochaines étapes possibles

- Ajout/édition de bus et trajets directement depuis l'interface (formulaires)
- Statistiques de revenus (graphiques)
- Notifications push aux chauffeurs depuis le dashboard (nécessitera une
  petite API Node.js, car l'envoi FCM depuis le frontend n'est pas sécurisé)
- Export CSV des réservations

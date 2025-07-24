# Documentation API Co-voiturage

## URL de base de l'API

```
http://localhost:3333
```

## Endpoints principaux

### 🔐 Authentification (`/api/v1/auth`)

| Méthode | Endpoint                       | Description                            | Auth requise |
| ------- | ------------------------------ | -------------------------------------- | ------------ |
| `POST`  | `/api/v1/auth/register`        | Inscription d'un utilisateur           | ❌           |
| `POST`  | `/api/v1/auth/login`           | Connexion d'un utilisateur             | ❌           |
| `POST`  | `/api/v1/auth/logout`          | Déconnexion d'un utilisateur           | ✅           |
| `GET`   | `/api/v1/auth/current-user`    | Informations de l'utilisateur connecté | ✅           |
| `POST`  | `/api/v1/auth/resend-email`    | Renvoyer l'email de vérification       | ❌           |
| `GET`   | `/api/v1/auth/verify-email`    | Vérification de l'email                | ❌           |
| `POST`  | `/api/v1/auth/forgot-password` | Mot de passe oublié                    | ❌           |
| `POST`  | `/api/v1/auth/reset-password`  | Réinitialisation du mot de passe       | ❌           |

### 🚗 Véhicules (`/api/v1/vehicles`)

| Méthode  | Endpoint                 | Description                 | Auth requise |
| -------- | ------------------------ | --------------------------- | ------------ |
| `GET`    | `/api/v1/vehicles`       | Liste de tous les véhicules | ✅           |
| `GET`    | `/api/v1/vehicles/:uuid` | Détails d'un véhicule       | ✅           |
| `POST`   | `/api/v1/vehicles`       | Création d'un véhicule      | ✅           |
| `PUT`    | `/api/v1/vehicles/:uuid` | Modification d'un véhicule  | ✅           |
| `DELETE` | `/api/v1/vehicles/:uuid` | Suppression d'un véhicule   | ✅           |

### 🛣️ Trajets (`/api/v1/trips`)

| Méthode | Endpoint              | Description               | Auth requise |
| ------- | --------------------- | ------------------------- | ------------ |
| `GET`   | `/api/v1/trips`       | Liste de tous les trajets | ✅           |
| `GET`   | `/api/v1/trips/:uuid` | Détails d'un trajet       | ✅           |
| `POST`  | `/api/v1/trips`       | Création d'un trajet      | ✅           |
| `PUT`   | `/api/v1/trips/:uuid` | Modification d'un trajet  | ✅           |

#### Endpoints de test pour les services de routage

| Méthode | Endpoint                                 | Description                           | Auth requise |
| ------- | ---------------------------------------- | ------------------------------------- | ------------ |
| `POST`  | `/api/v1/trips/test-geocoding`           | Test du géocodage                     | ✅           |
| `POST`  | `/api/v1/trips/test-reverse-geocoding`   | Test du géocodage inverse             | ✅           |
| `POST`  | `/api/v1/trips/test-matrix`              | Test de la matrice de distance        | ✅           |
| `POST`  | `/api/v1/trips/test-symmetric-matrix`    | Test de la matrice symétrique         | ✅           |
| `POST`  | `/api/v1/trips/test-one-to-many-matrix`  | Test de la matrice un-vers-plusieurs  | ✅           |
| `POST`  | `/api/v1/trips/test-many-to-one-matrix`  | Test de la matrice plusieurs-vers-un  | ✅           |
| `POST`  | `/api/v1/trips/test-traffic-matrix`      | Test de la matrice avec trafic        | ✅           |
| `POST`  | `/api/v1/trips/test-curbside-matrix`     | Test de la matrice avec bordures      | ✅           |
| `POST`  | `/api/v1/trips/test-fallback-matrix`     | Test de la matrice de secours         | ✅           |
| `POST`  | `/api/v1/trips/test-nearest-destination` | Test de la destination la plus proche | ✅           |

### 📋 Réservations (`/api/v1/bookings`)

| Méthode  | Endpoint                                | Description                            | Auth requise |
| -------- | --------------------------------------- | -------------------------------------- | ------------ |
| `GET`    | `/api/v1/bookings`                      | Mes réservations                       | ✅           |
| `GET`    | `/api/v1/bookings/:uuid`                | Détails d'une réservation              | ✅           |
| `POST`   | `/api/v1/bookings/trips/:tripUuid`      | Créer une réservation                  | ✅           |
| `PUT`    | `/api/v1/bookings/:uuid`                | Modifier une réservation               | ✅           |
| `DELETE` | `/api/v1/bookings/:uuid`                | Annuler une réservation                | ✅           |
| `GET`    | `/api/v1/bookings/trips/:uuid/bookings` | Réservations d'un trajet (conducteur)  | ✅           |
| `PUT`    | `/api/v1/bookings/:uuid/confirm`        | Confirmer une réservation (conducteur) | ✅           |
| `PUT`    | `/api/v1/bookings/:uuid/reject`         | Rejeter une réservation (conducteur)   | ✅           |

### 👥 Utilisateurs (`/api/v1/users`)

| Méthode  | Endpoint                 | Description               | Auth requise |
| -------- | ------------------------ | ------------------------- | ------------ |
| `GET`    | `/api/v1/users/:uuid`    | Profil d'un utilisateur   | ✅           |
| `GET`    | `/api/v1/users/profile`  | Mon profil                | ✅           |
| `PUT`    | `/api/v1/users/profile`  | Modifier mon profil       | ✅           |
| `PUT`    | `/api/v1/users/password` | Modifier mon mot de passe | ✅           |
| `DELETE` | `/api/v1/users`          | Supprimer mon compte      | ✅           |
| `GET`    | `/api/v1/users/trips`    | Mes trajets               | ✅           |

### 🔧 Administration et ACL (`/api/v1/acl`)

| Méthode  | Endpoint                            | Description                                    | Auth requise |
| -------- | ----------------------------------- | ---------------------------------------------- | ------------ |
| `GET`    | `/api/v1/acl/roles`                 | Liste de tous les rôles                        | ✅           |
| `GET`    | `/api/v1/acl/permissions`           | Liste de toutes les permissions                | ✅           |
| `GET`    | `/api/v1/acl/admin/roles`           | Tous les rôles d'utilisateur                   | ✅           |
| `GET`    | `/api/v1/acl/admins/roles`          | Tous les admins avec leurs rôles               | ✅           |
| `GET`    | `/api/v1/acl/role/:id/permissions`  | Permissions pour un rôle                       | ✅           |
| `GET`    | `/api/v1/acl/roles/permissions`     | Tous les rôles avec leurs permissions          | ✅           |
| `GET`    | `/api/v1/acl/role/:id/users`        | Vérifier si un rôle est lié à des utilisateurs | ✅           |
| `POST`   | `/api/v1/acl/roles`                 | Créer un rôle                                  | ✅           |
| `POST`   | `/api/v1/acl/permissions`           | Créer une permission                           | ✅           |
| `POST`   | `/api/v1/acl/admins/roles`          | Assigner des rôles à un admin                  | ✅           |
| `DELETE` | `/api/v1/acl/admins/roles`          | Révoquer un rôle d'un admin                    | ✅           |
| `POST`   | `/api/v1/acl/roles/permissions`     | Créer un rôle avec des permissions             | ✅           |
| `PUT`    | `/api/v1/acl/roles/:id/permissions` | Modifier les permissions d'un rôle             | ✅           |
| `DELETE` | `/api/v1/acl/roles/:id`             | Supprimer un rôle avec ses permissions         | ✅           |

## Format du token d'authentification

### Type de token

L'API utilise des **Access Tokens** générés par AdonisJS.

### Format de réponse lors de la connexion

```json
{
  "token": {
    "type": "bearer",
    "name": null,
    "token": "oat_MjQuMGQ0YTM5NGEtZWJkOS00YWM2LWIwYTctN2ZkZTVlOGE1NzQz.YUhSMGNITWlPaUk4VUhOMGNTdFJJVGQzUW1wQldHZHFiVWhOZW1Ob01EWXIvdz09",
    "abilities": ["*"],
    "lastUsedAt": null,
    "expiresAt": null
  }
}
```

### Utilisation du token dans les headers

```http
Authorization: Bearer oat_MjQuMGQ0YTM5NGEtZWJkOS00YWM2LWIwYTctN2ZkZTVlOGE1NzQz.YUhSMGNITWlPaUk4VUhOMGNTdFJJVGQzUW1wQldHZHFiVkhOZW1Ob01EWXIvdz09
```

### Propriétés du token

- **`type`** : Toujours "bearer"
- **`token`** : Le token d'accès à utiliser (commence par "oat\_")
- **`abilities`** : Permissions associées au token (["*"] = toutes les permissions)
- **`expiresAt`** : Date d'expiration (null = pas d'expiration)
- **`lastUsedAt`** : Dernière utilisation du token

### Durée de vie

Les tokens n'ont pas de date d'expiration par défaut et restent valides jusqu'à déconnexion explicite.

### Déconnexion

Pour invalider un token, utilisez l'endpoint `POST /api/v1/auth/logout` avec le token dans l'header Authorization.

## Exemples d'utilisation

### Connexion

```bash
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Utilisation d'un endpoint protégé

```bash
curl -X GET http://localhost:3333/api/v1/auth/current-user \
  -H "Authorization: Bearer your_token_here"
```

### Création d'un véhicule

```bash
curl -X POST http://localhost:3333/api/v1/vehicles \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
  "model": "Corolla",
  "color": "Red",
  "licensePlate": "ABC123",
  "year": 2020,
  "numberOfSeats": 5,
  "fuelType": "Gasoline",
  "hasAirConditioning": true,
  "isVerified": true
  }'
```

## Notes importantes

- ✅ = Authentification requise
- ❌ = Aucune authentification requise
- Tous les endpoints protégés nécessitent le header `Authorization: Bearer {token}`
- Le format des UUID utilisés dans les URLs est UUID v4
- L'API retourne du JSON pour toutes les réponses
- Les erreurs sont retournées avec des codes de statut HTTP appropriés

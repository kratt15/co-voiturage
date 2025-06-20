# 🚀 SPRINT 2 JOURS - Finir le MVP Co-voiturage

_Plan d'action intensif - Janvier 2025_

## 🎯 Objectif MVP

**Livrer une application fonctionnelle** avec les fonctionnalités de base du co-voiturage :

- ✅ Inscription/Connexion utilisateurs
- ✅ Créer et consulter des trajets
- ✅ Réserver des places
- ✅ API REST complète et testée

**Scope OUT (pas dans le MVP) :**

- ❌ Frontend/UI (API seulement)
- ❌ Paiements en ligne
- ❌ Messagerie temps réel
- ❌ Notifications push
- ❌ Upload photos

---

## 📅 JOUR 1 - Foundation API (8h)

### 🌅 MATIN (4h) - Authentification

**09:00-10:30 | AuthController (1.5h)**

```bash
# Créer le contrôleur auth
node ace make:controller auth
```

Endpoints à implémenter :

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

**10:30-12:00 | Validators + Routes (1.5h)**

```bash
# Créer les validators
node ace make:validator auth/register
node ace make:validator auth/login
```

Validators à créer :

- `registerValidator` (email, password, firstName, lastName, phone, birthDate)
- `loginValidator` (email, password)

Routes à ajouter dans `start/routes.ts` :

```typescript
router
  .group(() => {
    router.post('/register', [authController, 'register'])
    router.post('/login', [authController, 'login'])
    router.post('/logout', [authController, 'logout']).use([middleware.auth()])
    router.get('/me', [authController, 'me']).use([middleware.auth()])
  })
  .prefix('/auth')
```

**🕐 12:00-13:00 | PAUSE DÉJEUNER**

### 🌇 APRÈS-MIDI (4h) - Trajets Core

**13:00-14:30 | TripsController (1.5h)**

```bash
# Créer le contrôleur trajets
node ace make:controller trips
```

Endpoints MVP :

- `GET /api/v1/trips` (recherche avec filtres basic)
- `POST /api/v1/trips` (créer trajet)
- `GET /api/v1/trips/:id` (détails trajet)
- `PUT /api/v1/trips/:id` (modifier trajet)
- `DELETE /api/v1/trips/:id` (supprimer trajet)

**14:30-16:00 | TripValidator + TripService (1.5h)**

```bash
# Créer validator et service
node ace make:validator trip
mkdir app/services
touch app/services/trip_service.ts
```

**16:00-17:00 | Routes + Tests Auth (1h)**

- Ajouter routes trips dans `start/routes.ts`
- Tests rapides authentification avec Postman/Insomnia

---

## 📅 JOUR 2 - Booking + Finitions (8h)

### 🌅 MATIN (4h) - Réservations

**09:00-10:30 | BookingsController (1.5h)**

```bash
# Créer le contrôleur réservations
node ace make:controller bookings
```

Endpoints MVP :

- `POST /api/v1/trips/:id/bookings` (réserver des places)
- `GET /api/v1/bookings` (mes réservations)
- `PUT /api/v1/bookings/:id` (modifier statut)
- `DELETE /api/v1/bookings/:id` (annuler)

**10:30-12:00 | BookingValidator + Logic (1.5h)**

```bash
# Créer validator réservation
node ace make:validator booking
```

Logique métier critique :

- Vérifier places disponibles
- Calculer prix total
- Mettre à jour `availableSeats` du trajet
- Gestion des statuts PENDING → CONFIRMED

**🕐 12:00-13:00 | PAUSE DÉJEUNER**

### 🌇 APRÈS-MIDI (4h) - API Complete + Tests

**13:00-14:00 | UsersController (1h)**

```bash
# Contrôleur profils users
node ace make:controller users
```

Endpoints simples :

- `GET /api/v1/users/profile` (profil utilisateur)
- `PUT /api/v1/users/profile` (modifier profil)

**14:00-15:30 | VehiclesController (1.5h)**

```bash
# Contrôleur véhicules basique
node ace make:controller vehicles
```

CRUD simple pour véhicules :

- `GET /api/v1/vehicles` (mes véhicules)
- `POST /api/v1/vehicles` (ajouter véhicule)
- `PUT /api/v1/vehicles/:id` (modifier)
- `DELETE /api/v1/vehicles/:id` (supprimer)

**15:30-17:00 | Tests + Documentation (1.5h)**

- Tests fonctionnels rapides des nouveaux endpoints
- Documentation API avec exemples (README)
- Validation que tout fonctionne end-to-end

---

## 🛠️ Implémentation Parallèle Recommandée

### Jour 1 - Détail des fichiers à créer

**AuthController (`app/controllers/auth_controller.ts`)**

```typescript
export default class AuthController {
  async register({ request, response }: HttpContext) {
    // Validation + création user + token
  }

  async login({ request, response, auth }: HttpContext) {
    // Vérification credentials + génération token
  }

  async logout({ auth, response }: HttpContext) {
    // Suppression token
  }

  async me({ auth, response }: HttpContext) {
    // Retourner user connecté
  }
}
```

**RegisterValidator (`app/validators/auth/register.ts`)**

```typescript
export const registerValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2),
    lastName: vine.string().trim().minLength(2),
    email: vine.string().email().normalizeEmail(),
    phone: vine.string().mobile(),
    birthDate: vine.date(),
    password: vine.string().minLength(8),
  })
)
```

### Jour 2 - Logique métier critique

**BookingService logique places :**

```typescript
// Dans booking creation
const trip = await Trip.findOrFail(tripId)
if (trip.availableSeats < numberOfSeats) {
  throw new Error('Pas assez de places')
}

// Créer booking
const booking = await Booking.create({...})

// Mettre à jour places
trip.availableSeats -= numberOfSeats
if (trip.availableSeats === 0) {
  trip.status = 'FULL'
}
await trip.save()
```

---

## ⚡ Optimisations Sprint

### Code Réutilisable

1. **BaseController** avec méthodes communes
2. **Response helpers** pour format JSON standardisé
3. **Error handlers** globaux
4. **Middleware validation** générique

### Tests Minimalistes

- **Happy path** uniquement pour le MVP
- **Postman collection** avec tous les endpoints
- **Un test fonctionnel** par contrôleur principal

### Architecture Simple

- **Pas de services complexes** pour le MVP
- **Logique directe** dans les contrôleurs
- **Validation basique** VineJS
- **Relations simples** Lucid ORM

---

## 📋 Checklist MVP Final

### ✅ Jour 1 Objectifs

- [ ] AuthController 4 endpoints fonctionnels
- [ ] TripsController 5 endpoints fonctionnels
- [ ] Validators auth + trips
- [ ] Routes configurées
- [ ] Tests manuels auth + trips

### ✅ Jour 2 Objectifs

- [ ] BookingsController 4 endpoints fonctionnels
- [ ] UsersController profil basique
- [ ] VehiclesController CRUD simple
- [ ] Logique réservation avec gestion places
- [ ] Documentation API complète
- [ ] Collection Postman testée

---

## 🚀 Livrable Final (Vendredi Soir)

**API REST complète avec :**

- ✅ 20+ endpoints fonctionnels
- ✅ Authentification JWT sécurisée
- ✅ CRUD complet trajets et réservations
- ✅ Gestion des véhicules et profils
- ✅ Logique métier covoiturage opérationnelle
- ✅ Tests de validation
- ✅ Documentation développeur

**Architecture prête pour :**

- 🔄 Développement frontend immédiat
- 🔄 Ajout paiements futurs
- 🔄 Système notifications
- 🔄 Messagerie utilisateurs

---

## 💡 Tips Sprint Efficace

### Productivité Max

1. **Copier/adapter** le code ACL existant (structure similaire)
2. **Générer code** avec les commandes `node ace make:`
3. **Tester au fur et mesure** avec Postman
4. **Pas de sur-engineering** - code simple et fonctionnel

### Priorités

1. **Fonctionnel > Parfait** - MVP avant optimisation
2. **Core features** avant nice-to-have
3. **Tests manuels** avant tests automatiques
4. **API stable** avant interface graphique

### Dépannage

- **Lucid relations** : documentation officielle AdonisJS
- **Validation errors** : console.log les erreurs
- **Tests rapides** : curl ou Postman
- **Debug DB** : `node ace repl` pour tester modèles

---

**🎯 Go ! Avec ce plan, vous avez une application de covoiturage fonctionnelle en 2 jours !**

_Prêt à commencer par l'AuthController ?_

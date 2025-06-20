# 🚀 SPRINT 2 JOURS - Finir le MVP Co-voiturage

_Plan d'action intensif - Janvier 2025_

## 🎯 Objectif MVP

**Livrer une application fonctionnelle** avec les fonctionnalités de base :

- ✅ Inscription/Connexion utilisateurs
- ✅ Créer et consulter des trajets
- ✅ Réserver des places
- ✅ API REST complète et testée

**Scope OUT (pas dans le MVP) :**

- ❌ Frontend/UI (API seulement)
- ❌ Paiements en ligne
- ❌ Messagerie temps réel
- ❌ Upload photos

---

## 📅 JOUR 1 - Foundation API (8h)

### 🌅 MATIN (4h) - Authentification

**09:00-10:30 | AuthController (1.5h)**

```bash
node ace make:controller auth
```

Endpoints à implémenter :

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

**10:30-12:00 | Validators + Routes (1.5h)**

```bash
node ace make:validator auth/register
node ace make:validator auth/login
```

### 🌇 APRÈS-MIDI (4h) - Trajets Core

**13:00-14:30 | TripsController (1.5h)**

```bash
node ace make:controller trips
```

Endpoints MVP :

- `GET /api/v1/trips` (recherche)
- `POST /api/v1/trips` (créer)
- `GET /api/v1/trips/:id` (détails)
- `PUT /api/v1/trips/:id` (modifier)

**14:30-16:00 | TripValidator + Service (1.5h)**
**16:00-17:00 | Routes + Tests (1h)**

---

## 📅 JOUR 2 - Booking + Finitions (8h)

### 🌅 MATIN (4h) - Réservations

**09:00-10:30 | BookingsController (1.5h)**
**10:30-12:00 | BookingValidator + Logic (1.5h)**

### 🌇 APRÈS-MIDI (4h) - API Complete

**13:00-14:00 | UsersController (1h)**
**14:00-15:30 | VehiclesController (1.5h)**
**15:30-17:00 | Tests + Documentation (1.5h)**

---

## 📋 Checklist MVP Final

### ✅ Jour 1 Objectifs

- [ ] AuthController 4 endpoints
- [ ] TripsController 5 endpoints
- [ ] Validators auth + trips
- [ ] Routes configurées

### ✅ Jour 2 Objectifs

- [ ] BookingsController 4 endpoints
- [ ] UsersController profil
- [ ] VehiclesController CRUD
- [ ] Documentation API

---

**🎯 Avec ce plan, vous avez une API covoiturage complète en 2 jours !**

_Prêt à commencer par l'AuthController ?_

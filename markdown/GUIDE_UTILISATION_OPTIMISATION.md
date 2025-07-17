# Guide d'utilisation - Système d'optimisation de covoiturage

## 🚀 Introduction

Le système d'optimisation de covoiturage utilise l'API Mapbox Optimization v2 pour calculer automatiquement les meilleurs itinéraires lorsque plusieurs passagers doivent être pris en charge et déposés à différents endroits.

## 📋 Fonctionnalités principales

### 1. **Optimisation automatique des trajets**
- Calcul automatique de l'ordre optimal des arrêts
- Prise en compte des fenêtres horaires
- Gestion de la capacité du véhicule
- Minimisation du temps total de trajet

### 2. **Gestion intelligente des réservations**
- Réoptimisation automatique lors de l'ajout/suppression de réservations
- Validation des places disponibles
- Notification des horaires de pickup

### 3. **API complète**
- Routes pour conducteurs et passagers
- Gestion des statuts de réservation
- Historique des optimisations

## 🔧 Configuration

### Variables d'environnement requises
```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## 📝 Utilisation

### 1. Créer un trajet avec optimisation

```http
POST /api/v1/trips/optimization
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "vehicleId": 1,
  "departureCoordinates": {
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  "departureCity": "Paris",
  "arrivalCity": "Lyon",
  "arrivalCoordinates": {
    "latitude": 45.7640,
    "longitude": 4.8357
  },
  "departureDate": "2024-02-15",
  "departureTime": "08:00",
  "estimatedDuration": 240,
  "distanceKm": 465,
  "pricePerSeat": 30,
  "totalSeats": 4,
  "status": "PUBLISHED"
}
```

### 2. Créer une réservation (déclenche l'optimisation)

```http
POST /api/v1/bookings/trips/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "tripId": 1,
  "numberOfSeats": 2,
  "passengerComment": "Je serai à la gare principale"
}
```

### 3. Optimiser manuellement un trajet

```http
POST /api/v1/trips/{{tripId}}/optimize
Authorization: Bearer {{token}}
```

### 4. Récupérer la route optimisée

```http
GET /api/v1/trips/{{tripUuid}}/optimized-route
Authorization: Bearer {{token}}
```

## 📊 Format de la réponse optimisée

```json
{
  "routes": [{
    "vehicle": "vehicle-1",
    "stops": [
      {
        "location": "driver-start",
        "eta": "2024-02-15T08:00:00Z",
        "type": "start",
        "odometer": 0
      },
      {
        "location": "pickup-1",
        "eta": "2024-02-15T08:25:00Z",
        "type": "pickup",
        "duration": 180,
        "odometer": 12500,
        "bookingIds": [1]
      },
      {
        "location": "dropoff-1",
        "eta": "2024-02-15T11:30:00Z",
        "type": "dropoff",
        "duration": 120,
        "odometer": 450000,
        "bookingIds": [1]
      },
      {
        "location": "driver-end",
        "eta": "2024-02-15T12:00:00Z",
        "type": "end",
        "odometer": 465000
      }
    ]
  }]
}
```

## 🔄 Flux de travail

### Pour un conducteur :
1. Créer un trajet avec les points de départ et d'arrivée
2. Les passagers réservent des places
3. Le système optimise automatiquement l'itinéraire
4. Le conducteur reçoit l'ordre optimal des arrêts

### Pour un passager :
1. Rechercher des trajets disponibles
2. Réserver une place
3. Recevoir la confirmation avec l'heure de pickup estimée
4. Être notifié si l'heure change suite à d'autres réservations

## ⚠️ Limitations actuelles

1. **Coordonnées de pickup/dropoff** : Actuellement, les coordonnées utilisent les mêmes que le trajet principal
2. **Fenêtres horaires** : Définies par défaut à ±30 minutes du départ
3. **Notifications** : Les horaires de pickup sont calculés mais pas encore envoyés

## 🛠️ Dépannage

### Erreur "Timeout: solution non trouvée"
- L'API peut prendre jusqu'à 60 secondes pour des trajets complexes
- Réduire le nombre de points ou simplifier les contraintes

### Erreur "Configuration du trajet invalide"
- Vérifier que toutes les coordonnées sont valides
- S'assurer que les fenêtres horaires sont cohérentes

### Trajets "dropped"
- Certaines réservations peuvent être impossibles à satisfaire
- Vérifier les contraintes de temps et de capacité

# Service d'Optimisation OpenRouteService - Guide Complet

## 🎯 Qu'est-ce que le Service d'Optimisation ?

Le service d'optimisation d'OpenRouteService résout les **Problèmes de Routage de Véhicules (VRP - Vehicle Routing Problems)**. En termes simples, il aide à organiser efficacement les trajets de plusieurs véhicules pour accomplir plusieurs tâches.

## 🚗 Applications Réelles

### Exemples concrets :

- **Livraison de colis** : Optimiser les routes de camions de livraison
- **Covoiturage** : Organiser les trajets de plusieurs conducteurs
- **Services de transport** : Planifier les itinéraires de taxis ou VTC
- **Maintenance** : Organiser les visites de techniciens

## 📋 Concepts Clés

### 1. **Véhicules (Vehicles)**

```json
{
  "id": 1,
  "profile": "driving-car",
  "start": [2.3522, 48.8566], // Point de départ
  "end": [3.0667, 50.6333], // Point d'arrivée
  "capacity": [4], // Capacité de transport
  "skills": [1, 2], // Compétences requises
  "time_window": [28800, 43200] // Fenêtre de temps (8h-12h)
}
```

### 2. **Tâches (Jobs)**

```json
{
  "id": 1,
  "service": 300, // Temps de service (5 min)
  "delivery": [1], // Quantité à livrer
  "location": [2.348, 44.8738], // Coordonnées
  "skills": [1], // Compétences requises
  "time_windows": [[32400, 36000]] // Fenêtres de temps
}
```

## 🕐 Gestion du Temps

### **Tous les temps sont en secondes :**

- **1 minute** = 60 secondes
- **1 heure** = 3600 secondes
- **8h00** = 28800 secondes
- **12h00** = 43200 secondes

### **Fenêtres de temps :**

```json
"time_window": [28800, 43200]  // Entre 8h00 et 12h00
```

## 📍 Coordonnées

### **Format attendu : [longitude, latitude]**

```json
// ❌ Incorrect
"location": [48.8566, 2.3522]  // [lat, lon]

// ✅ Correct
"location": [2.3522, 48.8566]  // [lon, lat]
```

## 📏 Distances

### **Toutes les distances sont en mètres :**

- **1 km** = 1000 mètres
- **500 m** = 500 mètres

## 🎯 Exemple Pratique - Covoiturage

### **Scénario :**

- 1 conducteur part de Paris
- Doit récupérer 2 passagers à différents endroits
- Doit les déposer à Lille

### **Configuration :**

```json
{
  "vehicles": [
    {
      "id": 1,
      "profile": "driving-car",
      "start": [2.3522, 48.8566], // Paris
      "end": [3.0667, 50.6333], // Lille
      "capacity": [2], // 2 places disponibles
      "time_window": [0, 86400] // Toute la journée
    }
  ],
  "jobs": [
    {
      "id": 1,
      "service": 300, // 5 min pour récupérer
      "delivery": [1], // 1 passager
      "location": [2.348, 44.8738], // Point de collecte 1
      "skills": [1]
    },
    {
      "id": 2,
      "service": 300, // 5 min pour récupérer
      "delivery": [1], // 1 passager
      "location": [2.3972, 49.0761], // Point de collecte 2
      "skills": [1]
    }
  ]
}
```

## 🔧 Résultat d'Optimisation

### **Ce que retourne le service :**

```json
{
  "summary": {
    "cost": 52527, // Coût total en secondes
    "routes": 1, // Nombre de routes créées
    "unassigned": 0, // Tâches non assignées
    "duration": 52527, // Durée totale
    "service": 600 // Temps de service total
  },
  "routes": [
    {
      "vehicle": 1,
      "steps": [
        {
          "type": "start",
          "location": [2.3522, 48.8566], // Départ Paris
          "arrival": 0
        },
        {
          "type": "job",
          "location": [2.348, 44.8738], // Collecte passager 1
          "arrival": 22646,
          "duration": 22646
        },
        {
          "type": "job",
          "location": [2.3972, 49.0761], // Collecte passager 2
          "arrival": 52827,
          "duration": 52527
        },
        {
          "type": "end",
          "location": [3.0667, 50.6333], // Arrivée Lille
          "arrival": 53127
        }
      ]
    }
  ]
}
```

## 🎯 Avantages du Service

### **1. Optimisation Automatique**

- Trouve la route la plus efficace
- Minimise le temps de trajet
- Respecte les contraintes

### **2. Gestion des Contraintes**

- **Capacité** : Nombre de passagers/colis
- **Compétences** : Qualifications requises
- **Fenêtres de temps** : Horaires disponibles
- **Points de service** : Temps d'arrêt

### **3. Flexibilité**

- Plusieurs véhicules
- Plusieurs types de tâches
- Contraintes personnalisables

## 🚀 Utilisation dans votre Projet

### **Pour le covoiturage :**

1. **Véhicules** = Conducteurs disponibles
2. **Jobs** = Passagers à récupérer
3. **Capacité** = Places disponibles
4. **Skills** = Préférences (fumeur/non-fumeur, etc.)

### **Avantages :**

- ✅ Optimisation automatique des trajets
- ✅ Gestion des contraintes horaires
- ✅ Respect des capacités
- ✅ Calcul précis des durées

## 📚 Ressources

- **Documentation VROOM** : https://github.com/VROOM-Project/vroom
- **API OpenRouteService** : https://openrouteservice.org/dev/#/api-docs
- **Exemples d'utilisation** : https://github.com/VROOM-Project/vroom/tree/master/docs

---

_Ce service transforme la planification de trajets complexe en une optimisation automatique et efficace !_

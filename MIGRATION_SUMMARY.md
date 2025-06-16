# Récapitulatif des Migrations et Modèles - Système de Covoiturage

## 🗄️ Base de Données : 8 Tables Principales

### 1. **Users** (Table principale)

- **Migration**: `1748910275556_create_users_table.ts`
- **Modèle**: `app/models/user.ts`
- **Clé primaire**: UUID
- **Spécialités**: Hérite les fonctionnalités Driver et Passenger
- **Relations**:
  - Véhicules (1:N)
  - Trajets comme conducteur (1:N)
  - Réservations comme passager (1:N)
  - Avis donnés/reçus (1:N)
  - Notifications (1:N)

### 2. **Vehicles**

- **Migration**: `1748910275600_create_vehicles_table.ts`
- **Modèle**: `app/models/vehicle.ts`
- **Clé primaire**: UUID
- **Relations**:
  - Appartient à un conducteur (N:1)
  - Utilisé dans plusieurs trajets (1:N)

### 3. **Trips**

- **Migration**: `1748910275650_create_trips_table.ts`
- **Modèle**: `app/models/trip.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Gestion des statuts, places disponibles
- **Relations**:
  - Créé par un conducteur (N:1)
  - Utilise un véhicule (N:1)
  - A plusieurs réservations (1:N)
  - Génère des avis (1:N)

### 4. **Bookings**

- **Migration**: `1748910275700_create_bookings_table.ts`
- **Modèle**: `app/models/booking.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Gestion des statuts de réservation
- **Relations**:
  - Appartient à un trajet (N:1)
  - Effectuée par un passager (N:1)
  - A un paiement (1:1)
  - Génère des avis (1:N)

### 5. **Payments**

- **Migration**: `1748910275750_create_payments_table.ts`
- **Modèle**: `app/models/payment.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Gestion des paiements et remboursements
- **Relations**:
  - Lié à une réservation (1:1)

### 6. **Reviews**

- **Migration**: `1748910275800_create_reviews_table.ts`
- **Modèle**: `app/models/review.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Système de notation bidirectionnel
- **Relations**:
  - Auteur (N:1 avec User)
  - Destinataire (N:1 avec User)
  - Concerne un trajet (N:1)
  - Optionnellement lié à une réservation (N:1)

### 7. **Messages**

- **Migration**: `1748910275850_create_messages_table.ts`
- **Modèle**: `app/models/message.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Système de messagerie entre utilisateurs
- **Relations**:
  - Expéditeur (N:1 avec User)
  - Destinataire (N:1 avec User)
  - Optionnellement lié à un trajet (N:1)

### 8. **Notifications**

- **Migration**: `1748910275900_create_notifications_table.ts`
- **Modèle**: `app/models/notification.ts`
- **Clé primaire**: UUID
- **Fonctionnalités**: Système de notifications push
- **Relations**:
  - Destinée à un utilisateur (N:1)

## 🔧 Fonctionnalités Implémentées

### **Stratégie d'Identifiants**

- ✅ UUID v4 pour tous les IDs
- ✅ Génération automatique via hooks `before('create')`
- ✅ Sécurité renforcée (non-prédictibilité)

### **Types de Données Optimisés**

- ✅ `Double` pour les montants financiers (précision)
- ✅ `Boolean` pour les flags
- ✅ `ENUM` pour les statuts
- ✅ `JSON` pour les données complexes (arrêts possibles, métadonnées)

### **Relations UML Respectées**

- ✅ Héritage : User → Driver/Passenger (table unique)
- ✅ Agrégation : Conducteur ◇—— Véhicule
- ✅ Composition : Trajet ♦—— Réservation
- ✅ Associations : toutes les cardinalités respectées

### **Index de Performance**

- ✅ Index sur les clés étrangères
- ✅ Index composites pour les recherches fréquentes
- ✅ Index sur les statuts et dates

### **Méthodes Métier Intégrées**

- ✅ Gestion automatique des places disponibles
- ✅ Calcul automatique des notes globales
- ✅ Méthodes de validation des statuts
- ✅ Gestion des conversations et messages non lus

## 🚀 Commandes pour Tester

```bash
# Exécuter les migrations
node ace migration:run

# Vérifier le statut des migrations
node ace migration:status

# Rollback si nécessaire
node ace migration:rollback

# Créer des données de test
node ace db:seed
```

## 📊 Diagramme de Classes Implémenté

Le système respecte exactement le diagramme UML défini dans `covoid2.mermaid` avec :

- 8 tables principales
- Relations avec cardinalités correctes
- Types de données optimisés pour AdonisJS 6
- Support PostgreSQL natif
- Architecture prête pour la scalabilité

## 🔒 Sécurité

- ✅ UUID non-prédictibles
- ✅ Contraintes de clés étrangères
- ✅ Contraintes d'unicité
- ✅ Validation des statuts via ENUM
- ✅ Soft delete potentiel via timestamps

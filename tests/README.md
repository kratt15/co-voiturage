# Tests du Système de Co-voiturage

Ce dossier contient tous les tests pour l'application de co-voiturage, utilisant **Japa** comme framework de test.

## Structure des Tests

```
tests/
├── bootstrap.ts              # Configuration de base de Japa
├── functional/               # Tests fonctionnels (routes & contrôleurs)
│   └── roles_and_permissions.spec.ts
├── unit/                     # Tests unitaires (services & modèles)
│   └── services/
│       └── acl_service.spec.ts
├── helpers/                  # Helpers pour les tests
│   └── auth_helper.ts
└── README.md                # Ce fichier
```

## Types de Tests

### 1. Tests Fonctionnels (`functional/`)

Testent l'intégration complète des routes, contrôleurs et middleware :

- Tests des endpoints API
- Vérification de l'authentification
- Validation des données d'entrée
- Codes de statut HTTP
- Format des réponses JSON

### 2. Tests Unitaires (`unit/`)

Testent la logique métier isolée :

- Services (AclService, etc.)
- Modèles
- Helpers
- Fonctions utilitaires

## Commandes pour exécuter les tests

### Tous les tests

```bash
node ace test
```

### Tests spécifiques

```bash
# Tests fonctionnels seulement
node ace test --grep "functional"

# Tests unitaires seulement
node ace test --grep "unit"

# Test spécifique
node ace test --grep "Roles and Permissions API"
```

### Tests avec couverture

```bash
node ace test --coverage
```

### Tests en mode watch

```bash
node ace test --watch
```

## Configuration

### Base de données de test

Les tests utilisent une base de données séparée configurée dans `.env.test` :

```env
DB_DATABASE=co_voiturage_test
```

### Nettoyage automatique

- `group.setup()` : Nettoie la DB avant chaque groupe de tests
- `group.teardown()` : Nettoie la DB après chaque groupe de tests
- `group.each.setup()` : Prépare les données pour chaque test
- `group.each.teardown()` : Nettoie après chaque test

## Tests Rôles et Permissions

### Tests Fonctionnels (`roles_and_permissions.spec.ts`)

#### Routes testées :

- **GET** `/api/v1/acl/roles` - Récupérer tous les rôles
- **GET** `/api/v1/acl/permissions` - Récupérer toutes les permissions
- **GET** `/api/v1/acl/admin/roles` - Rôles de l'utilisateur actuel
- **GET** `/api/v1/acl/admins/roles` - Tous les admins avec leurs rôles
- **GET** `/api/v1/acl/role/:id/permissions` - Permissions d'un rôle
- **GET** `/api/v1/acl/roles/permissions` - Tous les rôles avec permissions
- **GET** `/api/v1/acl/role/:id/users` - Utilisateurs assignés à un rôle
- **POST** `/api/v1/acl/roles` - Créer un rôle
- **POST** `/api/v1/acl/permissions` - Créer une permission
- **POST** `/api/v1/acl/admins/roles` - Assigner des rôles
- **DELETE** `/api/v1/acl/admins/roles` - Révoquer des rôles
- **POST** `/api/v1/acl/roles/permissions` - Créer rôle avec permissions
- **PUT** `/api/v1/acl/roles/:id/permissions` - Modifier rôle et permissions
- **DELETE** `/api/v1/acl/roles/:id` - Supprimer un rôle

#### Scénarios testés :

✅ **Cas de succès** - Toutes les opérations normales  
✅ **Cas d'erreur** - Entités non trouvées (404)  
✅ **Validation** - Données invalides (422)  
✅ **Authentification** - Accès non autorisé (401)  
✅ **Duplications** - Conflits de données (400)

### Tests Unitaires (`acl_service.spec.ts`)

#### Méthodes testées :

- `getAllRoles()` - Récupération des rôles
- `getAllPermissions()` - Récupération des permissions
- `getUserRoles()` - Rôles d'un utilisateur
- `getAllAdminsWithRoles()` - Admins avec rôles
- `getPermissionsForRole()` - Permissions d'un rôle
- `checkRoleAssignedToUsers()` - Vérification d'assignation
- `createRole()` - Création de rôle
- `createPermission()` - Création de permission
- `validateRoles()` - Validation des rôles
- `assignRolesToUser()` - Attribution de rôles
- `revokeRolesFromUser()` - Révocation de rôles
- `validatePermissions()` - Validation des permissions
- `createRoleWithPermissions()` - Création rôle avec permissions
- `updateRoleWithPermissions()` - Mise à jour rôle
- `deleteRole()` - Suppression de rôle
- `getAllRolesWithPermissions()` - Rôles avec permissions

#### Gestion d'erreurs testée :

✅ **PrimaryException** - Erreurs métier  
✅ **Validations** - Données invalides  
✅ **Entités non trouvées** - Erreurs 404  
✅ **Contraintes** - Duplications, etc.

## Helpers de Test

### `auth_helper.ts`

Contient des fonctions utilitaires pour :

- `createTestAdmin()` - Créer un admin de test
- `createTestUser()` - Créer un utilisateur de test
- `authenticateAs()` - Authentifier dans les tests

## Bonnes Pratiques

### 1. Isolation des tests

- Chaque test est indépendant
- Données nettoyées entre les tests
- Pas d'état partagé

### 2. Noms descriptifs

```typescript
test('POST /api/v1/acl/roles - should return 400 for duplicate role', ...)
```

### 3. Structure AAA

```typescript
test('should create role', async ({ assert }) => {
  // Arrange - Préparer les données
  const roleData = { slug: 'test-role' }

  // Act - Exécuter l'action
  const role = await aclService.createRole(roleData.slug)

  // Assert - Vérifier le résultat
  assert.equal(role.slug, 'test-role')
})
```

### 4. Assertions spécifiques

```typescript
// ✅ Bon
response.assertStatus(201)
response.assertBodyContains({ message: 'Role created successfully' })

// ❌ Éviter
assert.isTrue(response.status() === 201)
```

## Exemple d'Exécution

```bash
$ node ace test

  Roles and Permissions API
    ✅ GET /api/v1/acl/roles - should get all roles (42ms)
    ✅ GET /api/v1/acl/permissions - should get all permissions (28ms)
    ✅ POST /api/v1/acl/roles - should create a new role (35ms)
    ✅ should return 401 for unauthenticated requests (12ms)
    ...

  AclService Unit Tests
    ✅ getAllRoles should return all roles (15ms)
    ✅ createRole should create a new role (22ms)
    ✅ createRole should throw exception for duplicate slug (18ms)
    ...

  Tests: 47 passed (2.3s)
```

## Débogage

### Logs de test

```typescript
test('debug test', async ({ assert }) => {
  console.log('Debug info:', data)
  // ...
})
```

### Variables d'environnement

```bash
DEBUG=1 node ace test
LOG_LEVEL=debug node ace test
```

Cette suite de tests garantit la fiabilité et la robustesse du système de rôles et permissions ! 🚀

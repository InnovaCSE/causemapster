# API d'Authentification - Arbre des Causes

## Endpoint d'Enregistrement

### `POST /api/auth/register`

Crée un nouvel utilisateur avec Supabase Auth et ajoute ses informations dans la table utilisateurs personnalisée.

#### Données d'entrée

```json
{
  "email": "jean.dupont@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

#### Validation

- **email** : Format email valide (obligatoire)
- **password** : Minimum 6 caractères (obligatoire)
- **firstName** : Non vide (obligatoire)
- **lastName** : Non vide (obligatoire)

#### Réponse de succès (201)

```json
{
  "user": {
    "id": "25f6b366-9fd0-46c4-94d8-ef069354aa87",
    "email": "jean.dupont@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "utilisateur"
  }
}
```

#### Réponses d'erreur

**400 - Données invalides**
```json
{
  "message": "Email invalide, Le mot de passe doit contenir au moins 6 caractères"
}
```

**400 - Email déjà utilisé**
```json
{
  "message": "Un compte avec cet email existe déjà"
}
```

**500 - Erreur serveur**
```json
{
  "message": "Erreur lors de la création du compte"
}
```

## Endpoint de Connexion

### `POST /api/auth/login`

Authentifie un utilisateur avec Supabase Auth et retourne ses informations de profil.

#### Données d'entrée

```json
{
  "email": "jean.dupont@example.com",
  "password": "motdepasse123"
}
```

#### Validation

- **email** : Format email valide (obligatoire)
- **password** : Non vide (obligatoire)

#### Réponse de succès (200)

```json
{
  "user": {
    "id": "25f6b366-9fd0-46c4-94d8-ef069354aa87",
    "email": "jean.dupont@example.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "utilisateur"
  }
}
```

#### Réponses d'erreur

**400 - Données invalides**
```json
{
  "message": "Email invalide, Le mot de passe est requis"
}
```

**401 - Identifiants incorrects**
```json
{
  "message": "Email ou mot de passe incorrect"
}
```

**500 - Erreur serveur**
```json
{
  "message": "Erreur lors de la connexion"
}
```

## Architecture Technique

### Service Supabase Auth (`server/services/supabaseService.ts`)

Le service utilise la clé `SUPABASE_SERVICE_ROLE_KEY` pour :
1. Créer l'utilisateur dans Supabase Auth
2. Ajouter ses informations dans la table `users` personnalisée
3. Gérer la cohérence des données

### Schémas de Validation (`shared/authSchemas.ts`)

```typescript
export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis")
});
```

### Base de Données

#### Table `users` (Supabase)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'utilisateur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Variables d'Environnement

- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service pour les opérations admin

## Tests

Tous les cas de test sont validés :
- ✅ Création utilisateur valide
- ✅ Rejet email dupliqué
- ✅ Validation données invalides
- ✅ Validation champs manquants

### Exécuter les tests
```bash
npx vitest run tests/api-register.test.ts
```

## Sécurité

- Utilisation de Supabase Auth pour la gestion sécurisée des mots de passe
- Validation stricte des données d'entrée avec Zod
- Gestion des erreurs appropriée sans exposition d'informations sensibles
- Row Level Security (RLS) activé sur la table `users`
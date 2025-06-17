-- Création de la table utilisateurs dans Supabase
-- Cette table étend les données d'authentification de Supabase Auth

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'utilisateur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS (Row Level Security) pour sécuriser les données
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Politique : les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
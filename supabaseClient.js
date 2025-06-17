import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Récupération des variables d'environnement (⚠️ bien préfixées avec VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// client/src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement depuis le fichier .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

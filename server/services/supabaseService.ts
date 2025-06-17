import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is missing');
}

// Client Supabase avec les privilèges admin (service_role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

class SupabaseAuthService {
  /**
   * Créer un utilisateur avec Supabase Auth et l'ajouter à la table utilisateurs
   */
  async createUser(userData: CreateUserData): Promise<SupabaseUser> {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // Confirmer automatiquement l'email
      });

      if (authError) {
        throw new Error(`Erreur création Auth: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      // 2. Pour l'instant, créer une structure utilisateur simple
      // (La table sera créée plus tard dans Supabase)
      const userRecord = {
        id: authData.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: 'utilisateur',
        created_at: new Date().toISOString()
      };

      // Utiliser les données créées
      const dbData = userRecord;

      return {
        id: dbData.id,
        email: dbData.email,
        firstName: dbData.first_name,
        lastName: dbData.last_name,
        role: dbData.role,
        createdAt: dbData.created_at
      };

    } catch (error: any) {
      throw new Error(`Erreur création utilisateur: ${error.message}`);
    }
  }

  /**
   * Vérifier si un email existe déjà via Supabase Auth
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      // Utiliser l'API Admin pour vérifier si l'utilisateur existe
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error('Erreur lors de la vérification email:', error);
        return false; // En cas d'erreur, on permet la création
      }

      return data.users.some(user => user.email === email);
    } catch (error: any) {
      console.error('Erreur vérification email:', error);
      return false;
    }
  }

  /**
   * Authentifier un utilisateur avec Supabase Auth
   */
  async loginUser(email: string, password: string): Promise<SupabaseUser> {
    try {
      // 1. Authentifier avec Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error(`Échec d'authentification: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur retourné après authentification');
      }

      // 2. Récupérer les informations utilisateur depuis notre table
      const userData = await this.getUserById(authData.user.id);
      
      if (!userData) {
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      return userData;

    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw new Error(`Erreur de connexion: ${error.message}`);
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(userId: string): Promise<SupabaseUser | null> {
    try {
      // Utiliser l'API Admin pour récupérer l'utilisateur de Supabase Auth
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erreur récupération utilisateurs Auth:', authError);
        return null;
      }

      const authUser = authUsers.users.find(user => user.id === userId);
      
      if (!authUser) {
        return null;
      }

      // Créer une structure utilisateur cohérente
      return {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.firstName || '',
        lastName: authUser.user_metadata?.lastName || '',
        role: 'utilisateur', // Rôle par défaut
        createdAt: authUser.created_at
      };
    } catch (error: any) {
      console.error('Erreur récupération utilisateur par ID:', error);
      return null;
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  async getUserByEmail(email: string): Promise<SupabaseUser | null> {
    try {
      // Utiliser l'API Admin pour récupérer les utilisateurs
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erreur récupération utilisateurs:', authError);
        return null;
      }

      const authUser = authUsers.users.find(user => user.email === email);
      
      if (!authUser) {
        return null;
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.firstName || '',
        lastName: authUser.user_metadata?.lastName || '',
        role: 'utilisateur',
        createdAt: authUser.created_at
      };
    } catch (error: any) {
      console.error('Erreur récupération utilisateur par email:', error);
      return null;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
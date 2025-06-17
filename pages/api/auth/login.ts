import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAuthService } from '../../../server/services/supabaseService';
import { loginSchema } from '../../../shared/authSchemas';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface ErrorResponse {
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    // Validation des données d'entrée
    const loginData = loginSchema.parse(req.body);
    
    // Authentifier avec Supabase Auth
    const user = await supabaseAuthService.loginUser(loginData.email, loginData.password);

    // Retourner les informations utilisateur (sans mot de passe)
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("Login error:", error);
    
    // Gestion des erreurs de validation Zod
    if (error.name === "ZodError") {
      const validationErrors = error.issues.map((issue: any) => {
        switch (issue.path[0]) {
          case "email":
            return "Email invalide";
          case "password":
            return "Le mot de passe est requis";
          default:
            return issue.message;
        }
      });
      
      return res.status(400).json({ 
        message: validationErrors.join(", ")
      });
    }
    
    // Gestion des erreurs d'authentification
    if (error.message.includes("Email ou mot de passe incorrect") || 
        error.message.includes("Invalid login credentials")) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    if (error.message.includes("Échec d'authentification")) {
      return res.status(401).json({ 
        message: "Échec de l'authentification" 
      });
    }

    // Erreur générique
    res.status(500).json({ 
      message: "Erreur lors de la connexion" 
    });
  }
}
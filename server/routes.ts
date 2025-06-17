import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { authService } from "./services/authService";
import { openaiService } from "./services/openaiService";
import { supabaseAuthService } from "./services/supabaseService";
import { insertUserSchema, insertAccidentSchema, insertWitnessSchema, insertFragmentSchema, insertMaterialEvidenceSchema, insertCauseTreeSchema } from "@shared/schema";
import { registerSchema, loginSchema } from "@shared/authSchemas";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const user = await authService.getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid authentication" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validation des données d'entrée
      const userData = registerSchema.parse(req.body);
      
      // Vérifier si l'email existe déjà
      const emailExists = await supabaseAuthService.emailExists(userData.email);
      if (emailExists) {
        return res.status(400).json({ 
          message: "Un compte avec cet email existe déjà" 
        });
      }

      // Créer l'utilisateur avec Supabase Auth + table personnalisée
      const user = await supabaseAuthService.createUser(userData);

      // Retourner les informations utilisateur (sans mot de passe)
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          nom: user.lastName,
          prenom: user.firstName,
          role: user.role
        }
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Gestion des erreurs de validation Zod
      if (error.name === "ZodError") {
        const validationErrors = error.issues.map((issue: any) => {
          switch (issue.path[0]) {
            case "email":
              return "Email invalide";
            case "password":
              return "Le mot de passe doit contenir au moins 6 caractères";
            case "firstName":
              return "Le prénom est requis";
            case "lastName":
              return "Le nom est requis";
            default:
              return issue.message;
          }
        });
        
        return res.status(400).json({ 
          message: validationErrors.join(", ")
        });
      }
      
      // Gestion des erreurs spécifiques
      if (error.message.includes("Email already registered")) {
        return res.status(400).json({ 
          message: "Un compte avec cet email existe déjà" 
        });
      }
      
      if (error.message.includes("Invalid email")) {
        return res.status(400).json({ 
          message: "Format d'email invalide" 
        });
      }
      
      if (error.message.includes("Password")) {
        return res.status(400).json({ 
          message: "Le mot de passe doit contenir au moins 6 caractères" 
        });
      }

      // Erreur générique
      res.status(500).json({ 
        message: "Erreur lors de la création du compte" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await authService.destroySession(req);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await authService.getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User routes
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        email,
      });
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Profile update failed" });
    }
  });

  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user || !await bcrypt.compare(currentPassword, user.password)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.user.id, { password: hashedPassword });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Password update failed" });
    }
  });

  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/user/accidents", requireAuth, async (req, res) => {
    try {
      const accidents = await storage.getAccidentsByUser(req.user.id);
      res.json(accidents);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch user accidents" });
    }
  });

  // Accident routes
  app.get("/api/accidents", requireAuth, async (req, res) => {
    try {
      const accidents = await storage.getAccidentsByUser(req.user.id);
      res.json(accidents);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch accidents" });
    }
  });

  app.get("/api/accidents/:id", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }
      
      res.json(accident);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch accident" });
    }
  });

  app.post("/api/accidents", requireAuth, async (req, res) => {
    try {
      const accidentData = insertAccidentSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Generate accident number
      const year = new Date().getFullYear();
      const count = await storage.getAccidentCountForYear(year);
      const accidentNumber = `ACC-${year}-${(count + 1).toString().padStart(3, '0')}`;

      const accident = await storage.createAccident({
        ...accidentData,
        accidentNumber,
      });

      // Handle witnesses if provided
      if (req.body.witnesses && Array.isArray(req.body.witnesses)) {
        for (const witnessData of req.body.witnesses) {
          await storage.createWitness({
            ...witnessData,
            accidentId: accident.id,
          });
        }
      }

      res.json(accident);
    } catch (error) {
      console.error("Accident creation error:", error);
      res.status(400).json({ message: "Failed to create accident" });
    }
  });

  app.patch("/api/accidents/:id", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const updatedAccident = await storage.updateAccident(accidentId, req.body);
      res.json(updatedAccident);
    } catch (error) {
      res.status(400).json({ message: "Failed to update accident" });
    }
  });

  // Witness routes
  app.get("/api/accidents/:id/witnesses", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const witnesses = await storage.getWitnessesByAccident(accidentId);
      res.json(witnesses);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch witnesses" });
    }
  });

  app.post("/api/accidents/:id/witnesses", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const witnessData = insertWitnessSchema.parse({
        ...req.body,
        accidentId,
      });

      const witness = await storage.createWitness(witnessData);
      res.json(witness);
    } catch (error) {
      res.status(400).json({ message: "Failed to create witness" });
    }
  });

  // Fragment routes
  app.get("/api/accidents/:id/fragments", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const fragments = await storage.getFragmentsByAccident(accidentId);
      res.json(fragments);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch fragments" });
    }
  });

  app.post("/api/accidents/:id/fragments", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const { fragments } = req.body;
      const createdFragments = [];

      for (const fragmentData of fragments) {
        const fragment = await storage.createFragment({
          ...fragmentData,
          accidentId,
        });
        createdFragments.push(fragment);
      }

      res.json(createdFragments);
    } catch (error) {
      res.status(400).json({ message: "Failed to create fragments" });
    }
  });

  app.patch("/api/fragments/:id", requireAuth, async (req, res) => {
    try {
      const fragmentId = parseInt(req.params.id);
      const fragment = await storage.getFragment(fragmentId);
      
      if (!fragment) {
        return res.status(404).json({ message: "Fragment not found" });
      }

      // Verify ownership through accident
      const accident = await storage.getAccident(fragment.accidentId);
      if (!accident || accident.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedFragment = await storage.updateFragment(fragmentId, req.body);
      res.json(updatedFragment);
    } catch (error) {
      res.status(400).json({ message: "Failed to update fragment" });
    }
  });

  // Material evidence routes
  app.get("/api/accidents/:id/evidence", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const evidence = await storage.getMaterialEvidenceByAccident(accidentId);
      res.json(evidence);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch evidence" });
    }
  });

  app.post("/api/accidents/:id/evidence", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const evidenceData = insertMaterialEvidenceSchema.parse({
        ...req.body,
        accidentId,
      });

      const evidence = await storage.createMaterialEvidence(evidenceData);
      res.json(evidence);
    } catch (error) {
      res.status(400).json({ message: "Failed to create evidence" });
    }
  });

  app.patch("/api/evidence/:id", requireAuth, async (req, res) => {
    try {
      const evidenceId = parseInt(req.params.id);
      const evidence = await storage.getMaterialEvidence(evidenceId);
      
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Verify ownership through accident
      const accident = await storage.getAccident(evidence.accidentId);
      if (!accident || accident.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedEvidence = await storage.updateMaterialEvidence(evidenceId, req.body);
      res.json(updatedEvidence);
    } catch (error) {
      res.status(400).json({ message: "Failed to update evidence" });
    }
  });

  // Cause tree routes
  app.get("/api/accidents/:id/cause-tree", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const causeTree = await storage.getCauseTreeByAccident(accidentId);
      res.json(causeTree);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch cause tree" });
    }
  });

  app.post("/api/accidents/:id/cause-tree", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const causeTreeData = insertCauseTreeSchema.parse({
        ...req.body,
        accidentId,
      });

      const causeTree = await storage.createCauseTree(causeTreeData);
      res.json(causeTree);
    } catch (error) {
      res.status(400).json({ message: "Failed to create cause tree" });
    }
  });

  // AI analysis routes
  app.post("/api/ai/analyze-testimony", requireAuth, async (req, res) => {
    try {
      const { accidentId, testimony, witnessId } = req.body;
      
      // Verify accident ownership
      const accident = await storage.getAccident(accidentId);
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const analysis = await openaiService.analyzeTestimony(testimony, accident.description);
      res.json(analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "AI analysis failed" });
    }
  });

  app.post("/api/ai/generate-cause-tree", requireAuth, async (req, res) => {
    try {
      const { accidentId, fragments } = req.body;
      
      // Verify accident ownership
      const accident = await storage.getAccident(accidentId);
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      const facts = fragments.map((f: any) => f.content);
      const causeTree = await openaiService.generateCauseTree(facts, accident.description || "");
      res.json(causeTree);
    } catch (error) {
      console.error("Cause tree generation error:", error);
      res.status(500).json({ message: "Cause tree generation failed" });
    }
  });

  // Export routes
  app.post("/api/accidents/:id/export-pdf", requireAuth, async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident || accident.userId !== req.user.id) {
        return res.status(404).json({ message: "Accident not found" });
      }

      // TODO: Implement PDF generation
      // For now, return a mock response
      res.status(501).json({ message: "PDF export not yet implemented" });
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Stats route
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

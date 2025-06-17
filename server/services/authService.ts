import session from "express-session";
import type { Request, Response } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

class AuthService {
  async createSession(req: Request, user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async destroySession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getCurrentUser(req: Request): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    try {
      const user = await storage.getUser(req.session.userId);
      return user || null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  async requireAuth(req: any, res: Response, next: any): Promise<void> {
    const user = await this.getCurrentUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    req.user = user;
    next();
  }

  async requireRole(role: string) {
    return async (req: any, res: Response, next: any): Promise<void> => {
      const user = await this.getCurrentUser(req);
      if (!user || user.role !== role) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
      }
      req.user = user;
      next();
    };
  }

  async checkPlanLimits(req: any, res: Response, next: any): Promise<void> {
    const user = await this.getCurrentUser(req);
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (user.plan === "free") {
      const stats = await storage.getUserStats(user.id);
      if (stats.monthlyUsage >= 3) {
        res.status(403).json({ 
          message: "Plan limit reached. Upgrade to premium for unlimited analyses.",
          code: "PLAN_LIMIT_EXCEEDED"
        });
        return;
      }
    }

    req.user = user;
    next();
  }
}

export const authService = new AuthService();

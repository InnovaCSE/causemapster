import { describe, it, expect, beforeAll } from "vitest";
import { supabaseAuthService } from "../server/services/supabaseService";

describe("Supabase Auth Service", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "test123456",
    firstName: "Jean",
    lastName: "Test"
  };

  beforeAll(async () => {
    // Nettoyer les données de test précédentes si elles existent
    try {
      const existingUser = await supabaseAuthService.getUserByEmail(testUser.email);
      if (existingUser) {
        // Note: dans un vrai test, on supprimerait l'utilisateur
        console.log("Utilisateur de test existant détecté");
      }
    } catch (error) {
      // L'utilisateur n'existe pas, c'est normal
    }
  });

  it("should check if email exists", async () => {
    // Vérifier qu'un email inexistant retourne false
    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
    const exists = await supabaseAuthService.emailExists(nonExistentEmail);
    expect(exists).toBe(false);
  });

  it("should create user with Supabase Auth and custom table", async () => {
    const user = await supabaseAuthService.createUser(testUser);
    
    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);
    expect(user.firstName).toBe(testUser.firstName);
    expect(user.lastName).toBe(testUser.lastName);
    expect(user.role).toBe("utilisateur");
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeDefined();
  });

  it("should retrieve user by email", async () => {
    const user = await supabaseAuthService.getUserByEmail(testUser.email);
    
    expect(user).toBeDefined();
    expect(user?.email).toBe(testUser.email);
    expect(user?.firstName).toBe(testUser.firstName);
    expect(user?.lastName).toBe(testUser.lastName);
  });

  it("should detect existing email", async () => {
    const exists = await supabaseAuthService.emailExists(testUser.email);
    expect(exists).toBe(true);
  });

  it("should handle non-existent user", async () => {
    const nonExistentUser = await supabaseAuthService.getUserByEmail("nonexistent@example.com");
    expect(nonExistentUser).toBeNull();
  });
});
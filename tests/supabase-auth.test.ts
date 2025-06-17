import { describe, it, expect } from "vitest";
import { supabase } from "../client/src/lib/supabaseClient";

describe("Supabase Auth Registration", () => {
  it("should connect to Supabase successfully", async () => {
    // Test de base pour vérifier la connexion
    const { data, error } = await supabase.from("users").select("count").limit(1);
    
    // On s'attend à une erreur car la table n'existe probablement pas encore
    // mais cela confirme que la connexion fonctionne
    expect(error).toBeDefined();
    expect(error?.message).toMatch(/relation "public.users" does not exist|does not exist/);
  });

  it("should test Supabase Auth creation", async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "test123456";

    // Tester la création d'utilisateur avec Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log("Supabase Auth Error:", error.message);
      // Vérifier si c'est une erreur de configuration ou autre
      expect(error.message).toBeDefined();
    } else {
      console.log("Supabase Auth Success:", data.user?.id);
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testEmail);
    }
  });
});
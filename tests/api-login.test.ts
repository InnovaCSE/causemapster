import { describe, it, expect } from "vitest";

describe("API Login Endpoint", () => {
  const baseUrl = "http://localhost:5000";

  it("should login user with valid credentials", async () => {
    // Utiliser un email créé dans le test d'enregistrement
    const loginData = {
      email: "jean.dupont@example.com",
      password: "motdepasse123"
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(loginData.email);
    expect(data.user.id).toBeDefined();
    expect(data.user.first_name).toBeDefined();
    expect(data.user.last_name).toBeDefined();
    expect(data.user.role).toBe("utilisateur");
  });

  it("should reject login with invalid email", async () => {
    const invalidLogin = {
      email: "nonexistent@example.com",
      password: "anypassword"
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(invalidLogin)
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain("Email ou mot de passe incorrect");
  });

  it("should reject login with wrong password", async () => {
    const wrongPassword = {
      email: "jean.dupont@example.com",
      password: "wrongpassword"
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(wrongPassword)
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain("Email ou mot de passe incorrect");
  });

  it("should reject login with invalid email format", async () => {
    const invalidEmailFormat = {
      email: "invalid-email",
      password: "password123"
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(invalidEmailFormat)
    });

    expect(response.status).toBe(400);
  });

  it("should reject login with missing fields", async () => {
    const missingFields = {
      email: "test@example.com"
      // password manquant
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(missingFields)
    });

    expect(response.status).toBe(400);
  });
});
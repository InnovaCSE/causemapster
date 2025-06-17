import { describe, it, expect } from "vitest";

describe("API Registration Endpoint", () => {
  const baseUrl = "http://localhost:5000";

  it("should register a new user successfully", async () => {
    const testUser = {
      email: `test-user-${Date.now()}@example.com`,
      password: "test123456",
      firstName: "Jean",
      lastName: "Test"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.prenom).toBe(testUser.firstName);
    expect(data.user.nom).toBe(testUser.lastName);
    expect(data.user.role).toBe("utilisateur");
    expect(data.user.id).toBeDefined();
  });

  it("should reject registration with duplicate email", async () => {
    const duplicateUser = {
      email: "jean.dupont@example.com", // Email déjà utilisé dans le test précédent
      password: "test123456",
      firstName: "Pierre",
      lastName: "Martin"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(duplicateUser)
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("email existe déjà");
  });

  it("should reject registration with invalid data", async () => {
    const invalidUser = {
      email: "email-invalide",
      password: "123", // Trop court
      firstName: "",
      lastName: "Test"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(invalidUser)
    });

    expect(response.status).toBe(400);
  });

  it("should reject registration with missing fields", async () => {
    const incompleteUser = {
      email: "test@example.com",
      // password manquant
      firstName: "Jean"
      // lastName manquant
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(incompleteUser)
    });

    expect(response.status).toBe(400);
  });
});
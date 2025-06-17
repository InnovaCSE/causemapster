import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!import.meta.env.VITE_DATABASE_URL) {
  throw new Error("VITE_DATABASE_URL is not set");
}

const connectionString = import.meta.env.VITE_DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Client-side database functions (limited operations)
export async function getUser(id: number) {
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return users[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// Note: Most database operations should be done on the server side
// This file is mainly for type definitions and basic client operations
export type { User, Accident, Witness, Fragment } from "@shared/schema";

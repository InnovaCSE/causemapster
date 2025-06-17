import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // user, admin
  plan: text("plan").notNull().default("free"), // free, premium
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accidents = pgTable("accidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accidentNumber: text("accident_number").notNull().unique(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  establishment: text("establishment").notNull(),
  description: text("description"),
  severity: text("severity"), // minor, moderate, severe
  victimName: text("victim_name"),
  victimFirstName: text("victim_first_name"),
  victimPosition: text("victim_position"),
  isAnonymized: boolean("is_anonymized").default(false),
  status: text("status").notNull().default("draft"), // draft, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const witnesses = pgTable("witnesses", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position").notNull(),
  testimony: text("testimony"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fragments = pgTable("fragments", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  witnessId: integer("witness_id"), // null for victim fragments
  content: text("content").notNull(),
  type: text("type").notNull(), // verified_fact, opinion, to_verify, other
  isUnusual: boolean("is_unusual").default(false),
  isNecessary: boolean("is_necessary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialEvidence = pgTable("material_evidence", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  description: text("description").notNull(),
  isUseful: boolean("is_useful").default(false),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const causeTrees = pgTable("cause_trees", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  treeData: jsonb("tree_data").notNull(), // stores the tree structure
  preventiveMeasures: jsonb("preventive_measures"), // stores prevention suggestions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAccidentSchema = createInsertSchema(accidents).omit({
  id: true,
  accidentNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWitnessSchema = createInsertSchema(witnesses).omit({
  id: true,
  createdAt: true,
});

export const insertFragmentSchema = createInsertSchema(fragments).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialEvidenceSchema = createInsertSchema(materialEvidence).omit({
  id: true,
  createdAt: true,
});

export const insertCauseTreeSchema = createInsertSchema(causeTrees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Accident = typeof accidents.$inferSelect;
export type InsertAccident = z.infer<typeof insertAccidentSchema>;
export type Witness = typeof witnesses.$inferSelect;
export type InsertWitness = z.infer<typeof insertWitnessSchema>;
export type Fragment = typeof fragments.$inferSelect;
export type InsertFragment = z.infer<typeof insertFragmentSchema>;
export type MaterialEvidence = typeof materialEvidence.$inferSelect;
export type InsertMaterialEvidence = z.infer<typeof insertMaterialEvidenceSchema>;
export type CauseTree = typeof causeTrees.$inferSelect;
export type InsertCauseTree = z.infer<typeof insertCauseTreeSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

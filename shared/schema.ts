import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mood: varchar("mood").notNull(), // very-sad, sad, neutral, happy, very-happy
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sleepEntries = pgTable("sleep_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  bedtime: timestamp("bedtime").notNull(),
  wakeTime: timestamp("wake_time").notNull(),
  hoursSlept: integer("hours_slept").notNull(),
  quality: varchar("quality").notNull(), // poor, fair, good, excellent
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // daily, twice-daily, weekly, etc.
  times: text("times").array().notNull(), // array of time strings like ["08:00", "20:00"]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationTaken = pgTable("medication_taken", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: varchar("medication_id").notNull(),
  userId: varchar("user_id").notNull(),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  scheduledTime: text("scheduled_time").notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSleepEntrySchema = createInsertSchema(sleepEntries).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationTakenSchema = createInsertSchema(medicationTaken).omit({
  id: true,
  takenAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

export type SleepEntry = typeof sleepEntries.$inferSelect;
export type InsertSleepEntry = z.infer<typeof insertSleepEntrySchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type MedicationTaken = typeof medicationTaken.$inferSelect;
export type InsertMedicationTaken = z.infer<typeof insertMedicationTakenSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

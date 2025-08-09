import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // User's preferred display name
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  emergencyContactEmail: varchar("emergency_contact_email"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactName: varchar("emergency_contact_name"),
  alertsEnabled: boolean("alerts_enabled").default(true),
  shareAlertsEnabled: boolean("share_alerts_enabled").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mood: varchar("mood").notNull(), // very-sad, sad, neutral, happy, very-happy
  description: text("description"), // User's description of their mood
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
  bedtimeDescriptor: text("bedtime_descriptor"), // How user felt going to bed
  wakeupDescriptor: text("wakeup_descriptor"), // How user felt waking up
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

export const exerciseEntries = pgTable("exercise_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  exercised: boolean("exercised").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weightEntries = pgTable("weight_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  weight: integer("weight").notNull(), // Store weight as integer (e.g., 1505 for 150.5 lbs)
  unit: varchar("unit").notNull().default("lbs"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertNotifications = pgTable("alert_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  alertType: varchar("alert_type").notNull(), // 'mood_low', 'medication_non_compliance'
  alertMessage: text("alert_message").notNull(),
  sentToUser: boolean("sent_to_user").default(false),
  sentToEmergencyContact: boolean("sent_to_emergency_contact").default(false),
  emergencyContactEmail: varchar("emergency_contact_email"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSleepEntrySchema = createInsertSchema(sleepEntries, {
  bedtime: z.coerce.date(),
  wakeTime: z.coerce.date(),
  hoursSlept: z.coerce.number(),
}).omit({
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

export const insertExerciseEntrySchema = createInsertSchema(exerciseEntries).omit({
  id: true,
  createdAt: true,
});

export const insertWeightEntrySchema = createInsertSchema(weightEntries).omit({
  id: true,
  createdAt: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).omit({
  id: true,
  createdAt: true,
});

// Onboarding schema for capturing initial user info
export const onboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactEmail: z.string().email().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional(),
  shareAlertsEnabled: z.boolean().default(false),
  alertsEnabled: z.boolean().default(true),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

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

export type ExerciseEntry = typeof exerciseEntries.$inferSelect;
export type InsertExerciseEntry = z.infer<typeof insertExerciseEntrySchema>;

export type WeightEntry = typeof weightEntries.$inferSelect;
export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;

export type OnboardingData = z.infer<typeof onboardingSchema>;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, real } from "drizzle-orm/pg-core";
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
  dosage: text("dosage"),
  frequency: text("frequency").notNull(), // daily, twice-daily, weekly, etc.
  times: text("times").array().notNull(), // array of time strings like ["08:00", "20:00"]
  isActive: boolean("is_active").default(true).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
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
  weight: real("weight").notNull(), // Store weight as decimal (e.g., 150.5 for 150.5 lbs)
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

export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  category: varchar("category").notNull(), // 'mood', 'sleep', 'medication', 'exercise', 'weight', 'overall'
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastEntryDate: timestamp("last_entry_date"),
  totalEntries: integer("total_entries").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementType: varchar("achievement_type").notNull(), // 'first_entry', 'streak_7', 'streak_30', 'perfect_week', etc.
  category: varchar("category").notNull(), // 'mood', 'sleep', 'medication', 'exercise', 'weight', 'overall'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  iconEmoji: varchar("icon_emoji").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Chat conversations and memory
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title"), // Optional conversation title
  summary: text("summary"), // AI-generated summary of conversation
  sentiment: varchar("sentiment"), // overall sentiment: positive, negative, neutral
  topics: text("topics").array(), // array of discussed topics
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  context: jsonb("context"), // Additional context like mood, recent activities
  sentiment: varchar("sentiment"), // message sentiment
  topics: text("topics").array(), // topics mentioned in this message
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User context profile for personalized responses
export const userContext = pgTable("user_context", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  preferences: jsonb("preferences"), // Communication style, topics of interest
  mentalHealthProfile: jsonb("mental_health_profile"), // Common concerns, triggers, coping strategies
  conversationHistory: jsonb("conversation_history"), // Recent conversation summaries
  personalDetails: jsonb("personal_details"), // Name preferences, important life details
  lastActive: timestamp("last_active").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  quality: z.coerce.string(),
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

export const insertUserStreakSchema = createInsertSchema(userStreaks);

export const insertAchievementSchema = createInsertSchema(achievements);

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertUserContextSchema = createInsertSchema(userContext).omit({
  id: true,
  lastActive: true,
  updatedAt: true,
});

// Onboarding schema for capturing initial user info
export const onboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactEmail: z.string().email().optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  emergencyContactPhone: z.string().optional(),
  shareAlertsEnabled: z.boolean().default(false),
  alertsEnabled: z.boolean().default(true),
}).refine((data) => {
  // If sharing alerts is enabled, emergency contact email is required
  if (data.shareAlertsEnabled && !data.emergencyContactEmail) {
    return false;
  }
  return true;
}, {
  message: "Emergency contact email is required when sharing alerts is enabled",
  path: ["emergencyContactEmail"],
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

export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type OnboardingData = z.infer<typeof onboardingSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type UserContext = typeof userContext.$inferSelect;
export type InsertUserContext = z.infer<typeof insertUserContextSchema>;

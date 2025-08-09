import {
  users,
  moodEntries,
  sleepEntries,
  medications,
  medicationTaken,
  journalEntries,
  exerciseEntries,
  weightEntries,
  alertNotifications,
  type User,
  type UpsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type SleepEntry,
  type InsertSleepEntry,
  type Medication,
  type InsertMedication,
  type MedicationTaken,
  type InsertMedicationTaken,
  type JournalEntry,
  type InsertJournalEntry,
  type ExerciseEntry,
  type InsertExerciseEntry,
  type WeightEntry,
  type InsertWeightEntry,
  type AlertNotification,
  type InsertAlertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Mood entries
  getMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntryById(id: string): Promise<MoodEntry | undefined>;
  updateMoodEntry(id: string, entry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;
  deleteMoodEntry(id: string): Promise<boolean>;

  // Sleep entries
  getSleepEntries(userId: string, limit?: number): Promise<SleepEntry[]>;
  createSleepEntry(entry: InsertSleepEntry): Promise<SleepEntry>;
  getSleepEntryById(id: string): Promise<SleepEntry | undefined>;
  updateSleepEntry(id: string, entry: Partial<InsertSleepEntry>): Promise<SleepEntry | undefined>;
  deleteSleepEntry(id: string): Promise<boolean>;

  // Medications
  getMedications(userId: string): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  getMedicationById(id: string): Promise<Medication | undefined>;
  updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<boolean>;

  // Medication taken records
  getMedicationTakenRecords(userId: string, date?: string): Promise<MedicationTaken[]>;
  createMedicationTakenRecord(record: InsertMedicationTaken): Promise<MedicationTaken>;
  getMedicationTakenByMedication(medicationId: string, date?: string): Promise<MedicationTaken[]>;

  // Journal entries
  getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntryById(id: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<boolean>;

  // Exercise entries
  getExerciseEntries(userId: string, limit?: number): Promise<ExerciseEntry[]>;
  createExerciseEntry(entry: InsertExerciseEntry): Promise<ExerciseEntry>;
  getExerciseEntryById(id: string): Promise<ExerciseEntry | undefined>;
  updateExerciseEntry(id: string, entry: Partial<InsertExerciseEntry>): Promise<ExerciseEntry | undefined>;
  deleteExerciseEntry(id: string): Promise<boolean>;

  // Weight entries
  getWeightEntries(userId: string, limit?: number): Promise<WeightEntry[]>;
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  getWeightEntryById(id: string): Promise<WeightEntry | undefined>;
  updateWeightEntry(id: string, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined>;
  deleteWeightEntry(id: string): Promise<boolean>;

  // Alert notifications
  getAlertNotifications(userId: string, limit?: number): Promise<AlertNotification[]>;
  createAlertNotification(alert: InsertAlertNotification): Promise<AlertNotification>;
  markAlertAsSent(id: string, sentToUser: boolean, sentToEmergencyContact: boolean): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private moodEntries: Map<string, MoodEntry>;
  private sleepEntries: Map<string, SleepEntry>;
  private medications: Map<string, Medication>;
  private medicationTaken: Map<string, MedicationTaken>;
  private journalEntries: Map<string, JournalEntry>;
  private exerciseEntries: Map<string, ExerciseEntry>;
  private weightEntries: Map<string, WeightEntry>;
  private alertNotifications: Map<string, AlertNotification>;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.sleepEntries = new Map();
    this.medications = new Map();
    this.medicationTaken = new Map();
    this.journalEntries = new Map();
    this.exerciseEntries = new Map();
    this.weightEntries = new Map();
    this.alertNotifications = new Map();

    // Create a default user for demo purposes
    this.upsertUser({
      id: "demo-user",
      email: "demo@moodbuddy.app",
      firstName: "Sarah",
      lastName: "Demo",
      displayName: "Sarah",
      profileImageUrl: null,
      phoneNumber: null,
      emergencyContactEmail: null,
      emergencyContactPhone: null,
      emergencyContactName: null,
      alertsEnabled: true,
      shareAlertsEnabled: false,
      onboardingCompleted: false,
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      displayName: userData.displayName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: userData.createdAt ?? now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Mood entries
  async getMoodEntries(userId: string, limit = 50): Promise<MoodEntry[]> {
    const entries = Array.from(this.moodEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return entries;
  }

  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    const moodEntry: MoodEntry = {
      ...entry,
      id,
      createdAt: new Date(),
      description: entry.description || null,
      notes: entry.notes || null,
    };
    this.moodEntries.set(id, moodEntry);
    return moodEntry;
  }

  async getMoodEntryById(id: string): Promise<MoodEntry | undefined> {
    return this.moodEntries.get(id);
  }

  async updateMoodEntry(id: string, entry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const existing = this.moodEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry };
    this.moodEntries.set(id, updated);
    return updated;
  }

  async deleteMoodEntry(id: string): Promise<boolean> {
    return this.moodEntries.delete(id);
  }

  // Sleep entries
  async getSleepEntries(userId: string, limit = 30): Promise<SleepEntry[]> {
    const entries = Array.from(this.sleepEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return entries;
  }

  async createSleepEntry(entry: InsertSleepEntry): Promise<SleepEntry> {
    const id = randomUUID();
    const sleepEntry: SleepEntry = {
      ...entry,
      id,
      createdAt: new Date(),
      bedtimeDescriptor: entry.bedtimeDescriptor || null,
      wakeupDescriptor: entry.wakeupDescriptor || null,
      notes: entry.notes || null,
    };
    this.sleepEntries.set(id, sleepEntry);
    return sleepEntry;
  }

  async getSleepEntryById(id: string): Promise<SleepEntry | undefined> {
    return this.sleepEntries.get(id);
  }

  async updateSleepEntry(id: string, entry: Partial<InsertSleepEntry>): Promise<SleepEntry | undefined> {
    const existing = this.sleepEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry };
    this.sleepEntries.set(id, updated);
    return updated;
  }

  async deleteSleepEntry(id: string): Promise<boolean> {
    return this.sleepEntries.delete(id);
  }

  // Medications
  async getMedications(userId: string): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .filter((med) => med.userId === userId && med.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = randomUUID();
    const med: Medication = {
      ...medication,
      id,
      createdAt: new Date(),
      isActive: medication.isActive ?? true,
    };
    this.medications.set(id, med);
    return med;
  }

  async getMedicationById(id: string): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const existing = this.medications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...medication };
    this.medications.set(id, updated);
    return updated;
  }

  async deleteMedication(id: string): Promise<boolean> {
    const medication = this.medications.get(id);
    if (!medication) return false;
    medication.isActive = false;
    this.medications.set(id, medication);
    return true;
  }

  // Medication taken records
  async getMedicationTakenRecords(userId: string, date?: string): Promise<MedicationTaken[]> {
    let records = Array.from(this.medicationTaken.values())
      .filter((record) => record.userId === userId);

    if (date) {
      const targetDate = new Date(date);
      records = records.filter((record) => {
        const recordDate = new Date(record.takenAt);
        return recordDate.toDateString() === targetDate.toDateString();
      });
    }

    return records.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  }

  async createMedicationTakenRecord(record: InsertMedicationTaken): Promise<MedicationTaken> {
    const id = randomUUID();
    const takenRecord: MedicationTaken = {
      ...record,
      id,
      takenAt: new Date(),
    };
    this.medicationTaken.set(id, takenRecord);
    return takenRecord;
  }

  async getMedicationTakenByMedication(medicationId: string, date?: string): Promise<MedicationTaken[]> {
    let records = Array.from(this.medicationTaken.values())
      .filter((record) => record.medicationId === medicationId);

    if (date) {
      const targetDate = new Date(date);
      records = records.filter((record) => {
        const recordDate = new Date(record.takenAt);
        return recordDate.toDateString() === targetDate.toDateString();
      });
    }

    return records;
  }

  // Journal entries
  async getJournalEntries(userId: string, limit = 20): Promise<JournalEntry[]> {
    const entries = Array.from(this.journalEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
    return entries;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const now = new Date();
    const journalEntry: JournalEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
      title: entry.title || null,
    };
    this.journalEntries.set(id, journalEntry);
    return journalEntry;
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }

  async updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const existing = this.journalEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry, updatedAt: new Date() };
    this.journalEntries.set(id, updated);
    return updated;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    return this.journalEntries.delete(id);
  }

  // Exercise entries
  async getExerciseEntries(userId: string, limit = 30): Promise<ExerciseEntry[]> {
    const entries = Array.from(this.exerciseEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return entries;
  }

  async createExerciseEntry(entry: InsertExerciseEntry): Promise<ExerciseEntry> {
    const id = randomUUID();
    const exerciseEntry: ExerciseEntry = {
      ...entry,
      id,
      createdAt: new Date(),
      notes: entry.notes || null,
    };
    this.exerciseEntries.set(id, exerciseEntry);
    return exerciseEntry;
  }

  async getExerciseEntryById(id: string): Promise<ExerciseEntry | undefined> {
    return this.exerciseEntries.get(id);
  }

  async updateExerciseEntry(id: string, entry: Partial<InsertExerciseEntry>): Promise<ExerciseEntry | undefined> {
    const existing = this.exerciseEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry };
    this.exerciseEntries.set(id, updated);
    return updated;
  }

  async deleteExerciseEntry(id: string): Promise<boolean> {
    return this.exerciseEntries.delete(id);
  }

  // Weight entries
  async getWeightEntries(userId: string, limit = 50): Promise<WeightEntry[]> {
    const entries = Array.from(this.weightEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return entries;
  }

  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const id = randomUUID();
    const weightEntry: WeightEntry = {
      ...entry,
      id,
      createdAt: new Date(),
      notes: entry.notes || null,
      unit: entry.unit || 'lbs',
    };
    this.weightEntries.set(id, weightEntry);
    return weightEntry;
  }

  async getWeightEntryById(id: string): Promise<WeightEntry | undefined> {
    return this.weightEntries.get(id);
  }

  async updateWeightEntry(id: string, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined> {
    const existing = this.weightEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry };
    this.weightEntries.set(id, updated);
    return updated;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    return this.weightEntries.delete(id);
  }

  // Alert notifications
  async getAlertNotifications(userId: string, limit = 50): Promise<AlertNotification[]> {
    const alerts = Array.from(this.alertNotifications.values())
      .filter((alert) => alert.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    return alerts;
  }

  async createAlertNotification(alert: InsertAlertNotification): Promise<AlertNotification> {
    const id = randomUUID();
    const alertNotification: AlertNotification = {
      ...alert,
      id,
      createdAt: new Date(),
      sentToUser: alert.sentToUser || false,
      sentToEmergencyContact: alert.sentToEmergencyContact || false,
      emergencyContactEmail: alert.emergencyContactEmail || null,
      emergencyContactPhone: alert.emergencyContactPhone || null,
    };
    this.alertNotifications.set(id, alertNotification);
    return alertNotification;
  }

  async markAlertAsSent(id: string, sentToUser: boolean, sentToEmergencyContact: boolean): Promise<boolean> {
    const alert = this.alertNotifications.get(id);
    if (!alert) return false;
    
    const updated = { ...alert, sentToUser, sentToEmergencyContact };
    this.alertNotifications.set(id, updated);
    return true;
  }
}

// Database storage implementation for Replit Auth
export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // All other methods would use database queries...
  // For now, throwing errors to indicate they need implementation
  async getMoodEntries(): Promise<MoodEntry[]> { throw new Error("Not implemented for database yet"); }
  async createMoodEntry(): Promise<MoodEntry> { throw new Error("Not implemented for database yet"); }
  async getMoodEntryById(): Promise<MoodEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async updateMoodEntry(): Promise<MoodEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteMoodEntry(): Promise<boolean> { throw new Error("Not implemented for database yet"); }
  async getSleepEntries(): Promise<SleepEntry[]> { throw new Error("Not implemented for database yet"); }
  async createSleepEntry(): Promise<SleepEntry> { throw new Error("Not implemented for database yet"); }
  async getSleepEntryById(): Promise<SleepEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async updateSleepEntry(): Promise<SleepEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteSleepEntry(): Promise<boolean> { throw new Error("Not implemented for database yet"); }
  async getMedications(): Promise<Medication[]> { throw new Error("Not implemented for database yet"); }
  async createMedication(): Promise<Medication> { throw new Error("Not implemented for database yet"); }
  async getMedicationById(): Promise<Medication | undefined> { throw new Error("Not implemented for database yet"); }
  async updateMedication(): Promise<Medication | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteMedication(): Promise<boolean> { throw new Error("Not implemented for database yet"); }
  async getMedicationTakenRecords(): Promise<MedicationTaken[]> { throw new Error("Not implemented for database yet"); }
  async createMedicationTakenRecord(): Promise<MedicationTaken> { throw new Error("Not implemented for database yet"); }
  async getMedicationTakenByMedication(): Promise<MedicationTaken[]> { throw new Error("Not implemented for database yet"); }
  async getJournalEntries(): Promise<JournalEntry[]> { throw new Error("Not implemented for database yet"); }
  async createJournalEntry(): Promise<JournalEntry> { throw new Error("Not implemented for database yet"); }
  async getJournalEntryById(): Promise<JournalEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async updateJournalEntry(): Promise<JournalEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteJournalEntry(): Promise<boolean> { throw new Error("Not implemented for database yet"); }

  // Exercise entries - Database implementation placeholders
  async getExerciseEntries(): Promise<ExerciseEntry[]> { throw new Error("Not implemented for database yet"); }
  async createExerciseEntry(): Promise<ExerciseEntry> { throw new Error("Not implemented for database yet"); }
  async getExerciseEntryById(): Promise<ExerciseEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async updateExerciseEntry(): Promise<ExerciseEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteExerciseEntry(): Promise<boolean> { throw new Error("Not implemented for database yet"); }

  // Weight entries - Database implementation placeholders
  async getWeightEntries(): Promise<WeightEntry[]> { throw new Error("Not implemented for database yet"); }
  async createWeightEntry(): Promise<WeightEntry> { throw new Error("Not implemented for database yet"); }
  async getWeightEntryById(): Promise<WeightEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async updateWeightEntry(): Promise<WeightEntry | undefined> { throw new Error("Not implemented for database yet"); }
  async deleteWeightEntry(): Promise<boolean> { throw new Error("Not implemented for database yet"); }

  // Alert notifications - Database implementation placeholders
  async getAlertNotifications(): Promise<AlertNotification[]> { throw new Error("Not implemented for database yet"); }
  async createAlertNotification(): Promise<AlertNotification> { throw new Error("Not implemented for database yet"); }
  async markAlertAsSent(): Promise<boolean> { throw new Error("Not implemented for database yet"); }
}

// Use MemStorage for now, switch to DatabaseStorage later
export const storage = new MemStorage();

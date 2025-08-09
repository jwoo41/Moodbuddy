import {
  type User,
  type InsertUser,
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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private moodEntries: Map<string, MoodEntry>;
  private sleepEntries: Map<string, SleepEntry>;
  private medications: Map<string, Medication>;
  private medicationTaken: Map<string, MedicationTaken>;
  private journalEntries: Map<string, JournalEntry>;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.sleepEntries = new Map();
    this.medications = new Map();
    this.medicationTaken = new Map();
    this.journalEntries = new Map();

    // Create a default user for demo purposes
    this.createUser({
      username: "demo",
      password: "demo",
      name: "Sarah",
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
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
}

export const storage = new MemStorage();

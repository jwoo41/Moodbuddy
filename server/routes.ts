import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertMoodEntrySchema,
  insertSleepEntrySchema,
  insertMedicationSchema,
  insertMedicationTakenSchema,
  insertJournalEntrySchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // For demo purposes, we'll use a hardcoded user ID (will switch to auth later)
  const DEMO_USER_ID = "demo-user";

  // Mood entries
  app.get("/api/mood", async (req, res) => {
    try {
      const entries = await storage.getMoodEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/mood", async (req, res) => {
    try {
      const data = insertMoodEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createMoodEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood entry data" });
    }
  });

  app.put("/api/mood/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertMoodEntrySchema.partial().parse(req.body);
      const entry = await storage.updateMoodEntry(id, data);
      if (!entry) {
        return res.status(404).json({ error: "Mood entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood entry data" });
    }
  });

  app.delete("/api/mood/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMoodEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Mood entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mood entry" });
    }
  });

  // Sleep entries
  app.get("/api/sleep", async (req, res) => {
    try {
      const entries = await storage.getSleepEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sleep entries" });
    }
  });

  app.post("/api/sleep", async (req, res) => {
    try {
      const data = insertSleepEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createSleepEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid sleep entry data" });
    }
  });

  app.put("/api/sleep/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertSleepEntrySchema.partial().parse(req.body);
      const entry = await storage.updateSleepEntry(id, data);
      if (!entry) {
        return res.status(404).json({ error: "Sleep entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid sleep entry data" });
    }
  });

  app.delete("/api/sleep/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSleepEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Sleep entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sleep entry" });
    }
  });

  // Medications
  app.get("/api/medications", async (req, res) => {
    try {
      const medications = await storage.getMedications(DEMO_USER_ID);
      res.json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const data = insertMedicationSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const medication = await storage.createMedication(data);
      res.json(medication);
    } catch (error) {
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  app.put("/api/medications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertMedicationSchema.partial().parse(req.body);
      const medication = await storage.updateMedication(id, data);
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMedication(id);
      if (!deleted) {
        return res.status(404).json({ error: "Medication not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // Medication taken records
  app.get("/api/medications/taken", async (req, res) => {
    try {
      const { date } = req.query;
      const records = await storage.getMedicationTakenRecords(DEMO_USER_ID, date as string);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medication records" });
    }
  });

  app.post("/api/medications/taken", async (req, res) => {
    try {
      const data = insertMedicationTakenSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const record = await storage.createMedicationTakenRecord(data);
      res.json(record);
    } catch (error) {
      res.status(400).json({ error: "Invalid medication taken data" });
    }
  });

  // Journal entries
  app.get("/api/journal", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", async (req, res) => {
    try {
      const data = insertJournalEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createJournalEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid journal entry data" });
    }
  });

  app.put("/api/journal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertJournalEntrySchema.partial().parse(req.body);
      const entry = await storage.updateJournalEntry(id, data);
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid journal entry data" });
    }
  });

  app.delete("/api/journal/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteJournalEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

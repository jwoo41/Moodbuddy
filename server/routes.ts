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
  insertExerciseEntrySchema,
  insertWeightEntrySchema,
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

  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData.displayName || typeof updateData.displayName !== 'string') {
        return res.status(400).json({ message: "Display name is required" });
      }
      
      // Get existing user
      const existingUser = await storage.getUser(userId);
      
      // Prepare update object
      const userUpdate: any = {
        id: userId,
        email: existingUser?.email || req.user.claims.email,
        firstName: existingUser?.firstName || req.user.claims.given_name,
        lastName: existingUser?.lastName || req.user.claims.family_name,
        profileImageUrl: existingUser?.profileImageUrl || req.user.claims.picture,
        displayName: updateData.displayName.trim(),
      };

      // Add onboarding fields if provided
      if (updateData.email) userUpdate.email = updateData.email;
      if (updateData.phoneNumber !== undefined) userUpdate.phoneNumber = updateData.phoneNumber;
      if (updateData.emergencyContactName !== undefined) userUpdate.emergencyContactName = updateData.emergencyContactName;
      if (updateData.emergencyContactEmail !== undefined) userUpdate.emergencyContactEmail = updateData.emergencyContactEmail;
      if (updateData.emergencyContactPhone !== undefined) userUpdate.emergencyContactPhone = updateData.emergencyContactPhone;
      if (updateData.alertsEnabled !== undefined) userUpdate.alertsEnabled = updateData.alertsEnabled;
      if (updateData.shareAlertsEnabled !== undefined) userUpdate.shareAlertsEnabled = updateData.shareAlertsEnabled;
      if (updateData.onboardingCompleted !== undefined) userUpdate.onboardingCompleted = updateData.onboardingCompleted;
      
      const updatedUser = await storage.upsertUser(userUpdate);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user", details: error instanceof Error ? error.message : 'Unknown error' });
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
      console.log("Sleep entry request body:", JSON.stringify(req.body, null, 2));
      const data = insertSleepEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      console.log("Parsed sleep data:", JSON.stringify(data, null, 2));
      const entry = await storage.createSleepEntry(data);
      res.json(entry);
    } catch (error) {
      console.error("Sleep entry validation error:", error);
      res.status(400).json({ error: "Invalid sleep entry data", details: error instanceof Error ? error.message : 'Unknown error' });
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

  // Exercise entries
  app.get("/api/exercise", async (req, res) => {
    try {
      const entries = await storage.getExerciseEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise entries" });
    }
  });

  app.post("/api/exercise", async (req, res) => {
    try {
      const data = insertExerciseEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createExerciseEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid exercise entry data" });
    }
  });

  app.put("/api/exercise/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertExerciseEntrySchema.partial().parse(req.body);
      const entry = await storage.updateExerciseEntry(id, data);
      if (!entry) {
        return res.status(404).json({ error: "Exercise entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid exercise entry data" });
    }
  });

  app.delete("/api/exercise/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExerciseEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Exercise entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete exercise entry" });
    }
  });

  // Weight entries
  app.get("/api/weight", async (req, res) => {
    try {
      const entries = await storage.getWeightEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weight entries" });
    }
  });

  app.post("/api/weight", async (req, res) => {
    try {
      const data = insertWeightEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createWeightEntry(data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid weight entry data" });
    }
  });

  app.put("/api/weight/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertWeightEntrySchema.partial().parse(req.body);
      const entry = await storage.updateWeightEntry(id, data);
      if (!entry) {
        return res.status(404).json({ error: "Weight entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid weight entry data" });
    }
  });

  app.delete("/api/weight/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWeightEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Weight entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete weight entry" });
    }
  });

  // Alert notifications endpoints
  app.get("/api/alerts", async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Use DEMO_USER_ID for now since we're using memory storage
      const alerts = await storage.getAlertNotifications(DEMO_USER_ID);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const alertData = req.body;
      
      // Get user from storage to check alert preferences
      const userFromStorage = await storage.getUser(DEMO_USER_ID);
      
      const alert = await storage.createAlertNotification({
        userId: DEMO_USER_ID,
        alertType: alertData.alertType,
        alertMessage: alertData.alertMessage,
        emergencyContactEmail: alertData.emergencyContactEmail || null,
        emergencyContactPhone: alertData.emergencyContactPhone || null,
        sentToUser: false,
        sentToEmergencyContact: false,
      });

      // If user has alert sharing enabled and emergency contact, send alert
      if (userFromStorage?.shareAlertsEnabled && (userFromStorage?.emergencyContactEmail || userFromStorage?.emergencyContactPhone)) {
        try {
          // In a real app, this would send email/SMS
          // For now, we'll just mark as sent to emergency contact
          await storage.markAlertAsSent(alert.id, true, true);
          console.log(`Alert shared with emergency contact: ${userFromStorage.emergencyContactEmail || userFromStorage.emergencyContactPhone}`);
        } catch (error) {
          console.error("Failed to send alert to emergency contact:", error);
        }
      } else {
        await storage.markAlertAsSent(alert.id, true, false);
      }

      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

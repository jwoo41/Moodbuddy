import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GamificationService } from "./gamification";
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
  
  // Initialize gamification service
  const gamificationService = new GamificationService(storage);

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
      
      // Update streak and check for achievements
      const streakResult = await gamificationService.updateStreakOnEntry(DEMO_USER_ID, 'mood');
      
      res.json({ 
        entry, 
        gamification: {
          streak: streakResult.streak,
          isNewRecord: streakResult.isNewRecord,
          newAchievements: streakResult.achievements
        }
      });
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
      
      // Update streak and check for achievements
      const streakResult = await gamificationService.updateStreakOnEntry(DEMO_USER_ID, 'sleep');
      
      res.json({ 
        entry, 
        gamification: {
          streak: streakResult.streak,
          isNewRecord: streakResult.isNewRecord,
          newAchievements: streakResult.achievements
        }
      });
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
      
      // Update streak and check for achievements
      const streakResult = await gamificationService.updateStreakOnEntry(DEMO_USER_ID, 'exercise');
      
      res.json({ 
        entry, 
        gamification: {
          streak: streakResult.streak,
          isNewRecord: streakResult.isNewRecord,
          newAchievements: streakResult.achievements
        }
      });
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
      
      // Update streak and check for achievements
      const streakResult = await gamificationService.updateStreakOnEntry(DEMO_USER_ID, 'weight');
      
      res.json({ 
        entry, 
        gamification: {
          streak: streakResult.streak,
          isNewRecord: streakResult.isNewRecord,
          newAchievements: streakResult.achievements
        }
      });
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

  // Gamification endpoints
  app.get("/api/streaks", async (req, res) => {
    try {
      const streaks = await storage.getUserStreaks(DEMO_USER_ID);
      const streakSummary = await gamificationService.getStreakSummary(DEMO_USER_ID);
      res.json({ streaks, summary: streakSummary });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch streaks" });
    }
  });

  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(DEMO_USER_ID);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Check if OpenAI API key is available
  app.get('/api/check-openai', (req, res) => {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    if (hasApiKey) {
      res.json({ available: true });
    } else {
      res.status(404).json({ available: false });
    }
  });

  // ChatGPT API endpoint with memory
  app.post('/api/chat', async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      const { message, context } = req.body;
      const userId = (req.session as any)?.passport?.user?.id || 'demo-user';
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Import chat memory service
      const { chatMemoryService } = await import('./chat-memory');
      
      // Get current conversation
      const conversation = await chatMemoryService.getCurrentConversation(userId);
      
      // Save user message
      await chatMemoryService.saveMessage(
        conversation.id,
        userId,
        "user",
        message,
        {
          topics: chatMemoryService.extractTopics(message),
          sentiment: chatMemoryService.analyzeSentiment(message),
        }
      );
      
      // Get personalized context
      const personalizedContext = await chatMemoryService.getPersonalizedContext(userId);
      
      // Get recent conversation history for OpenAI
      const recentMessages = await chatMemoryService.getRecentMessages(userId, 8);
      
      // Build conversation history for OpenAI
      const conversationHistory = recentMessages
        .reverse() // Reverse to get chronological order
        .map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));

      // Import OpenAI dynamically
      const { default: OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o which is the most advanced model available for mental health conversations
        messages: [
          {
            role: "system",
            content: personalizedContext
          },
          ...conversationHistory.slice(-6), // Include last 6 messages for context
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now. Please try again.";
      
      // Save assistant response
      await chatMemoryService.saveMessage(
        conversation.id,
        userId,
        "assistant",
        response,
        {
          topics: chatMemoryService.extractTopics(response),
          sentiment: "supportive",
        }
      );
      
      res.json({ response });
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Check if it's a quota/billing error and provide fallback
      if (error.status === 429 || error.code === 'insufficient_quota') {
        // Return a supportive fallback response when quota is exceeded
        const fallbackResponses = [
          "I'm here to support you, even when my advanced features aren't available. Your feelings are valid and you're not alone in this journey. What's been on your mind today?",
          "Thank you for sharing with me. While I might not have all my advanced capabilities right now, I want you to know that you're valued and your wellbeing matters deeply. How can I support you today?",
          "I appreciate you reaching out. Even in simple ways, I'm here to listen and remind you that you have incredible strength within you. What would be most helpful for you right now?",
          "Your courage in seeking support shows how much you care about yourself, and that's beautiful. While I may have limited features at the moment, my care for your wellbeing remains constant. Tell me what's in your heart."
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        res.json({ response: randomResponse });
      } else {
        res.status(500).json({ error: 'Failed to generate response' });
      }
    }
  });

  // Get chat history
  app.get('/api/chat/history', async (req, res) => {
    try {
      const userId = (req.session as any)?.passport?.user?.id || 'demo-user';
      const { chatMemoryService } = await import('./chat-memory');
      
      const messages = await chatMemoryService.getRecentMessages(userId, 20);
      res.json({ messages: messages.reverse() }); // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  // Get user context for personalization insights
  app.get('/api/chat/context', async (req, res) => {
    try {
      const userId = (req.session as any)?.passport?.user?.id || 'demo-user';
      const { chatMemoryService } = await import('./chat-memory');
      
      const userCtx = await chatMemoryService.getUserContext(userId);
      const currentContext = await chatMemoryService.buildCurrentContext(userId);
      
      res.json({ 
        userContext: userCtx,
        currentContext 
      });
    } catch (error) {
      console.error('Error fetching user context:', error);
      res.status(500).json({ error: 'Failed to fetch user context' });
    }
  });

  // Update user preferences
  app.post('/api/chat/preferences', async (req, res) => {
    try {
      const userId = (req.session as any)?.passport?.user?.id || 'demo-user';
      const { preferences, mentalHealthProfile, personalDetails } = req.body;
      const { chatMemoryService } = await import('./chat-memory');
      
      await chatMemoryService.updateUserProfile(userId, {
        preferences,
        mentalHealthProfile,
        personalDetails
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

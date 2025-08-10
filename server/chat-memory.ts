import { db } from "./db";
import { chatConversations, chatMessages, userContext } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface ChatContext {
  recentMood?: string;
  recentActivities?: string[];
  currentConcerns?: string[];
  conversationHistory?: string;
  userPreferences?: any;
}

export interface MessageContext {
  sentiment?: string;
  topics?: string[];
  contextData?: any;
}

export class ChatMemoryService {
  // Get or create user context profile
  async getUserContext(userId: string) {
    let context = await db
      .select()
      .from(userContext)
      .where(eq(userContext.userId, userId))
      .limit(1);

    if (context.length === 0) {
      // Create initial user context
      const newContext = await db
        .insert(userContext)
        .values({
          userId,
          preferences: {
            communicationStyle: "supportive",
            topics: [],
          },
          mentalHealthProfile: {
            concerns: [],
            copingStrategies: [],
            triggers: [],
          },
          conversationHistory: [],
          personalDetails: {},
        })
        .returning();
      
      return newContext[0];
    }

    return context[0];
  }

  // Get current conversation or create new one
  async getCurrentConversation(userId: string) {
    // Get most recent conversation that's been updated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let conversation = await db
      .select()
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.userId, userId),
          // Only get conversations from today
        )
      )
      .orderBy(desc(chatConversations.updatedAt))
      .limit(1);

    if (conversation.length === 0) {
      // Create new conversation
      const newConversation = await db
        .insert(chatConversations)
        .values({
          userId,
          title: `Chat - ${new Date().toLocaleDateString()}`,
          sentiment: "neutral",
          topics: [],
        })
        .returning();
      
      return newConversation[0];
    }

    return conversation[0];
  }

  // Save message with context
  async saveMessage(
    conversationId: string, 
    userId: string, 
    role: "user" | "assistant", 
    content: string, 
    messageContext?: MessageContext
  ) {
    // Build context with current user state
    const context = await this.buildCurrentContext(userId);
    
    const message = await db
      .insert(chatMessages)
      .values({
        conversationId,
        userId,
        role,
        content,
        context: { ...context, ...messageContext?.contextData },
        sentiment: messageContext?.sentiment,
        topics: messageContext?.topics || [],
      })
      .returning();

    // Update conversation timestamp and analyze topics
    await this.updateConversationWithMessage(conversationId, content, messageContext);
    
    return message[0];
  }

  // Build current context from user's recent activities
  async buildCurrentContext(userId: string): Promise<ChatContext> {
    try {
      // Get recent mood entries
      const recentMood = await db.query.moodEntries.findFirst({
        where: (moodEntries, { eq }) => eq(moodEntries.userId, userId),
        orderBy: (moodEntries, { desc }) => [desc(moodEntries.createdAt)],
      });

      // Get recent activities (exercise, sleep quality, etc.)
      const recentExercise = await db.query.exerciseEntries.findFirst({
        where: (exerciseEntries, { eq }) => eq(exerciseEntries.userId, userId),
        orderBy: (exerciseEntries, { desc }) => [desc(exerciseEntries.createdAt)],
      });

      const recentSleep = await db.query.sleepEntries.findFirst({
        where: (sleepEntries, { eq }) => eq(sleepEntries.userId, userId),
        orderBy: (sleepEntries, { desc }) => [desc(sleepEntries.createdAt)],
      });

      // Get conversation history (last 5 conversations)
      const recentConversations = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.userId, userId))
        .orderBy(desc(chatConversations.updatedAt))
        .limit(5);

      return {
        recentMood: recentMood?.mood,
        recentActivities: [
          recentExercise?.exercised ? "exercised" : "no exercise",
          recentSleep ? `slept ${recentSleep.hoursSlept}h (${recentSleep.quality})` : "no sleep data"
        ].filter(Boolean),
        conversationHistory: recentConversations
          .map(conv => conv.summary)
          .filter(Boolean)
          .join("; "),
      };
    } catch (error) {
      console.error("Error building context:", error);
      return {};
    }
  }

  // Get recent conversation history for context
  async getRecentMessages(userId: string, limit: number = 10) {
    const conversation = await this.getCurrentConversation(userId);
    
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Update conversation summary and topics
  private async updateConversationWithMessage(
    conversationId: string, 
    content: string, 
    messageContext?: MessageContext
  ) {
    const conversation = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) return;

    const existingTopics = conversation[0].topics || [];
    const newTopics = messageContext?.topics || this.extractTopics(content);
    const combinedTopics = [...new Set([...existingTopics, ...newTopics])];

    await db
      .update(chatConversations)
      .set({
        topics: combinedTopics,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.id, conversationId));
  }

  // Extract topics from message content
  extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Mental health topics
    if (lowerContent.includes("anxiety") || lowerContent.includes("anxious")) topics.push("anxiety");
    if (lowerContent.includes("depression") || lowerContent.includes("depressed")) topics.push("depression");
    if (lowerContent.includes("stress") || lowerContent.includes("stressed")) topics.push("stress");
    if (lowerContent.includes("sleep") || lowerContent.includes("insomnia")) topics.push("sleep");
    if (lowerContent.includes("work") || lowerContent.includes("job")) topics.push("work");
    if (lowerContent.includes("family") || lowerContent.includes("relationship")) topics.push("relationships");
    if (lowerContent.includes("medication") || lowerContent.includes("meds")) topics.push("medication");
    if (lowerContent.includes("therapy") || lowerContent.includes("counseling")) topics.push("therapy");
    
    return topics;
  }

  // Analyze sentiment of message content
  analyzeSentiment(content: string): string {
    const lowerContent = content.toLowerCase();
    
    // Positive indicators
    const positiveWords = ["happy", "great", "good", "better", "excited", "grateful", "thankful", "love", "amazing", "wonderful"];
    const negativeWords = ["sad", "bad", "terrible", "awful", "depressed", "anxious", "worried", "stressed", "hate", "angry"];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  // Get personalized context for AI responses
  async getPersonalizedContext(userId: string): Promise<string> {
    const userCtx = await this.getUserContext(userId);
    const currentContext = await this.buildCurrentContext(userId);
    const recentMessages = await this.getRecentMessages(userId, 5);
    
    let contextPrompt = "You are MoodBuddy, a compassionate mental health companion. ";
    
    // Add user's recent emotional state
    if (currentContext.recentMood) {
      contextPrompt += `The user's recent mood was ${currentContext.recentMood}. `;
    }
    
    // Add recent activities context
    if (currentContext.recentActivities && currentContext.recentActivities.length > 0) {
      contextPrompt += `Recent activities: ${currentContext.recentActivities.join(", ")}. `;
    }
    
    // Add conversation history context
    if (recentMessages.length > 0) {
      const recentUserMessages = recentMessages
        .filter(msg => msg.role === "user")
        .slice(0, 3)
        .map(msg => msg.content.substring(0, 100))
        .join("; ");
      
      if (recentUserMessages) {
        contextPrompt += `Recent conversation topics: ${recentUserMessages}. `;
      }
    }
    
    // Add user preferences
    const preferences = userCtx.preferences as any;
    if (preferences?.communicationStyle) {
      contextPrompt += `User prefers ${preferences.communicationStyle} communication style. `;
    }
    
    // Add mental health profile
    const profile = userCtx.mentalHealthProfile as any;
    if (profile?.concerns && profile.concerns.length > 0) {
      contextPrompt += `User has mentioned concerns about: ${profile.concerns.join(", ")}. `;
    }
    
    contextPrompt += "Provide personalized, empathetic responses that acknowledge their history and current state. Be supportive and reference relevant past conversations when appropriate.";
    
    return contextPrompt;
  }

  // Update user preferences and mental health profile
  async updateUserProfile(userId: string, updates: {
    preferences?: any;
    mentalHealthProfile?: any;
    personalDetails?: any;
  }) {
    const userCtx = await this.getUserContext(userId);
    
    await db
      .update(userContext)
      .set({
        preferences: updates.preferences ? { ...userCtx.preferences, ...updates.preferences } : userCtx.preferences,
        mentalHealthProfile: updates.mentalHealthProfile ? { ...userCtx.mentalHealthProfile, ...updates.mentalHealthProfile } : userCtx.mentalHealthProfile,
        personalDetails: updates.personalDetails ? { ...userCtx.personalDetails, ...updates.personalDetails } : userCtx.personalDetails,
        updatedAt: new Date(),
      })
      .where(eq(userContext.userId, userId));
  }
}

export const chatMemoryService = new ChatMemoryService();
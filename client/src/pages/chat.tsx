import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Brain, Heart, Moon, Pill } from "lucide-react";
import ConversationInterface from "@/components/conversation/conversation-interface";
import SmartChat from "@/components/smart-chat";

const conversationTopics = [
  {
    id: 'general',
    title: 'General Check-in',
    description: 'Talk about how you\'re feeling overall',
    icon: MessageCircle,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    id: 'mood',
    title: 'Mood & Emotions',
    description: 'Discuss your emotional state and feelings',
    icon: Heart,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  },
  {
    id: 'sleep',
    title: 'Sleep & Rest',
    description: 'Talk about sleep patterns and rest quality',
    icon: Moon,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    id: 'medication',
    title: 'Medication & Health',
    description: 'Discuss medications and health routines',
    icon: Pill,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  {
    id: 'therapy',
    title: 'Therapeutic Conversation',
    description: 'Deeper discussion about mental health',
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  }
];

export default function Chat() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
          MoodBuddy Chat
        </h1>
        <p className="text-moodbuddy-neutral-600 dark:text-muted-foreground">
          Have a conversation with your mental health companion
        </p>
      </div>

      <SmartChat />
      
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          💡 <strong>Smart Chat Enabled!</strong> MoodBuddy is powered by advanced AI for meaningful conversations.
        </p>
        <p className="text-xs">
          Share your thoughts, feelings, or ask for advice - MoodBuddy provides personalized support and positive affirmations.
        </p>
      </div>
    </div>
  );
}
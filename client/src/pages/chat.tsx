import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Brain, Heart, Moon, Pill } from "lucide-react";
import ConversationInterface from "@/components/conversation/conversation-interface";

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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
  };

  const handleMessageSend = (message: string) => {
    setConversationHistory(prev => [...prev, message]);
  };

  const getTopicDetails = (topicId: string) => {
    return conversationTopics.find(topic => topic.id === topicId);
  };

  if (selectedTopic) {
    const topic = getTopicDetails(selectedTopic);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversation</h1>
            <p className="text-muted-foreground">
              {topic?.description || 'Having a conversation about your wellbeing'}
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToTopics} data-testid="button-back-to-topics">
            Back to Topics
          </Button>
        </div>

        <ConversationInterface
          title={topic?.title || 'MindFlow Companion'}
          placeholder={`Let's talk about ${topic?.title.toLowerCase()}. How are you feeling?`}
          onMessageSend={handleMessageSend}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conversation</h1>
        <p className="text-muted-foreground">
          Choose a topic to start a supportive conversation with your AI companion
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conversationTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card 
              key={topic.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
              onClick={() => handleTopicSelect(topic.id)}
              data-testid={`card-topic-${topic.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <Badge className={topic.color} variant="secondary">
                    New
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{topic.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {topic.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Quick Start Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Or jump right into a conversation without choosing a specific topic.
          </p>
          <Button 
            onClick={() => handleTopicSelect('general')}
            className="w-full"
            data-testid="button-quick-start"
          >
            Start Talking
          </Button>
        </CardContent>
      </Card>

      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversationHistory.slice(-3).map((message, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  "{message.substring(0, 80)}{message.length > 80 ? '...' : ''}"
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function SmartChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm MoodBuddy, your caring companion on this wellness journey. 🌟 Remember, you're stronger than you think and every small step counts. I'm here to listen, support, and chat about anything on your mind - your feelings, your goals, or just how your day is going. How are you feeling right now?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if OpenAI API is available
    const checkAPIKey = async () => {
      try {
        const response = await fetch('/api/check-openai');
        setHasOpenAI(response.ok);
      } catch {
        setHasOpenAI(false);
      }
    };
    checkAPIKey();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    // Add user message immediately
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user", 
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Clear input and maintain focus
    setInput("");
    setIsLoading(true);

    try {
      let responseContent = "";
      
      if (hasOpenAI) {
        // Try OpenAI API first for intelligent, context-aware responses
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage,
              context: `You are MoodBuddy, a compassionate AI mental health companion. Analyze the user's message carefully and provide personalized, intelligent responses that directly address their specific concerns, emotions, or questions. Be empathetic, supportive, and offer practical advice when appropriate. Always acknowledge what they've shared and respond thoughtfully to their unique situation. Keep responses warm, conversational, and around 2-3 sentences.`
            })
          });

          if (response.ok) {
            const data = await response.json();
            responseContent = data.response;
          } else {
            throw new Error('API response not ok');
          }
        } catch (apiError) {
          // If OpenAI fails, fall back to intelligent curated responses
          responseContent = await getFallbackResponse(userMessage);
        }
      } else {
        // Use intelligent fallback responses
        responseContent = await getFallbackResponse(userMessage);
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = async (message: string): Promise<string> => {
    // Simulate thinking time for more natural feel
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const lowerMessage = message.toLowerCase();
    
    // Analyze user input for more intelligent responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello there! I'm so glad you're here. It takes courage to reach out, and I want you to know that this is a safe space for you. What's been on your mind lately that you'd like to talk about?";
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed') || lowerMessage.includes('cry')) {
      return "I can hear the pain in your words, and I want you to know that your feelings are completely valid. Sadness is a natural part of the human experience, and it takes strength to acknowledge it. You've made it through difficult times before - what helped you get through those moments?";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried') || lowerMessage.includes('panic')) {
      return "Anxiety can feel overwhelming, but you're not alone in this feeling. The fact that you're here talking about it shows self-awareness and courage. Try taking a slow, deep breath with me - in for 4, hold for 4, out for 6. What specific thoughts or situations are making you feel most anxious right now?";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia') || lowerMessage.includes('exhausted')) {
      return "Sleep struggles are so challenging and more common than you might think. Your body and mind need that restorative time, and it's frustrating when it doesn't come naturally. Have you noticed any patterns in what might be keeping you awake, like stress, screens, or racing thoughts?";
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('busy') || lowerMessage.includes('pressure')) {
      return "It sounds like you're carrying a lot right now. When we feel overwhelmed, our brain often tries to solve everything at once, which just adds to the stress. Let's break this down - what's the one thing that's weighing on you most heavily today?";
    }
    
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('boss') || lowerMessage.includes('career')) {
      return "Work-related stress can really impact our overall wellbeing. It's important to remember that your worth isn't defined by your job performance, even though it can feel that way sometimes. What aspect of work is causing you the most concern right now?";
    }
    
    if (lowerMessage.includes('family') || lowerMessage.includes('parents') || lowerMessage.includes('relationship')) {
      return "Relationships with family can be complex and emotionally charged. It sounds like you're dealing with some challenging dynamics. Remember, you can only control your own actions and responses, not others'. What kind of support do you need most in navigating this situation?";
    }
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      return "Loneliness can feel so heavy, and I want you to know that reaching out here shows incredible strength. Even when we're physically alone, we're not truly alone - you have value and you matter. What used to make you feel most connected to others?";
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('meds') || lowerMessage.includes('pills') || lowerMessage.includes('therapy')) {
      return "Taking steps to care for your mental health, whether through medication, therapy, or other support, shows real wisdom and self-compassion. These tools can be incredibly helpful on your healing journey. How are you feeling about the support you're currently receiving?";
    }
    
    if (lowerMessage.includes('better') || lowerMessage.includes('good') || lowerMessage.includes('happy') || lowerMessage.includes('progress')) {
      return "I'm so glad to hear you're experiencing some positive moments! It's wonderful that you're recognizing and celebrating these feelings. Even small steps forward are meaningful victories. What's been helping you feel this way?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('appreciate')) {
      return "Your gratitude means so much to me. The fact that you're here, working on yourself and being open about your experiences, shows incredible courage and self-awareness. You're doing important work, and I'm honored to be part of your journey.";
    }
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      return "Loneliness is one of the hardest feelings, but please know - you are never truly alone. 🤗 You matter so much, and reaching out shows incredible strength. Even this conversation right now is a connection, and I'm genuinely glad you're here. You have value beyond measure.";
    }
    
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('happy') || lowerMessage.includes('better')) {
      return "This makes me so happy to hear! 🌟 You deserve all these good feelings and more. Your positive energy is wonderful, and I hope you take a moment to really appreciate how far you've come. You're doing amazing things for yourself and others around you.";
    }
    
    // Default supportive response with affirmation
    // Default response for unmatched input
    return "Thank you for sharing that with me. I can tell this matters to you, and I want you to know that I'm here to listen without judgment. Your experiences and feelings are valid, and you deserve support. Can you tell me a bit more about what's on your mind so I can better understand how to help?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <svg width="40" height="50" viewBox="0 0 100 120" className="rounded-lg">
              {/* Outer light blue circle background */}
              <circle cx="50" cy="50" r="48" fill="#B3E5FC" />
              {/* Orange head/face */}
              <circle cx="50" cy="50" r="35" fill="#FF8A65" />
              {/* Blue eyes */}
              <circle cx="40" cy="45" r="4" fill="#1565C0" />
              <circle cx="60" cy="45" r="4" fill="#1565C0" />
              {/* Blue smile */}
              <path d="M 35 60 Q 50 75 65 60" stroke="#1565C0" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Orange body/torso */}
              <ellipse cx="50" cy="90" rx="25" ry="20" fill="#FF8A65" />
              {/* Arms */}
              <ellipse cx="20" cy="85" rx="10" ry="15" fill="#FF8A65" transform="rotate(-25 20 85)" />
              <ellipse cx="80" cy="85" rx="10" ry="15" fill="#FF8A65" transform="rotate(25 80 85)" />
            </svg>
          </div>
          <CardTitle>
            Chat with MoodBuddy
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Your compassionate AI companion for mental health support
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-white dark:bg-card">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Tell me what's on your mind..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={isLoading}
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              data-testid="button-send-message"
              className="px-4 py-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
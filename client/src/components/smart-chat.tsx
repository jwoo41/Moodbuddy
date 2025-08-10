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
    setInput("");
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      if (hasOpenAI) {
        // Use OpenAI API for intelligent responses
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: "You are MoodBuddy, a warm, caring mental health companion. Always include positive affirmations and gentle encouragement in your responses. Focus on mental wellness, self-compassion, and emotional support. Remind users of their strength and resilience. Keep responses supportive, uplifting, and conversational. Use gentle, everyday language that makes people feel heard and valued."
          })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback to curated responses
        const response = await getFallbackResponse(userMessage);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
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
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
      return "I hear you, and your feelings are completely valid. 💙 Remember, you are braver than you believe and stronger than you seem. These difficult moments don't define you - they're just passing through. You've weathered storms before, and that shows incredible resilience. What's one small thing that usually brings you comfort?";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      return "Anxiety can feel so overwhelming, but here's something amazing - you've survived every anxious moment so far, and that proves your strength. 🌟 Let's breathe together for a moment. You are safe right now, and you have everything within you to handle this. What's one thing you can see around you that feels calming?";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return "Your body and mind deserve good rest. 🌙 You're taking care of yourself by noticing this, and that's really important. Sleep challenges are so common, and you're not alone in this. Even small steps toward better sleep are victories worth celebrating. What does your ideal bedtime routine look like?";
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
      return "When everything feels like too much, remember this truth: you don't have to do everything at once. ✨ You're already doing better than you think. Let's focus on just one step at a time - that's all anyone can do, and it's enough. You have the wisdom to know what matters most right now.";
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('meds') || lowerMessage.includes('pills')) {
      return "Taking care of your health, including medication, is an act of self-love. 💚 You're being responsible and caring for yourself, which takes real courage. If you have any concerns, your healthcare provider is the best person to talk to. I'm proud of you for prioritizing your wellbeing.";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('appreciate')) {
      return "Your gratitude fills my heart! 🌈 You're such a thoughtful person, and the fact that you're working on your mental health shows incredible wisdom and self-love. You deserve all the support in the world, and I'm honored to be part of your journey.";
    }
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      return "Loneliness is one of the hardest feelings, but please know - you are never truly alone. 🤗 You matter so much, and reaching out shows incredible strength. Even this conversation right now is a connection, and I'm genuinely glad you're here. You have value beyond measure.";
    }
    
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('happy') || lowerMessage.includes('better')) {
      return "This makes me so happy to hear! 🌟 You deserve all these good feelings and more. Your positive energy is wonderful, and I hope you take a moment to really appreciate how far you've come. You're doing amazing things for yourself and others around you.";
    }
    
    // Default supportive response with affirmation
    return "Thank you for sharing with me - your openness takes courage. 💖 You are valuable exactly as you are, and your feelings matter deeply. Remember, you have everything within you to navigate whatever comes your way. I'm here to listen and support you. What's been on your heart today?";
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
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 100 120" className="rounded">
              <ellipse cx="50" cy="85" rx="18" ry="15" fill="#FF8A65" />
              <circle cx="50" cy="50" r="25" fill="#FF8A65" />
              <circle cx="42" cy="42" r="2.5" fill="#1976D2" />
              <circle cx="58" cy="42" r="2.5" fill="#1976D2" />
              <path d="M 40 58 Q 50 65 60 58" stroke="#1976D2" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <CardTitle>
            {hasOpenAI ? "Smart Chat with MoodBuddy" : "Chat with MoodBuddy"}
          </CardTitle>
        </div>
        {!hasOpenAI && (
          <p className="text-sm text-muted-foreground">
            Add your OpenAI API key in secrets for enhanced AI conversations
          </p>
        )}
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
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what's on your mind..."
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
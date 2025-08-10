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
      content: "Hello! I'm your MoodBuddy companion. I'm here to support you with mental health conversations, coping strategies, and emotional wellness. How are you feeling today?",
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
            context: "You are MoodBuddy, a compassionate mental health companion. Provide supportive, empathetic responses focused on mental wellness, coping strategies, and emotional support. Keep responses concise but caring."
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
      return "I hear that you're feeling down, and I want you to know that these feelings are valid. It's okay to have difficult days. Have you been able to maintain your daily routines? Sometimes small, consistent actions can help when we're struggling emotionally.";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      return "Anxiety can feel overwhelming, but remember that you've gotten through difficult moments before. Try taking three deep breaths with me. Focus on what you can control right now, and remember that anxious thoughts don't always reflect reality.";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return "Sleep is so important for mental health. Poor sleep can affect mood, anxiety, and our ability to cope. Have you tried establishing a consistent bedtime routine? Even small changes like limiting screens an hour before bed can make a difference.";
    }
    
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
      return "Feeling stressed and overwhelmed is challenging. Let's break things down into smaller, manageable pieces. What's one small thing you could do today that might help you feel more in control?";
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('meds') || lowerMessage.includes('pills')) {
      return "Medication can be an important part of mental health care. If you have concerns about your medications, it's always best to discuss them with your healthcare provider. Are you having trouble remembering to take them, or are you experiencing side effects?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful') || lowerMessage.includes('appreciate')) {
      return "You're so welcome! It means a lot to me that I can be here to support you. Remember, seeking help and working on your mental health takes courage. You're doing important work by taking care of yourself.";
    }
    
    if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      return "Feeling lonely is really difficult, especially when it feels like no one understands. You're not alone in feeling this way, and reaching out shows strength. Have you been able to connect with anyone recently, even in small ways?";
    }
    
    // Default supportive response
    return "Thank you for sharing that with me. Your feelings and experiences matter. I'm here to listen and support you. Is there anything specific you'd like to talk about or explore together?";
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
              placeholder="Share how you're feeling..."
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
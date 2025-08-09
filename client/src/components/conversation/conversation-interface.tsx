import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VoiceRecorder from "../voice/voice-recorder";

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface ConversationInterfaceProps {
  title?: string;
  placeholder?: string;
  onMessageSend?: (message: string) => void;
}

export default function ConversationInterface({ 
  title = "MindFlow Companion",
  placeholder = "How are you feeling today? You can type or speak...",
  onMessageSend 
}: ConversationInterfaceProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your MindFlow companion. I'm here to help you track your mental health and wellbeing. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'assistant', isVoice = false) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isVoice
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Mental health focused responses
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      return "I hear that you're feeling down. It's important to acknowledge these feelings. Have you been able to maintain your sleep schedule? Sometimes tracking your sleep patterns can help identify what might be affecting your mood.";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
      return "Anxiety can be really challenging. Let's focus on what you can control right now. Have you tried any breathing exercises today? I can also help you track what might be triggering these feelings in your journal.";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return "Sleep is so important for mental health. Let's look at your sleep patterns. Have you been going to bed and waking up at consistent times? I can help you track this in the sleep section.";
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('pills') || lowerMessage.includes('medicine')) {
      return "Staying consistent with medications is crucial. Are you taking them at the same times each day? I can help you set up reminders and track your medication adherence.";
    }
    
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('happy') || lowerMessage.includes('better')) {
      return "That's wonderful to hear! It's important to celebrate the good moments. What do you think contributed to feeling this way today? Recording this in your journal might help you identify positive patterns.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I can help you track your mental health in several ways: monitor your mood daily, log sleep patterns, manage medication schedules, and keep a personal journal. Which area would you like to focus on today?";
    }
    
    // Default supportive responses
    const responses = [
      "Thank you for sharing that with me. How has this been affecting your daily routine?",
      "I appreciate you opening up. Have you noticed any patterns in how you've been feeling lately?",
      "It sounds like you're going through something important. Would it help to track this in your journal?",
      "That's a significant thing to share. How are you taking care of yourself during this time?",
      "I'm here to listen and help you track your wellbeing. What feels most important to focus on right now?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (content: string, isVoice = false) => {
    if (!content.trim()) return;
    
    // Add user message
    addMessage(content, 'user', isVoice);
    setInputValue("");
    setIsProcessing(true);
    onMessageSend?.(content);
    
    try {
      // Generate AI response
      const response = await generateResponse(content);
      addMessage(response, 'assistant');
      
      // Speak the response if it was a voice message
      if (isVoice && 'speechSynthesis' in window) {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
        }, 500);
      }
      
    } catch (error) {
      console.error('Error generating response:', error);
      addMessage("I'm sorry, I'm having trouble responding right now. Please try again.", 'assistant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    if (text.trim()) {
      handleSendMessage(text, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.type === 'assistant' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        onClick={() => speakMessage(message.content)}
                        data-testid={`button-speak-${message.id}`}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isProcessing}
                className="pr-12"
                data-testid="input-conversation"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isProcessing}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription}
              onRecordingStart={() => toast({ title: "Listening...", description: "Speak now" })}
              onRecordingStop={() => toast({ title: "Processing...", description: "Converting speech to text" })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
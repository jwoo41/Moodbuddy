import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

const inspirationalQuotes = [
  {
    text: "Every day is a new opportunity to nurture your mental health and wellbeing.",
    author: "MoodBuddy"
  },
  {
    text: "Small steps forward are still progress. Be gentle with yourself today.",
    author: "MoodBuddy"
  },
  {
    text: "Your feelings are valid, your struggles are real, and your strength is greater than you know.",
    author: "MoodBuddy"
  },
  {
    text: "It's okay to not be okay. What matters is that you're here, trying, and taking care of yourself.",
    author: "MoodBuddy"
  },
  {
    text: "Healing isn't linear. Some days will be harder than others, and that's perfectly normal.",
    author: "MoodBuddy"
  },
  {
    text: "You are worthy of love, peace, and happiness - especially from yourself.",
    author: "MoodBuddy"
  },
  {
    text: "Mental health is just as important as physical health. Take care of both.",
    author: "MoodBuddy"
  },
  {
    text: "Progress, not perfection. Every small act of self-care matters.",
    author: "MoodBuddy"
  },
  {
    text: "Your journey is unique. Don't compare your chapter 1 to someone else's chapter 20.",
    author: "MoodBuddy"
  },
  {
    text: "Breathe deeply. You have survived 100% of your difficult days so far.",
    author: "MoodBuddy"
  }
];

export default function InspirationalQuotes() {
  const [currentQuote, setCurrentQuote] = useState(inspirationalQuotes[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Set random quote on component mount
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    setCurrentQuote(inspirationalQuotes[randomIndex]);
  }, []);

  const refreshQuote = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
      setCurrentQuote(inspirationalQuotes[randomIndex]);
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200 leading-relaxed mb-2">
              "{currentQuote.text}"
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              — {currentQuote.author}
            </p>
          </div>
          <button
            onClick={refreshQuote}
            disabled={isRefreshing}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors p-1"
            data-testid="button-refresh-quote"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
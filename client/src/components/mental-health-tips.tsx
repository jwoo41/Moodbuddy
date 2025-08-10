import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface MentalHealthTip {
  id: string;
  category: "motivation" | "mindfulness" | "selfcare" | "coping" | "wellness" | "gratitude";
  title: string;
  message: string;
  icon: string;
}

const mentalHealthTips: MentalHealthTip[] = [
  {
    id: "1",
    category: "motivation",
    title: "You're Stronger Than You Think",
    message: "Every challenge you've faced has made you more resilient. Remember, you've overcome difficulties before, and you can do it again. Take it one step at a time.",
    icon: "💪"
  },
  {
    id: "2",
    category: "mindfulness",
    title: "Take a Mindful Moment",
    message: "Pause and take three deep breaths. Notice how your body feels right now. This simple practice can help center your mind and reduce anxiety.",
    icon: "🧘‍♀️"
  },
  {
    id: "3",
    category: "selfcare",
    title: "Self-Care Isn't Selfish",
    message: "Taking time for yourself isn't indulgent—it's necessary. Whether it's a warm bath, a walk outside, or simply saying 'no' to extra commitments, prioritize your well-being.",
    icon: "🛁"
  },
  {
    id: "4",
    category: "coping",
    title: "It's Okay to Not Be Okay",
    message: "Having difficult emotions is part of being human. Don't judge yourself for feeling sad, anxious, or overwhelmed. These feelings are temporary and will pass.",
    icon: "🤗"
  },
  {
    id: "5",
    category: "wellness",
    title: "Sleep is Your Superpower",
    message: "Quality sleep affects your mood, energy, and ability to cope with stress. Try to maintain a consistent sleep schedule and create a relaxing bedtime routine.",
    icon: "😴"
  },
  {
    id: "6",
    category: "gratitude",
    title: "Find Something to Appreciate",
    message: "Even on tough days, there's usually something small to be grateful for—a warm cup of coffee, a friend's text, or simply having made it through the day.",
    icon: "🌟"
  },
  {
    id: "7",
    category: "motivation",
    title: "Progress Over Perfection",
    message: "You don't have to be perfect. Small steps forward are still progress. Celebrate the little wins and be patient with yourself on this journey.",
    icon: "🎯"
  },
  {
    id: "8",
    category: "mindfulness",
    title: "Ground Yourself in the Present",
    message: "When anxiety strikes, try the 5-4-3-2-1 technique: Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This brings you back to the present moment.",
    icon: "🌱"
  },
  {
    id: "9",
    category: "selfcare",
    title: "Movement is Medicine",
    message: "Physical activity, even just a 5-minute walk, can boost your mood and reduce stress. Your body and mind are connected—when you move your body, you help your mind too.",
    icon: "🚶‍♀️"
  },
  {
    id: "10",
    category: "wellness",
    title: "Connect with Others",
    message: "Reaching out to friends, family, or support groups can make a huge difference. You don't have to face challenges alone—human connection is powerful medicine.",
    icon: "👥"
  },
  {
    id: "11",
    category: "coping",
    title: "Create a Calming Space",
    message: "Having a designated calm space in your home—even just a cozy corner with soft lighting or plants—can provide a retreat when you need to reset and recharge.",
    icon: "🏡"
  },
  {
    id: "12",
    category: "mindfulness",
    title: "Practice Self-Compassion",
    message: "Talk to yourself like you would a good friend. Replace harsh self-criticism with kind, understanding words. You deserve the same compassion you show others.",
    icon: "💖"
  },
  {
    id: "13",
    category: "wellness",
    title: "Nutrition Affects Mood",
    message: "What you eat impacts how you feel. Try to include foods rich in omega-3s, like salmon and walnuts, and limit excessive caffeine or sugar that can affect your mood stability.",
    icon: "🥗"
  },
  {
    id: "14",
    category: "motivation",
    title: "You're Making a Difference",
    message: "Your presence in this world matters more than you know. Even small acts of kindness create ripple effects. You're contributing to the world just by being you.",
    icon: "✨"
  },
  {
    id: "15",
    category: "coping",
    title: "Breathe Through Difficult Moments",
    message: "When overwhelmed, try box breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat until you feel more centered. Your breath is always available to help you.",
    icon: "🫁"
  }
];

export default function MentalHealthTips() {
  const [currentTip, setCurrentTip] = useState<MentalHealthTip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set initial tip based on day of year to ensure consistency but variety
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % mentalHealthTips.length;
    setCurrentTip(mentalHealthTips[tipIndex]);
  }, []);

  const getNewTip = () => {
    setIsLoading(true);
    
    // Simulate a moment of loading for better UX
    setTimeout(() => {
      const availableTips = mentalHealthTips.filter(tip => tip.id !== currentTip?.id);
      const randomTip = availableTips[Math.floor(Math.random() * availableTips.length)];
      setCurrentTip(randomTip);
      setIsLoading(false);
    }, 500);
  };

  if (!currentTip) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
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
            <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
              Daily Wellness Tip
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={getNewTip}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300"
            data-testid="button-new-tip"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" role="img" aria-label={currentTip.category}>
              {currentTip.icon}
            </span>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {currentTip.title}
            </h3>
          </div>
          <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
            {currentTip.message}
          </p>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
              — Your MoodBuddy companion
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
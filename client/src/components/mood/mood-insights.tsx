import { MoodEntry } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, Heart } from "lucide-react";

interface MoodInsightsProps {
  moodEntries: MoodEntry[];
}

const moodToValue = (mood: string): number => {
  switch (mood) {
    case "very-sad": return 1;
    case "sad": return 2;
    case "neutral": return 3;
    case "happy": return 4;
    case "very-happy": return 5;
    default: return 3;
  }
};

const moodEmojis = {
  "very-sad": "😢",
  "sad": "😞",
  "neutral": "😐",
  "happy": "😊",
  "very-happy": "😄",
};

export default function MoodInsights({ moodEntries }: MoodInsightsProps) {
  if (moodEntries.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Heart className="w-5 h-5 mr-2 text-pink-500" />
            Mood Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-3xl mb-2">💝</div>
            <p className="text-muted-foreground">
              Add more mood entries to unlock personalized insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate mood statistics
  const recentEntries = moodEntries.slice(0, 7); // Last 7 entries
  const previousEntries = moodEntries.slice(7, 14); // Previous 7 entries
  
  const averageRecentMood = recentEntries.length > 0 
    ? recentEntries.reduce((sum, entry) => sum + moodToValue(entry.mood), 0) / recentEntries.length
    : 0;
    
  const averagePreviousMood = previousEntries.length > 0
    ? previousEntries.reduce((sum, entry) => sum + moodToValue(entry.mood), 0) / previousEntries.length
    : averageRecentMood;

  const moodTrend = averageRecentMood - averagePreviousMood;
  
  // Find mood patterns
  const moodCounts = moodEntries.slice(0, 14).reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentMood = Object.entries(moodCounts).reduce((a, b) => 
    moodCounts[a[0]] > moodCounts[b[0]] ? a : b
  )[0];

  // Calculate streak
  let currentStreak = 0;
  let streakMood = moodEntries[0]?.mood;
  const streakValue = moodToValue(streakMood);
  
  for (const entry of moodEntries) {
    const entryValue = moodToValue(entry.mood);
    if (streakValue >= 4 && entryValue >= 4) { // Happy streak
      currentStreak++;
    } else if (streakValue <= 2 && entryValue <= 2) { // Sad streak
      currentStreak++;
    } else {
      break;
    }
  }

  const getTrendText = () => {
    if (moodTrend > 0.5) return { text: "trending upward", color: "text-green-600", icon: TrendingUp };
    if (moodTrend < -0.5) return { text: "trending downward", color: "text-red-600", icon: TrendingDown };
    return { text: "staying stable", color: "text-blue-600", icon: Calendar };
  };

  const trendInfo = getTrendText();
  const TrendIcon = trendInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Heart className="w-5 h-5 mr-2 text-pink-500" />
          Mood Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Trend */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
            <span className="font-medium">Your mood is {trendInfo.text}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            vs. last week
          </div>
        </div>

        {/* Most Frequent Mood */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-xl">
              {moodEmojis[mostFrequentMood as keyof typeof moodEmojis]}
            </span>
            <span className="font-medium">
              Most common: {mostFrequentMood.replace('-', ' ')}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round((moodCounts[mostFrequentMood] / Math.min(moodEntries.length, 14)) * 100)}% of time
          </div>
        </div>

        {/* Current Streak */}
        {currentStreak >= 3 && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔥</span>
              <span className="font-medium">
                {streakValue >= 4 ? 'Positive' : 'Challenging'} streak
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStreak} days
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            <strong>This week:</strong> {recentEntries.length} mood entries • 
            Average: {averageRecentMood.toFixed(1)}/5.0
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
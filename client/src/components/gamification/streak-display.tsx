import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";

interface StreakData {
  streaks: Array<{
    id: string;
    userId: string;
    category: string;
    currentStreak: number;
    longestStreak: number;
    lastEntryDate: string | null;
    totalEntries: number;
    updatedAt: string;
  }>;
  summary: {
    totalActiveStreaks: number;
    longestCurrentStreak: number;
    bestCategory: string;
    recentAchievements: Array<{
      id: string;
      userId: string;
      achievementType: string;
      category: string;
      title: string;
      description: string;
      iconEmoji: string;
      earnedAt: string;
    }>;
  };
}

export function StreakDisplay() {
  const { data: streakData, isLoading, error } = useQuery<StreakData>({
    queryKey: ['/api/streaks'],
  });

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'mood': '😊',
      'sleep': '😴',
      'medication': '💊',
      'exercise': '💪',
      'weight': '⚖️',
      'journal': '📝',
      'overall': '⭐'
    };
    return emojis[category] || '🎯';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'mood': 'Mood',
      'sleep': 'Sleep',
      'medication': 'Medication',
      'exercise': 'Exercise',
      'weight': 'Weight',
      'journal': 'Journal',
      'overall': 'Overall'
    };
    return names[category] || category;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-500" />
            Your Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !streakData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Target className="w-5 h-5 mr-2" />
            Streaks Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load your streak data right now.</p>
        </CardContent>
      </Card>
    );
  }

  const activeStreaks = streakData.streaks.filter(s => s.currentStreak > 0);

  return (
    <div className="space-y-6">
      {/* Streak Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-500" />
            Streak Summary
          </CardTitle>
          <CardDescription>Your consistency tracking at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streakData.summary.totalActiveStreaks}
              </div>
              <div className="text-sm text-muted-foreground">Active Streaks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {streakData.summary.longestCurrentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">
                {getCategoryEmoji(streakData.summary.bestCategory)}
              </div>
              <div className="text-sm text-muted-foreground">Top Category</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {streakData.summary.recentAchievements.length}
              </div>
              <div className="text-sm text-muted-foreground">Recent Wins</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Streaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Your Tracking Streaks
          </CardTitle>
          <CardDescription>Keep the momentum going!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {streakData.streaks.map((streak) => (
              <div
                key={streak.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  streak.currentStreak > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
                data-testid={`streak-${streak.category}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getCategoryEmoji(streak.category)}</div>
                  <div>
                    <div className="font-medium">{getCategoryName(streak.category)}</div>
                    <div className="text-sm text-muted-foreground">
                      {streak.totalEntries} total entries
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {streak.currentStreak > 0 && (
                      <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                        🔥 {streak.currentStreak} days
                      </Badge>
                    )}
                    {streak.longestStreak > 0 && (
                      <Badge variant="secondary">
                        🏆 Best: {streak.longestStreak}
                      </Badge>
                    )}
                  </div>
                  {streak.lastEntryDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last: {new Date(streak.lastEntryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {streakData.streaks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start tracking to build your streaks!</p>
                <p className="text-sm mt-2">Log your mood, sleep, medication, or exercise to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {streakData.summary.recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streakData.summary.recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  data-testid={`achievement-${achievement.achievementType}`}
                >
                  <div className="text-2xl">{achievement.iconEmoji}</div>
                  <div className="flex-1">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      {achievement.title}
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {achievement.description}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">
                    {getCategoryName(achievement.category)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
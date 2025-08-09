import React from "react";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Star, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  category: string;
  title: string;
  description: string;
  iconEmoji: string;
  earnedAt: string;
}

export default function GamificationPage() {
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

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

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Your Progress & Achievements
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your consistency and celebrate your wellness journey milestones
        </p>
      </div>

      <Tabs defaultValue="streaks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="streaks" className="flex items-center space-x-2">
            <Flame className="w-4 h-4" />
            <span>Streaks</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streaks" className="space-y-6">
          <StreakDisplay />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {achievementsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Loading Achievements...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : achievements.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-muted-foreground">
                  <Target className="w-5 h-5 mr-2" />
                  No Achievements Yet
                </CardTitle>
                <CardDescription>
                  Start tracking your mood, sleep, medication, and exercise to unlock achievements!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">
                    Your first achievement is just one tracking entry away!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Achievement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Achievement Summary
                  </CardTitle>
                  <CardDescription>Your wellness journey milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {achievements.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {Object.keys(groupedAchievements).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {achievements.filter(a => a.achievementType.includes('streak')).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Streak Awards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {achievements.filter(a => a.achievementType.includes('first')).length}
                      </div>
                      <div className="text-sm text-muted-foreground">First Steps</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements by Category */}
              {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      {getCategoryName(category)} Achievements
                    </CardTitle>
                    <CardDescription>
                      {categoryAchievements.length} achievement{categoryAchievements.length !== 1 ? 's' : ''} earned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {categoryAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800"
                          data-testid={`achievement-${achievement.achievementType}`}
                        >
                          <div className="text-3xl">{achievement.iconEmoji}</div>
                          <div className="flex-1">
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">
                              {achievement.title}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              {achievement.description}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">
                                {new Date(achievement.earnedAt).toLocaleDateString()}
                              </Badge>
                              <Badge variant="secondary">
                                {getCategoryName(achievement.category)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* All Achievements Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Achievement Timeline
                  </CardTitle>
                  <CardDescription>Your recent accomplishments in chronological order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements
                      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                      .slice(0, 10)
                      .map((achievement, index) => (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="text-2xl">{achievement.iconEmoji}</div>
                          <div className="flex-1">
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {getCategoryName(achievement.category)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(achievement.earnedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
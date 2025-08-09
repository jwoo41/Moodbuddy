import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Moon, Pill, PenTool, MessageCircle, User, LogOut, Plus } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User as UserType, MoodEntry } from "@shared/schema";

const moodEmojis = {
  "very-sad": "😢",
  "sad": "😔",
  "neutral": "😐",
  "happy": "😊",
  "very-happy": "😄",
};

const moodLabels = {
  "very-sad": "Very Sad",
  "sad": "Sad", 
  "neutral": "Neutral",
  "happy": "Happy",
  "very-happy": "Very Happy",
};

export default function Home() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const addMoodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const response = await apiRequest("POST", "/api/mood", { mood });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: "Mood logged",
        description: "Thanks for sharing how you're feeling!",
      });
    },
  });

  const getTodaysMood = () => {
    const today = new Date().toDateString();
    return moodEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const todaysMood = getTodaysMood();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
          Hello, {user?.firstName || 'Friend'}! 👋
        </h1>
        <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground text-lg">
          How are you feeling today?
        </p>
      </div>

      {/* Quick Mood Tracker */}
      <Card className="mb-8 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Quick Mood Check</CardTitle>
          {todaysMood ? (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="text-3xl">{moodEmojis[todaysMood.mood as keyof typeof moodEmojis]}</span>
              <span className="text-lg font-medium">You're feeling {moodLabels[todaysMood.mood as keyof typeof moodLabels].toLowerCase()} today</span>
            </div>
          ) : (
            <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">Tap an emoji to log your mood</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-4">
            {Object.entries(moodEmojis).map(([mood, emoji]) => (
              <Button
                key={mood}
                variant={todaysMood?.mood === mood ? "default" : "outline"}
                size="lg"
                className="text-3xl p-4 h-auto"
                onClick={() => addMoodMutation.mutate(mood)}
                disabled={addMoodMutation.isPending}
                data-testid={`mood-${mood}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/sleep">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">😴</div>
              <div className="font-medium">Sleep</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/medication">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">💊</div>
              <div className="font-medium">Meds</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/journal">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">📝</div>
              <div className="font-medium">Journal</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/chat">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🤖</div>
              <div className="font-medium">AI Chat</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">📊</span>
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {moodEntries.length}
              </div>
              <div className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground">
                Mood entries
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                0
              </div>
              <div className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground">
                Sleep logs
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                0
              </div>
              <div className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground">
                Journal entries
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom spacing for mobile nav */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
}
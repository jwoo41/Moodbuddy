import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Moon, Pill, PenTool, MessageCircle, User, LogOut, Plus, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User as UserType, MoodEntry, SleepEntry, Medication, MedicationTaken } from "@shared/schema";

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
  const [sleepForm, setSleepForm] = useState({ bedtime: "", wakeTime: "", quality: "" });

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const { data: sleepEntries = [] } = useQuery<SleepEntry[]>({
    queryKey: ["/api/sleep"],
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: medicationTaken = [] } = useQuery<MedicationTaken[]>({
    queryKey: ["/api/medications/taken"],
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

  const addSleepMutation = useMutation({
    mutationFn: async (data: { bedtime: string; wakeTime: string; quality: string }) => {
      const bedtime = new Date(`${new Date().toDateString()} ${data.bedtime}:00`);
      const wakeTime = new Date(`${new Date().toDateString()} ${data.wakeTime}:00`);
      
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      const sleepData = {
        bedtime,
        wakeTime,
        hoursSlept,
        quality: data.quality,
      };

      const response = await apiRequest("POST", "/api/sleep", sleepData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep"] });
      toast({
        title: "Sleep logged",
        description: "Your sleep data has been recorded!",
      });
      setSleepForm({ bedtime: "", wakeTime: "", quality: "" });
    },
  });

  const markMedicationTakenMutation = useMutation({
    mutationFn: async (data: { medicationId: string; scheduledTime: string }) => {
      const response = await apiRequest("POST", "/api/medications/taken", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications/taken"] });
      toast({
        title: "Medication marked",
        description: "Medication dose recorded!",
      });
    },
  });

  const getTodaysMood = () => {
    const today = new Date().toDateString();
    return moodEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const getTodaysSleep = () => {
    const today = new Date().toDateString();
    return sleepEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const isMedicationTakenToday = (medicationId: string, scheduledTime: string) => {
    const today = new Date().toDateString();
    return medicationTaken.some(record => 
      record.medicationId === medicationId &&
      record.scheduledTime === scheduledTime &&
      new Date(record.takenAt).toDateString() === today
    );
  };

  const todaysMood = getTodaysMood();
  const todaysSleep = getTodaysSleep();

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

      {/* Sleep Quick Logger */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">😴</span>
            Sleep Tracker
          </CardTitle>
          {todaysSleep ? (
            <div className="text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-lg font-medium text-green-700 dark:text-green-400">
                ✅ Sleep logged: {todaysSleep.hoursSlept}h ({todaysSleep.quality})
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="time"
                placeholder="Bedtime"
                value={sleepForm.bedtime}
                onChange={(e) => setSleepForm({...sleepForm, bedtime: e.target.value})}
                data-testid="input-bedtime"
              />
              <Input
                type="time"
                placeholder="Wake time"
                value={sleepForm.wakeTime}
                onChange={(e) => setSleepForm({...sleepForm, wakeTime: e.target.value})}
                data-testid="input-waketime"
              />
              <div className="flex space-x-2">
                <Select value={sleepForm.quality} onValueChange={(value) => setSleepForm({...sleepForm, quality: value})}>
                  <SelectTrigger data-testid="select-quality">
                    <SelectValue placeholder="Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => addSleepMutation.mutate(sleepForm)}
                  disabled={!sleepForm.bedtime || !sleepForm.wakeTime || !sleepForm.quality || addSleepMutation.isPending}
                  data-testid="button-log-sleep"
                >
                  Log
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Medication Tracker */}
      {medications.length > 0 && (
        <Card className="mb-6 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="text-2xl mr-2">💊</span>
              Today's Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-medium mb-2">{med.name} - {med.dosage}</div>
                  <div className="flex space-x-2">
                    {med.times.map((time) => (
                      <div key={time} className="flex items-center space-x-2">
                        <span className="text-sm">{time}</span>
                        <Button
                          size="sm"
                          variant={isMedicationTakenToday(med.id, time) ? "default" : "outline"}
                          onClick={() => !isMedicationTakenToday(med.id, time) && markMedicationTakenMutation.mutate({
                            medicationId: med.id,
                            scheduledTime: time
                          })}
                          disabled={isMedicationTakenToday(med.id, time) || markMedicationTakenMutation.isPending}
                          data-testid={`med-${med.id}-${time}`}
                        >
                          {isMedicationTakenToday(med.id, time) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/sleep">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">😴</div>
              <div className="font-medium">Sleep History</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/medication">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">💊</div>
              <div className="font-medium">Manage Meds</div>
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
                {sleepEntries.length}
              </div>
              <div className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground">
                Sleep logs
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {medications.length}
              </div>
              <div className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground">
                Active medications
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
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, Moon, Pill, PenTool, MessageCircle, User, LogOut, Plus, Check, X, Bell, Activity, Weight } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User as UserType, MoodEntry, SleepEntry, Medication, MedicationTaken, ExerciseEntry, WeightEntry } from "@shared/schema";
import OnboardingModal from "@/components/onboarding/onboarding-modal";
import { MultiStepOnboarding } from "@/components/onboarding/multi-step-onboarding";
import MoodChart from "@/components/mood/mood-chart";
import { AchievementToast } from "@/components/gamification/achievement-toast";
import MentalHealthTips from "@/components/mental-health-tips";
import InspirationalQuotes from "@/components/inspirational-quotes";

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

const medicationFormSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  times: z.array(z.string()).min(1, "At least one time is required"),
});

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be less than 50 characters"),
});

type MedicationFormData = z.infer<typeof medicationFormSchema>;
type ProfileFormData = z.infer<typeof profileFormSchema>;

const frequencies = [
  { value: "daily", label: "Daily", times: 1 },
  { value: "twice-daily", label: "Twice Daily", times: 2 },
  { value: "three-times-daily", label: "Three Times Daily", times: 3 },
];

export default function Home() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAchievements, setPendingAchievements] = useState<any[]>([]);
  const achievementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to handle achievements consistently
  const handleAchievements = (data: any) => {
    if (data.gamification?.newAchievements?.length > 0) {
      if (achievementTimeoutRef.current) {
        clearTimeout(achievementTimeoutRef.current);
      }
      
      achievementTimeoutRef.current = setTimeout(() => {
        setPendingAchievements(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAchievements = data.gamification.newAchievements.filter(
            (achievement: any) => !existingIds.has(achievement.id)
          );
          return [...prev, ...newAchievements];
        });
      }, 100);
    }
  };

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  // State variables
  const [sleepForm, setSleepForm] = useState({ 
    bedtime: "", 
    wakeTime: ""
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isMedDialogOpen, setIsMedDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodDescription, setMoodDescription] = useState("");
  const [showMoodDescription, setShowMoodDescription] = useState(false);

  // Data queries
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

  const { data: exerciseEntries = [] } = useQuery<ExerciseEntry[]>({
    queryKey: ['/api/exercise'],
  });

  const { data: weightEntries = [] } = useQuery<WeightEntry[]>({
    queryKey: ['/api/weight'],
  });

  // Additional state for exercise and weight tracking
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightForm, setWeightForm] = useState({ 
    weight: "", 
    unit: "lbs", 
    notes: "" 
  });

  // Helper functions
  const getTimeSlots = () => {
    switch (selectedFrequency) {
      case "daily":
        return ["08:00"];
      case "twice-daily":
        return ["08:00", "20:00"];
      case "three-times-daily":
        return ["08:00", "12:00", "20:00"];
      default:
        return [];
    }
  };

  const checkMoodAlerts = (entries: MoodEntry[]) => {
    // Implementation for mood alert checking
    const recentEntries = entries.slice(-5);
    const lowMoodCount = recentEntries.filter(entry => 
      entry.mood === "very-sad" || entry.mood === "sad"
    ).length;
    
    if (lowMoodCount >= 5) {
      console.log("Alert: Low mood pattern detected");
    }
  };

  const checkMedicationConsistency = (meds: Medication[], taken: MedicationTaken[]) => {
    // Implementation for medication consistency checking
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentTaken = taken.filter(mt => new Date(mt.takenAt) >= threeDaysAgo);
    const adherenceRate = recentTaken.length / (meds.length * 3);
    
    if (adherenceRate < 0.7 && meds.length > 0) {
      console.log("Alert: Low medication adherence");
    }
  };

  // Run alert checks when data changes
  useEffect(() => {
    if (moodEntries.length > 0) {
      checkMoodAlerts(moodEntries);
    }
    if (medications.length > 0 && medicationTaken.length > 0) {
      checkMedicationConsistency(medications, medicationTaken);
    }
  }, [moodEntries, medications, medicationTaken]);

  // Form configurations
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || user?.firstName || '',
    },
  });

  const medForm = useForm<MedicationFormData>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      times: [],
    },
  });

  // Helper functions for data
  const todaysMood = moodEntries.find(entry => 
    new Date(entry.createdAt).toDateString() === new Date().toDateString()
  );

  const todaysSleep = sleepEntries.find(entry => 
    new Date(entry.createdAt).toDateString() === new Date().toDateString()
  );

  const getTodaysExercise = () => {
    return exerciseEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === new Date().toDateString()
    );
  };

  const getTodaysWeight = () => {
    return weightEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === new Date().toDateString()
    );
  };

  // Mutations
  const addMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; description?: string }) => {
      if (todaysMood) {
        const response = await apiRequest("PUT", `/api/mood/${todaysMood.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/mood", data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streaks"] });
      
      handleAchievements(data);
      
      let description = todaysMood ? "Your mood has been updated." : "Thanks for sharing how you're feeling!";
      if (data.gamification?.streak > 1) {
        description += ` 🔥 ${data.gamification.streak} day streak!`;
      }
      if (data.gamification?.isNewRecord) {
        description += " 🎉 New record!";
      }
      
      toast({
        title: todaysMood ? "Mood updated!" : "Mood logged!",
        description,
      });
    },
  });

  const addSleepMutation = useMutation({
    mutationFn: async (data: { 
      bedtime: string; 
      wakeTime: string;
    }) => {
      if (!data.bedtime || !data.wakeTime) {
        throw new Error("Both bedtime and wake time are required");
      }

      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.bedtime) || !timeRegex.test(data.wakeTime)) {
        throw new Error("Please enter valid times in HH:MM format");
      }

      const bedtime = new Date(`${new Date().toDateString()} ${data.bedtime}:00`);
      const wakeTime = new Date(`${new Date().toDateString()} ${data.wakeTime}:00`);
      
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      if (hoursSlept < 1 || hoursSlept > 16) {
        throw new Error("Sleep duration must be between 1 and 16 hours. Please check your times.");
      }

      const sleepData = {
        bedtime,
        wakeTime,
        hoursSlept,
        quality: "good",
      };

      if (todaysSleep) {
        const response = await apiRequest("PUT", `/api/sleep/${todaysSleep.id}`, sleepData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/sleep", sleepData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep"] });
      toast({
        title: todaysSleep ? "Sleep updated!" : "Sleep logged!",
        description: todaysSleep ? "Your sleep data has been updated!" : "Your sleep data has been recorded!",
      });
      setSleepForm({ 
        bedtime: "", 
        wakeTime: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save sleep data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      const response = await apiRequest("POST", "/api/medications", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      handleAchievements(data);
      toast({
        title: "Medication added!",
        description: "Your medication has been saved successfully.",
      });
      setIsMedDialogOpen(false);
      medForm.reset();
      setSelectedFrequency("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add medication. Please try again.",
        variant: "destructive",
      });
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", `/api/auth/user`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your display name has been saved successfully.",
      });
      setIsProfileDialogOpen(false);
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: { exercised: boolean; notes?: string }) => {
      const todaysExercise = getTodaysExercise();
      if (todaysExercise) {
        const response = await apiRequest("PUT", `/api/exercise/${todaysExercise.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/exercise", data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise'] });
      queryClient.invalidateQueries({ queryKey: ['/api/streaks'] });
      
      handleAchievements(data);
      
      let description = getTodaysExercise() ? "Exercise status updated!" : "Exercise logged!";
      if (data.gamification?.streak > 1) {
        description += ` 🔥 ${data.gamification.streak} day streak!`;
      }
      if (data.gamification?.isNewRecord) {
        description += " 🎉 New record!";
      }
      
      toast({
        title: "Exercise tracked!",
        description,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: number; unit: string; notes?: string }) => {
      const todaysWeight = getTodaysWeight();
      if (todaysWeight) {
        const response = await apiRequest("PUT", `/api/weight/${todaysWeight.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/weight", data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      queryClient.invalidateQueries({ queryKey: ['/api/streaks'] });
      
      handleAchievements(data);
      
      let description = getTodaysWeight() ? "Weight updated!" : "Weight logged!";
      if (data.gamification?.streak > 1) {
        description += ` 🔥 ${data.gamification.streak} day streak!`;
      }
      if (data.gamification?.isNewRecord) {
        description += " 🎉 New record!";
      }
      
      toast({
        title: "Weight tracked!",
        description,
      });
      setWeightForm({ weight: "", unit: "lbs", notes: "" });
      setIsEditingWeight(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log weight. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for actions
  const markMedicationTaken = (medicationId: string, scheduledTime: string) => {
    markMedicationTakenMutation.mutate({ medicationId, scheduledTime });
  };

  const skipMedication = (medicationId: string, scheduledTime: string) => {
    // For skip functionality, we might want to track this differently
    toast({
      title: "Medication skipped",
      description: "Dose has been skipped for this time.",
    });
  };

  const handleFrequencyChange = (value: string) => {
    setSelectedFrequency(value);
    medForm.setValue("frequency", value);
    const timeSlots = getTimeSlots();
    medForm.setValue("times", timeSlots);
  };

  const setupNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications enabled",
          description: "You'll receive medication reminders",
        });
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup notifications",
        variant: "destructive",
      });
    }
  };

  const toggleMedicationNotifications = async (medicationId: string, enabled: boolean) => {
    try {
      const response = await apiRequest("PUT", `/api/medications/${medicationId}`, {
        notificationsEnabled: enabled
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
        toast({
          title: enabled ? "Notifications enabled" : "Notifications disabled",
          description: `Medication reminders ${enabled ? 'turned on' : 'turned off'}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const onMoodSubmit = (mood: string, description?: string) => {
    addMoodMutation.mutate({ mood, description });
    setSelectedMood(null);
    setMoodDescription("");
    setShowMoodDescription(false);
  };

  const onMedSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(data);
  };

  const onWeightSubmit = () => {
    const weight = parseFloat(weightForm.weight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight",
        variant: "destructive",
      });
      return;
    }
    
    addWeightMutation.mutate({
      weight,
      unit: weightForm.unit,
      notes: weightForm.notes || undefined,
    });
  };

  if (showOnboarding) {
    return (
      <MultiStepOnboarding
        open={showOnboarding}
        userName={user?.displayName || user?.firstName || "Friend"}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName || user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            How are you feeling today?
          </p>
        </div>

        {/* Mood Tracker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              Today's Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysMood ? (
              <div className="text-center py-4">
                <div className="text-6xl mb-2">{moodEmojis[todaysMood.mood as keyof typeof moodEmojis]}</div>
                <p className="text-lg font-medium mb-2">{moodLabels[todaysMood.mood as keyof typeof moodLabels]}</p>
                {todaysMood.description && (
                  <p className="text-sm text-muted-foreground mb-4">"{todaysMood.description}"</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMood(todaysMood.mood)}
                  data-testid="button-update-mood"
                >
                  Update Mood
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(moodEmojis).map(([mood, emoji]) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className="p-4 text-4xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    data-testid={`button-mood-${mood}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {selectedMood && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{moodEmojis[selectedMood as keyof typeof moodEmojis]}</div>
                  <h3 className="text-lg font-medium">{moodLabels[selectedMood as keyof typeof moodLabels]}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How are you feeling? (Optional)
                    </label>
                    <Input
                      value={moodDescription}
                      onChange={(e) => setMoodDescription(e.target.value)}
                      placeholder="Describe your mood in a few words..."
                      data-testid="input-mood-description"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onMoodSubmit(selectedMood, moodDescription)}
                      disabled={addMoodMutation.isPending}
                      className="flex-1"
                      data-testid="button-save-mood"
                    >
                      {addMoodMutation.isPending ? "Saving..." : "Save Mood"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMood(null);
                        setMoodDescription("");
                      }}
                      className="flex-1"
                      data-testid="button-cancel-mood"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleep Tracker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Moon className="w-6 h-6 mr-2 text-blue-500" />
              Sleep Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysSleep ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">😴</div>
                <p className="text-lg font-medium mb-2">
                  {todaysSleep.hoursSlept} hours of sleep
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Bedtime: {new Date(todaysSleep.bedtime).toLocaleTimeString()} • 
                  Wake: {new Date(todaysSleep.wakeTime).toLocaleTimeString()}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSleepForm({
                      bedtime: new Date(todaysSleep.bedtime).toTimeString().slice(0, 5),
                      wakeTime: new Date(todaysSleep.wakeTime).toTimeString().slice(0, 5)
                    });
                  }}
                  data-testid="button-update-sleep"
                >
                  Update Sleep
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center mb-2">
                      🛏️ Bedtime
                    </label>
                    <Input
                      type="time"
                      value={sleepForm.bedtime}
                      onChange={(e) => setSleepForm({...sleepForm, bedtime: e.target.value})}
                      data-testid="input-bedtime"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center mb-2">
                      ⏰ Wake Up Time
                    </label>
                    <Input
                      type="time"
                      value={sleepForm.wakeTime}
                      onChange={(e) => setSleepForm({...sleepForm, wakeTime: e.target.value})}
                      data-testid="input-waketime"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => addSleepMutation.mutate(sleepForm)}
                    disabled={!sleepForm.bedtime || !sleepForm.wakeTime || addSleepMutation.isPending}
                    data-testid="button-log-sleep"
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  >
                    {addSleepMutation.isPending ? "💤 Saving..." : todaysSleep ? "💤 Update Sleep" : "💤 Log Sleep"}
                  </Button>
                  {todaysSleep && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSleepForm({ bedtime: '', wakeTime: '' });
                      }}
                      data-testid="button-cancel-sleep-edit"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medication Tracker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Pill className="w-6 h-6 mr-2 text-green-500" />
                Today's Medications
              </div>
              <Button
                onClick={() => setIsMedDialogOpen(true)}
                size="sm"
                data-testid="button-add-medication"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{med.name}</div>
                        {med.dosage && (
                          <div className="text-sm text-muted-foreground">{med.dosage}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          medForm.reset({
                            name: med.name,
                            dosage: med.dosage || "",
                            frequency: med.frequency,
                            times: med.times || []
                          });
                          setSelectedFrequency(med.frequency);
                          setIsMedDialogOpen(true);
                        }}
                        data-testid={`button-edit-med-${med.id}`}
                      >
                        Edit
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4">
                      {med.times?.map((time, timeIndex) => {
                        const wasTaken = medicationTaken.some(mt => 
                          mt.medicationId === med.id && 
                          mt.scheduledTime === time &&
                          new Date(mt.takenAt).toDateString() === new Date().toDateString()
                        );
                        
                        return (
                          <div key={timeIndex} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">{time}</div>
                            <div className={`text-4xl transition-all duration-200 ${wasTaken ? 'filter grayscale' : ''}`}>
                              💊
                            </div>
                            <div className="mt-2 space-x-2">
                              <Button
                                size="sm"
                                variant={wasTaken ? "secondary" : "default"}
                                onClick={() => markMedicationTaken(med.id, time)}
                                disabled={wasTaken || markMedicationTakenMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                data-testid={`button-taken-${med.id}-${timeIndex}`}
                              >
                                {wasTaken ? "✓ Taken" : "👍 Taken"}
                              </Button>
                              {!wasTaken && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => skipMedication(med.id, time)}
                                  className="text-xs px-2 py-1"
                                  data-testid={`button-skip-${med.id}-${timeIndex}`}
                                >
                                  👎 Skip
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      }) || []}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No medications added yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first medication to start tracking your daily doses
                </p>
                <Button onClick={() => setIsMedDialogOpen(true)} data-testid="button-add-first-medication">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Tracker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-6 h-6 mr-2 text-orange-500" />
              Today's Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTodaysExercise() ? (
              <div className="text-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl mb-2">
                  {getTodaysExercise()?.exercised ? "💪" : "😴"}
                </div>
                <div className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">
                  {getTodaysExercise()?.exercised ? "Great job exercising today!" : "Rest day logged"}
                </div>
                {getTodaysExercise()?.notes && (
                  <p className="text-sm text-green-600 dark:text-green-300 mb-3">
                    Notes: {getTodaysExercise()?.notes}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentExercise = getTodaysExercise();
                    if (currentExercise) {
                      addExerciseMutation.mutate({ 
                        exercised: !currentExercise.exercised, 
                        notes: currentExercise.notes || undefined 
                      });
                    }
                  }}
                  data-testid="button-toggle-exercise"
                >
                  Change to {getTodaysExercise()?.exercised ? "Rest Day" : "Exercised"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Did you exercise today? Even a short walk counts!
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => addExerciseMutation.mutate({ exercised: true })}
                    disabled={addExerciseMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-exercised-yes"
                  >
                    💪 Yes, I exercised!
                  </Button>
                  <Button
                    onClick={() => addExerciseMutation.mutate({ exercised: false })}
                    disabled={addExerciseMutation.isPending}
                    variant="outline" 
                    className="flex-1"
                    data-testid="button-exercised-no"
                  >
                    😴 Rest day
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight Tracker */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Weight className="w-6 h-6 mr-2 text-purple-500" />
              Weight Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTodaysWeight() && !isEditingWeight ? (
              <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl mb-2">⚖️</div>
                <div className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-2">
                  Today: {getTodaysWeight()?.weight} {getTodaysWeight()?.unit}
                </div>
                {getTodaysWeight()?.notes && (
                  <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                    Notes: {getTodaysWeight()?.notes}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const todaysWeight = getTodaysWeight();
                    if (todaysWeight) {
                      setWeightForm({
                        weight: todaysWeight.weight.toString(),
                        unit: todaysWeight.unit,
                        notes: todaysWeight.notes || ""
                      });
                      setIsEditingWeight(true);
                    }
                  }}
                  data-testid="button-edit-weight"
                >
                  Update Weight
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={weightForm.weight}
                    onChange={(e) => setWeightForm({...weightForm, weight: e.target.value})}
                    data-testid="input-weight"
                  />
                  <Select value={weightForm.unit} onValueChange={(value) => setWeightForm({...weightForm, unit: value})}>
                    <SelectTrigger data-testid="select-weight-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={weightForm.notes}
                  onChange={(e) => setWeightForm({...weightForm, notes: e.target.value})}
                  data-testid="input-weight-notes"
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={onWeightSubmit}
                    disabled={!weightForm.weight || addWeightMutation.isPending}
                    data-testid="button-log-weight"
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  >
                    {addWeightMutation.isPending ? "⚖️ Saving..." : getTodaysWeight() ? "⚖️ Update Weight" : "⚖️ Log Weight"}
                  </Button>
                  {isEditingWeight && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWeightForm({ weight: "", unit: "lbs", notes: "" });
                        setIsEditingWeight(false);
                      }}
                      data-testid="button-cancel-weight-edit"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/mood">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Mood</h3>
                <p className="text-xs text-muted-foreground">Track feelings</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/sleep">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Moon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Sleep</h3>
                <p className="text-xs text-muted-foreground">Log rest</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/medication">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Pill className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Medication</h3>
                <p className="text-xs text-muted-foreground">Manage doses</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/exercise">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Exercise</h3>
                <p className="text-xs text-muted-foreground">Track activity</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/journal">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <PenTool className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Journal</h3>
                <p className="text-xs text-muted-foreground">Write thoughts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/gamification">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Weight className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Progress</h3>
                <p className="text-xs text-muted-foreground">View streaks</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Mental Health Tips */}
        <MentalHealthTips />

        {/* Inspirational Quotes */}
        <InspirationalQuotes />

        {/* Crisis Support */}
        <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
            🆘 Need immediate support?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <span className="text-red-600 dark:text-red-300">
              <strong>988</strong> - Suicide & Crisis Lifeline
            </span>
            <span className="text-red-600 dark:text-red-300">
              <strong>Text HOME to 741741</strong> - Crisis Text Line
            </span>
            <span className="text-red-600 dark:text-red-300">
              <a 
                href="https://findahelpline.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline font-medium"
              >
                International Help
              </a>
            </span>
          </div>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            If you're having thoughts of self-harm, please reach out immediately. You are not alone.
          </p>
        </div>
      </div>

      {/* Medication Dialog */}
      <Dialog open={isMedDialogOpen} onOpenChange={setIsMedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>
              Add a new medication to track your medication adherence.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...medForm}>
            <form onSubmit={medForm.handleSubmit(onMedSubmit)} className="space-y-4">
              <FormField
                control={medForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sertraline" {...field} data-testid="input-medication-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={medForm.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 50mg" {...field} data-testid="input-medication-dosage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={medForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFrequencyChange(value);
                      }} 
                      value={field.value}
                      data-testid="select-medication-frequency"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Once daily</SelectItem>
                        <SelectItem value="twice-daily">Twice daily</SelectItem>
                        <SelectItem value="three-times-daily">Three times daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedFrequency && (
                <div className="space-y-2">
                  <FormLabel>Times</FormLabel>
                  {getTimeSlots().map((defaultTime, index) => (
                    <FormField
                      key={index}
                      control={medForm.control}
                      name={`times.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="time"
                              placeholder={defaultTime}
                              {...field}
                              data-testid={`input-medication-time-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsMedDialogOpen(false);
                    medForm.reset();
                    setSelectedFrequency("");
                  }}
                  className="flex-1"
                  data-testid="button-cancel-medication"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMedicationMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-medication"
                >
                  {addMedicationMutation.isPending ? "Saving..." : "Save Medication"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Achievement Toast Handler */}
      {pendingAchievements.length > 0 && (
        <AchievementToast 
          achievements={pendingAchievements} 
          onClose={() => {
            if (achievementTimeoutRef.current) {
              clearTimeout(achievementTimeoutRef.current);
              achievementTimeoutRef.current = null;
            }
            setPendingAchievements([]);
          }} 
        />
      )}
    </div>
  );
}
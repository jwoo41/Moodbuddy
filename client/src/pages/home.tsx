import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || user?.firstName || '',
    },
  });

  // Profile update mutation
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
  const [sleepForm, setSleepForm] = useState({ 
    bedtime: "", 
    wakeTime: ""
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bedtimeNotificationEnabled, setBedtimeNotificationEnabled] = useState(false);
  const [bedtimeReminderTime, setBedtimeReminderTime] = useState("22:00");
  const [wakeUpNotificationEnabled, setWakeUpNotificationEnabled] = useState(false);
  const [wakeUpReminderTime, setWakeUpReminderTime] = useState("07:00");
  const [scheduledNotifications, setScheduledNotifications] = useState<number[]>([]);
  const [isMedDialogOpen, setIsMedDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodDescription, setMoodDescription] = useState("");
  const [showMoodDescription, setShowMoodDescription] = useState(false);

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

  // Run alert checks when data changes
  useEffect(() => {
    if (moodEntries.length > 0) {
      checkMoodAlerts(moodEntries);
    }
    if (medications.length > 0 && medicationTaken.length > 0) {
      checkMedicationConsistency(medications, medicationTaken);
    }
  }, [moodEntries, medications, medicationTaken]);

  const medForm = useForm<MedicationFormData>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      times: [],
    },
  });

  const addMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; description?: string }) => {
      if (todaysMood) {
        // Update existing mood
        const response = await apiRequest("PUT", `/api/mood/${todaysMood.id}`, data);
        return response.json();
      } else {
        // Create new mood
        const response = await apiRequest("POST", "/api/mood", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: todaysMood ? "Mood updated!" : "Mood logged!",
        description: todaysMood ? "Your mood has been updated." : "Thanks for sharing how you're feeling!",
      });
    },
  });

  const addSleepMutation = useMutation({
    mutationFn: async (data: { 
      bedtime: string; 
      wakeTime: string;
    }) => {
      // Validate input
      if (!data.bedtime || !data.wakeTime) {
        throw new Error("Both bedtime and wake time are required");
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.bedtime) || !timeRegex.test(data.wakeTime)) {
        throw new Error("Please enter valid times in HH:MM format");
      }

      const bedtime = new Date(`${new Date().toDateString()} ${data.bedtime}:00`);
      const wakeTime = new Date(`${new Date().toDateString()} ${data.wakeTime}:00`);
      
      // If wake time is earlier than bedtime, assume it's the next day
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      // Validate reasonable sleep duration (1-16 hours)
      if (hoursSlept < 1 || hoursSlept > 16) {
        throw new Error("Sleep duration must be between 1 and 16 hours. Please check your times.");
      }

      const sleepData = {
        bedtime,
        wakeTime,
        hoursSlept,
        quality: "good", // Default quality for quick logging
      };

      if (todaysSleep) {
        // Update existing sleep entry
        const response = await apiRequest("PUT", `/api/sleep/${todaysSleep.id}`, sleepData);
        return response.json();
      } else {
        // Create new sleep entry
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

  const addMedicationMutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      // Check if we're editing an existing medication
      const existingMedication = medications.find(med => med.name === data.name && med.dosage === data.dosage);
      
      if (existingMedication) {
        // Update existing medication
        const response = await apiRequest("PUT", `/api/medications/${existingMedication.id}`, data);
        return response.json();
      } else {
        // Create new medication
        const response = await apiRequest("POST", "/api/medications", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      const existingMedication = medications.find(med => med.name === medForm.getValues("name"));
      toast({
        title: existingMedication ? "Medication updated!" : "Medication added!",
        description: existingMedication ? "Your medication has been updated." : "Your medication has been added successfully.",
      });
      setIsMedDialogOpen(false);
      medForm.reset({
        name: "",
        dosage: "",
        frequency: "",
        times: [],
      });
      setSelectedFrequency("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save medication. Please try again.",
        variant: "destructive",
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

  const getTodaysExercise = () => {
    const today = new Date().toDateString();
    return exerciseEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const getTodaysWeight = () => {
    const today = new Date().toDateString();
    return weightEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  // Exercise form and mutations
  const addExerciseMutation = useMutation({
    mutationFn: async (data: { exercised: boolean; notes?: string }) => {
      const todaysExercise = getTodaysExercise();
      
      if (todaysExercise) {
        // Update existing exercise entry
        const response = await apiRequest("PUT", `/api/exercise/${todaysExercise.id}`, data);
        return response.json();
      } else {
        // Create new exercise entry
        const response = await apiRequest("POST", "/api/exercise", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise"] });
      toast({
        title: "Exercise logged",
        description: "Your exercise has been recorded for today.",
      });
    },
  });

  // Weight state and mutations
  const [weightForm, setWeightForm] = useState({ weight: "", unit: "lbs", notes: "" });

  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: number; unit: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/weight", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
      toast({
        title: "Weight logged",
        description: "Your weight has been recorded successfully.",
      });
      setWeightForm({ weight: "", unit: "lbs", notes: "" });
    },
  });

  const isMedicationTakenToday = (medicationId: string, scheduledTime: string) => {
    const today = new Date().toDateString();
    return medicationTaken.some(record => 
      record.medicationId === medicationId &&
      record.scheduledTime === scheduledTime &&
      new Date(record.takenAt).toDateString() === today
    );
  };

  const generateTimeSlots = (count: number) => {
    const times = [];
    const startHour = 8; // Start at 8 AM
    const interval = Math.floor(12 / count); // Spread over 12 hours

    for (let i = 0; i < count; i++) {
      const hour = startHour + (i * interval);
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      times.push(timeString);
    }
    return times;
  };

  const handleFrequencyChange = (frequency: string) => {
    setSelectedFrequency(frequency);
    const freqData = frequencies.find(f => f.value === frequency);
    if (freqData) {
      const defaultTimes = generateTimeSlots(freqData.times);
      medForm.setValue("frequency", frequency);
      medForm.setValue("times", defaultTimes);
      // Force re-render by triggering form validation
      medForm.trigger("times");
    }
  };

  const onMedSubmit = (data: MedicationFormData) => {
    console.log("Submitting medication:", data);
    if (!data.times || data.times.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one time for your medication.",
        variant: "destructive",
      });
      return;
    }
    addMedicationMutation.mutate(data);
  };

  const todaysMood = getTodaysMood();
  const todaysSleep = getTodaysSleep();

  // Clear all scheduled notifications when component unmounts or notifications are disabled
  useEffect(() => {
    return () => {
      scheduledNotifications.forEach(id => clearTimeout(id));
    };
  }, [scheduledNotifications]);

  // Re-schedule notifications when medications change or notifications are enabled
  useEffect(() => {
    if (notificationsEnabled) {
      if (medications.length > 0) {
        scheduleAllMedicationNotifications();
      }
      if (bedtimeNotificationEnabled) {
        scheduleBedtimeNotification();
      }
      if (wakeUpNotificationEnabled) {
        scheduleWakeUpNotification();
      }
    }
  }, [medications, notificationsEnabled, bedtimeNotificationEnabled, bedtimeReminderTime, wakeUpNotificationEnabled, wakeUpReminderTime]);

  const setupNotifications = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications. Try using Chrome, Firefox, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        scheduleAllMedicationNotifications();
        toast({
          title: "Notifications enabled",
          description: "You'll now receive reminders for medications and sleep times",
        });
      } else if (permission === "denied") {
        toast({
          title: "Notifications blocked",
          description: "To enable: Click the lock/bell icon in your address bar → Allow notifications → Refresh page",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Notifications permission needed",
          description: "Please allow notifications when prompted to receive reminders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Notification setup error:', error);
      toast({
        title: "Notification setup failed",
        description: "Browser may have blocked the request. Try: Settings → Site Permissions → Notifications → Allow",
        variant: "destructive",
      });
    }
  };

  // Alert system functions
  const checkMoodAlerts = (moodEntries: MoodEntry[]) => {
    if (moodEntries.length < 5) return;
    
    const recentMoods = moodEntries.slice(0, 5);
    const lowMoodCount = recentMoods.filter(entry => 
      entry.mood === 'sad' || entry.mood === 'very-sad'
    ).length;
    
    if (lowMoodCount === 5) {
      toast({
        title: "🚨 Mental Health Alert",
        description: "You've reported low mood for 5 days in a row. Consider reaching out to a healthcare professional for support.",
        variant: "destructive",
      });
    }
  };

  const checkMedicationConsistency = (medications: Medication[], takenRecords: MedicationTaken[]) => {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    medications.forEach(med => {
      // Check if medication was created more than 3 days ago
      const medicationCreated = new Date(med.createdAt);
      const daysSinceCreated = Math.floor((today.getTime() - medicationCreated.getTime()) / (24 * 60 * 60 * 1000));
      
      // Only check adherence if medication has been tracked for at least 3 full days
      if (daysSinceCreated < 3) {
        return; // Skip adherence check for new medications
      }
      
      const expectedDoses = med.frequency === 'daily' ? 3 : med.frequency === 'twice-daily' ? 6 : 9; // 3 days worth
      const recentTaken = takenRecords.filter(record => 
        record.medicationId === med.id &&
        new Date(record.takenAt) >= threeDaysAgo
      );
      
      // Calculate adherence percentage
      const adherenceRate = recentTaken.length / expectedDoses;
      
      if (adherenceRate < 0.7) { // Less than 70% adherence over 3 days
        toast({
          title: "💊 Medication Reminder",
          description: `You haven't been taking ${med.name} consistently for 3 days. Staying on track with medication is important for your health.`,
          variant: "destructive",
        });
      }
    });
  };

  // Test notification functionality
  const testNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification("🔔 Test Notification", {
        body: "Notifications are working! You'll receive reminders like this.",
        icon: '/icon-192.svg',
        tag: 'test-notification',
      });

      setTimeout(() => notification.close(), 5000);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      toast({
        title: "Test notification sent",
        description: "Check if you received the notification",
      });
    } else {
      toast({
        title: "Cannot test notifications",
        description: "Please enable notifications first",
        variant: "destructive",
      });
    }
  };

  const scheduleAllMedicationNotifications = () => {
    // Clear existing medication notifications only
    const medicationNotifications = scheduledNotifications.filter(id => 
      medications.some(med => med.times?.some(() => true))
    );
    medicationNotifications.forEach(id => clearTimeout(id));
    
    const newNotificationIds: number[] = [];
    
    medications.forEach(medication => {
      medication.times?.forEach(time => {
        const notificationId = scheduleMedicationNotification(medication.name, time, medication.dosage || undefined);
        if (notificationId) {
          newNotificationIds.push(notificationId);
        }
      });
    });
    
    // Keep bedtime notifications and add new medication notifications
    setScheduledNotifications(prev => [
      ...prev.filter(id => !medicationNotifications.includes(id)),
      ...newNotificationIds
    ]);
  };

  const scheduleBedtimeNotification = () => {
    if (!bedtimeNotificationEnabled || !notificationsEnabled) return;
    
    const now = new Date();
    const [hours, minutes] = bedtimeReminderTime.split(':').map(Number);
    
    // Create notification time for today
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    const timeoutId = window.setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(`🛏️ Bedtime Reminder`, {
          body: `Time to wind down for bed. Good sleep helps your mental health!`,
          icon: '/icon-192.svg',
          tag: 'bedtime-reminder',
          badge: '/icon-192.svg',
          requireInteraction: true,
        });

        // Auto-close notification after 45 seconds
        setTimeout(() => notification.close(), 45000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      // Schedule the next bedtime notification for tomorrow
      scheduleBedtimeNotification();
    }, timeUntilNotification);
    
    setScheduledNotifications(prev => [...prev, timeoutId]);
  };

  const scheduleWakeUpNotification = () => {
    if (!wakeUpNotificationEnabled || !notificationsEnabled) return;
    
    const now = new Date();
    const [hours, minutes] = wakeUpReminderTime.split(':').map(Number);
    
    // Create notification time for today
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    const timeoutId = window.setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(`⏰ Good Morning! Time to Wake Up`, {
          body: `Start your day right! Remember to log your mood and check your medications.`,
          icon: '/icon-192.svg',
          tag: 'wakeup-reminder',
          badge: '/icon-192.svg',
          requireInteraction: true,
        });

        // Auto-close notification after 45 seconds
        setTimeout(() => notification.close(), 45000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      // Schedule the next wake-up notification for tomorrow
      scheduleWakeUpNotification();
    }, timeUntilNotification);
    
    setScheduledNotifications(prev => [...prev, timeoutId]);
  };

  const scheduleMedicationNotification = (medicationName: string, time: string, dosage?: string): number | null => {
    if (!notificationsEnabled) return null;
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create notification time for today
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    const timeoutId = window.setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(`💊 Time for ${medicationName}`, {
          body: `Take your ${dosage || ''} dose now`,
          icon: '/icon-192.svg',
          tag: `medication-${medicationName}-${time}`,
          badge: '/icon-192.svg',
          requireInteraction: true,
        });

        // Auto-close notification after 30 seconds
        setTimeout(() => notification.close(), 30000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      // Schedule the next notification for tomorrow at the same time
      const nextNotificationId = scheduleMedicationNotification(medicationName, time, dosage);
      if (nextNotificationId) {
        setScheduledNotifications(prev => [...prev.filter(id => id !== timeoutId), nextNotificationId]);
      }
    }, timeUntilNotification);
    
    return timeoutId;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with User Profile */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground">
            Hello, {user?.displayName || user?.firstName || 'Friend'}! 👋
          </h1>
          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-3">
                <User className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
              </DialogHeader>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="What should we call you?"
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsProfileDialogOpen(false)}
                      className="flex-1"
                      data-testid="button-cancel-profile"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="flex-1" 
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground text-lg">
          How are you feeling today?
        </p>
      </div>

      {/* Quick Mood Tracker */}
      <Card className="mb-8 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Quick Mood Check</CardTitle>
          {todaysMood ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">{moodEmojis[todaysMood.mood as keyof typeof moodEmojis]}</span>
                <span className="text-lg font-medium">You're feeling {moodLabels[todaysMood.mood as keyof typeof moodLabels].toLowerCase()} today</span>
              </div>
              {todaysMood.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
                  "{todaysMood.description}"
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedMood(todaysMood.mood);
                  setMoodDescription(todaysMood.description || '');
                  setShowMoodDescription(true);
                }}
                data-testid="button-edit-mood"
                className="mx-auto"
              >
                Edit Mood
              </Button>
            </div>
          ) : (
            <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">Tap an emoji to log your mood</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-4 mb-4">
            {Object.entries(moodEmojis).map(([mood, emoji]) => (
              <Button
                key={mood}
                variant={todaysMood?.mood === mood ? "default" : "outline"}
                size="lg"
                className="text-3xl p-4 h-auto"
                onClick={() => {
                  setSelectedMood(mood);
                  setShowMoodDescription(true);
                }}
                disabled={addMoodMutation.isPending}
                data-testid={`mood-${mood}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
          
          {showMoodDescription && selectedMood && (
            <div className="space-y-3">
              <Input
                placeholder="How would you describe this feeling? (optional)"
                value={moodDescription}
                onChange={(e) => setMoodDescription(e.target.value)}
                data-testid="input-mood-description"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    addMoodMutation.mutate({ 
                      mood: selectedMood, 
                      description: moodDescription || undefined 
                    });
                    setShowMoodDescription(false);
                    setSelectedMood(null);
                    setMoodDescription("");
                  }}
                  disabled={addMoodMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-mood"
                >
{addMoodMutation.isPending ? "Saving..." : todaysMood ? "Update Mood" : "Save Mood"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMoodDescription(false);
                    setSelectedMood(null);
                    setMoodDescription("");
                  }}
                  data-testid="button-cancel-mood"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Quick Logger */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">😴</span>
              Sleep Tracker
            </div>
            {!notificationsEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={setupNotifications}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                data-testid="button-enable-sleep-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Reminders
              </Button>
            )}
          </CardTitle>
          {todaysSleep ? (
            <div className="text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">
                ✅ Sleep logged: {todaysSleep.hoursSlept}h
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Reset sleep form to edit mode with current data
                  const bedtime = new Date(todaysSleep.bedtime);
                  const wakeTime = new Date(todaysSleep.wakeTime);
                  setSleepForm({
                    bedtime: `${bedtime.getHours().toString().padStart(2, '0')}:${bedtime.getMinutes().toString().padStart(2, '0')}`,
                    wakeTime: `${wakeTime.getHours().toString().padStart(2, '0')}:${wakeTime.getMinutes().toString().padStart(2, '0')}`
                  });
                }}
                data-testid="button-edit-sleep"
              >
                Edit Sleep
              </Button>
            </div>
          ) : null}
          


          {/* Sleep Notification Settings */}
          {notificationsEnabled && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Sleep notifications are active
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testNotification}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  data-testid="button-test-notification"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  Test
                </Button>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bedtime-notifications"
                    checked={bedtimeNotificationEnabled}
                    onChange={(e) => setBedtimeNotificationEnabled(e.target.checked)}
                    className="rounded"
                    data-testid="checkbox-bedtime-notifications"
                  />
                  <label htmlFor="bedtime-notifications" className="text-sm font-medium">
                    🛏️ Bedtime Reminders
                  </label>
                </div>
                {bedtimeNotificationEnabled && (
                  <Input
                    type="time"
                    value={bedtimeReminderTime}
                    onChange={(e) => setBedtimeReminderTime(e.target.value)}
                    className="w-24 h-8 text-sm"
                    data-testid="input-bedtime-reminder-time"
                  />
                )}
              </div>
              {bedtimeNotificationEnabled && (
                <p className="text-xs text-muted-foreground">
                  We'll remind you to wind down for bed at {bedtimeReminderTime}
                </p>
              )}
              
              {/* Wake-up Notification Settings */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="wakeup-notifications"
                    checked={wakeUpNotificationEnabled}
                    onChange={(e) => setWakeUpNotificationEnabled(e.target.checked)}
                    className="rounded"
                    data-testid="checkbox-wakeup-notifications"
                  />
                  <label htmlFor="wakeup-notifications" className="text-sm font-medium">
                    ⏰ Wake-up Reminders
                  </label>
                </div>
                {wakeUpNotificationEnabled && (
                  <Input
                    type="time"
                    value={wakeUpReminderTime}
                    onChange={(e) => setWakeUpReminderTime(e.target.value)}
                    className="w-24 h-8 text-sm"
                    data-testid="input-wakeup-reminder-time"
                  />
                )}
              </div>
              {wakeUpNotificationEnabled && (
                <p className="text-xs text-muted-foreground mt-1">
                  We'll wake you up at {wakeUpReminderTime} to start your day right
                </p>
              )}
            </div>
          )}

          {(!todaysSleep || sleepForm.bedtime || sleepForm.wakeTime) && (
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border mt-4">
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
        </CardHeader>
      </Card>

      {/* Exercise Tracker */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-600" />
            Exercise Today
          </CardTitle>
          
          {/* Exercise Status Display */}
          {getTodaysExercise() && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getTodaysExercise()?.exercised ? "💪" : "😴"}
                  </span>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {getTodaysExercise()?.exercised ? "Great job! You exercised today" : "No exercise logged today"}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Logged at {new Date(getTodaysExercise()!.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const current = getTodaysExercise();
                    if (current) {
                      addExerciseMutation.mutate({ 
                        exercised: !current.exercised,
                        notes: current.notes || undefined
                      });
                    }
                  }}
                  data-testid="button-toggle-exercise"
                >
                  {getTodaysExercise()?.exercised ? "Mark as Not Done" : "Mark as Done"}
                </Button>
              </div>
            </div>
          )}
          
          {/* Exercise Quick Log Buttons */}
          {!getTodaysExercise() && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Did you exercise today? Physical activity is great for mental health! 💪
              </p>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => addExerciseMutation.mutate({ exercised: true })}
                  disabled={addExerciseMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-exercise-yes"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">👍</span>
                    <span className="font-medium">Yes!</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => addExerciseMutation.mutate({ exercised: false })}
                  disabled={addExerciseMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-exercise-no"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-2">👎</span>
                    <span>Not Today</span>
                  </div>
                </Button>
              </div>
              
              {addExerciseMutation.isPending && (
                <p className="text-sm text-center text-muted-foreground">
                  💪 Logging exercise...
                </p>
              )}
            </div>
          )}
          
          {/* Weight Tracking Section */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Weight className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium">Weight Tracking</span>
              </div>
              {weightEntries.length > 0 && weightEntries[0] && (
                <span className="text-sm text-muted-foreground">
                  Last: {weightEntries[0].weight / 10} {weightEntries[0].unit} 
                  ({new Date(weightEntries[0].createdAt).toLocaleDateString()})
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm({...weightForm, weight: e.target.value})}
                  data-testid="input-weight"
                />
              </div>
              <Select
                value={weightForm.unit}
                onValueChange={(value) => setWeightForm({...weightForm, unit: value})}
              >
                <SelectTrigger className="w-20" data-testid="select-weight-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (weightForm.weight) {
                    addWeightMutation.mutate({
                      weight: Math.round(parseFloat(weightForm.weight) * 10), // Store as integer (e.g., 1505 for 150.5)
                      unit: weightForm.unit,
                      notes: weightForm.notes || undefined
                    });
                  }
                }}
                disabled={!weightForm.weight || addWeightMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-log-weight"
              >
                {addWeightMutation.isPending ? "⚖️ Saving..." : "⚖️ Log Weight"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Medication Tracker */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💊</span>
              Today's Medications
            </div>
            <div className="flex items-center space-x-2">
              {!notificationsEnabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setupNotifications}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  data-testid="button-enable-med-notifications"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Reminders
                </Button>
              )}
              <Dialog open={isMedDialogOpen} onOpenChange={setIsMedDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-add-medication-home">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
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
                              <Input placeholder="e.g., 50mg (optional)" {...field} data-testid="input-medication-dosage" />
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
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-medication-frequency">
                                  <SelectValue placeholder="How often?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {frequencies.map((freq) => (
                                  <SelectItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {selectedFrequency && (
                        <div>
                          <FormLabel>Times</FormLabel>
                          <div className="space-y-2 mt-2">
                            {medForm.watch("times")?.map((time, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={time || ""}
                                  onChange={(e) => {
                                    const times = [...(medForm.getValues("times") || [])];
                                    times[index] = e.target.value;
                                    medForm.setValue("times", times);
                                  }}
                                  data-testid={`input-medication-time-${index}`}
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground min-w-12">
                                  {parseInt(time?.split(':')[0] || '0') < 12 ? 'AM' : 'PM'}
                                </span>
                              </div>
                            )) || []}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsMedDialogOpen(false);
                            medForm.reset({
                              name: "",
                              dosage: "",
                              frequency: "",
                              times: [],
                            });
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
              
              {medications.length > 0 && !notificationsEnabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setupNotifications}
                  className="flex items-center space-x-1"
                  data-testid="button-enable-notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span>Enable Reminders</span>
                </Button>
              )}
              {notificationsEnabled && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Reminders On</span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notificationsEnabled && medications.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Medication reminders are active for {medications.length} medication{medications.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                You'll receive notifications at your scheduled times
              </p>
            </div>
          )}

          {medications.length > 0 ? (
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{med.name}{med.dosage ? ` - ${med.dosage}` : ''}</div>
                      {notificationsEnabled && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Bell className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Reminders active
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Pre-populate form with existing medication data
                        medForm.reset({
                          name: med.name,
                          dosage: med.dosage || undefined,
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
                  
                  {/* Visual pill representation with individual tracking */}
                  <div className="space-y-4 mb-4">
                    {Array.from({ length: med.frequency === 'daily' ? 1 : med.frequency === 'twice-daily' ? 2 : 3 }).map((_, pillIndex) => {
                      const time = med.times?.[pillIndex] || 'N/A';
                      const hour = parseInt(time.split(':')[0]);
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      const displayTime = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${time.split(':')[1]} ${ampm}`;
                      const isThisPillTaken = medicationTaken.some(record => 
                        record.medicationId === med.id &&
                        record.scheduledTime === time &&
                        new Date(record.takenAt).toDateString() === new Date().toDateString()
                      );
                      
                      return (
                        <div key={pillIndex} className={`p-4 rounded-lg border-2 ${isThisPillTaken ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-16 h-8 rounded-full border-2 flex items-center justify-center text-lg ${
                                isThisPillTaken ? 'bg-green-200 border-green-400' : 'bg-white border-gray-300'
                              }`}>
                                💊
                              </div>
                              <div>
                                <div className="font-bold text-lg">{displayTime}</div>
                                <div className="text-sm text-gray-500">{ampm} Dose</div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 hover:bg-green-200 dark:hover:bg-green-800 flex flex-col items-center"
                                onClick={() => {
                                  markMedicationTakenMutation.mutate({
                                    medicationId: med.id,
                                    scheduledTime: time
                                  });
                                }}
                                disabled={isThisPillTaken || markMedicationTakenMutation.isPending}
                                data-testid={`med-taken-${med.id}-${pillIndex}`}
                              >
                                <span className="text-2xl">👍</span>
                                <span className="text-xs">Taken</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 hover:bg-red-200 dark:hover:bg-red-800 flex flex-col items-center"
                                onClick={() => {
                                  toast({
                                    title: "Medication skipped",
                                    description: `${displayTime} dose marked as skipped`,
                                    variant: "destructive",
                                  });
                                }}
                                disabled={isThisPillTaken}
                                data-testid={`med-skip-${med.id}-${pillIndex}`}
                              >
                                <span className="text-2xl">👎</span>
                                <span className="text-xs">Skip</span>
                              </Button>
                            </div>
                          </div>
                          {isThisPillTaken && (
                            <div className="mt-2 text-green-600 font-medium text-sm">
                              ✅ TAKEN
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="text-center mt-4">
                    <div className="text-sm text-gray-500">
                      {med.frequency === 'daily' ? 'Once daily' : med.frequency === 'twice-daily' ? 'Twice daily' : 'Three times daily'}
                    </div>
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
                Add Your First Medication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise & Weight Tracker */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">💪</span>
            Exercise & Weight Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-xl mr-2">💪</span>
              Exercise
            </h3>
            {getTodaysExercise() ? (
              <div className="text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">
                  {getTodaysExercise()?.exercised ? "💪 Exercised today!" : "😴 Rest day logged"}
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {getTodaysExercise()?.notes && `Notes: ${getTodaysExercise()?.notes}`}
                </p>
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
                  className="mt-2"
                  data-testid="button-toggle-exercise"
                >
                  Change to {getTodaysExercise()?.exercised ? "Rest Day" : "Exercised"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                <p className="text-sm text-orange-800 dark:text-orange-200 text-center">
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
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Weight Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-xl mr-2">⚖️</span>
              Weight
            </h3>
            {getTodaysWeight() ? (
              <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-2">
                  ⚖️ Today: {getTodaysWeight()?.weight} {getTodaysWeight()?.unit}
                </div>
                {getTodaysWeight()?.notes && (
                  <p className="text-sm text-blue-600 dark:text-blue-300">
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
                    }
                  }}
                  className="mt-2"
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
                <Button
                  onClick={() => {
                    const weight = parseFloat(weightForm.weight);
                    if (weight > 0) {
                      addWeightMutation.mutate({
                        weight,
                        unit: weightForm.unit,
                        notes: weightForm.notes || undefined
                      });
                      setWeightForm({ weight: "", unit: "lbs", notes: "" });
                    }
                  }}
                  disabled={!weightForm.weight || addWeightMutation.isPending}
                  className="w-full"
                  data-testid="button-log-weight"
                >
                  {addWeightMutation.isPending ? "Logging..." : "⚖️ Log Weight"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Dynamic import to prevent bundle size issues */}
      {showOnboarding && (
        <OnboardingModal 
          open={showOnboarding} 
          onComplete={() => setShowOnboarding(false)}
          userName={user?.firstName || user?.displayName || ""}
        />
      )}
      {/* Emergency Hotline Footer */}
      <div className="mt-8 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
        <div className="text-center">
          <h4 className="text-red-700 dark:text-red-400 font-semibold mb-2 text-sm">Crisis Support Available 24/7</h4>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <span className="text-red-600 dark:text-red-300">
              <strong>Crisis:</strong>{" "}
              <a href="tel:988" className="underline hover:no-underline font-medium">
                Call 988
              </a>
            </span>
            <span className="text-red-600 dark:text-red-300">
              <strong>Text:</strong> HOME to 741741
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
    </div>
  );
}
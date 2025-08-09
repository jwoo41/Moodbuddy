import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, Moon, Pill, PenTool, MessageCircle, User, LogOut, Plus, Check, X, Bell } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const medicationFormSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
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

      const bedtime = new Date(`${new Date().toDateString()} ${data.bedtime}:00`);
      const wakeTime = new Date(`${new Date().toDateString()} ${data.wakeTime}:00`);
      
      // If wake time is earlier than bedtime, assume it's the next day
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      // Validate reasonable sleep duration (1-16 hours)
      if (hoursSlept < 1 || hoursSlept > 16) {
        throw new Error("Sleep duration must be between 1 and 16 hours");
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save medication. Please try again.",
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
    if (notificationsEnabled && medications.length > 0) {
      scheduleAllMedicationNotifications();
    }
  }, [medications, notificationsEnabled]);

  const setupNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        scheduleAllMedicationNotifications();
        toast({
          title: "Notifications enabled",
          description: "You'll receive medication reminders at scheduled times",
        });
      } else if (permission === "denied") {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings to receive reminders",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
    }
  };

  const scheduleAllMedicationNotifications = () => {
    // Clear existing notifications
    scheduledNotifications.forEach(id => clearTimeout(id));
    setScheduledNotifications([]);
    
    const newNotificationIds: number[] = [];
    
    medications.forEach(medication => {
      medication.times?.forEach(time => {
        const notificationId = scheduleMedicationNotification(medication.name, time, medication.dosage);
        if (notificationId) {
          newNotificationIds.push(notificationId);
        }
      });
    });
    
    setScheduledNotifications(newNotificationIds);
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
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">😴</span>
            Sleep Tracker
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
          
          {/* Sleep form - always show if no sleep logged or editing */}
          {(!todaysSleep || sleepForm.bedtime || sleepForm.wakeTime) && (
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
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

      {/* Medication Tracker */}
      <Card className="mb-6 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💊</span>
              Today's Medications
            </div>
            <div className="flex items-center space-x-2">
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
                            <FormLabel>Dosage</FormLabel>
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length > 0 ? (
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{med.name} - {med.dosage}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Pre-populate form with existing medication data
                        medForm.reset({
                          name: med.name,
                          dosage: med.dosage,
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
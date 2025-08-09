import { useState } from "react";
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

type MedicationFormData = z.infer<typeof medicationFormSchema>;

const frequencies = [
  { value: "daily", label: "Daily", times: 1 },
  { value: "twice-daily", label: "Twice Daily", times: 2 },
  { value: "three-times-daily", label: "Three Times Daily", times: 3 },
];

export default function Home() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sleepForm, setSleepForm] = useState({ bedtime: "", wakeTime: "" });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isMedDialogOpen, setIsMedDialogOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");

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
    mutationFn: async (data: { bedtime: string; wakeTime: string }) => {
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
        quality: "good", // Default quality for quick logging
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
      setSleepForm({ bedtime: "", wakeTime: "" });
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
      const response = await apiRequest("POST", "/api/medications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Medication added",
        description: "Your medication has been added successfully.",
      });
      setIsMedDialogOpen(false);
      medForm.reset();
      setSelectedFrequency("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add medication. Please try again.",
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
    }
  };

  const onMedSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(data);
  };

  const todaysMood = getTodaysMood();
  const todaysSleep = getTodaysSleep();

  // Request notification permission and set up medication reminders
  const setupNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications enabled",
          description: "You'll get reminders for your medications",
        });
        
        // Schedule notifications for medications
        medications.forEach(med => {
          med.times.forEach(time => {
            scheduleNotification(med.name, time);
          });
        });
      }
    }
  };

  const scheduleNotification = (medName: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    setTimeout(() => {
      if (notificationsEnabled && 'Notification' in window) {
        new Notification(`Time to take ${medName}`, {
          body: `It's time for your ${time} dose`,
          icon: '/favicon.ico',
        });
      }
      
      // Schedule for next day
      setTimeout(() => scheduleNotification(medName, time), 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
  };

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
                ✅ Sleep logged: {todaysSleep.hoursSlept}h
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
              <Button 
                onClick={() => addSleepMutation.mutate(sleepForm)}
                disabled={!sleepForm.bedtime || !sleepForm.wakeTime || addSleepMutation.isPending}
                data-testid="button-log-sleep"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Log Sleep
              </Button>
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
                            <Select onValueChange={handleFrequencyChange} defaultValue={field.value}>
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
                            {medForm.watch("times").map((time, index) => (
                              <Input
                                key={index}
                                type="time"
                                value={time}
                                onChange={(e) => {
                                  const times = [...medForm.getValues("times")];
                                  times[index] = e.target.value;
                                  medForm.setValue("times", times);
                                }}
                                data-testid={`input-medication-time-${index}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-3 pt-4">
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
                          {addMedicationMutation.isPending ? "Saving..." : "Add Medication"}
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
                  <div className="font-medium mb-2">{med.name} - {med.dosage}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* AM Dose */}
                    {med.times.filter(time => {
                      const hour = parseInt(time.split(':')[0]);
                      return hour < 12;
                    }).map((time) => {
                      const isTaken = isMedicationTakenToday(med.id, time);
                      
                      return (
                        <div key={time} className={`p-3 rounded-lg border-2 transition-all ${
                          isTaken ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-600' : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                          <div className="text-center">
                            <div className="font-bold text-lg mb-2">AM ({time})</div>
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto hover:bg-green-200 dark:hover:bg-green-800"
                                onClick={() => !isTaken && markMedicationTakenMutation.mutate({
                                  medicationId: med.id,
                                  scheduledTime: time
                                })}
                                disabled={isTaken || markMedicationTakenMutation.isPending}
                                data-testid={`med-taken-${med.id}-${time}`}
                              >
                                <span className="text-3xl">👍</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto hover:bg-red-200 dark:hover:bg-red-800"
                                onClick={() => {
                                  toast({
                                    title: "AM dose skipped",
                                    description: "Marked as intentionally skipped",
                                    variant: "destructive",
                                  });
                                }}
                                disabled={isTaken}
                                data-testid={`med-skip-${med.id}-${time}`}
                              >
                                <span className="text-3xl">👎</span>
                              </Button>
                            </div>
                            {isTaken && (
                              <div className="mt-2 text-green-600 dark:text-green-400 font-bold">
                                ✅ TAKEN
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* PM Dose */}
                    {med.times.filter(time => {
                      const hour = parseInt(time.split(':')[0]);
                      return hour >= 12;
                    }).map((time) => {
                      const isTaken = isMedicationTakenToday(med.id, time);
                      
                      return (
                        <div key={time} className={`p-3 rounded-lg border-2 transition-all ${
                          isTaken ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-600' : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                          <div className="text-center">
                            <div className="font-bold text-lg mb-2">PM ({time})</div>
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto hover:bg-green-200 dark:hover:bg-green-800"
                                onClick={() => !isTaken && markMedicationTakenMutation.mutate({
                                  medicationId: med.id,
                                  scheduledTime: time
                                })}
                                disabled={isTaken || markMedicationTakenMutation.isPending}
                                data-testid={`med-taken-${med.id}-${time}`}
                              >
                                <span className="text-3xl">👍</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto hover:bg-red-200 dark:hover:bg-red-800"
                                onClick={() => {
                                  toast({
                                    title: "PM dose skipped",
                                    description: "Marked as intentionally skipped",
                                    variant: "destructive",
                                  });
                                }}
                                disabled={isTaken}
                                data-testid={`med-skip-${med.id}-${time}`}
                              >
                                <span className="text-3xl">👎</span>
                              </Button>
                            </div>
                            {isTaken && (
                              <div className="mt-2 text-green-600 dark:text-green-400 font-bold">
                                ✅ TAKEN
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
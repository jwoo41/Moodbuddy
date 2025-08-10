import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Moon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SleepChart from "@/components/sleep/sleep-chart";
import { SleepEntry } from "@shared/schema";

const sleepFormSchema = z.object({
  bedtime: z.string().min(1, "Bedtime is required"),
  wakeTime: z.string().min(1, "Wake time is required"),
  quality: z.string().optional(),
  notes: z.string().optional(),
});

type SleepFormData = z.infer<typeof sleepFormSchema>;

export default function Sleep() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sleepEntries = [], isLoading } = useQuery<SleepEntry[]>({
    queryKey: ["/api/sleep"],
  });

  const form = useForm<SleepFormData>({
    resolver: zodResolver(sleepFormSchema),
    defaultValues: {
      bedtime: "",
      wakeTime: "",
      quality: "",
      notes: "",
    },
  });

  const addSleepMutation = useMutation({
    mutationFn: async (data: SleepFormData) => {
      // Calculate hours slept
      const bedtime = new Date(`2000-01-01T${data.bedtime}:00`);
      const wakeTime = new Date(`2000-01-01T${data.wakeTime}:00`);
      
      // Handle overnight sleep
      if (wakeTime < bedtime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      const hoursSlept = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      const sleepData = {
        bedtime: new Date(`${new Date().toDateString()} ${data.bedtime}:00`),
        wakeTime: new Date(`${new Date().toDateString()} ${data.wakeTime}:00`),
        hoursSlept,
        quality: data.quality || "good", // Default to "good" if not provided
        notes: data.notes || undefined,
      };

      const response = await apiRequest("POST", "/api/sleep", sleepData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep"] });
      toast({
        title: "Sleep entry added",
        description: "Your sleep data has been recorded successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add sleep entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SleepFormData) => {
    addSleepMutation.mutate(data);
  };

  const getAverageHours = () => {
    if (sleepEntries.length === 0) return 0;
    const total = sleepEntries.reduce((sum, entry) => sum + entry.hoursSlept, 0);
    return Math.round((total / sleepEntries.length) * 10) / 10;
  };

  const getQualityDistribution = () => {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    sleepEntries.forEach(entry => {
      if (entry.quality in distribution) {
        distribution[entry.quality as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
            Sleep Tracking
          </h1>
          <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
            Monitor your sleep patterns and improve your rest quality.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sleep-entry">
              <Plus className="w-4 h-4 mr-2" />
              Add Sleep Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Sleep Entry</DialogTitle>
              <DialogDescription>
                Record your sleep schedule and quality to track your rest patterns.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bedtime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedtime</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-bedtime" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="wakeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wake Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-wake-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sleep Quality (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sleep-quality">
                            <SelectValue placeholder="How well did you sleep?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How did you feel? Any factors affecting your sleep?"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-sleep-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-sleep"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addSleepMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-sleep"
                  >
                    {addSleepMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground">
              Average Sleep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="average-sleep-hours">
              {getAverageHours()}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="total-sleep-entries">
              {sleepEntries.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground">
              Last Night
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="last-night-hours">
              {sleepEntries[0]?.hoursSlept || "--"}h
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepChart sleepEntries={sleepEntries} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {sleepEntries.length > 0 ? (
              <div className="space-y-3">
                {sleepEntries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-moodbuddy-neutral-50 dark:bg-muted rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-moodbuddy-neutral-900 dark:text-foreground" data-testid={`sleep-entry-date-${entry.id}`}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-moodbuddy-neutral-500 dark:text-muted-foreground" data-testid={`sleep-entry-quality-${entry.id}`}>
                        Quality: {entry.quality}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-moodbuddy-neutral-900 dark:text-foreground" data-testid={`sleep-entry-hours-${entry.id}`}>
                        {entry.hoursSlept}h
                      </div>
                      <div className="text-sm text-moodbuddy-neutral-500 dark:text-muted-foreground">
                        {new Date(entry.bedtime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })} - {new Date(entry.wakeTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit", 
                          hour12: true,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Moon className="w-12 h-12 text-moodbuddy-neutral-300 dark:text-muted-foreground mx-auto mb-4" />
                <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground mb-4">
                  No sleep entries yet
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-sleep">
                  Add Your First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Smile, Edit, Trash2, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MoodModal from "@/components/mood/mood-modal";
import { MoodEntry } from "@shared/schema";

const moodFormSchema = z.object({
  mood: z.string().min(1, "Mood is required"),
  notes: z.string().optional(),
});

type MoodFormData = z.infer<typeof moodFormSchema>;

const moodEmojis = {
  "very-sad": "😢",
  "sad": "😞",
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

const moodColors = {
  "very-sad": "bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  "sad": "bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
  "neutral": "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
  "happy": "bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  "very-happy": "bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
};

export default function Mood() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moodEntries = [], isLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const form = useForm<MoodFormData>({
    resolver: zodResolver(moodFormSchema),
    defaultValues: {
      mood: "",
      notes: "",
    },
  });

  const updateMoodMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<MoodFormData> }) => {
      const response = await apiRequest("PUT", `/api/mood/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: "Mood updated",
        description: "Your mood entry has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update mood entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMoodMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/mood/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: "Mood entry deleted",
        description: "Your mood entry has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete mood entry.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    form.setValue("mood", entry.mood);
    form.setValue("notes", entry.notes || "");
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: MoodFormData) => {
    if (editingEntry) {
      updateMoodMutation.mutate({
        id: editingEntry.id,
        updates: data,
      });
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${d.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      })}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday, ${d.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      })}`;
    }
    
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  const getMoodStats = () => {
    if (!moodEntries || moodEntries.length === 0) {
      return {
        totalEntries: 0,
        mostCommon: undefined,
        thisWeek: 0,
      };
    }

    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(moodCounts);
    const mostCommon = entries.length > 0 
      ? entries.reduce((a, b) => moodCounts[a[0]] > moodCounts[b[0]] ? a : b)[0]
      : undefined;

    return {
      totalEntries: moodEntries.length,
      mostCommon,
      thisWeek: moodEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      }).length,
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="grid gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getMoodStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
            Mood Tracking
          </h1>
          <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
            Track your emotional wellbeing and identify patterns.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-mood-entry">
          <Plus className="w-4 h-4 mr-2" />
          Log Mood
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <Smile className="w-4 h-4 mr-2" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="total-mood-entries">
              {stats.totalEntries}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Most Common
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {stats.mostCommon && (
                <>
                  <span className="text-2xl">
                    {moodEmojis[stats.mostCommon as keyof typeof moodEmojis]}
                  </span>
                  <div className="text-lg font-semibold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="most-common-mood">
                    {moodLabels[stats.mostCommon as keyof typeof moodLabels]}
                  </div>
                </>
              )}
              {!stats.mostCommon && (
                <div className="text-lg font-semibold text-moodbuddy-neutral-900 dark:text-foreground">--</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="week-mood-entries">
              {stats.thisWeek}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {moodEntries.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {moodEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      moodColors[entry.mood as keyof typeof moodColors]
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                        </span>
                        <div>
                          <div className="font-medium text-moodbuddy-neutral-900 dark:text-foreground" data-testid={`mood-entry-label-${entry.id}`}>
                            {moodLabels[entry.mood as keyof typeof moodLabels]}
                          </div>
                          <div className="text-sm text-moodbuddy-neutral-500 dark:text-muted-foreground" data-testid={`mood-entry-date-${entry.id}`}>
                            {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(entry)}
                          className="text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-primary p-1 h-auto"
                          data-testid={`button-edit-mood-${entry.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMoodMutation.mutate(entry.id)}
                          disabled={deleteMoodMutation.isPending}
                          className="text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-destructive p-1 h-auto"
                          data-testid={`button-delete-mood-${entry.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground" data-testid={`mood-entry-notes-${entry.id}`}>
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Smile className="w-12 h-12 text-mindflow-neutral-300 dark:text-muted-foreground mx-auto mb-4" />
                <p className="text-mindflow-neutral-500 dark:text-muted-foreground mb-4">
                  No mood entries yet
                </p>
                <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-first-mood">
                  Log Your First Mood
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mood Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(moodLabels).map(([mood, label]) => {
                const count = moodEntries.filter(entry => entry.mood === mood).length;
                const percentage = moodEntries.length > 0 ? (count / moodEntries.length) * 100 : 0;
                
                return (
                  <div key={mood} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {moodEmojis[mood as keyof typeof moodEmojis]}
                      </span>
                      <span className="text-sm font-medium text-mindflow-neutral-700 dark:text-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-mindflow-neutral-100 dark:bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-mindflow-neutral-500 dark:text-muted-foreground w-8 text-right" data-testid={`mood-count-${mood}`}>
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <MoodModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Mood Entry</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-mood">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(moodLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center space-x-2">
                              <span>{moodEmojis[value as keyof typeof moodEmojis]}</span>
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
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
                        placeholder="What's on your mind?"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-edit-mood-notes"
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
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingEntry(null);
                    form.reset();
                  }}
                  className="flex-1"
                  data-testid="button-cancel-edit-mood"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMoodMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-edit-mood"
                >
                  {updateMoodMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

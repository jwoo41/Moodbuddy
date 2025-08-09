import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moods = [
  { value: "very-sad", emoji: "😢", label: "Very Sad" },
  { value: "sad", emoji: "😞", label: "Sad" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "very-happy", emoji: "😄", label: "Very Happy" },
];

export default function MoodModal({ open, onOpenChange }: MoodModalProps) {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/mood", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      toast({
        title: "Mood saved",
        description: "Your mood has been recorded successfully.",
      });
      onOpenChange(false);
      setSelectedMood("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling today.",
        variant: "destructive",
      });
      return;
    }
    
    saveMoodMutation.mutate({
      mood: selectedMood,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-moodbuddy-neutral-900 dark:text-foreground">
            How are you feeling?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-5 gap-3 mb-6">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center p-3 rounded-lg transition-colors border-2 ${
                selectedMood === mood.value
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-moodbuddy-neutral-50 dark:hover:bg-muted border-transparent"
              }`}
              data-testid={`mood-option-${mood.value}`}
            >
              <span className="text-3xl mb-2">{mood.emoji}</span>
              <span className="text-xs text-moodbuddy-neutral-700 dark:text-muted-foreground">
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <Label htmlFor="mood-notes" className="text-sm font-medium text-moodbuddy-neutral-700 dark:text-foreground mb-2 block">
            Notes (optional)
          </Label>
          <Textarea
            id="mood-notes"
            placeholder="What's on your mind today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
            data-testid="input-mood-notes"
          />
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-cancel-mood"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMoodMutation.isPending}
            className="flex-1"
            data-testid="button-save-mood"
          >
            {saveMoodMutation.isPending ? "Saving..." : "Save Mood"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

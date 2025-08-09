import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { JournalEntry } from "@shared/schema";

interface JournalEntryProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
}

export default function JournalEntryComponent({ entry, onEdit }: JournalEntryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/journal/${entry.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete journal entry.",
        variant: "destructive",
      });
    },
  });

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
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  const getPreview = (content: string) => {
    return content.length > 120 ? content.substring(0, 120) + "..." : content;
  };

  return (
    <div className="border-l-4 border-primary/20 pl-4 py-3 bg-moodbuddy-neutral-50/50 dark:bg-muted/50 rounded-r-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-moodbuddy-neutral-700 dark:text-foreground" data-testid={`journal-date-${entry.id}`}>
          {formatDate(entry.updatedAt)}
        </span>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(entry)}
            className="text-xs text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-primary p-1 h-auto"
            data-testid={`button-edit-${entry.id}`}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="text-xs text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-destructive p-1 h-auto"
            data-testid={`button-delete-${entry.id}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {entry.title && (
        <h4 className="font-medium text-moodbuddy-neutral-800 dark:text-foreground mb-1" data-testid={`journal-title-${entry.id}`}>
          {entry.title}
        </h4>
      )}
      
      <p className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground line-clamp-2" data-testid={`journal-preview-${entry.id}`}>
        {getPreview(entry.content)}
      </p>
    </div>
  );
}

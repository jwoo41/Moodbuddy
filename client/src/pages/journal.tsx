import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Search, Edit, Trash2, Mic, MicOff, Square } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { JournalEntry } from "@shared/schema";

const journalFormSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

export default function Journal() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journalEntries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          const currentContent = form.getValues("content");
          form.setValue("content", currentContent + finalTranscript + " ");
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive",
          });
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [form, toast]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const addJournalMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      const response = await apiRequest("POST", "/api/journal", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateJournalMutation = useMutation({
    mutationFn: async (data: { id: string; updates: JournalFormData }) => {
      const response = await apiRequest("PUT", `/api/journal/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal entry updated",
        description: "Your journal entry has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteJournalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/journal/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal entry deleted",
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

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    form.setValue("title", entry.title || "");
    form.setValue("content", entry.content);
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: JournalFormData) => {
    if (editingEntry) {
      updateJournalMutation.mutate({
        id: editingEntry.id,
        updates: data,
      });
    } else {
      addJournalMutation.mutate(data);
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

  const getPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + "..." : content;
  };

  const filteredEntries = journalEntries.filter(entry => 
    searchTerm === "" || 
    entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalWords = () => {
    return journalEntries.reduce((total, entry) => {
      return total + entry.content.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  };

  const getThisWeekEntries = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return journalEntries.filter(entry => new Date(entry.createdAt) >= weekAgo).length;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
            Journal
          </h1>
          <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
            Reflect on your thoughts and experiences.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open && isRecording) {
            stopRecording();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-journal-entry">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Give your entry a title..." 
                          {...field} 
                          data-testid="input-journal-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        Content
                        {speechSupported && (
                          <Button
                            type="button"
                            variant={isRecording ? "destructive" : "outline"}
                            size="sm"
                            onClick={toggleRecording}
                            className="ml-2 flex items-center space-x-1"
                            data-testid="button-voice-input"
                          >
                            {isRecording ? (
                              <>
                                <Square className="w-3 h-3" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3 h-3" />
                                <span>Voice</span>
                              </>
                            )}
                          </Button>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            placeholder={speechSupported 
                              ? "Type here or click Voice to speak your entry..." 
                              : "What's on your mind today? How are you feeling? What happened?"
                            }
                            className={`resize-none min-h-[200px] ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}
                            {...field}
                            data-testid="input-journal-content"
                          />
                          {isRecording && (
                            <div className="absolute top-2 right-2 flex items-center space-x-1 text-red-600 text-sm">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                              <span>Recording...</span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {speechSupported && (
                        <p className="text-xs text-muted-foreground">
                          {isRecording 
                            ? "Speak naturally. Your words will appear above as you talk."
                            : "Click Voice button or use keyboard to add your journal entry."
                          }
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      if (isRecording) stopRecording();
                      form.reset();
                    }}
                    className="flex-1"
                    data-testid="button-cancel-journal"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addJournalMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-journal"
                  >
                    {addJournalMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="total-journal-entries">
              {journalEntries.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground">
              Total Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="total-journal-words">
              {getTotalWords().toLocaleString()}
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
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="week-journal-entries">
              {getThisWeekEntries()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Entries</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-moodbuddy-neutral-400 dark:text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-journal"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border-l-4 border-primary/20 pl-4 py-4 bg-moodbuddy-neutral-50/50 dark:bg-muted/50 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-moodbuddy-neutral-700 dark:text-foreground" data-testid={`journal-date-${entry.id}`}>
                          {formatDate(entry.updatedAt)}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(entry)}
                            className="text-xs text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-primary p-1 h-auto"
                            data-testid={`button-edit-journal-${entry.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteJournalMutation.mutate(entry.id)}
                            disabled={deleteJournalMutation.isPending}
                            className="text-xs text-moodbuddy-neutral-400 dark:text-muted-foreground hover:text-destructive p-1 h-auto"
                            data-testid={`button-delete-journal-${entry.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {entry.title && (
                        <h4 className="font-medium text-moodbuddy-neutral-800 dark:text-foreground mb-2" data-testid={`journal-title-${entry.id}`}>
                          {entry.title}
                        </h4>
                      )}
                      
                      <p className="text-sm text-moodbuddy-neutral-600 dark:text-muted-foreground whitespace-pre-wrap" data-testid={`journal-content-${entry.id}`}>
                        {getPreview(entry.content)}
                      </p>
                      
                      <div className="mt-2 text-xs text-moodbuddy-neutral-400 dark:text-muted-foreground">
                        {entry.content.split(/\s+/).filter(word => word.length > 0).length} words
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-moodbuddy-neutral-300 dark:text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-moodbuddy-neutral-900 dark:text-foreground mb-2">
                Start Your Journey
              </h3>
              <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground mb-6">
                Begin documenting your thoughts, feelings, and experiences.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-start-journaling">
                Write Your First Entry
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-moodbuddy-neutral-300 dark:text-muted-foreground mx-auto mb-2" />
              <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
                No entries found matching "{searchTerm}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open && isRecording) {
          stopRecording();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Give your entry a title..." 
                        {...field} 
                        data-testid="input-edit-journal-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      Content
                      {speechSupported && (
                        <Button
                          type="button"
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={toggleRecording}
                          className="ml-2 flex items-center space-x-1"
                          data-testid="button-voice-input-edit"
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-3 h-3" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3 h-3" />
                              <span>Voice</span>
                            </>
                          )}
                        </Button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder={speechSupported 
                            ? "Type here or click Voice to speak your entry..." 
                            : "What's on your mind?"
                          }
                          className={`resize-none min-h-[200px] ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}
                          {...field}
                          data-testid="input-edit-journal-content"
                        />
                        {isRecording && (
                          <div className="absolute top-2 right-2 flex items-center space-x-1 text-red-600 text-sm">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                            <span>Recording...</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {speechSupported && (
                      <p className="text-xs text-muted-foreground">
                        {isRecording 
                          ? "Speak naturally. Your words will appear above as you talk."
                          : "Click Voice button or use keyboard to add your journal entry."
                        }
                      </p>
                    )}
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    if (isRecording) stopRecording();
                    setEditingEntry(null);
                    form.reset();
                  }}
                  className="flex-1"
                  data-testid="button-cancel-edit-journal"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateJournalMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-edit-journal"
                >
                  {updateJournalMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

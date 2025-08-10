import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pill, Clock, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MedicationCard from "@/components/medication/medication-card";
import { Medication as MedicationType, MedicationTaken } from "@shared/schema";

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
  { value: "weekly", label: "Weekly", times: 1 },
];

export default function Medication() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery<MedicationType[]>({
    queryKey: ["/api/medications"],
  });

  const { data: medicationTaken = [] } = useQuery<MedicationTaken[]>({
    queryKey: ["/api/medications/taken"],
  });

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      times: [],
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
      setIsAddDialogOpen(false);
      form.reset();
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

  const onSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(data);
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
      form.setValue("frequency", frequency);
      form.setValue("times", defaultTimes);
    }
  };

  const getTodaysTaken = () => {
    const today = new Date().toDateString();
    return medicationTaken.filter(record => 
      new Date(record.takenAt).toDateString() === today
    ).length;
  };

  const getTodaysTotal = () => {
    return medications.reduce((total, med) => total + med.times.length, 0);
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
            Medication Management
          </h1>
          <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
            Track your medications and stay on schedule.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-medication">
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
              <DialogDescription>
                Add a new medication to track your medication adherence.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={handleFrequencyChange} value={field.value || ""}>
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
                      {form.watch("times").map((time, index) => (
                        <Input
                          key={index}
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const times = [...form.getValues("times")];
                            times[index] = e.target.value;
                            form.setValue("times", times);
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
                      setIsAddDialogOpen(false);
                      form.reset();
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
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <Pill className="w-4 h-4 mr-2" />
              Total Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="total-medications">
              {medications.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Taken Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="taken-today">
              {getTodaysTaken()} / {getTodaysTotal()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-moodbuddy-neutral-500 dark:text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Adherence Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-moodbuddy-neutral-900 dark:text-foreground" data-testid="adherence-rate">
              {getTodaysTotal() > 0 ? Math.round((getTodaysTaken() / getTodaysTotal()) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    takenRecords={medicationTaken.filter(
                      (record) => record.medicationId === medication.id
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-12 h-12 text-moodbuddy-neutral-300 dark:text-muted-foreground mx-auto mb-4" />
                <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground mb-4">
                  No medications added yet
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-medication">
                  Add Your First Medication
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medications.flatMap(med => 
                med.times.map(time => ({
                  medication: med,
                  time: time,
                  taken: medicationTaken.some(record => 
                    record.medicationId === med.id && 
                    record.scheduledTime === time &&
                    new Date(record.takenAt).toDateString() === new Date().toDateString()
                  )
                }))
              ).sort((a, b) => a.time.localeCompare(b.time)).map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-moodbuddy-neutral-50 dark:bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-moodbuddy-neutral-900 dark:text-foreground">
                      {schedule.time}
                    </div>
                    <div>
                      <div className="font-medium text-moodbuddy-neutral-700 dark:text-foreground">
                        {schedule.medication.name}
                      </div>
                      <div className="text-xs text-moodbuddy-neutral-500 dark:text-muted-foreground">
                        {schedule.medication.dosage}
                      </div>
                    </div>
                  </div>
                  <Badge variant={schedule.taken ? "default" : "outline"}>
                    {schedule.taken ? "✓ Taken" : "Pending"}
                  </Badge>
                </div>
              ))}
              
              {medications.length === 0 && (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-moodbuddy-neutral-300 dark:text-muted-foreground mx-auto mb-2" />
                  <p className="text-moodbuddy-neutral-500 dark:text-muted-foreground">
                    No medications scheduled for today
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

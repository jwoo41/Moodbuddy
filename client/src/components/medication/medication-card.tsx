import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Medication, MedicationTaken } from "@shared/schema";

interface MedicationCardProps {
  medication: Medication;
  takenRecords: MedicationTaken[];
}

export default function MedicationCard({ medication, takenRecords }: MedicationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const now = new Date();
  const today = now.toDateString();
  
  // Get next scheduled time for today
  const nextTime = medication.times.find((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    return scheduledTime > now;
  });

  // Check if already taken for the next scheduled time
  const isTaken = nextTime ? takenRecords.some(
    (record) => record.scheduledTime === nextTime &&
    new Date(record.takenAt).toDateString() === today
  ) : false;

  const markTakenMutation = useMutation({
    mutationFn: async () => {
      if (!nextTime) throw new Error("No scheduled time found");
      
      const response = await apiRequest("POST", "/api/medications/taken", {
        medicationId: medication.id,
        scheduledTime: nextTime,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications/taken"] });
      toast({
        title: "Medication marked as taken",
        description: `${medication.name} has been recorded.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark medication as taken.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = () => {
    if (isTaken) return "bg-secondary/10";
    return "bg-accent/10";
  };

  const getIndicatorColor = () => {
    if (isTaken) return "bg-secondary";
    return "bg-accent";
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${getIndicatorColor()}`} />
        <div>
          <div className="font-medium text-moodbuddy-neutral-700 dark:text-foreground" data-testid={`medication-name-${medication.id}`}>
            {medication.name}
          </div>
          <div className="text-xs text-moodbuddy-neutral-500 dark:text-muted-foreground" data-testid={`medication-dosage-${medication.id}`}>
            {medication.dosage}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-medium text-moodbuddy-neutral-700 dark:text-foreground" data-testid={`medication-time-${medication.id}`}>
          {nextTime || "No more doses today"}
        </div>
        {isTaken ? (
          <div className="text-xs text-secondary font-medium">✓ Taken</div>
        ) : nextTime ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markTakenMutation.mutate()}
            disabled={markTakenMutation.isPending}
            className="text-xs text-accent hover:text-accent/80 p-0 h-auto font-medium"
            data-testid={`button-mark-taken-${medication.id}`}
          >
            Mark Taken
          </Button>
        ) : null}
      </div>
    </div>
  );
}

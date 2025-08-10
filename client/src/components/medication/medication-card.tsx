import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Medication, MedicationTaken } from "@shared/schema";
import { Check, ThumbsUp, ThumbsDown, Bell } from "lucide-react";

interface MedicationCardProps {
  medication: Medication;
  takenRecords: MedicationTaken[];
}

export default function MedicationCard({ medication, takenRecords }: MedicationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const today = new Date().toDateString();

  const markTakenMutation = useMutation({
    mutationFn: async (scheduledTime: string) => {
      const response = await apiRequest("POST", "/api/medications/taken", {
        medicationId: medication.id,
        scheduledTime,
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getFrequencyDisplay = () => {
    switch (medication.frequency) {
      case 'daily': return 'Once daily';
      case 'twice-daily': return 'Twice daily';
      case 'three-times-daily': return 'Three times daily';
      default: return medication.frequency;
    }
  };

  return (
    <div className="space-y-4">
      {/* Medication Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {medication.name}
            </h3>
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm mt-1">
              <Bell className="w-4 h-4 mr-1" />
              Reminders active
            </div>
          </div>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </div>

        <div className="text-center mb-4">
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {getFrequencyDisplay()}
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-sm flex items-center justify-center mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Reminders on
          </div>
        </div>
      </div>

      {/* Dose Cards */}
      <div className="space-y-3">
        {medication.times.map((time, index) => {
          const wasTaken = takenRecords.some(record => 
            record.medicationId === medication.id && 
            record.scheduledTime === time &&
            new Date(record.takenAt).toDateString() === today
          );

          return (
            <div 
              key={index}
              className={`rounded-lg border p-4 transition-all ${
                wasTaken 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Pill and Time */}
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-8 rounded-full flex items-center justify-center ${
                    wasTaken ? 'bg-green-100 dark:bg-green-800' : 'bg-white dark:bg-gray-700'
                  } border-2 ${
                    wasTaken ? 'border-green-300 dark:border-green-600' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="text-lg">💊</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatTime(time).split(' ')[0]}
                    </div>
                    <div className="text-xl font-medium text-gray-600 dark:text-gray-400">
                      {formatTime(time).split(' ')[1]}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {index === 0 ? 'AM' : index === 1 ? 'PM' : 'PM'} Dose
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {wasTaken ? (
                    <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-5 h-5 mr-1" />
                      TAKEN
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => markTakenMutation.mutate(time)}
                        disabled={markTakenMutation.isPending}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300"
                        size="sm"
                        data-testid={`button-taken-${medication.id}-${index}`}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Taken
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        data-testid={`button-skip-${medication.id}-${index}`}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Skip
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {wasTaken && (
                <div className="mt-3 p-2 bg-green-100 dark:bg-green-800/30 rounded border border-green-200 dark:border-green-700">
                  <div className="flex items-center text-green-700 dark:text-green-300 font-medium text-sm">
                    <Check className="w-4 h-4 mr-1" />
                    TAKEN
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

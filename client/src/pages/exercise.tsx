import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Weight, TrendingUp, Calendar } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User as UserType, ExerciseEntry, WeightEntry } from "@shared/schema";

export default function Exercise() {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [weightForm, setWeightForm] = useState({ weight: "", unit: "lbs", notes: "" });
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  const { data: exerciseEntries = [] } = useQuery<ExerciseEntry[]>({
    queryKey: ['/api/exercise'],
  });

  const { data: weightEntries = [] } = useQuery<WeightEntry[]>({
    queryKey: ['/api/weight'],
  });

  const getTodaysExercise = () => {
    const today = new Date().toDateString();
    return exerciseEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const getTodaysWeight = () => {
    const today = new Date().toDateString();
    return weightEntries.find(entry => 
      new Date(entry.createdAt).toDateString() === today
    );
  };

  const addExerciseMutation = useMutation({
    mutationFn: async (data: { exercised: boolean; notes?: string }) => {
      const todaysExercise = getTodaysExercise();
      
      if (todaysExercise) {
        const response = await apiRequest("PUT", `/api/exercise/${todaysExercise.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/exercise", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise"] });
      toast({
        title: "Exercise logged",
        description: "Your exercise has been recorded for today.",
      });
    },
  });

  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: number; unit: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/weight", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
      toast({
        title: "Weight logged",
        description: "Your weight has been recorded for today.",
      });
      setWeightForm({ weight: "", unit: "lbs", notes: "" });
    },
  });

  const updateWeightMutation = useMutation({
    mutationFn: async (data: { id: string; weight: number; unit: string; notes?: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/weight/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
      toast({
        title: "Weight updated",
        description: "Your weight has been updated successfully.",
      });
      setWeightForm({ weight: "", unit: "lbs", notes: "" });
      setIsEditingWeight(false);
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-moodbuddy-neutral-900 dark:text-foreground mb-2">
          Exercise & Weight Tracker
        </h1>
        <p className="text-moodbuddy-neutral-600 dark:text-muted-foreground">
          Track your physical activity and monitor your weight progress
        </p>
      </div>

      {/* Today's Exercise Tracker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-6 h-6 mr-2" />
            Today's Exercise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTodaysExercise() ? (
            <div className="text-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl mb-2">
                {getTodaysExercise()?.exercised ? "💪" : "😴"}
              </div>
              <div className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">
                {getTodaysExercise()?.exercised ? "Great job exercising today!" : "Rest day logged"}
              </div>
              {getTodaysExercise()?.notes && (
                <p className="text-sm text-green-600 dark:text-green-300 mb-3">
                  Notes: {getTodaysExercise()?.notes}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const currentExercise = getTodaysExercise();
                  if (currentExercise) {
                    addExerciseMutation.mutate({ 
                      exercised: !currentExercise.exercised, 
                      notes: currentExercise.notes || undefined 
                    });
                  }
                }}
                data-testid="button-toggle-exercise"
              >
                Change to {getTodaysExercise()?.exercised ? "Rest Day" : "Exercised"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Did you exercise today? Even a short walk counts!
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => addExerciseMutation.mutate({ exercised: true })}
                  disabled={addExerciseMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-exercised-yes"
                >
                  💪 Yes, I exercised!
                </Button>
                <Button
                  onClick={() => addExerciseMutation.mutate({ exercised: false })}
                  disabled={addExerciseMutation.isPending}
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-exercised-no"
                >
                  😴 Rest day
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Tracker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Weight className="w-6 h-6 mr-2" />
            Weight Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTodaysWeight() && !isEditingWeight ? (
            <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl mb-2">⚖️</div>
              <div className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-2">
                Today: {getTodaysWeight()?.weight} {getTodaysWeight()?.unit}
              </div>
              {getTodaysWeight()?.notes && (
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                  Notes: {getTodaysWeight()?.notes}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const todaysWeight = getTodaysWeight();
                  if (todaysWeight) {
                    setWeightForm({
                      weight: todaysWeight.weight.toString(),
                      unit: todaysWeight.unit,
                      notes: todaysWeight.notes || ""
                    });
                    setIsEditingWeight(true);
                  }
                }}
                data-testid="button-edit-weight"
              >
                Update Weight
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Weight"
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm({...weightForm, weight: e.target.value})}
                  data-testid="input-weight"
                />
                <Select value={weightForm.unit} onValueChange={(value) => setWeightForm({...weightForm, unit: value})}>
                  <SelectTrigger data-testid="select-weight-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={weightForm.notes}
                onChange={(e) => setWeightForm({...weightForm, notes: e.target.value})}
                data-testid="input-weight-notes"
              />
              <div className="flex gap-2">
                {isEditingWeight && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setWeightForm({ weight: "", unit: "lbs", notes: "" });
                      setIsEditingWeight(false);
                    }}
                    className="flex-1"
                    data-testid="button-cancel-weight"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const weight = parseFloat(weightForm.weight);
                    if (weight > 0) {
                      const todaysWeight = getTodaysWeight();
                      if (todaysWeight) {
                        updateWeightMutation.mutate({
                          id: todaysWeight.id,
                          weight,
                          unit: weightForm.unit,
                          notes: weightForm.notes || undefined
                        });
                      } else {
                        addWeightMutation.mutate({
                          weight,
                          unit: weightForm.unit,
                          notes: weightForm.notes || undefined
                        });
                      }
                      if (!todaysWeight) {
                        setWeightForm({ weight: "", unit: "lbs", notes: "" });
                        setIsEditingWeight(false);
                      }
                    }
                  }}
                  disabled={!weightForm.weight || addWeightMutation.isPending || updateWeightMutation.isPending}
                  className={isEditingWeight ? "flex-1" : "w-full"}
                  data-testid="button-log-weight"
                >
                  {(addWeightMutation.isPending || updateWeightMutation.isPending) ? "Saving..." : (getTodaysWeight() && isEditingWeight ? "⚖️ Update Weight" : "⚖️ Log Weight")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            Exercise History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exerciseEntries.length > 0 ? (
            <div className="space-y-3">
              {exerciseEntries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {entry.exercised ? "💪" : "😴"}
                    </div>
                    <div>
                      <div className="font-medium">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.exercised ? "Exercised" : "Rest day"}
                      </div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No exercise logs yet</h3>
              <p className="text-muted-foreground">
                Start tracking your daily exercise to see your progress here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-6 h-6 mr-2" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weightEntries.length > 0 ? (
            <div className="space-y-3">
              {weightEntries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⚖️</div>
                    <div>
                      <div className="font-medium">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.weight} {entry.unit}
                      </div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Weight className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No weight logs yet</h3>
              <p className="text-muted-foreground">
                Start tracking your weight to see your progress here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom spacing for mobile nav */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
}
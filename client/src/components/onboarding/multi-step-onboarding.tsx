import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MultiStepOnboardingProps {
  open: boolean;
  onComplete: () => void;
  userName: string;
}

export function MultiStepOnboarding({ open, onComplete, userName }: MultiStepOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [notificationTime, setNotificationTime] = useState("20:00");
  const [enableNotifications, setEnableNotifications] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moods = [
    { value: "very-sad", emoji: "😢", label: "Very Sad", color: "bg-red-100 hover:bg-red-200 border-red-300" },
    { value: "sad", emoji: "😔", label: "Sad", color: "bg-orange-100 hover:bg-orange-200 border-orange-300" },
    { value: "neutral", emoji: "😐", label: "Neutral", color: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300" },
    { value: "happy", emoji: "😊", label: "Happy", color: "bg-green-100 hover:bg-green-200 border-green-300" },
    { value: "very-happy", emoji: "😄", label: "Very Happy", color: "bg-blue-100 hover:bg-blue-200 border-blue-300" },
  ];

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/auth/user`, {
        onboardingCompleted: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Welcome to MoodBuddy!",
        description: "You're all set up and ready to track your wellness journey.",
      });
      onComplete();
    },
    onError: (error) => {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addMoodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const response = await apiRequest("POST", "/api/mood", { mood });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood'] });
    },
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (selectedMood) {
        await addMoodMutation.mutateAsync(selectedMood);
      }
      await updateUserMutation.mutateAsync();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    // Step 1: Welcome
    {
      title: "Hey friend,",
      subtitle: "I'm MoodBuddy!",
      content: (
        <div className="text-center space-y-6">
          <div className="mx-auto w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <svg width="60" height="60" viewBox="0 0 100 100" className="rounded-full">
                <circle cx="50" cy="50" r="40" fill="#FF8A65" />
                <circle cx="35" cy="40" r="4" fill="#1976D2" />
                <circle cx="65" cy="40" r="4" fill="#1976D2" />
                <path d="M 35 60 Q 50 70 65 60" stroke="#1976D2" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="space-y-4 max-w-sm mx-auto">
            <p className="text-gray-600 leading-relaxed">
              Here to help you track your mood, sleep, and meds—so you can feel more in control every day.
            </p>
          </div>
          <Button 
            onClick={handleNext}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
            data-testid="button-lets-go"
          >
            Let's Go
          </Button>
        </div>
      )
    },
    // Step 2: Features
    {
      title: "What I can",
      subtitle: "do for you",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">😊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Check in with your feelings</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🌙</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">See how sleep affects your mood</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Get gentle daily reminders</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">😊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Ask questions & discuss mental health topics</div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )
    },
    // Step 3: Notifications
    {
      title: "Set Your Daily",
      subtitle: "Check-In",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-1">(Optional)</p>
            <p className="text-gray-700 mb-6">When should I check in with you?</p>
            
            <div className="bg-gray-100 rounded-xl p-6 mb-6">
              <Input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="text-center text-xl border-0 bg-transparent text-gray-900 font-medium"
                data-testid="input-notification-time"
              />
            </div>
            
            <p className="text-gray-600 text-sm mb-8">
              I'll just nudge you once a day—promise!
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setEnableNotifications(false);
                handleNext();
              }}
              className="flex-1 py-3 rounded-xl"
            >
              Skip
            </Button>
            <Button 
              onClick={() => {
                setEnableNotifications(true);
                handleNext();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            >
              Enable Notifications
            </Button>
          </div>
        </div>
      )
    },
    // Step 4: First Mood Check
    {
      title: "Your First",
      subtitle: "Mood Check",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedMood === mood.value 
                    ? `${mood.color} border-current scale-105` 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                data-testid={`button-mood-${mood.value}`}
              >
                <div className="text-3xl mb-1">{mood.emoji}</div>
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Sleep hours</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">8 hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Medication taken</span>
              <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-300 absolute right-0"></div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleComplete}
            disabled={!selectedMood || updateUserMutation.isPending || addMoodMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
            data-testid="button-save-mood"
          >
            {(updateUserMutation.isPending || addMoodMutation.isPending) ? "Setting up..." : "Save"}
          </Button>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-gray-50 border-0 shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>MoodBuddy Onboarding</DialogTitle>
        </VisuallyHidden>
        <div className="p-6 space-y-8">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Step content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentStepData.title}
            </h1>
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              {currentStepData.subtitle}
            </h2>
            
            {currentStepData.content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
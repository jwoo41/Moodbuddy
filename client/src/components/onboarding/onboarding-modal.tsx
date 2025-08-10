import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Heart, Phone, Mail, User, AlertTriangle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { onboardingSchema, OnboardingData } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  userName?: string;
}

export default function OnboardingModal({ open, onComplete, userName }: OnboardingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: userName || "",
      email: "",
      phoneNumber: "",
      emergencyContactName: "",
      emergencyContactEmail: "",
      emergencyContactPhone: "",
      shareAlertsEnabled: false,
      alertsEnabled: true,
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await apiRequest("PUT", "/api/auth/user", {
        ...data,
        onboardingCompleted: true,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to MoodBuddy!",
        description: "Your profile has been set up successfully.",
      });
      onComplete();
    },
    onError: (error) => {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup Error",
        description: "There was a problem setting up your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingData) => {
    console.log("Onboarding form submitted with data:", data);
    onboardingMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 mr-3">
              <svg width="40" height="40" viewBox="0 0 100 120" className="rounded-lg">
                {/* Body */}
                <ellipse cx="50" cy="95" rx="20" ry="18" fill="#FF8A65" />
                {/* Head with light blue background circle */}
                <circle cx="50" cy="50" r="28" fill="#B3E5FC" />
                {/* Face */}
                <circle cx="50" cy="50" r="23" fill="#FF8A65" />
                {/* Eyes */}
                <circle cx="42" cy="44" r="3" fill="#1976D2" />
                <circle cx="58" cy="44" r="3" fill="#1976D2" />
                {/* Smile */}
                <path d="M 38 58 Q 50 68 62 58" stroke="#1976D2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Arms */}
                <ellipse cx="25" cy="80" rx="8" ry="12" fill="#FF8A65" transform="rotate(-20 25 80)" />
                <ellipse cx="75" cy="80" rx="8" ry="12" fill="#FF8A65" transform="rotate(20 75 80)" />
              </svg>
            </div>
            Welcome to MoodBuddy!
          </DialogTitle>
          <p className="text-muted-foreground">
            Let's set up your profile to personalize your mental health journey
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="What should we call you?" {...field} data-testid="input-display-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your-email@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Emergency Contact (Optional)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  We can notify someone you trust if concerning patterns are detected
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mom, Dr. Smith, Best friend" {...field} data-testid="input-emergency-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactEmail"
                  render={({ field }) => {
                    const shareAlertsEnabled = form.watch("shareAlertsEnabled");
                    return (
                      <FormItem>
                        <FormLabel>
                          Contact Email{shareAlertsEnabled ? " *" : ""}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="their-email@example.com" 
                            {...field} 
                            data-testid="input-emergency-email" 
                          />
                        </FormControl>
                        <FormMessage />
                        {shareAlertsEnabled && (
                          <p className="text-xs text-orange-600 dark:text-orange-400">
                            Required when sharing alerts is enabled
                          </p>
                        )}
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Their phone number" {...field} data-testid="input-emergency-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Alert Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Smart Alert Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  MoodBuddy can detect concerning patterns and provide helpful guidance
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="alertsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Health Pattern Alerts</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Get notified about low mood patterns (5+ days) and medication missed doses
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-alerts" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shareAlertsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Share Alerts with Emergency Contact</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Your emergency contact will be notified when concerning patterns are detected
                        </p>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                          data-testid="switch-share-alerts"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("shareAlertsEnabled") && !form.watch("emergencyContactEmail") && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Emergency contact email is required when sharing alerts is enabled
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Your Privacy Matters</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    Your health data is private and secure. Emergency contacts will only receive alerts about concerning patterns, 
                    never your detailed mood or medication information. You can change these settings anytime in your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="submit"
                disabled={onboardingMutation.isPending}
                className="min-w-[120px]"
                data-testid="button-complete-onboarding"
              >
                {onboardingMutation.isPending ? "Setting up..." : "Get Started!"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
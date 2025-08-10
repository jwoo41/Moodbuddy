import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Moon, Pill, PenTool } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Mood Tracking",
      description: "Track your daily emotions with simple emoji-based logging"
    },
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Sleep Monitoring",
      description: "Log your sleep patterns and quality to improve rest"
    },
    {
      icon: <Pill className="w-6 h-6" />,
      title: "Medication Reminders",
      description: "Never miss a dose with intelligent scheduling"
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Journal Entries",
      description: "Express your thoughts and track your mental health journey"
    },

    {
      icon: <Brain className="w-6 h-6" />,
      title: "Insights & Analytics",
      description: "Understand patterns and trends in your wellbeing"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MoodBuddy</h1>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your Mental Health
            <span className="text-blue-600 block">Companion</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Track your mood, sleep, and medications while getting personalized insights 
            to support your mental wellness journey.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            data-testid="button-get-started"
          >
            Start Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to take control of your mental health?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of users who are already improving their wellbeing with MoodBuddy.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            data-testid="button-join-now"
          >
            Join Now - It's Free
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
          <h4 className="text-red-700 dark:text-red-400 font-semibold mb-2">Crisis Support Available 24/7</h4>
          <div className="space-y-2 text-sm">
            <p className="text-red-600 dark:text-red-300">
              <strong>National Suicide Prevention Lifeline:</strong>{" "}
              <a href="tel:988" className="underline hover:no-underline font-medium">
                988
              </a>
            </p>
            <p className="text-red-600 dark:text-red-300">
              <strong>Crisis Text Line:</strong>{" "}
              <span className="font-medium">Text HOME to 741741</span>
            </p>
            <p className="text-red-600 dark:text-red-300">
              <strong>International:</strong>{" "}
              <a 
                href="https://findahelpline.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline font-medium"
              >
                findahelpline.com
              </a>
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              If you're having thoughts of self-harm, please reach out immediately. You are not alone.
            </p>
          </div>
        </div>
        <p>&copy; 2024 MoodBuddy. Supporting your mental wellness journey.</p>
      </footer>
    </div>
  );
}
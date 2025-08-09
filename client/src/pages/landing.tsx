import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Heart, Moon, Pill, PenTool, MessageCircle } from "lucide-react";

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
      icon: <MessageCircle className="w-6 h-6" />,
      title: "AI Companion",
      description: "Get support through intelligent conversations"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MindFlow</h1>
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
            Join thousands of users who are already improving their wellbeing with MindFlow.
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
        <p>&copy; 2024 MindFlow. Supporting your mental wellness journey.</p>
      </footer>
    </div>
  );
}
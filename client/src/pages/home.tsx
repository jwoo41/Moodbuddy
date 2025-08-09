import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Moon, Pill, PenTool, MessageCircle, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import { User as UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth() as { user: UserType | undefined };

  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Mood Tracking",
      description: "How are you feeling today?",
      link: "/mood",
      color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
    },
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Sleep Log",
      description: "Track your sleep patterns",
      link: "/sleep",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
    },
    {
      icon: <Pill className="w-6 h-6" />,
      title: "Medications",
      description: "Manage your medication schedule",
      link: "/medication",
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
    },
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Journal",
      description: "Write about your day",
      link: "/journal",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "AI Companion",
      description: "Chat with your mental health assistant",
      link: "/chat",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-600 dark:text-gray-300" />
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {user?.email}
              </span>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/logout"}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Wellness Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your mental health journey with these powerful tools
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Link key={index} href={feature.link}>
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump into your most common activities
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 justify-center">
              <Link href="/mood">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white" data-testid="button-log-mood">
                  Log Mood
                </Button>
              </Link>
              <Link href="/sleep">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-log-sleep">
                  Log Sleep
                </Button>
              </Link>
              <Link href="/journal">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="button-write-journal">
                  Write Journal
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-chat-ai">
                  Chat with AI
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
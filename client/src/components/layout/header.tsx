import { Link, useLocation } from "wouter";
import { Brain, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Sleep", href: "/sleep" },
  { name: "Medication", href: "/medication" },
  { name: "Mood", href: "/mood" },
  { name: "Journal", href: "/journal" },
];

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white dark:bg-card shadow-sm border-b border-mindflow-neutral-100 dark:border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-moodbuddy-neutral-900 dark:text-foreground">
              MoodBuddy
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors pb-1 ${
                    isActive
                      ? "text-primary font-medium border-b-2 border-primary"
                      : "text-mindflow-neutral-500 dark:text-muted-foreground hover:text-primary"
                  }`}
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-mindflow-neutral-500 dark:text-muted-foreground hover:text-primary"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

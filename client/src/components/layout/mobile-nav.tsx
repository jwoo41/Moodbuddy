import { Link, useLocation } from "wouter";
import { Home, Moon, Smile, BookOpen, Pill, MessageCircle, Activity, Trophy, Music } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Sleep", href: "/sleep", icon: Moon },
  { name: "Exercise", href: "/exercise", icon: Activity },
  { name: "Mood", href: "/mood", icon: Smile },
  { name: "Meds", href: "/medication", icon: Pill },
  { name: "Sound", href: "/soundscape", icon: Music },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-moodbuddy-neutral-100 dark:border-border px-4 py-2 z-50">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-moodbuddy-neutral-500 dark:text-muted-foreground"
              }`}
              data-testid={`mobile-nav-${item.name.toLowerCase()}`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

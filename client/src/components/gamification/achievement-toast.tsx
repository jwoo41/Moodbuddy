import { useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  category: string;
  title: string;
  description: string;
  iconEmoji: string;
  earnedAt: string;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onClose?: () => void;
}

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const { toast } = useToast();
  const processedIds = useRef(new Set<string>());
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timeouts to prevent glitches
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    if (achievements && achievements.length > 0) {
      // Filter out achievements we've already processed
      const newAchievements = achievements.filter(achievement => 
        !processedIds.current.has(achievement.id)
      );

      if (newAchievements.length === 0) return;

      newAchievements.forEach((achievement, index) => {
        // Mark as processed immediately to prevent duplicates
        processedIds.current.add(achievement.id);
        
        // Delay each toast by 800ms to avoid overwhelming the user
        const timeout = setTimeout(() => {
          toast({
            title: `🎉 Achievement Unlocked!`,
            description: (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{achievement.iconEmoji}</span>
                  <span className="font-medium">{achievement.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            ),
            duration: 6000,
          });
        }, index * 800);
        
        timeoutRefs.current.push(timeout);
      });

      // Call onClose after all toasts are shown with a bit more time
      if (onClose && newAchievements.length > 0) {
        const closeTimeout = setTimeout(() => {
          onClose();
        }, newAchievements.length * 800 + 2000);
        timeoutRefs.current.push(closeTimeout);
      }
    }

    // Cleanup function
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [achievements, toast, onClose]);

  // Clear processed IDs when component unmounts or achievements array is empty
  useEffect(() => {
    if (!achievements || achievements.length === 0) {
      processedIds.current.clear();
    }
  }, [achievements]);

  return null; // This component doesn't render anything visible
}
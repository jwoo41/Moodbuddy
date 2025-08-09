import { useEffect } from 'react';
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

  useEffect(() => {
    if (achievements && achievements.length > 0) {
      achievements.forEach((achievement, index) => {
        // Delay each toast by 500ms to avoid overwhelming the user
        setTimeout(() => {
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
            duration: 5000,
          });
        }, index * 500);
      });

      // Call onClose after all toasts are shown
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, achievements.length * 500 + 1000);
      }
    }
  }, [achievements, toast, onClose]);

  return null; // This component doesn't render anything visible
}
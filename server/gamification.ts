import { IStorage } from './storage';
import { Achievement, InsertAchievement } from '@shared/schema';

export class GamificationService {
  constructor(private storage: IStorage) {}

  // Calculate and update streaks when user makes an entry
  async updateStreakOnEntry(userId: string, category: string, entryDate: Date = new Date()): Promise<{
    streak: number;
    isNewRecord: boolean;
    achievements: Achievement[];
  }> {
    const today = entryDate.toDateString();
    const yesterday = new Date(entryDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const userStreak = await this.storage.getOrCreateUserStreak(userId, category);

    let newCurrentStreak = 1;
    let isNewRecord = false;

    // Check if they already logged today
    if (userStreak.lastEntryDate && new Date(userStreak.lastEntryDate).toDateString() === today) {
      // Already logged today, just return current streak
      return {
        streak: userStreak.currentStreak,
        isNewRecord: false,
        achievements: []
      };
    }

    // Check if they logged yesterday to continue streak
    if (userStreak.lastEntryDate && new Date(userStreak.lastEntryDate).toDateString() === yesterdayStr) {
      newCurrentStreak = userStreak.currentStreak + 1;
    }

    // Check if new record
    if (newCurrentStreak > userStreak.longestStreak) {
      isNewRecord = true;
    }

    // Update streak
    const updatedStreak = await this.storage.updateUserStreak(userId, category, {
      userId,
      category,
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(newCurrentStreak, userStreak.longestStreak),
      lastEntryDate: entryDate,
      totalEntries: userStreak.totalEntries + 1
    });

    // Check for achievements
    const newAchievements = await this.checkForAchievements(userId, category, updatedStreak);

    return {
      streak: newCurrentStreak,
      isNewRecord,
      achievements: newAchievements
    };
  }

  // Check and award achievements based on streaks and milestones
  private async checkForAchievements(userId: string, category: string, streak: any): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // First entry achievement
    if (streak.totalEntries === 1) {
      const hasFirstEntry = await this.storage.hasAchievement(userId, 'first_entry', category);
      if (!hasFirstEntry) {
        const achievement = await this.storage.createAchievement({
          userId,
          achievementType: 'first_entry',
          category,
          title: `First ${this.getCategoryDisplayName(category)}!`,
          description: `You logged your first ${category} entry. Great start!`,
          iconEmoji: this.getCategoryEmoji(category)
        });
        achievements.push(achievement);
      }
    }

    // Streak achievements
    const streakMilestones = [3, 7, 14, 30, 60, 100];
    for (const milestone of streakMilestones) {
      if (streak.currentStreak === milestone) {
        const hasStreak = await this.storage.hasAchievement(userId, `streak_${milestone}`, category);
        if (!hasStreak) {
          const achievement = await this.storage.createAchievement({
            userId,
            achievementType: `streak_${milestone}`,
            category,
            title: `${milestone} Day ${this.getCategoryDisplayName(category)} Streak!`,
            description: `Amazing! You've tracked your ${category} for ${milestone} days in a row.`,
            iconEmoji: milestone >= 30 ? '🏆' : milestone >= 14 ? '🎖️' : milestone >= 7 ? '🥉' : '🔥'
          });
          achievements.push(achievement);
        }
      }
    }

    // Total entries milestones
    const totalMilestones = [10, 25, 50, 100, 250, 500];
    for (const milestone of totalMilestones) {
      if (streak.totalEntries === milestone) {
        const hasTotal = await this.storage.hasAchievement(userId, `total_${milestone}`, category);
        if (!hasTotal) {
          const achievement = await this.storage.createAchievement({
            userId,
            achievementType: `total_${milestone}`,
            category,
            title: `${milestone} ${this.getCategoryDisplayName(category)} Entries!`,
            description: `You've made ${milestone} total ${category} entries. Keep it up!`,
            iconEmoji: '📊'
          });
          achievements.push(achievement);
        }
      }
    }

    return achievements;
  }

  // Check for perfect week achievement (all categories tracked each day)
  async checkPerfectWeek(userId: string): Promise<Achievement | null> {
    const categories = ['mood', 'sleep', 'medication', 'exercise'];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let perfectDays = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekAgo);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toDateString();

      let allCategoriesLogged = true;
      for (const category of categories) {
        const streak = await this.storage.getOrCreateUserStreak(userId, category);
        if (!streak.lastEntryDate || new Date(streak.lastEntryDate).toDateString() !== dateStr) {
          allCategoriesLogged = false;
          break;
        }
      }

      if (allCategoriesLogged) {
        perfectDays++;
      }
    }

    if (perfectDays >= 7) {
      const hasPerfectWeek = await this.storage.hasAchievement(userId, 'perfect_week', 'overall');
      if (!hasPerfectWeek) {
        return await this.storage.createAchievement({
          userId,
          achievementType: 'perfect_week',
          category: 'overall',
          title: 'Perfect Week!',
          description: 'You tracked mood, sleep, medication, and exercise every day this week!',
          iconEmoji: '🌟'
        });
      }
    }

    return null;
  }

  private getCategoryDisplayName(category: string): string {
    const displayNames: { [key: string]: string } = {
      'mood': 'Mood',
      'sleep': 'Sleep',
      'medication': 'Medication',
      'exercise': 'Exercise',
      'weight': 'Weight',
      'journal': 'Journal',
      'overall': 'Overall'
    };
    return displayNames[category] || category;
  }

  private getCategoryEmoji(category: string): string {
    const emojis: { [key: string]: string } = {
      'mood': '😊',
      'sleep': '😴',
      'medication': '💊',
      'exercise': '💪',
      'weight': '⚖️',
      'journal': '📝',
      'overall': '⭐'
    };
    return emojis[category] || '🎯';
  }

  // Get user's current streaks summary
  async getStreakSummary(userId: string): Promise<{
    totalActiveStreaks: number;
    longestCurrentStreak: number;
    bestCategory: string;
    recentAchievements: Achievement[];
  }> {
    const streaks = await this.storage.getUserStreaks(userId);
    const achievements = await this.storage.getUserAchievements(userId);
    
    const activeStreaks = streaks.filter(s => s.currentStreak > 0);
    const longestStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
    
    let bestCategory = 'mood';
    let bestStreakLength = 0;
    streaks.forEach(streak => {
      if (streak.currentStreak > bestStreakLength) {
        bestStreakLength = streak.currentStreak;
        bestCategory = streak.category;
      }
    });

    const recentAchievements = achievements
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 3);

    return {
      totalActiveStreaks: activeStreaks.length,
      longestCurrentStreak: longestStreak,
      bestCategory,
      recentAchievements
    };
  }
}
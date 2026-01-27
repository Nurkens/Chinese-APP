import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  createdAt: Date;
}

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  // Get user's active goals
  async getUserGoals(userId: string) {
    // For now, return mock data
    // In production, fetch from database
    const progress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const mockGoals = [
      {
        id: '1',
        userId,
        title: 'Daily Practice',
        description: 'Practice 20 minutes every day',
        target: 20,
        current: Math.min((progress?.currentStreak || 0) * 5, 20),
        type: 'daily' as const,
        completed: (progress?.currentStreak || 0) >= 4,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId,
        title: 'Weekly Words',
        description: 'Learn 50 new words this week',
        target: 50,
        current: Math.min((progress?.totalWords || 0) % 50, 50),
        type: 'weekly' as const,
        completed: (progress?.totalWords || 0) % 50 === 0 && (progress?.totalWords || 0) > 0,
        createdAt: new Date(),
      },
      {
        id: '3',
        userId,
        title: '7-Day Streak',
        description: 'Maintain a 7-day learning streak',
        target: 7,
        current: Math.min(progress?.currentStreak || 0, 7),
        type: 'weekly' as const,
        completed: (progress?.currentStreak || 0) >= 7,
        createdAt: new Date(),
      },
      {
        id: '4',
        userId,
        title: `HSK ${progress?.hskLevel || 1} Master`,
        description: `Complete all HSK ${progress?.hskLevel || 1} words`,
        target: (progress?.hskLevel || 1) * 150, // 150 words per level
        current: progress?.totalWords || 0,
        type: 'monthly' as const,
        completed: (progress?.totalWords || 0) >= (progress?.hskLevel || 1) * 150,
        createdAt: new Date(),
      },
    ];

    return mockGoals;
  }

  // Get user's achievements
  async getUserAchievements(userId: string) {
    const progress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const achievements = [
      {
        id: '1',
        title: 'First Streak',
        description: '7-day streak achieved',
        icon: 'flame',
        unlocked: (progress?.longestStreak || 0) >= 7,
        unlockedAt: (progress?.longestStreak || 0) >= 7 ? new Date() : null,
      },
      {
        id: '2',
        title: 'Word Master',
        description: 'Learn 100 words',
        icon: 'trophy',
        unlocked: (progress?.totalWords || 0) >= 100,
        unlockedAt: (progress?.totalWords || 0) >= 100 ? new Date() : null,
      },
      {
        id: '3',
        title: 'Dedicated Learner',
        description: '30-day streak',
        icon: 'calendar',
        unlocked: (progress?.longestStreak || 0) >= 30,
        unlockedAt: (progress?.longestStreak || 0) >= 30 ? new Date() : null,
      },
      {
        id: '4',
        title: 'HSK 1 Complete',
        description: 'Master all HSK 1 words',
        icon: 'checkmark',
        unlocked: (progress?.totalWords || 0) >= 150 && (progress?.hskLevel || 1) >= 2,
        unlockedAt: (progress?.totalWords || 0) >= 150 ? new Date() : null,
      },
      {
        id: '5',
        title: 'HSK 2 Complete',
        description: 'Master all HSK 2 words',
        icon: 'star',
        unlocked: (progress?.totalWords || 0) >= 300 && (progress?.hskLevel || 1) >= 3,
        unlockedAt: (progress?.totalWords || 0) >= 300 ? new Date() : null,
      },
      {
        id: '6',
        title: 'Century Club',
        description: '100-day streak',
        icon: 'ribbon',
        unlocked: (progress?.longestStreak || 0) >= 100,
        unlockedAt: (progress?.longestStreak || 0) >= 100 ? new Date() : null,
      },
    ];

    return achievements;
  }

  // Create a new goal
  async createGoal(userId: string, goalData: Partial<Goal>) {
    // Mock implementation
    // In production, save to database
    return {
      id: Date.now().toString(),
      userId,
      ...goalData,
      current: 0,
      completed: false,
      createdAt: new Date(),
    };
  }

  // Update goal progress
  async updateGoalProgress(userId: string, goalId: string, current: number) {
    // Mock implementation
    // In production, update in database
    return {
      id: goalId,
      userId,
      current,
      updated: true,
    };
  }

  // Delete a goal
  async deleteGoal(userId: string, goalId: string) {
    // Mock implementation
    // In production, delete from database
    return {
      id: goalId,
      deleted: true,
    };
  }
}

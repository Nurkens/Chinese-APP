import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserProgress(userId: string) {
    let progress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      // First check if user exists, create if not
      let user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // Create user first
        const suffix = Math.floor(1000 + Math.random() * 9000).toString();
        user = await this.prisma.user.create({
          data: {
            id: userId,
            username: userId,
            tag: `${userId}#${suffix}`,
            isGuest: true,
          },
        });
      }

      // Now create progress
      progress = await this.prisma.userProgress.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          hskLevel: 1,
          totalWords: 0,
          targetWords: 1200,
        },
      });
    }

    return progress;
  }

  async updateStreak(userId: string) {
    const progress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('User progress not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = progress.lastStudyDate ? new Date(progress.lastStudyDate) : null;

    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
    }

    let newStreak = progress.currentStreak;

    if (!lastStudy) {
      // First time studying
      newStreak = 1;
    } else {
      const daysDifference = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference === 0) {
        // Already studied today, don't change streak
        return progress;
      } else if (daysDifference === 1) {
        // Studied yesterday, increment streak
        newStreak = progress.currentStreak + 1;
      } else {
        // Missed days, reset streak
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(newStreak, progress.longestStreak);

    return this.prisma.userProgress.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastStudyDate: new Date(),
      },
    });
  }

  async updateProgress(userId: string, data: {
    hskLevel?: number;
    totalWords?: number;
    targetWords?: number;
  }) {
    return this.prisma.userProgress.update({
      where: { userId },
      data,
    });
  }

  async getUserWithProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        learnedWords: {
          include: {
            word: true,
          },
          orderBy: {
            lastReview: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async markWordAsLearned(userId: string, wordId: string) {
    // Check if word is already learned
    const existingUserWord = await this.prisma.userWord.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    });

    if (existingUserWord) {
      // Update existing
      return this.prisma.userWord.update({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        data: {
          reviewCount: { increment: 1 },
          lastReview: new Date(),
          mastery: Math.min(100, existingUserWord.mastery + 10),
        },
      });
    } else {
      // Create new
      const userWord = await this.prisma.userWord.create({
        data: {
          userId,
          wordId,
          mastery: 10,
          reviewCount: 1,
          lastReview: new Date(),
        },
      });

      // Update total words count
      await this.prisma.userProgress.update({
        where: { userId },
        data: {
          totalWords: { increment: 1 },
        },
      });

      return userWord;
    }
  }

  async getLearnedWords(userId: string) {
    return this.prisma.userWord.findMany({
      where: { userId },
      include: {
        word: true,
      },
      orderBy: {
        lastReview: 'desc',
      },
    });
  }
}

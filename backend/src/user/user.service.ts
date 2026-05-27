import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  reminderEnabled: false,
  reminderTime: '19:00',
  soundEnabled: true,
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ---------- Profile editing ----------

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const data: {
      username?: string;
      email?: string | null;
      avatar?: string | null;
      tag?: string;
    } = {};

    if (dto.username !== undefined && dto.username !== user.username) {
      const taken = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (taken && taken.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
      data.username = dto.username;
      // Keep tag in sync with username, preserve existing #suffix when possible
      const suffix = user.tag.includes('#')
        ? user.tag.split('#').pop()
        : Math.floor(1000 + Math.random() * 9000).toString();
      data.tag = `${dto.username}#${suffix}`;
    }

    if (dto.email !== undefined && dto.email !== user.email) {
      if (dto.email) {
        const taken = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (taken && taken.id !== userId) {
          throw new ConflictException('Email is already in use');
        }
      }
      data.email = dto.email || null;
    }

    if (dto.avatar !== undefined) {
      data.avatar = dto.avatar || null;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { progress: true },
    });

    return this.sanitizeUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isGuest || !user.password) {
      throw new BadRequestException(
        'Guest accounts cannot change a password. Please create a full account first.',
      );
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { success: true };
  }

  private sanitizeUser(user: any) {
    if (!user) return user;
    const { password, ...rest } = user;
    return rest;
  }

  // ---------- Settings ----------

  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId, ...DEFAULT_SETTINGS },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    // Ensure record exists, then update
    await this.getSettings(userId);

    return this.prisma.userSettings.update({
      where: { userId },
      data: {
        ...(dto.notificationsEnabled !== undefined && {
          notificationsEnabled: dto.notificationsEnabled,
        }),
        ...(dto.reminderEnabled !== undefined && {
          reminderEnabled: dto.reminderEnabled,
        }),
        ...(dto.reminderTime !== undefined && {
          reminderTime: dto.reminderTime,
        }),
        ...(dto.soundEnabled !== undefined && {
          soundEnabled: dto.soundEnabled,
        }),
      },
    });
  }

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
        settings: true,
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

    return this.sanitizeUser(user);
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

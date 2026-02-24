import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          include: {
            progress: true,
            _count: { select: { learnedWords: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => ({
      friendshipId: f.id,
      id: f.friend.id,
      username: f.friend.username,
      tag: f.friend.tag,
      isGuest: f.friend.isGuest,
      progress: f.friend.progress
        ? {
            currentStreak: f.friend.progress.currentStreak,
            longestStreak: f.friend.progress.longestStreak,
            hskLevel: f.friend.progress.hskLevel,
            totalWords: f.friend._count.learnedWords,
            targetWords: f.friend.progress.targetWords,
          }
        : null,
      addedAt: f.createdAt,
    }));
  }

  async addFriend(userId: string, tag: string) {
    // Find user by tag
    const friendUser = await this.prisma.user.findUnique({
      where: { tag },
    });

    if (!friendUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Cannot add yourself
    if (friendUser.id === userId) {
      throw new BadRequestException('Нельзя добавить самого себя');
    }

    // Check if already friends
    const existing = await this.prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: friendUser.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Этот пользователь уже в друзьях');
    }

    // Create bidirectional friendship
    await this.prisma.$transaction([
      this.prisma.friendship.create({
        data: {
          userId,
          friendId: friendUser.id,
        },
      }),
      this.prisma.friendship.create({
        data: {
          userId: friendUser.id,
          friendId: userId,
        },
      }),
    ]);

    return { message: 'Друг добавлен', friendId: friendUser.id };
  }

  async removeFriend(userId: string, friendId: string) {
    // Remove bidirectional friendship
    await this.prisma.$transaction([
      this.prisma.friendship.deleteMany({
        where: { userId, friendId },
      }),
      this.prisma.friendship.deleteMany({
        where: { userId: friendId, friendId: userId },
      }),
    ]);

    return { message: 'Друг удалён' };
  }

  async searchByTag(tag: string) {
    const user = await this.prisma.user.findUnique({
      where: { tag },
      include: { progress: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      id: user.id,
      username: user.username,
      tag: user.tag,
      progress: user.progress
        ? {
            hskLevel: user.progress.hskLevel,
            totalWords: user.progress.totalWords,
            currentStreak: user.progress.currentStreak,
          }
        : null,
    };
  }

  async getGlobalLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: { isGuest: false },
      include: {
        progress: true,
        _count: { select: { learnedWords: true } },
      },
      take: 50,
    });

    // Sort by actual learned words count
    const sorted = users.sort(
      (a, b) => b._count.learnedWords - a._count.learnedWords,
    );

    return sorted.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      tag: user.tag,
      progress: user.progress
        ? {
            currentStreak: user.progress.currentStreak,
            hskLevel: user.progress.hskLevel,
            totalWords: user._count.learnedWords,
          }
        : null,
    }));
  }

  async getFriendsLeaderboard(userId: string) {
    // Get friend IDs
    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const friendIds = friendships.map((f) => f.friendId);
    // Include self
    const allIds = [userId, ...friendIds];

    const users = await this.prisma.user.findMany({
      where: { id: { in: allIds } },
      include: {
        progress: true,
        _count: { select: { learnedWords: true } },
      },
    });

    // Sort by actual learned words count
    const sorted = users.sort(
      (a, b) => b._count.learnedWords - a._count.learnedWords,
    );

    return sorted.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      tag: user.tag,
      progress: user.progress
        ? {
            currentStreak: user.progress.currentStreak,
            hskLevel: user.progress.hskLevel,
            totalWords: user._count.learnedWords,
          }
        : null,
    }));
  }
}

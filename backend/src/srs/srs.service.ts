import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SM2Algorithm, ReviewResult } from './srs.algorithm';

export interface DueCard {
  id: string;
  wordId: string;
  word: {
    id: string;
    chinese: string;
    pinyin: string;
    translation: string;
    example?: string;
    hskLevel: number;
  };
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate: Date;
  isNew: boolean;
}

export interface ReviewStats {
  totalDue: number;
  newCards: number;
  reviewCards: number;
  learnedToday: number;
  reviewedToday: number;
}

@Injectable()
export class SRSService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get cards that are due for review
   */
  async getDueCards(userId: string, limit: number = 20): Promise<DueCard[]> {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Include all cards due today

    const dueCards = await this.prisma.userWord.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: now,
        },
      },
      include: {
        word: true,
      },
      orderBy: [
        { nextReviewDate: 'asc' }, // Most overdue first
        { repetitions: 'asc' },    // Then newer cards
      ],
      take: limit,
    });

    return dueCards.map(card => ({
      id: card.id,
      wordId: card.wordId,
      word: {
        id: card.word.id,
        chinese: card.word.chinese,
        pinyin: card.word.pinyin,
        translation: card.word.translation,
        example: card.word.example || undefined,
        hskLevel: card.word.hskLevel,
      },
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      nextReviewDate: card.nextReviewDate,
      lastReviewDate: card.lastReviewDate,
      isNew: card.repetitions === 0,
    }));
  }

  /**
   * Get new cards (never reviewed) for learning
   */
  async getNewCards(userId: string, hskLevel: number, limit: number = 10): Promise<DueCard[]> {
    // Get words the user hasn't learned yet
    const existingWordIds = await this.prisma.userWord.findMany({
      where: { userId },
      select: { wordId: true },
    });

    const existingIds = existingWordIds.map(w => w.wordId);

    const newWords = await this.prisma.word.findMany({
      where: {
        hskLevel: {
          lte: hskLevel, // Words at or below current HSK level
        },
        id: {
          notIn: existingIds,
        },
      },
      take: limit,
      orderBy: { hskLevel: 'asc' }, // Easier words first
    });

    // Create temporary card data for new words
    return newWords.map(word => ({
      id: '', // Will be created when reviewed
      wordId: word.id,
      word: {
        id: word.id,
        chinese: word.chinese,
        pinyin: word.pinyin,
        translation: word.translation,
        example: word.example || undefined,
        hskLevel: word.hskLevel,
      },
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
      lastReviewDate: new Date(),
      isNew: true,
    }));
  }

  /**
   * Submit a review for a card
   */
  async submitReview(
    userId: string,
    wordId: string,
    quality: 'again' | 'hard' | 'good' | 'easy'
  ): Promise<ReviewResult & { wordId: string }> {
    const qualityNum = SM2Algorithm.qualityFromString(quality);

    // Find existing card or create new one
    let userWord = await this.prisma.userWord.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    const cardData = userWord
      ? {
          easeFactor: userWord.easeFactor,
          interval: userWord.interval,
          repetitions: userWord.repetitions,
        }
      : SM2Algorithm.initializeCard();

    // Calculate new SRS parameters
    const result = SM2Algorithm.calculateNextReview(cardData, qualityNum);

    if (userWord) {
      // Update existing card
      await this.prisma.userWord.update({
        where: { id: userWord.id },
        data: {
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          nextReviewDate: result.nextReviewDate,
          lastReviewDate: new Date(),
          lastReview: new Date(),
          reviewCount: { increment: 1 },
          mastery: Math.min(100, Math.round((result.repetitions / 10) * 100)),
        },
      });
    } else {
      // Create new card
      userWord = await this.prisma.userWord.create({
        data: {
          userId,
          wordId,
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          nextReviewDate: result.nextReviewDate,
          lastReviewDate: new Date(),
          lastReview: new Date(),
          reviewCount: 1,
          mastery: Math.min(100, Math.round((result.repetitions / 10) * 100)),
        },
      });

      // Update total words count for new cards
      await this.prisma.userProgress.update({
        where: { userId },
        data: {
          totalWords: { increment: 1 },
        },
      });
    }

    return {
      ...result,
      wordId,
    };
  }

  /**
   * Get review statistics for today
   */
  async getReviewStats(userId: string): Promise<ReviewStats> {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count due cards
    const dueCards = await this.prisma.userWord.count({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
    });

    // Count new cards (repetitions = 0 and due)
    const newCards = await this.prisma.userWord.count({
      where: {
        userId,
        repetitions: 0,
        nextReviewDate: { lte: now },
      },
    });

    // Count cards reviewed today
    const reviewedToday = await this.prisma.userWord.count({
      where: {
        userId,
        lastReviewDate: { gte: todayStart },
      },
    });

    // Count new cards learned today (first review was today)
    const learnedToday = await this.prisma.userWord.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    // Get total words not yet learned by user for "new available"
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const totalLearned = await this.prisma.userWord.count({
      where: { userId },
    });

    const totalWordsInLevel = await this.prisma.word.count({
      where: {
        hskLevel: { lte: userProgress?.hskLevel || 1 },
      },
    });

    const newAvailable = totalWordsInLevel - totalLearned;

    return {
      totalDue: dueCards,
      newCards: Math.min(newAvailable, 20), // Daily new card limit
      reviewCards: dueCards - newCards,
      learnedToday,
      reviewedToday,
    };
  }

  /**
   * Get interval preview for rating buttons
   */
  async getIntervalPreview(userId: string, wordId: string): Promise<{
    again: string;
    hard: string;
    good: string;
    easy: string;
  }> {
    const userWord = await this.prisma.userWord.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    const cardData = userWord
      ? {
          easeFactor: userWord.easeFactor,
          interval: userWord.interval,
          repetitions: userWord.repetitions,
        }
      : {};

    return SM2Algorithm.getIntervalPreviews(cardData);
  }
}

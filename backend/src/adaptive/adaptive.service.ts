import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PerformanceMetrics {
  accuracyRate: number; // 0-1, percentage of correct reviews
  avgReviewsPerDay: number;
  cardsLearned: number;
  retentionRate: number; // How many cards stay in learning vs forgotten
  difficultWords: string[]; // Words frequently marked as 'hard' or 'again'
  easyWords: string[]; // Words marked as 'easy'
}

export interface ForgetCurveScore {
  wordId: string;
  chinese: string;
  daysSinceLastReview: number;
  predictedRetentionRate: number; // 0-1
  recommendationPriority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface AdaptiveRecommendation {
  wordId: string;
  word: any;
  recommendationScore: number;
  reason: string;
  category: 'review_soon' | 'at_risk' | 'master' | 'challenge';
}

@Injectable()
export class AdaptiveService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analyze user performance metrics
   */
  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    const userWords = await this.prisma.userWord.findMany({
      where: { userId },
      include: { word: true },
    });

    if (userWords.length === 0) {
      return {
        accuracyRate: 0,
        avgReviewsPerDay: 0,
        cardsLearned: userWords.filter(w => w.repetitions > 0).length,
        retentionRate: 0,
        difficultWords: [],
        easyWords: [],
      };
    }

    // Calculate accuracy rate based on easeFactor
    // Words with high easeFactor = easier (more accurate)
    // Words with low easeFactor = harder (less accurate)
    const avgEaseFactor = userWords.reduce((sum, w) => sum + w.easeFactor, 0) / userWords.length;
    const accuracyRate = Math.min(1, (avgEaseFactor - 1.3) / (2.5 - 1.3)); // Normalize to 0-1

    // Calculate cards learned (repetitions > 0)
    const cardsLearned = userWords.filter(w => w.repetitions > 0).length;

    // Calculate retention rate (cards that haven't been forgotten)
    const retentionRate = cardsLearned > 0 ? cardsLearned / userWords.length : 0;

    // Find difficult words (easeFactor < 1.8 = struggling)
    const difficultWords = userWords
      .filter(w => w.easeFactor < 1.8 && w.repetitions > 0)
      .sort((a, b) => a.easeFactor - b.easeFactor)
      .slice(0, 10)
      .map(w => w.wordId);

    // Find easy words (easeFactor > 2.3 = mastered)
    const easyWords = userWords
      .filter(w => w.easeFactor > 2.3)
      .slice(0, 10)
      .map(w => w.wordId);

    // Estimate reviews per day
    const firstReview = userWords.find(w => w.lastReviewDate);
    const daysSinceStart = firstReview
      ? Math.max(1, Math.floor((Date.now() - firstReview.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const avgReviewsPerDay = userWords.filter(w => w.reviewCount > 0).length / daysSinceStart;

    return {
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      avgReviewsPerDay: Math.round(avgReviewsPerDay * 100) / 100,
      cardsLearned,
      retentionRate: Math.round(retentionRate * 100) / 100,
      difficultWords,
      easyWords,
    };
  }

  /**
   * Ebbinghaus Forgetting Curve: Predicts retention based on days since review
   * R = e^(-t/S)
   * R = retention (0-1)
   * t = time in days
   * S = strength of memory (based on repetitions and easeFactor)
   */
  private calculateForgetCurve(
    daysSinceLastReview: number,
    repetitions: number,
    easeFactor: number
  ): number {
    if (daysSinceLastReview === 0) return 1.0; // Just reviewed

    // Memory strength increases with repetitions
    const memoryStrength = Math.min(30, repetitions * 3);

    // Forgetting curve: e^(-t/S)
    const retentionRate = Math.exp(-daysSinceLastReview / (memoryStrength + 1));

    return Math.max(0, Math.min(1, retentionRate));
  }

  /**
   * Get words using the forgetting curve algorithm
   */
  async getForgetCurveAnalysis(userId: string): Promise<ForgetCurveScore[]> {
    const userWords = await this.prisma.userWord.findMany({
      where: { userId, repetitions: { gt: 0 } }, // Only reviewed cards
      include: { word: true },
    });

    const now = new Date();

    const scores = userWords.map(uw => {
      const daysSinceLastReview = Math.floor(
        (now.getTime() - uw.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const predictedRetention = this.calculateForgetCurve(
        daysSinceLastReview,
        uw.repetitions,
        uw.easeFactor
      );

      let recommendationPriority: 'urgent' | 'high' | 'medium' | 'low';
      let reason: string;

      if (predictedRetention < 0.3) {
        recommendationPriority = 'urgent';
        reason = 'Likely to forget soon - review now!';
      } else if (predictedRetention < 0.5) {
        recommendationPriority = 'high';
        reason = 'Retention dropping - review soon';
      } else if (predictedRetention < 0.8) {
        recommendationPriority = 'medium';
        reason = 'Good retention, review in 2-3 days';
      } else {
        recommendationPriority = 'low';
        reason = 'Strong memory - review later';
      }

      return {
        wordId: uw.wordId,
        chinese: uw.word.chinese,
        daysSinceLastReview,
        predictedRetentionRate: Math.round(predictedRetention * 100) / 100,
        recommendationPriority,
        reason,
      };
    });

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return scores.sort(
      (a, b) => priorityOrder[a.recommendationPriority] - priorityOrder[b.recommendationPriority]
    );
  }

  /**
   * Get personalized word recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<AdaptiveRecommendation[]> {
    const metrics = await this.getPerformanceMetrics(userId);
    const forgetCurve = await this.getForgetCurveAnalysis(userId);

    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const recommendations: AdaptiveRecommendation[] = [];

    // 1. Add words at risk of being forgotten
    forgetCurve.slice(0, Math.ceil(limit * 0.4)).forEach(fc => {
      recommendations.push({
        wordId: fc.wordId,
        word: { chinese: fc.chinese },
        recommendationScore: 1 - fc.predictedRetentionRate,
        reason: fc.reason,
        category: 'at_risk',
      });
    });

    // 2. Add difficult words that need more practice
    const difficultWordDetails = await this.prisma.userWord.findMany({
      where: { userId, wordId: { in: metrics.difficultWords } },
      include: { word: true },
      take: Math.ceil(limit * 0.3),
    });

    difficultWordDetails.forEach(dw => {
      recommendations.push({
        wordId: dw.wordId,
        word: dw.word,
        recommendationScore: 2 - dw.easeFactor, // Lower easeFactor = higher recommendation
        reason: `You struggle with this word (${dw.reviewCount} attempts)`,
        category: 'challenge',
      });
    });

    // 3. Add new words if user is progressing well
    if (metrics.retentionRate > 0.7 && recommendations.length < limit) {
      const newWords = await this.prisma.word.findMany({
        where: {
          hskLevel: userProgress?.hskLevel,
          learnedBy: {
            none: { userId },
          },
        },
        take: limit - recommendations.length,
      });

      newWords.forEach(word => {
        recommendations.push({
          wordId: word.id,
          word,
          recommendationScore: 0.5,
          reason: 'New word matching your current level',
          category: 'challenge',
        });
      });
    }

    return recommendations.slice(0, limit).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Automatically adjust HSK level based on performance
   */
  async adjustHSKLevelAdaptively(userId: string): Promise<{ newLevel: number; reason: string }> {
    const metrics = await this.getPerformanceMetrics(userId);
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    let newLevel = userProgress?.hskLevel || 1;
    let reason = '';

    // If accuracy is very high (>0.85) and retention is good (>0.8), advance
    if (
      metrics.accuracyRate > 0.85 &&
      metrics.retentionRate > 0.8 &&
      userProgress?.totalWords &&
      userProgress?.targetWords &&
      userProgress.totalWords > userProgress.targetWords * 0.8
    ) {
      newLevel = Math.min(6, newLevel + 1);
      reason = 'Excellent performance! Advancing to next level.';
    }
    // If accuracy is low (<0.5), consider going back
    else if (metrics.accuracyRate < 0.5 && newLevel > 1) {
      newLevel = Math.max(1, newLevel - 1);
      reason = 'Having difficulty, going back a level to consolidate knowledge.';
    }

    if (newLevel !== userProgress?.hskLevel) {
      await this.prisma.userProgress.update({
        where: { userId },
        data: { hskLevel: newLevel },
      });
    }

    return {
      newLevel,
      reason: newLevel !== userProgress?.hskLevel ? reason : 'Keep practicing at current level!',
    };
  }

  /**
   * Get learning insights and personalized advice
   */
  async getLearningInsights(userId: string) {
    const metrics = await this.getPerformanceMetrics(userId);
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId },
    });

    const insights: Array<{
      type: string;
      level: string;
      message: string;
      suggestion: string;
    }> = [];

    // Insight 1: Learning pace
    if (metrics.avgReviewsPerDay > 50) {
      insights.push({
        type: 'pace',
        level: 'excellent',
        message: 'You\'re learning at a blazing pace! 🔥',
        suggestion: 'Maintain momentum, but ensure quality over quantity.',
      });
    } else if (metrics.avgReviewsPerDay > 20) {
      insights.push({
        type: 'pace',
        level: 'good',
        message: `You're averaging ${Math.round(metrics.avgReviewsPerDay)} reviews/day.`,
        suggestion: 'Consistent pace helps with retention.',
      });
    } else if (metrics.avgReviewsPerDay > 0) {
      insights.push({
        type: 'pace',
        level: 'low',
        message: `You're currently doing ${Math.round(metrics.avgReviewsPerDay)} reviews/day.`,
        suggestion: 'Try increase your study frequency for faster progress.',
      });
    }

    // Insight 2: Difficult areas
    if (metrics.difficultWords.length > 0) {
      insights.push({
        type: 'struggle',
        level: 'warning',
        message: `${metrics.difficultWords.length} words are giving you trouble.`,
        suggestion: 'These words need extra practice. Try focusing on them.',
      });
    }

    // Insight 3: Mastery progress
    const totalWordsForMastery = userProgress?.totalWords || 1;
    const mastery = (metrics.cardsLearned / totalWordsForMastery) * 100;
    insights.push({
      type: 'mastery',
      level: mastery > 70 ? 'excellent' : mastery > 40 ? 'good' : 'low',
      message: `${Math.round(mastery)}% of words learned feel solid.`,
      suggestion: mastery < 50 ? 'Keep reviewing to build mastery!' : 'Great foundation! Ready for new challenges?',
    });

    return insights;
  }
}

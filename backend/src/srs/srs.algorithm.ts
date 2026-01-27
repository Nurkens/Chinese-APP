/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm used in Anki
 *
 * Quality ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect, but recognized after seeing answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect recall
 */

export interface SRSCard {
  easeFactor: number;      // EF (easiness factor), starts at 2.5
  interval: number;        // Days until next review
  repetitions: number;     // Number of successful reviews in a row
  nextReviewDate: Date;    // When to review next
  lastReviewDate: Date;    // When last reviewed
}

export interface ReviewResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export class SM2Algorithm {
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly DEFAULT_EASE_FACTOR = 2.5;

  /**
   * Calculate the next review parameters based on quality of recall
   * @param card Current card state
   * @param quality Rating 0-5 of how well the user recalled
   * @returns New card parameters
   */
  static calculateNextReview(card: Partial<SRSCard>, quality: number): ReviewResult {
    // Clamp quality to 0-5
    quality = Math.max(0, Math.min(5, Math.round(quality)));

    let { easeFactor = this.DEFAULT_EASE_FACTOR, interval = 0, repetitions = 0 } = card;

    // Calculate new ease factor using SM-2 formula
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const newEaseFactor = Math.max(
      this.MIN_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    let newInterval: number;
    let newRepetitions: number;

    if (quality < 3) {
      // Failed recall - reset to beginning
      newRepetitions = 0;
      newInterval = 1; // Review again in 1 day
    } else {
      // Successful recall
      newRepetitions = repetitions + 1;

      if (newRepetitions === 1) {
        newInterval = 1; // First success: 1 day
      } else if (newRepetitions === 2) {
        newInterval = 6; // Second success: 6 days
      } else {
        // Subsequent successes: multiply previous interval by ease factor
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    nextReviewDate.setHours(0, 0, 0, 0);

    return {
      easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate,
    };
  }

  /**
   * Check if a card is due for review
   */
  static isDue(card: SRSCard): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(card.nextReviewDate) <= now;
  }

  /**
   * Get cards that are due for review, sorted by priority
   * Cards that are more overdue come first
   */
  static sortByPriority(cards: SRSCard[]): SRSCard[] {
    const now = new Date();
    return cards
      .filter(card => this.isDue(card))
      .sort((a, b) => {
        const aOverdue = now.getTime() - new Date(a.nextReviewDate).getTime();
        const bOverdue = now.getTime() - new Date(b.nextReviewDate).getTime();
        return bOverdue - aOverdue; // Most overdue first
      });
  }

  /**
   * Convert quality description to number
   */
  static qualityFromString(quality: 'again' | 'hard' | 'good' | 'easy'): number {
    switch (quality) {
      case 'again': return 1; // Failed
      case 'hard': return 3;  // Correct but difficult
      case 'good': return 4;  // Correct with hesitation
      case 'easy': return 5;  // Perfect
      default: return 3;
    }
  }

  /**
   * Get interval preview for each button option
   */
  static getIntervalPreviews(card: Partial<SRSCard>): {
    again: string;
    hard: string;
    good: string;
    easy: string;
  } {
    const formatInterval = (days: number): string => {
      if (days < 1) return '<1d';
      if (days === 1) return '1d';
      if (days < 7) return `${days}d`;
      if (days < 30) return `${Math.round(days / 7)}w`;
      if (days < 365) return `${Math.round(days / 30)}mo`;
      return `${Math.round(days / 365)}y`;
    };

    return {
      again: formatInterval(this.calculateNextReview(card, 1).interval),
      hard: formatInterval(this.calculateNextReview(card, 3).interval),
      good: formatInterval(this.calculateNextReview(card, 4).interval),
      easy: formatInterval(this.calculateNextReview(card, 5).interval),
    };
  }

  /**
   * Initialize a new card with default SRS values
   */
  static initializeCard(): SRSCard {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return {
      easeFactor: this.DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewDate: now, // Due immediately
      lastReviewDate: now,
    };
  }
}

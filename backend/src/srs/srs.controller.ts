import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { SRSService } from './srs.service';

@Controller('srs')
export class SRSController {
  constructor(private readonly srsService: SRSService) {}

  /**
   * Get cards due for review
   */
  @Get('due')
  async getDueCards(
    @Query('userId') userId: string = 'guest',
    @Query('limit') limit: string = '20'
  ) {
    return this.srsService.getDueCards(userId, parseInt(limit, 10));
  }

  /**
   * Get new cards for learning
   */
  @Get('new')
  async getNewCards(
    @Query('userId') userId: string = 'guest',
    @Query('hskLevel') hskLevel: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.srsService.getNewCards(
      userId,
      parseInt(hskLevel, 10),
      parseInt(limit, 10)
    );
  }

  /**
   * Get review statistics
   */
  @Get('stats')
  async getReviewStats(@Query('userId') userId: string = 'guest') {
    return this.srsService.getReviewStats(userId);
  }

  /**
   * Get interval preview for a card
   */
  @Get('preview/:wordId')
  async getIntervalPreview(
    @Param('wordId') wordId: string,
    @Query('userId') userId: string = 'guest'
  ) {
    return this.srsService.getIntervalPreview(userId, wordId);
  }

  /**
   * Submit a review
   */
  @Post('review')
  async submitReview(
    @Body() body: {
      userId?: string;
      wordId: string;
      quality: 'again' | 'hard' | 'good' | 'easy';
    }
  ) {
    const userId = body.userId || 'guest';
    return this.srsService.submitReview(userId, body.wordId, body.quality);
  }

  /**
   * Start a review session - returns mixed new and due cards
   */
  @Get('session')
  async getReviewSession(
    @Query('userId') userId: string = 'guest',
    @Query('newLimit') newLimit: string = '5',
    @Query('reviewLimit') reviewLimit: string = '15'
  ) {
    const [dueCards, newCards, stats] = await Promise.all([
      this.srsService.getDueCards(userId, parseInt(reviewLimit, 10)),
      this.srsService.getNewCards(userId, 1, parseInt(newLimit, 10)),
      this.srsService.getReviewStats(userId),
    ]);

    // Mix new cards into review cards
    const session = [...dueCards];

    // Insert new cards at intervals
    newCards.forEach((card, index) => {
      const position = Math.min((index + 1) * 3, session.length);
      session.splice(position, 0, card);
    });

    return {
      cards: session,
      stats,
    };
  }
}

import { Controller, Post, Get, Body, Param, Request } from '@nestjs/common';
import { TutorService } from './tutor.service';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('chat')
  async chat(@Request() req, @Body('message') message: string) {
    // Support both authenticated users and guests
    const userId = req.user?.id || req.body?.userId || 'guest';
    return this.tutorService.chat(userId, message);
  }

  @Get('stats')
  async getStats(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.tutorService.getUserStats(userId);
  }

  @Get('history')
  async getHistory(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.tutorService.getHistory(userId);
  }

  @Post('history/clear')
  async clearHistory(@Request() req) {
    const userId = req.user?.id || req.body?.userId || 'guest';
    this.tutorService.clearHistory(userId);
    return { message: 'History cleared' };
  }

  @Post('emotion/:emotion')
  async triggerEmotion(@Param('emotion') emotion: string) {
    return this.tutorService.triggerEmotion(emotion as any);
  }
}

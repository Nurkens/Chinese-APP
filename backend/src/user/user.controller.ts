import { Controller, Get, Post, Put, Request, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.userService.getUserWithProgress(userId);
  }

  @Get('progress')
  async getProgress(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.userService.getUserProgress(userId);
  }

  @Post('progress/streak')
  async updateStreak(@Request() req) {
    const userId = req.user?.id || req.body?.userId || 'guest';
    return this.userService.updateStreak(userId);
  }

  @Put('progress')
  async updateProgress(
    @Request() req,
    @Body() data: { hskLevel?: number; totalWords?: number; targetWords?: number }
  ) {
    const userId = req.user?.id || req.body?.userId || 'guest';
    return this.userService.updateProgress(userId, data);
  }

  @Post('words/:wordId/learn')
  async markWordAsLearned(@Request() req, @Param('wordId') wordId: string) {
    const userId = req.user?.id || req.body?.userId || 'guest';
    return this.userService.markWordAsLearned(userId, wordId);
  }

  @Get('words/learned')
  async getLearnedWords(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.userService.getLearnedWords(userId);
  }
}

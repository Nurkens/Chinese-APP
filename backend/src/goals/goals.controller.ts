import { Controller, Get, Post, Body, Param, Delete, Request, Query } from '@nestjs/common';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getUserGoals(@Request() req, @Query('userId') userId?: string) {
    const id = req.user?.id || userId || 'guest';
    return this.goalsService.getUserGoals(id);
  }

  @Get('achievements')
  async getUserAchievements(@Request() req, @Query('userId') userId?: string) {
    const id = req.user?.id || userId || 'guest';
    return this.goalsService.getUserAchievements(id);
  }

  @Post()
  async createGoal(@Request() req, @Body() goalData: any) {
    const userId = req.user?.id || goalData.userId || 'guest';
    return this.goalsService.createGoal(userId, goalData);
  }

  @Post(':id/progress')
  async updateGoalProgress(
    @Request() req,
    @Param('id') goalId: string,
    @Body('current') current: number,
    @Body('userId') userId?: string,
  ) {
    const id = req.user?.id || userId || 'guest';
    return this.goalsService.updateGoalProgress(id, goalId, current);
  }

  @Delete(':id')
  async deleteGoal(@Param('id') goalId: string, @Query('userId') userId?: string) {
    const id = userId || 'guest';
    return this.goalsService.deleteGoal(id, goalId);
  }
}

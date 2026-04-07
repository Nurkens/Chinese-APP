import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AdaptiveService } from './adaptive.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('adaptive')
@UseGuards(JwtAuthGuard)
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}

  /**
   * Get user's performance metrics
   */
  @Get('metrics')
  async getMetrics(@Request() req: any) {
    return await this.adaptiveService.getPerformanceMetrics(req.user.id);
  }

  /**
   * Get forgetting curve analysis with recommendations
   */
  @Get('forgetting-curve')
  async getForgetCurve(@Request() req: any) {
    return await this.adaptiveService.getForgetCurveAnalysis(req.user.id);
  }

  /**
   * Get personalized word recommendations
   */
  @Get('recommendations')
  async getRecommendations(@Request() req: any) {
    return await this.adaptiveService.getPersonalizedRecommendations(req.user.id, 15);
  }

  /**
   * Get adaptive HSK level adjustment
   */
  @Get('adjust-level')
  async adjustLevel(@Request() req: any) {
    return await this.adaptiveService.adjustHSKLevelAdaptively(req.user.id);
  }

  /**
   * Get learning insights and personalized advice
   */
  @Get('insights')
  async getInsights(@Request() req: any) {
    return await this.adaptiveService.getLearningInsights(req.user.id);
  }

  /**
   * Get complete adaptive learning dashboard data
   */
  @Get('dashboard')
  async getAdaptiveDashboard(@Request() req: any) {
    const [metrics, recommendations, insights, levelAdjustment] = await Promise.all([
      this.adaptiveService.getPerformanceMetrics(req.user.id),
      this.adaptiveService.getPersonalizedRecommendations(req.user.id, 10),
      this.adaptiveService.getLearningInsights(req.user.id),
      this.adaptiveService.adjustHSKLevelAdaptively(req.user.id),
    ]);

    return {
      metrics,
      recommendations,
      insights,
      levelAdjustment,
    };
  }
}

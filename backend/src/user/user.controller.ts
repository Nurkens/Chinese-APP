import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Request,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  private getUserId(req: any): string {
    // JWT strategy returns the full user object, so req.user.id is the authoritative id
    return req.user?.id;
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getUserWithProgress(this.getUserId(req));
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(this.getUserId(req), dto);
  }

  @Post('password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(this.getUserId(req), dto);
  }

  @Get('settings')
  async getSettings(@Request() req) {
    return this.userService.getSettings(this.getUserId(req));
  }

  @Put('settings')
  async updateSettings(@Request() req, @Body() dto: UpdateSettingsDto) {
    return this.userService.updateSettings(this.getUserId(req), dto);
  }

  @Get('progress')
  async getProgress(@Request() req) {
    return this.userService.getUserProgress(this.getUserId(req));
  }

  @Post('progress/streak')
  async updateStreak(@Request() req) {
    return this.userService.updateStreak(this.getUserId(req));
  }

  @Put('progress')
  async updateProgress(
    @Request() req,
    @Body() data: { hskLevel?: number; totalWords?: number; targetWords?: number },
  ) {
    return this.userService.updateProgress(this.getUserId(req), data);
  }

  @Post('words/:wordId/learn')
  async markWordAsLearned(@Request() req, @Param('wordId') wordId: string) {
    return this.userService.markWordAsLearned(this.getUserId(req), wordId);
  }

  @Get('words/learned')
  async getLearnedWords(@Request() req) {
    return this.userService.getLearnedWords(this.getUserId(req));
  }
}

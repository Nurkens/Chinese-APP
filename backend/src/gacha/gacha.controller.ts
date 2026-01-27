import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { GachaService } from './gacha.service';

@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Post('pull')
  async pull(@Request() req, @Body('pullType') pullType: 'single' | 'ten') {
    // Support both authenticated users and guests
    const userId = req.user?.id || req.body?.userId || 'guest';
    return this.gachaService.pull(userId, pullType);
  }

  @Get('pity')
  async getPityState(@Request() req) {
    const userId = req.user?.id || req.query?.userId || 'guest';
    return this.gachaService.getPityState(userId);
  }

  @Get('cards')
  async getAllCards() {
    return this.gachaService.getAllCards();
  }

  @Get('cards/:rarity')
  async getCardsByRarity(@Body('rarity') rarity: 'SSR' | 'SR' | 'R') {
    return this.gachaService.getCardsByRarity(rarity);
  }
}

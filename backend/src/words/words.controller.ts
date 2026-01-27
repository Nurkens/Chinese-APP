import { Controller, Get, Post, Param } from '@nestjs/common';
import { WordsService } from './words.service';

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get('today')
  async getTodayCharacter() {
    return this.wordsService.getTodayCharacter();
  }

  @Get('hsk/:level')
  async getWordsByHskLevel(@Param('level') level: string) {
    return this.wordsService.getWordsByHskLevel(parseInt(level));
  }

  @Get(':id')
  async getWordById(@Param('id') id: string) {
    return this.wordsService.getWordById(id);
  }

  @Post('seed')
  async seedWords() {
    return this.wordsService.seedInitialWords();
  }
}
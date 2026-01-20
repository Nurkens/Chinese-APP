import { Controller, Get, Post, Body } from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('words') 
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
  }

  @Get()
  findAll() {
    return this.wordsService.findAll();
  }
}
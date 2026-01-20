import { Injectable } from '@nestjs/common';
import { CreateWordDto } from './dto/create-word.dto';

@Injectable()
export class WordsService {

  private words = [
    { id: 1, character: '我', pinyin: 'wǒ', translation: 'Я' },
    { id: 2, character: '你', pinyin: 'nǐ', translation: 'Ты' },
  ];

  findAll() {
    return this.words;
  }

  create(createWordDto: CreateWordDto) {
    const newWord = { id: Date.now(), ...createWordDto };
    this.words.push(newWord);
    return newWord;
  }
}
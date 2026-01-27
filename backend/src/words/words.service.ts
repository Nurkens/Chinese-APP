import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

  async getTodayCharacter() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have a daily word for today
    let dailyWord = await this.prisma.dailyWord.findUnique({
      where: { date: today },
    });

    let word;

    if (dailyWord) {
      // Get the existing word
      word = await this.prisma.word.findUnique({
        where: { id: dailyWord.wordId },
      });
    } else {
      // Pick a random word
      const words = await this.prisma.word.findMany();

      if (words.length === 0) {
        // If no words exist, create a default one
        word = await this.createDefaultWord();
      } else {
        const randomIndex = Math.floor(Math.random() * words.length);
        word = words[randomIndex];
      }

      // Save as today's word
      await this.prisma.dailyWord.create({
        data: {
          wordId: word.id,
          date: today,
        },
      });
    }

    return {
      id: word.id,
      chinese: word.chinese,
      pinyin: word.pinyin,
      translation: word.translation,
      example: word.example,
      examplePinyin: word.examplePinyin,
      hskLevel: word.hskLevel,
      category: word.category,
    };
  }

  async getWordsByHskLevel(level: number) {
    return this.prisma.word.findMany({
      where: { hskLevel: level },
      orderBy: { chinese: 'asc' },
    });
  }

  async getWordById(id: string) {
    const word = await this.prisma.word.findUnique({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  async createWord(data: {
    chinese: string;
    pinyin: string;
    translation: string;
    example?: string;
    examplePinyin?: string;
    hskLevel: number;
    category?: string;
  }) {
    return this.prisma.word.create({
      data,
    });
  }

  private async createDefaultWord() {
    // Create the default word (火 - fire) that we show in the UI
    return this.prisma.word.create({
      data: {
        chinese: '火',
        pinyin: 'huǒ',
        translation: 'fire',
        example: '火车',
        examplePinyin: 'huǒchē',
        hskLevel: 1,
        category: 'noun',
      },
    });
  }

  async seedInitialWords() {
    const words = [
      {
        chinese: '火',
        pinyin: 'huǒ',
        translation: 'fire',
        example: '火车',
        examplePinyin: 'huǒchē',
        hskLevel: 1,
        category: 'noun',
      },
      {
        chinese: '水',
        pinyin: 'shuǐ',
        translation: 'water',
        example: '水果',
        examplePinyin: 'shuǐguǒ',
        hskLevel: 1,
        category: 'noun',
      },
      {
        chinese: '人',
        pinyin: 'rén',
        translation: 'person',
        example: '中国人',
        examplePinyin: 'zhōngguó rén',
        hskLevel: 1,
        category: 'noun',
      },
      {
        chinese: '学习',
        pinyin: 'xuéxí',
        translation: 'to study',
        example: '我学习汉语',
        examplePinyin: 'wǒ xuéxí hànyǔ',
        hskLevel: 1,
        category: 'verb',
      },
      {
        chinese: '朋友',
        pinyin: 'péngyou',
        translation: 'friend',
        example: '我的朋友',
        examplePinyin: 'wǒ de péngyou',
        hskLevel: 1,
        category: 'noun',
      },
    ];

    for (const word of words) {
      await this.prisma.word.upsert({
        where: { chinese: word.chinese },
        update: {},
        create: word,
      });
    }

    return { message: 'Initial words seeded successfully' };
  }
}
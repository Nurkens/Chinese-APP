import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OllamaService, ChatMessage } from './ollama.service';
import { STORY_SYSTEM_PROMPT } from '../prompts/story';
import { loadAiConfig } from '../ai.config';

const MAX_REGENS_PER_DAY = 3;
const NUM_FOCUS_WORDS = 8;

interface StoryLine {
  chinese: string;
  pinyin: string;
  translation: string;
}

interface FocusWord {
  wordId: string;
  chinese: string;
  pinyin: string;
  translation: string;
  hskLevel: number;
  source: 'srs_weak' | 'recent' | 'hsk_new';
}

export interface DailyStoryDTO {
  id: string;
  date: string;
  title: string;
  lines: StoryLine[];
  wordsUsed: FocusWord[];
  regenCount: number;
  remainingRegens: number;
  hskLevel: number | null;
  model: string;
  createdAt: Date;
  isNew: boolean;
}

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);
  private readonly cfg = loadAiConfig();

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
  ) {}

  async getToday(userId: string): Promise<DailyStoryDTO> {
    const date = this.todayKey();
    const existing = await this.prisma.dailyStory.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing) return this.toDto(existing, false);
    return this.generate(userId, date, false);
  }

  async regenerateToday(userId: string): Promise<DailyStoryDTO> {
    const date = this.todayKey();
    const existing = await this.prisma.dailyStory.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing && existing.regenCount >= MAX_REGENS_PER_DAY) {
      throw new BadRequestException(
        `Daily regenerate limit reached (${MAX_REGENS_PER_DAY}/day). Come back tomorrow.`,
      );
    }
    return this.generate(userId, date, true, existing?.regenCount ?? 0);
  }

  // ---------- core ----------

  private async generate(
    userId: string,
    date: string,
    isRegen: boolean,
    prevRegenCount = 0,
  ): Promise<DailyStoryDTO> {
    const focusWords = await this.pickFocusWords(userId);
    if (focusWords.length === 0) {
      throw new BadRequestException(
        'No vocabulary available yet — learn or review a few words first.',
      );
    }

    const hskLevel = focusWords[0]?.hskLevel ?? null;

    const userContent = this.buildUserPrompt(focusWords, hskLevel);
    const messages: ChatMessage[] = [
      { role: 'system', content: STORY_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ];

    const parsed = await this.callModelWithRetry(messages);

    // Annotate which focus words actually appeared in the story
    const joined = parsed.lines.map((l) => l.chinese).join('');
    const wordsUsed = focusWords.filter((w) => joined.includes(w.chinese));

    const newCount = isRegen ? prevRegenCount + 1 : 0;

    const row = await this.prisma.dailyStory.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        title: parsed.title.slice(0, 60),
        lines: parsed.lines as any,
        wordsUsed: wordsUsed as any,
        hskLevel,
        model: this.cfg.chatModel,
        regenCount: newCount,
      },
      update: {
        title: parsed.title.slice(0, 60),
        lines: parsed.lines as any,
        wordsUsed: wordsUsed as any,
        hskLevel,
        model: this.cfg.chatModel,
        regenCount: newCount,
      },
    });

    return this.toDto(row, true);
  }

  private async callModelWithRetry(messages: ChatMessage[]): Promise<{
    title: string;
    lines: StoryLine[];
  }> {
    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await this.ollama.chat(messages, {
          json: true,
          temperature: attempt === 0 ? 0.8 : 0.4,
          numPredict: 700,
        });
        const parsed = this.tryParse(raw);
        if (parsed) return parsed;
        lastError = `Could not parse model output as 5-line story: ${raw.slice(0, 200)}`;
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }
    throw new ServiceUnavailableException(`Story generation failed: ${lastError}`);
  }

  private tryParse(raw: string): { title: string; lines: StoryLine[] } | null {
    if (!raw) return null;
    // Strip markdown fences in case the model insists
    const cleaned = raw
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    // Find the first { and the matching last }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const candidate = cleaned.slice(start, end + 1);

    let obj: any;
    try {
      obj = JSON.parse(candidate);
    } catch {
      return null;
    }

    if (typeof obj?.title !== 'string') return null;
    if (!Array.isArray(obj?.lines)) return null;

    const lines: StoryLine[] = [];
    for (const l of obj.lines) {
      if (
        typeof l?.chinese === 'string' &&
        typeof l?.pinyin === 'string' &&
        typeof l?.translation === 'string'
      ) {
        lines.push({
          chinese: l.chinese.trim(),
          pinyin: l.pinyin.trim(),
          translation: l.translation.trim(),
        });
      }
    }

    if (lines.length < 3) return null; // accept 3-5; the prompt asks for 5
    return { title: obj.title.trim(), lines: lines.slice(0, 5) };
  }

  private buildUserPrompt(focus: FocusWord[], hskLevel: number | null): string {
    const list = focus
      .map((w) => `- ${w.chinese} (${w.pinyin}) — ${w.translation}`)
      .join('\n');
    const level = hskLevel ? ` Learner's HSK level: ${hskLevel}.` : '';
    return `Focus words (use at least 3 across the 5 lines):\n${list}\n${level}\nReturn the JSON now.`;
  }

  /**
   * Pick the most useful words to weave into today's story.
   * Priority:
   *   1. SRS cards due/overdue with the lowest mastery (true "weak" words)
   *   2. Recently reviewed words (recall reinforcement)
   *   3. Fallback: next HSK words at the learner's level (cold-start)
   */
  private async pickFocusWords(userId: string): Promise<FocusWord[]> {
    const now = new Date();

    const dueWeak = await this.prisma.userWord.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      orderBy: [{ easeFactor: 'asc' }, { mastery: 'asc' }],
      take: NUM_FOCUS_WORDS,
      include: { word: true },
    });

    let picks: FocusWord[] = dueWeak
      .filter((uw) => !!uw.word)
      .map((uw) => ({
        wordId: uw.wordId,
        chinese: uw.word!.chinese,
        pinyin: uw.word!.pinyin,
        translation: uw.word!.translation,
        hskLevel: uw.word!.hskLevel,
        source: 'srs_weak' as const,
      }));

    if (picks.length < NUM_FOCUS_WORDS) {
      const recent = await this.prisma.userWord.findMany({
        where: {
          userId,
          wordId: { notIn: picks.map((p) => p.wordId) },
        },
        orderBy: { lastReviewDate: 'desc' },
        take: NUM_FOCUS_WORDS - picks.length,
        include: { word: true },
      });
      picks = picks.concat(
        recent
          .filter((uw) => !!uw.word)
          .map((uw) => ({
            wordId: uw.wordId,
            chinese: uw.word!.chinese,
            pinyin: uw.word!.pinyin,
            translation: uw.word!.translation,
            hskLevel: uw.word!.hskLevel,
            source: 'recent' as const,
          })),
      );
    }

    if (picks.length === 0) {
      // Cold start — pull a handful of words from the learner's HSK level
      const progress = await this.prisma.userProgress.findUnique({
        where: { userId },
        select: { hskLevel: true },
      });
      const level = progress?.hskLevel ?? 1;
      const seed = await this.prisma.word.findMany({
        where: { hskLevel: { lte: level } },
        take: NUM_FOCUS_WORDS,
        orderBy: { createdAt: 'asc' },
      });
      picks = seed.map((w) => ({
        wordId: w.id,
        chinese: w.chinese,
        pinyin: w.pinyin,
        translation: w.translation,
        hskLevel: w.hskLevel,
        source: 'hsk_new' as const,
      }));
    }

    return picks;
  }

  private todayKey(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toDto(row: any, isNew: boolean): DailyStoryDTO {
    return {
      id: row.id,
      date: row.date,
      title: row.title,
      lines: row.lines as StoryLine[],
      wordsUsed: (row.wordsUsed as FocusWord[]) ?? [],
      regenCount: row.regenCount,
      remainingRegens: Math.max(0, MAX_REGENS_PER_DAY - row.regenCount),
      hskLevel: row.hskLevel,
      model: row.model,
      createdAt: row.createdAt,
      isNew,
    };
  }
}

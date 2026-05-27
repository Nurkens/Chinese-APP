import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OllamaService, ChatMessage } from './ollama.service';
import { SUMMARIZER_PROMPT, TITLE_PROMPT } from '../prompts/summarizer';
import { loadAiConfig } from '../ai.config';

/**
 * Owns conversation history + rolling summary.
 *
 * Strategy:
 *   - Keep the last N messages (historyWindow) verbatim for the prompt.
 *   - When the *total* message count crosses summarizeAfter, fold the older
 *     messages into a single running summary, persisted on the conversation row.
 *   - Summarization runs as a non-blocking best-effort task — a failure does
 *     not block the user's reply.
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly cfg = loadAiConfig();

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
  ) {}

  async getRecentHistory(conversationId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: this.cfg.historyWindow,
    });
    return rows
      .reverse()
      .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }));
  }

  async getSummary(conversationId: string): Promise<string | null> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { summary: true },
    });
    return conv?.summary ?? null;
  }

  async appendMessage(
    conversationId: string,
    role: ChatMessage['role'],
    content: string,
    tokensApprox = 0,
  ) {
    const created = await this.prisma.message.create({
      data: { conversationId, role, content, tokensApprox },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  }

  /**
   * If the conversation has more messages than summarizeAfter, fold the *older*
   * portion into the persisted summary. Runs best-effort; errors are logged.
   * Intended to be called *after* the user sees the assistant's reply.
   */
  async maybeSummarize(conversationId: string): Promise<void> {
    try {
      const conv = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { summary: true },
      });
      if (!conv) return;

      const total = await this.prisma.message.count({ where: { conversationId } });
      if (total < this.cfg.summarizeAfter) return;

      // Take the oldest (total - historyWindow) messages — these are the ones
      // that will not appear verbatim in future prompts and so must be summarized.
      const olderCount = total - this.cfg.historyWindow;
      if (olderCount <= 0) return;

      const older = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: olderCount,
      });

      const transcript = older
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const messages: ChatMessage[] = [
        { role: 'system', content: SUMMARIZER_PROMPT },
      ];
      if (conv.summary) {
        messages.push({
          role: 'user',
          content: `Existing memory:\n${conv.summary}\n\nNew transcript to merge:\n${transcript}`,
        });
      } else {
        messages.push({ role: 'user', content: `Transcript:\n${transcript}` });
      }

      const summary = await this.ollama.chat(messages, { temperature: 0.2, numPredict: 300 });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { summary: summary.trim() },
      });
    } catch (err: any) {
      this.logger.warn(`Summarization failed for ${conversationId}: ${err.message}`);
    }
  }

  /**
   * Generate a short title for an untitled conversation, based on the first user message.
   * Best-effort — falls back to a truncation of the message if the model fails.
   */
  async generateTitle(conversationId: string, firstUserMessage: string): Promise<string> {
    const fallback = firstUserMessage.split(/\s+/).slice(0, 6).join(' ').slice(0, 60);
    try {
      const title = await this.ollama.chat(
        [
          { role: 'system', content: TITLE_PROMPT },
          { role: 'user', content: firstUserMessage },
        ],
        { temperature: 0.2, numPredict: 30 },
      );
      const cleaned = title
        .trim()
        .replace(/^["'`]+|["'`.!?]+$/g, '')
        .slice(0, 80);
      const finalTitle = cleaned || fallback;
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: finalTitle },
      });
      return finalTitle;
    } catch (err: any) {
      this.logger.warn(`Title generation failed: ${err.message}`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: fallback },
      });
      return fallback;
    }
  }
}

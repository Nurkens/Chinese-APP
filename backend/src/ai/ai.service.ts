import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './services/ollama.service';
import { PromptBuilderService, UserFacts } from './services/prompt-builder.service';
import { MemoryService } from './services/memory.service';
import { RagService } from './services/rag.service';
import { loadAiConfig } from './ai.config';

export interface StreamSink {
  onToken: (token: string) => void;
  onMeta?: (meta: { conversationId: string; titleUpdated?: string }) => void;
  onDone: (full: string) => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

/**
 * High-level chat orchestrator. Pulls together:
 *   userFacts → memory (summary + history) → RAG retrieval → prompt → Ollama stream
 *
 * Persists user + assistant messages around the streaming call, and kicks off
 * best-effort summarization + title generation after the reply is delivered.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly cfg = loadAiConfig();

  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
    private prompts: PromptBuilderService,
    private memory: MemoryService,
    private rag: RagService,
  ) {}

  // ---------- Conversation CRUD ----------

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        model: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException();
    return conv;
  }

  async createConversation(userId: string, title?: string) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: title?.trim() || 'New conversation',
        model: this.cfg.chatModel,
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) throw new ForbiddenException();
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { success: true };
  }

  // ---------- Chat ----------

  async streamReply(opts: {
    userId: string;
    conversationId?: string | null;
    message: string;
    sink: StreamSink;
  }): Promise<void> {
    const { userId, message, sink } = opts;
    const cleanMessage = (message || '').trim();
    if (!cleanMessage) {
      sink.onError(new Error('Empty message'));
      return;
    }

    // 1. Ensure a conversation
    let conversationId = opts.conversationId ?? null;
    let isNew = false;
    if (!conversationId) {
      const conv = await this.createConversation(userId);
      conversationId = conv.id;
      isNew = true;
    } else {
      const exists = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });
      if (!exists) throw new NotFoundException('Conversation not found');
      if (exists.userId !== userId) throw new ForbiddenException();
    }

    // 2. Persist the user message first so it never gets lost on errors
    await this.memory.appendMessage(conversationId, 'user', cleanMessage);

    // 3. Gather facts / history / summary / retrieval in parallel
    const userFacts = await this.loadUserFacts(userId);
    const [history, summary, retrieved] = await Promise.all([
      this.memory.getRecentHistory(conversationId).then((h) => h.slice(0, -1)), // drop the just-appended user msg, we add it as `userMessage`
      this.memory.getSummary(conversationId),
      this.rag.retrieve(cleanMessage, this.cfg.topKContext, userFacts.hskLevel ?? null),
    ]);

    const messages = this.prompts.build({
      userFacts,
      retrieved,
      conversationSummary: summary,
      history,
      userMessage: cleanMessage,
    });

    // 4. Emit metadata so the client knows the conversation id for new chats
    sink.onMeta?.({ conversationId });

    // 5. Stream
    let full = '';
    try {
      await this.ollama.streamChat(
        messages,
        {
          signal: sink.signal,
          onToken: (t) => {
            full += t;
            sink.onToken(t);
          },
          onDone: async (finalText) => {
            full = finalText || full;
            try {
              await this.memory.appendMessage(conversationId!, 'assistant', full);
            } catch (e: any) {
              this.logger.warn(`Persist assistant message failed: ${e.message}`);
            }
            sink.onDone(full);

            // Fire-and-forget background tasks
            if (isNew) {
              this.memory
                .generateTitle(conversationId!, cleanMessage)
                .then((title) => sink.onMeta?.({ conversationId: conversationId!, titleUpdated: title }))
                .catch(() => {});
            }
            this.memory.maybeSummarize(conversationId!).catch(() => {});
          },
          onError: (err) => sink.onError(err),
        },
        { model: this.cfg.chatModel },
      );
    } catch (err: any) {
      // If we got *some* tokens before the error, still persist what we have.
      if (full.length > 0) {
        try {
          await this.memory.appendMessage(conversationId!, 'assistant', full);
        } catch {
          /* ignore */
        }
      }
      throw err;
    }
  }

  // ---------- Status ----------

  async status() {
    const health = await this.ollama.health();
    return {
      ollama: health,
      rag: this.rag.stats(),
      config: {
        chatModel: this.cfg.chatModel,
        embeddingModel: this.cfg.embeddingModel,
        temperature: this.cfg.temperature,
        numPredict: this.cfg.numPredict,
        topKContext: this.cfg.topKContext,
        historyWindow: this.cfg.historyWindow,
        summarizeAfter: this.cfg.summarizeAfter,
      },
    };
  }

  async reindex() {
    return this.rag.reindex();
  }

  // ---------- internals ----------

  private async loadUserFacts(userId: string): Promise<UserFacts> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        isGuest: true,
        progress: {
          select: {
            hskLevel: true,
            totalWords: true,
            currentStreak: true,
            longestStreak: true,
          },
        },
      },
    });
    if (!user) return {};
    return {
      username: user.username,
      isGuest: user.isGuest,
      hskLevel: user.progress?.hskLevel ?? null,
      totalWords: user.progress?.totalWords ?? null,
      currentStreak: user.progress?.currentStreak ?? null,
      longestStreak: user.progress?.longestStreak ?? null,
    };
  }
}

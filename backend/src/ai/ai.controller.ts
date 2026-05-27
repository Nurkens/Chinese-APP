import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { StoryService } from './services/story.service';
import { ChatRequestDto, CreateConversationDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ai: AiService,
    private readonly story: StoryService,
  ) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  @Get('status')
  status() {
    return this.ai.status();
  }

  @Post('knowledge/reindex')
  async reindex() {
    return this.ai.reindex();
  }

  @Get('story/today')
  async storyToday(@Req() req: Request) {
    return this.story.getToday(this.uid(req));
  }

  @Post('story/regenerate')
  async storyRegenerate(@Req() req: Request) {
    return this.story.regenerateToday(this.uid(req));
  }

  @Get('conversations')
  list(@Req() req: Request) {
    return this.ai.listConversations(this.uid(req));
  }

  @Post('conversations')
  create(@Req() req: Request, @Body() dto: CreateConversationDto) {
    return this.ai.createConversation(this.uid(req), dto.title);
  }

  @Get('conversations/:id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.ai.getConversation(this.uid(req), id);
  }

  @Delete('conversations/:id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.ai.deleteConversation(this.uid(req), id);
  }

  /**
   * Streaming chat endpoint. Emits Server-Sent Events with three event types:
   *   - "meta"  → { conversationId, titleUpdated? }
   *   - "token" → { delta }
   *   - "done"  → { full }
   *   - "error" → { message }
   *
   * The client uses fetch() + ReadableStream (not EventSource) so the JWT
   * Authorization header is preserved.
   */
  @Post('chat/stream')
  async chatStream(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: ChatRequestDto,
  ) {
    const userId = this.uid(req);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx: disable buffering
    res.flushHeaders?.();

    const ctrl = new AbortController();
    req.on('close', () => ctrl.abort());

    const send = (event: string, data: unknown) => {
      if (res.writableEnded) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // @ts-expect-error: flush exists with compression middleware
      res.flush?.();
    };

    // Periodic keep-alive comment so proxies don't time the connection out.
    const heartbeat = setInterval(() => {
      if (res.writableEnded) return;
      res.write(`: keep-alive\n\n`);
    }, 15_000);

    try {
      await this.ai.streamReply({
        userId,
        conversationId: dto.conversationId,
        message: dto.message,
        sink: {
          signal: ctrl.signal,
          onMeta: (meta) => send('meta', meta),
          onToken: (delta) => send('token', { delta }),
          onDone: (full) => {
            send('done', { full });
            clearInterval(heartbeat);
            res.end();
          },
          onError: (err) => {
            send('error', { message: err.message || 'Unknown error' });
            clearInterval(heartbeat);
            if (!res.writableEnded) res.end();
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`Stream chat failed: ${err.message}`, err.stack);
      send('error', { message: err.message || 'Server error' });
      clearInterval(heartbeat);
      if (!res.writableEnded) res.end();
    }
  }
}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OllamaService } from './services/ollama.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { MemoryService } from './services/memory.service';
import { RagService } from './services/rag.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiController],
  providers: [AiService, OllamaService, PromptBuilderService, MemoryService, RagService],
  exports: [AiService, OllamaService, RagService],
})
export class AiModule {}

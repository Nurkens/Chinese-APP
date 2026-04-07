import { Module } from '@nestjs/common';
import { AdaptiveService } from './adaptive.service';
import { AdaptiveController } from './adaptive.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdaptiveController],
  providers: [AdaptiveService],
  exports: [AdaptiveService],
})
export class AdaptiveModule {}

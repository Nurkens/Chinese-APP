import { Module } from '@nestjs/common';
import { SRSController } from './srs.controller';
import { SRSService } from './srs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SRSController],
  providers: [SRSService],
  exports: [SRSService],
})
export class SRSModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WordsModule } from './words/words.module';
import { UserModule } from './user/user.module';
import { GoalsModule } from './goals/goals.module';
import { TutorModule } from './tutor/tutor.module';
import { GachaModule } from './gacha/gacha.module';
import { SRSModule } from './srs/srs.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    WordsModule,
    UserModule,
    GoalsModule,
    TutorModule,
    GachaModule,
    SRSModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

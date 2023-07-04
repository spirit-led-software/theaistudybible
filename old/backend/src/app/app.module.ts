import configuration from '@configs';
import { AuthModule } from '@modules/auth/auth.module';
import { ChatMessageModule } from '@modules/chat-message/chat-message.module';
import { ChatModule } from '@modules/chat/chat.module';
import { DatabaseModule } from '@modules/database/database.module';
import { DevoModule } from '@modules/devo/devo.module';
import { FileScraperModule } from '@modules/file-scraper/file-scraper.module';
import { IndexOpModule } from '@modules/index-op/index-op.module';
import { QueueModule } from '@modules/queue/queue.module';
import { S3Module } from '@modules/s3/s3.module';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { WebScraperModule } from '@modules/web-scraper/web-scraper.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local'],
      load: [configuration],
    }),
    AuthModule.forRoot(),
    ScheduleModule.forRoot(),
    QueueModule,
    DatabaseModule,
    VectorDBModule,
    IndexOpModule,
    ChatModule,
    ChatMessageModule,
    DevoModule,
    S3Module,
    FileScraperModule,
    WebScraperModule,
  ],
})
export class AppModule {}

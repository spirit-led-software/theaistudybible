import configuration from '@configs';
import { ChatMessageModule } from '@modules/chat-message/chat-message.module';
import { DatabaseModule } from '@modules/database/database.module';
import { DevoModule } from '@modules/devo/devo.module';
import { IndexOpModule } from '@modules/index-op/index-op.module';
import { QueueModule } from '@modules/queue/queue.module';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './modules/chat/chat.module';
import { S3Module } from './modules/s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local'],
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    QueueModule,
    DatabaseModule,
    VectorDBModule,
    IndexOpModule,
    ChatModule,
    ChatMessageModule,
    DevoModule,
    S3Module,
  ],
})
export class AppModule {}

import configuration from '@configs';
import { ChatMessageModule } from '@modules/chat-message/chat-message.module';
import { DatabaseModule } from '@modules/database/database.module';
import { VectorDatabaseModule } from '@modules/database/vector-db.module';
import { DevoModule } from '@modules/devo/devo.module';
import { IndexOpModule } from '@modules/index-op/index-op.module';
import { QueueModule } from '@modules/queue/queue.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    QueueModule,
    DatabaseModule,
    VectorDatabaseModule,
    IndexOpModule,
    ChatModule,
    ChatMessageModule,
    DevoModule,
  ],
})
export class AppModule {}

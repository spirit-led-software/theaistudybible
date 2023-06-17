import { ChatMessageModule } from '@modules/chat-message/chat-message.module';
import { CustomConfigModule } from '@modules/config/custom-config.module';
import { DatabaseModule } from '@modules/database/database.module';
import { VectorDatabaseModule } from '@modules/database/vector-database.module';
import { DevoModule } from '@modules/devo/devo.module';
import { IndexOpModule } from '@modules/index-op/index-op.module';
import { QueueModule } from '@modules/queue/queue.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    CustomConfigModule,
    ScheduleModule.forRoot(),
    QueueModule,
    DatabaseModule,
    VectorDatabaseModule,
    IndexOpModule,
    ChatMessageModule,
    DevoModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

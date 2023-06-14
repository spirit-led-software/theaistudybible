import { CustomConfigModule } from '@modules/config/custom-config.module';
import { DbModule } from '@modules/database/database.module';
import { DevoModule } from '@modules/devo/devo.module';
import { IndexModule } from '@modules/index/index.module';
import { QueryModule } from '@modules/query/query.module';
import { QueueModule } from '@modules/queue/queue.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    CustomConfigModule,
    ScheduleModule.forRoot(),
    QueueModule,
    DbModule,
    IndexModule,
    QueryModule,
    DevoModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

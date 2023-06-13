import { DbModule } from '@modules/database/database.module';
import { DevoModule } from '@modules/devo/devo.module';
import { IndexModule } from '@modules/index/index.module';
import { QueryModule } from '@modules/query/query.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomConfigModule } from './modules/config/custom-config.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    CustomConfigModule,
    ScheduleModule.forRoot(),
    QueueModule,
    DbModule,
    IndexModule,
    QueryModule,
    DevoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

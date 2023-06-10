import { Module } from '@nestjs/common';
import { CustomConfigModule } from './modules/config/custom-config.module';
import { DbModule } from './modules/database/database.module';
import { IndexModule } from './modules/index/index.module';
import { QueryModule } from './modules/query/query.module';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    CustomConfigModule,
    IndexModule,
    DbModule,
    QueryModule,
    RabbitmqModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

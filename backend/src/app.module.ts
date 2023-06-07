import { Module } from '@nestjs/common';
import { CustomConfigModule } from './modules/custom-config.module';
import { DbModule } from './modules/db.module';
import { IndexModule } from './modules/index/index.module';
import { QueryModule } from './modules/query/query.module';

@Module({
  imports: [CustomConfigModule, IndexModule, DbModule, QueryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

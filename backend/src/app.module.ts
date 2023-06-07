import { Module } from '@nestjs/common';
import { IndexModule } from './index/index.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [IndexModule, QueryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

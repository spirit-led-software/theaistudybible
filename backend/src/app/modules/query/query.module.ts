import { ChatModule } from '@modules/chat/chat.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryResult } from './entities/query-result.entity';
import { Query } from './entities/query.entity';
import { SourceDocument } from './entities/source-document.entity';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Query, QueryResult, SourceDocument]),
    ChatModule,
  ],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}

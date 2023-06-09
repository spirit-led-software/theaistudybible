import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Query } from './entities/query.entity';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [TypeOrmModule.forFeature([Query])],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}

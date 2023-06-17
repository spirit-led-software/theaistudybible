import { Devo, SourceDocument } from '@entities';
import { LLMModule } from '@modules/llm/llm.module';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevoController } from './devo.controller';
import { DevoService } from './devo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Devo, SourceDocument]),
    VectorDBModule,
    LLMModule,
  ],
  controllers: [DevoController],
  providers: [DevoService],
})
export class DevoModule {}

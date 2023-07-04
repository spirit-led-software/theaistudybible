import { LLMModule } from '@modules/llm/llm.module';
import { Module } from '@nestjs/common';
import { VectorDBService } from './vector-db.service';

@Module({
  imports: [LLMModule],
  providers: [VectorDBService],
  exports: [VectorDBService],
})
export class VectorDBModule {
  constructor(private readonly vectorDbService: VectorDBService) {}

  async onModuleInit() {
    await this.vectorDbService.initializeCollection();
  }
}

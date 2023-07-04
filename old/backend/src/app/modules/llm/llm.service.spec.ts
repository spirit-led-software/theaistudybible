import { Test, TestingModule } from '@nestjs/testing';
import { LLMService } from './llm.service';

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LLMService],
    }).compile();

    service = module.get<LLMService>(LLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

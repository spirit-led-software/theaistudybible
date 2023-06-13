import { Test, TestingModule } from '@nestjs/testing';
import { DevoService } from './devo.service';

describe('DevoService', () => {
  let service: DevoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevoService],
    }).compile();

    service = module.get<DevoService>(DevoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { IndexOpService } from './index-op.service';

describe('IndexOpService', () => {
  let service: IndexOpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndexOpService],
    }).compile();

    service = module.get<IndexOpService>(IndexOpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

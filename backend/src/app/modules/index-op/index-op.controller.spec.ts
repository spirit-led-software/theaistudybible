import { Test, TestingModule } from '@nestjs/testing';
import { IndexOpController } from './index-op.controller';
import { IndexOpService } from './index-op.service';

describe('IndexOpController', () => {
  let controller: IndexOpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexOpController],
      providers: [IndexOpService],
    }).compile();

    controller = module.get<IndexOpController>(IndexOpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

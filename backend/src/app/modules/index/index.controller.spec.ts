import { Test, TestingModule } from '@nestjs/testing';
import { IndexController } from './index.controller';
import { IndexService } from './index.service';

describe('IndexController', () => {
  let controller: IndexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexController],
      providers: [IndexService],
    }).compile();

    controller = module.get<IndexController>(IndexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

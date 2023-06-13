import { Test, TestingModule } from '@nestjs/testing';
import { DevoController } from './devo.controller';
import { DevoService } from './devo.service';

describe('DevoController', () => {
  let controller: DevoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevoController],
      providers: [DevoService],
    }).compile();

    controller = module.get<DevoController>(DevoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

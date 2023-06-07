import { Test, TestingModule } from '@nestjs/testing';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

describe('QueryController', () => {
  let controller: QueryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [QueryService],
    }).compile();

    controller = module.get<QueryController>(QueryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

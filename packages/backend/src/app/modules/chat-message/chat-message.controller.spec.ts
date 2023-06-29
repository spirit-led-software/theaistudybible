import { Test, TestingModule } from '@nestjs/testing';
import { ChatMessageController } from './chat-message.controller';
import { ChatMessageService } from './chat-message.service';

describe('ChatMessageController', () => {
  let controller: ChatMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatMessageController],
      providers: [ChatMessageService],
    }).compile();

    controller = module.get<ChatMessageController>(ChatMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

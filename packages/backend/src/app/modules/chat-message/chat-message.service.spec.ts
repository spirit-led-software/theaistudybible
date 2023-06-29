import { Test, TestingModule } from '@nestjs/testing';
import { ChatMessageService } from './chat-message.service';

describe('ChatMessageService', () => {
  let service: ChatMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatMessageService],
    }).compile();

    service = module.get<ChatMessageService>(ChatMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

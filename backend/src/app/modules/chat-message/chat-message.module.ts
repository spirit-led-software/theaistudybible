import { ChatAnswer } from '@entities/chat-answer';
import { ChatMessage } from '@entities/chat-message';
import { SourceDocument } from '@entities/source-document';
import { ChatModule } from '@modules/chat/chat.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageController } from './chat-message.controller';
import { ChatMessageService } from './chat-message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatAnswer, SourceDocument]),
    ChatModule,
  ],
  controllers: [ChatMessageController],
  providers: [ChatMessageService],
})
export class ChatMessageModule {}

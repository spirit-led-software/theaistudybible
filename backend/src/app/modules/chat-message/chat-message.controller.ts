import { CreateChatMessageDto } from '@dtos/chat-message';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { paginateEntityList } from '@utils/pagination';
import type { Response } from 'express';
import { ChatMessageService } from './chat-message.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chat-messages')
export class ChatMessageController {
  constructor(private readonly queryService: ChatMessageService) {}

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get()
  async getMessages(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const messages = await this.queryService.getAllMessages();
    return paginateEntityList(messages, +page, +limit);
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get(':id')
  async getMessage(@Param('id') id: string) {
    const message = await this.queryService.getMessage(id);
    if (!message) {
      throw new NotFoundException();
    }
    return message;
  }

  @SerializeOptions({
    groups: ['query-result'],
  })
  @Get(':id/result')
  async getAnswer(@Param('id') id: string) {
    const message = await this.queryService.getMessage(id);
    if (!message) {
      throw new NotFoundException();
    }
    const result = message.answer;
    return result;
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Post()
  async newMessage(
    @Body() body: CreateChatMessageDto,
    @Res() response: Response,
  ) {
    const chatMessage = await this.queryService.saveMessage(body);
    response.writeHead(206, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Chat-ID': chatMessage.chat.id,
      'X-Chat-Message-ID': chatMessage.id,
    });
    await this.queryService.executeMessage(chatMessage, response);
  }
}

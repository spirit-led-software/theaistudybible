import { CreateChatMessageDto } from '@dtos/chat-message';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ChatMessageService } from './chat-message.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chat-messages')
export class ChatMessageController {
  constructor(private readonly queryService: ChatMessageService) {}

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get()
  async getMessages() {
    const queries = await this.queryService.getAllMessages();
    return queries;
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get(':id')
  async getMessage(@Param('id') id: string) {
    const query = await this.queryService.getMessage(id);
    if (!query) {
      throw new NotFoundException();
    }
    return query;
  }

  @SerializeOptions({
    groups: ['query-result'],
  })
  @Get(':id/result')
  async getAnswer(@Param('id') id: string) {
    const query = await this.queryService.getMessage(id);
    if (!query) {
      throw new NotFoundException();
    }
    const result = query.answer;
    return result;
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Post()
  async newMessage(@Body() body: CreateChatMessageDto) {
    const query = await this.queryService.message(body);
    return query;
  }
}

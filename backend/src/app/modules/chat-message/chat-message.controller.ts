import { CreateChatMessageDto } from '@dtos/chat-message';
import { AuthGuard } from '@modules/auth/auth.guard';
import { Session } from '@modules/auth/session.decorator';
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
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { paginateEntityList } from '@utils/pagination';
import type { Response } from 'express';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { ChatMessageService } from './chat-message.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chat-messages')
export class ChatMessageController {
  constructor(private readonly queryService: ChatMessageService) {}

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get()
  @UseGuards(new AuthGuard())
  async getMessages(
    @Session() session: SessionContainer,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const messages = await this.queryService.getAllMessages();
    messages.filter((message) => message.chat.userId === session.getUserId());
    return paginateEntityList(messages, +page, +limit);
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Get(':id')
  @UseGuards(new AuthGuard())
  async getMessage(
    @Session() session: SessionContainer,
    @Param('id') id: string,
  ) {
    const message = await this.queryService.getMessage(id);
    if (!message) {
      throw new NotFoundException();
    }
    if (message.chat.userId !== session.getUserId()) {
      throw new UnauthorizedException();
    }
    return message;
  }

  @SerializeOptions({
    groups: ['query-result'],
  })
  @Get(':id/result')
  @UseGuards(new AuthGuard())
  async getAnswer(
    @Session() session: SessionContainer,
    @Param('id') id: string,
  ) {
    const message = await this.queryService.getMessage(id);
    if (!message) {
      throw new NotFoundException();
    }
    if (message.chat.userId !== session.getUserId()) {
      throw new UnauthorizedException();
    }
    const result = message.answer;
    return result;
  }

  @SerializeOptions({
    groups: ['chat-message'],
  })
  @Post()
  async newMessage(
    @Session() session: SessionContainer,
    @Body() body: CreateChatMessageDto,
    @Res() response: Response,
  ) {
    const chatMessage = await this.queryService.saveMessage(session, body);
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

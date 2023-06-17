import { CreateChatDto } from '@dtos/chat';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @SerializeOptions({
    groups: ['chat'],
  })
  @Post()
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.externalCreate(createChatDto);
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get()
  findAll() {
    return this.chatService.findAll();
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatService.remove(id);
  }
}

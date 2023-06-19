import { CreateChatDto } from '@dtos/chat';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { paginateEntityList } from '@utils/pagination';
import { ChatService } from './chat.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @SerializeOptions({
    groups: ['chat'],
  })
  @Post()
  async create(@Body() createChatDto: CreateChatDto) {
    return await this.chatService.externalCreate(createChatDto);
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get()
  async findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const chats = await this.chatService.findAll();
    return paginateEntityList(chats, +page, +limit);
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.chatService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.chatService.remove(id);
  }
}

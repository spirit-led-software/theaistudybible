import { CreateChatDto } from '@dtos/chat';
import { AuthGuard } from '@modules/auth/auth.guard';
import { Session } from '@modules/auth/session.decorator';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { paginateEntityList } from '@utils/pagination';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { ChatService } from './chat.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @SerializeOptions({
    groups: ['chat'],
  })
  @Post()
  async create(
    @Session() session: SessionContainer,
    @Body() createChatDto: CreateChatDto,
  ) {
    return await this.chatService.externalCreate(session, createChatDto);
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get()
  @UseGuards(new AuthGuard())
  async findAll(
    @Session() session: SessionContainer,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const chats = await this.chatService.findAll();
    chats.filter((chat) => chat.userId === session.getUserId());
    return paginateEntityList(chats, +page, +limit);
  }

  @SerializeOptions({
    groups: ['chat'],
  })
  @Get(':id')
  @UseGuards(new AuthGuard())
  async findOne(@Session() session: SessionContainer, @Param('id') id: string) {
    const chat = await this.chatService.findOne(id);
    if (!chat) {
      throw new NotFoundException();
    }
    if (chat.userId !== session.getUserId()) {
      throw new UnauthorizedException();
    }
    return chat;
  }

  @UseGuards(new AuthGuard())
  @Delete(':id')
  async remove(@Session() session: SessionContainer, @Param('id') id: string) {
    const chat = await this.chatService.findOne(id);
    if (chat.userId !== session.getUserId()) {
      throw new UnauthorizedException();
    }
    return await this.chatService.remove(id);
  }
}

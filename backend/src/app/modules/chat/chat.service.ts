import { CreateChatDto } from '@dtos/chat';
import { Chat } from '@entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
  ) {}

  async externalCreate(
    session: SessionContainer,
    createChatDto: CreateChatDto,
  ) {
    let chat = new Chat();
    chat.subject = createChatDto.subject;
    chat.userId = session.getUserId();
    chat = await this.chatRepository.save(chat);
    return chat;
  }

  async internalCreate(chat: Chat) {
    return await this.chatRepository.save(chat);
  }

  async externalUpdate(id: string, updateChatDto: CreateChatDto) {
    let chat = await this.chatRepository.findOneByOrFail({ id });
    chat.subject = updateChatDto.subject;
    chat = await this.chatRepository.save(chat);
    return chat;
  }

  async internalUpdate(chat: Chat) {
    await this.chatRepository.findOneByOrFail({ id: chat.id });
    return await this.chatRepository.save(chat);
  }

  async findAll() {
    return await this.chatRepository.find();
  }

  async findOne(id: string) {
    return await this.chatRepository.findOneBy({ id });
  }

  async remove(id: string) {
    return await this.chatRepository.delete({ id });
  }
}

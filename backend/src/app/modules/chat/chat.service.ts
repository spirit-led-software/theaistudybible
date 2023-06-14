import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
  ) {}

  async externalCreate(createChatDto: CreateChatDto) {
    let chat = new Chat();
    chat.subject = createChatDto.subject;
    chat = await this.chatRepository.save(chat);
    return chat;
  }

  async internalCreate(chat: Chat) {
    return await this.chatRepository.save(chat);
  }

  async externalUpdate(id: number, updateChatDto: CreateChatDto) {
    let chat = await this.chatRepository.findOneByOrFail({ id });
    chat.subject = updateChatDto.subject;
    chat = await this.chatRepository.save(chat);
    return chat;
  }

  async internalUpdate(chat: Chat) {
    return await this.chatRepository.save(chat);
  }

  async findAll() {
    return await this.chatRepository.find();
  }

  async findOne(id: number) {
    return await this.chatRepository.findOneBy({ id });
  }

  async remove(id: number) {
    return await this.chatRepository.delete({ id });
  }
}

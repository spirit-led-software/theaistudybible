import { getVectorStore } from '@configs/milvus';
import { getChatModel } from '@configs/openai';
import { CreateChatMessageDto } from '@dtos/chat-message';
import { Chat, ChatAnswer, ChatMessage, SourceDocument } from '@entities';
import { ChatService } from '@modules/chat/chat.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import {
  AIChatMessage,
  BaseChatMessage,
  ChainValues,
  HumanChatMessage,
} from 'langchain/schema';
import { Repository } from 'typeorm';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatAnswer)
    private readonly chatAnswerRepository: Repository<ChatAnswer>,
    @InjectRepository(SourceDocument)
    private readonly sourceDocumentRepository: Repository<SourceDocument>,
    private readonly chatService: ChatService,
  ) {}

  async getAllMessages() {
    return await this.chatMessageRepository.find();
  }

  async getMessage(id: number) {
    return await this.chatMessageRepository.findOneBy({
      id,
    });
  }

  async message(message: CreateChatMessageDto) {
    this.logger.log(`Recieved chat message: ${JSON.stringify(message)}`);
    let chat: Chat;
    if (!message.chatId) {
      chat = new Chat();
      chat.subject = message.message;
      chat.messages = [];
      chat = await this.chatService.internalCreate(chat);
      message.chatId = chat.id;
    } else {
      chat = await this.chatService.findOne(message.chatId);
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }
    }
    this.logger.debug(`Using chat: '${chat.id}' as history`);
    const vectorStore = await getVectorStore();
    const history: BaseChatMessage[] =
      chat.messages
        .map((q) => {
          return [
            new HumanChatMessage(q.message),
            new AIChatMessage(q.answer.text),
          ];
        })
        .flat() || [];
    this.logger.debug(`Chat history: ${JSON.stringify(history)}`);
    const memory = new BufferMemory({
      chatHistory: new ChatMessageHistory(history),
      memoryKey: 'chat_history',
      inputKey: 'message',
      outputKey: 'answer',
      returnMessages: true,
    });
    const chain = ConversationalRetrievalQAChain.fromLLM(
      getChatModel(),
      vectorStore.asRetriever(10),
      {
        returnSourceDocuments: true,
        memory,
        inputKey: 'message',
        outputKey: 'answer',
      },
    );
    const result = await chain.call({
      message: message.message,
    });
    this.logger.debug(`Result for query: ${JSON.stringify(result)}`);
    const queryEntity = await this.saveMessage(message, result, chat);
    return queryEntity;
  }

  async saveMessage(
    query: CreateChatMessageDto,
    result: ChainValues,
    chat: Chat,
  ) {
    let chatMessageEntity = new ChatMessage();
    chatMessageEntity.message = query.message;
    chatMessageEntity.answer = result.text;
    chatMessageEntity.chat = chat;
    let chatAnswerEntity = new ChatAnswer();
    chatAnswerEntity.text = result.text;
    const sourceDocuments: SourceDocument[] = [];
    for (const sourceDocument of result.sourceDocuments) {
      let sourceDocumentEntity = await this.sourceDocumentRepository.findOne({
        where: { pageContent: sourceDocument.pageContent },
      });
      if (!sourceDocumentEntity) {
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.pageContent = sourceDocument.pageContent;
        sourceDocumentEntity.metadata = JSON.stringify(sourceDocument.metadata);
        sourceDocumentEntity = await this.sourceDocumentRepository.save(
          sourceDocumentEntity,
        );
      }
      sourceDocuments.push(sourceDocumentEntity);
    }
    chatAnswerEntity.sourceDocuments = sourceDocuments;
    chatAnswerEntity = await this.chatAnswerRepository.save(chatAnswerEntity);
    chatMessageEntity.answer = chatAnswerEntity;
    chatMessageEntity = await this.chatMessageRepository.save(
      chatMessageEntity,
    );
    return chatMessageEntity;
  }
}

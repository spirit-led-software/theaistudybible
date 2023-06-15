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
    Logger.log(`Query: ${JSON.stringify(message)}`);
    let chat: Chat;
    if (!message.chatId) {
      chat = new Chat();
      chat.subject = message.query;
      chat.messages = [];
      message.chatId = chat.id;
    } else {
      chat = await this.chatService.findOne(message.chatId);
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }
    }
    Logger.log(`Using chat: '${JSON.stringify(chat)}' as history`);
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
    Logger.log(`Chat history: ${JSON.stringify(history)}`);
    const memory = new BufferMemory({
      chatHistory: new ChatMessageHistory(history),
      memoryKey: 'chat_history',
      inputKey: 'question',
      outputKey: 'answer',
      returnMessages: true,
    });
    const chain = ConversationalRetrievalQAChain.fromLLM(
      getChatModel(),
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
        verbose: true,
        memory,
      },
    );
    const result = await chain.call({
      question: message.query,
    });
    Logger.log(`Result for query: ${JSON.stringify(result)}`);
    const queryEntity = await this.saveMessage(message, result, chat);
    chat.messages.push(queryEntity);
    await this.chatService.internalUpdate(chat);
    return queryEntity;
  }

  async saveMessage(
    query: CreateChatMessageDto,
    result: ChainValues,
    chat: Chat,
  ) {
    let chatMessageEntity = new ChatMessage();
    chatMessageEntity.message = query.query;
    chatMessageEntity.answer = result.text;
    chatMessageEntity.chat = chat;
    let chatAnswerEntity = new ChatAnswer();
    chatAnswerEntity.text = result.text;
    const sourceDocuments = [];
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
        sourceDocuments.push(sourceDocumentEntity);
      }
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

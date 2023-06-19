import { CreateChatMessageDto } from '@dtos/chat-message';
import { Chat, ChatAnswer, ChatMessage, SourceDocument } from '@entities';
import { ChatService } from '@modules/chat/chat.service';
import { LLMService } from '@modules/llm/llm.service';
import { VectorDBService } from '@modules/vector-db/vector-db.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
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
    private readonly vectorDbService: VectorDBService,
    private readonly llmService: LLMService,
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

  async getMessage(id: string) {
    return await this.chatMessageRepository.findOneBy({
      id,
    });
  }

  async saveMessage(message: CreateChatMessageDto) {
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
    let chatMessage = new ChatMessage();
    chatMessage.chat = chat;
    chatMessage.message = message.message;
    chatMessage = await this.chatMessageRepository.save(chatMessage);
    chat.messages
      ? chat.messages.push(chatMessage)
      : (chat.messages = [chatMessage]);
    await this.chatService.internalUpdate(chat);
    return chatMessage;
  }

  async executeMessage(message: ChatMessage, response: Response) {
    const vectorStore = await this.vectorDbService.getVectorStore();
    const history: BaseChatMessage[] =
      message.chat.messages
        ?.map((q) => {
          if (q.message !== message.message) {
            return [
              new HumanChatMessage(q.message),
              new AIChatMessage(q.answer.text),
            ];
          }
          return [];
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
      this.llmService.getChatModel(),
      vectorStore.asRetriever(10),
      {
        returnSourceDocuments: true,
        memory,
        inputKey: 'message',
        outputKey: 'answer',
      },
    );
    chain
      .call(
        {
          message: message.message,
        },
        [
          {
            handleLLMNewToken: (token) => {
              this.sendStreamedResponseData(token, response);
            },
          },
        ],
      )
      .then(async (result) => {
        let sources: string[] = result.sourceDocuments.map(
          (s) => s.metadata.source,
        );
        sources = sources.filter(
          (source, index) => sources.indexOf(source) === index,
        );
        const sourcesString = sources.join('\n');
        this.sendStreamedResponseData(`Sources:\n`, response);
        this.sendStreamedResponseData(sourcesString, response);
        this.logger.debug(`Chat message result: ${JSON.stringify(result)}`);
        await this.saveAnswer(message, result);
        response.end();
      })
      .catch((err) => {
        this.logger.error(`${err.stack}`);
      });
  }

  sendStreamedResponseData(data: string, response: Response) {
    response.write(`data: ${data}\n\n`);
  }

  async saveAnswer(chatMessage: ChatMessage, result: ChainValues) {
    let chatAnswerEntity = new ChatAnswer();
    chatAnswerEntity.text = result.text;
    chatAnswerEntity.sourceDocuments = [];
    chatAnswerEntity = await this.chatAnswerRepository.save(chatAnswerEntity);
    const sourceDocuments: SourceDocument[] = [];
    for (const sourceDocument of result.sourceDocuments) {
      let sourceDocumentEntity = await this.sourceDocumentRepository.findOneBy({
        pageContent: sourceDocument.pageContent,
      });
      if (!sourceDocumentEntity) {
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.pageContent = sourceDocument.pageContent;
        sourceDocumentEntity.metadata = JSON.stringify(sourceDocument.metadata);
      }
      sourceDocuments.push(sourceDocumentEntity);
    }
    chatAnswerEntity.sourceDocuments = sourceDocuments;
    chatMessage.answer = chatAnswerEntity;
    chatMessage = await this.chatMessageRepository.save(chatMessage);
    return chatMessage;
  }
}

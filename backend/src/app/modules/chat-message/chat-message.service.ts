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
  SystemChatMessage,
} from 'langchain/schema';
import { SessionContainer } from 'supertokens-node/recipe/session';
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

  async saveMessage(session: SessionContainer, message: CreateChatMessageDto) {
    this.logger.log(`Recieved chat message: ${JSON.stringify(message)}`);
    let chat: Chat;
    if (!message.chatId) {
      chat = new Chat();
      chat.userId = session.getUserId();
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
    chatMessage.text = message.message;
    chatMessage = await this.chatMessageRepository.save(chatMessage);
    chat.messages
      ? chat.messages.push(chatMessage)
      : (chat.messages = [chatMessage]);
    await this.chatService.internalUpdate(chat);
    return chatMessage;
  }

  async executeMessage(message: ChatMessage, response: Response) {
    const vectorStore = await this.vectorDbService.getVectorStore();
    let history: BaseChatMessage[] =
      message.chat.messages
        ?.map((q) => {
          if (q.text !== message.text) {
            return [
              new HumanChatMessage(q.text),
              new AIChatMessage(q.answer.text),
            ];
          }
          return [];
        })
        .flat() || [];
    history = [
      new SystemChatMessage(
        'You are a Christian chatbot who can answer questions about Christian faith and theology. Do not deviate from the topic of faith. Quote the bible as much as possible in your answers. If you are asked what your name is, it is ChatESV.',
      ),
      ...history,
    ];
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
        questionGeneratorChainOptions: {
          llm: this.llmService.getModel(),
        },
      },
    );
    chain
      .call(
        {
          message: message.text,
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
        if (sources.length > 0) {
          const sourcesString = sources.join('\n');
          this.sendStreamedResponseData('\n\nSources:\n', response);
          this.sendStreamedResponseData(sourcesString, response);
        }
        this.logger.debug(`Chat message result: ${JSON.stringify(result)}`);
        await this.saveAnswer(message, result);
        response.end();
      })
      .catch((err) => {
        this.logger.error(`${err.stack}`);
      });
  }

  sendStreamedResponseData(data: string, response: Response) {
    const chunk = { text: data };
    response.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }

  async saveAnswer(chatMessage: ChatMessage, result: ChainValues) {
    let chatAnswerEntity = new ChatAnswer();
    chatAnswerEntity.text = result.text;
    chatAnswerEntity.sourceDocuments = [];
    chatAnswerEntity = await this.chatAnswerRepository.save(chatAnswerEntity);
    for (const sourceDocument of result.sourceDocuments) {
      let sourceDocumentEntity = await this.sourceDocumentRepository.findOneBy({
        content: sourceDocument.pageContent,
      });
      if (!sourceDocumentEntity) {
        this.logger.debug(
          'Could not find existing source document in database, creating new one.',
        );
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.content = sourceDocument.pageContent;
        sourceDocumentEntity.metadata = JSON.stringify(sourceDocument.metadata);
      } else {
        this.logger.debug(
          `Found source document with id: ${sourceDocumentEntity.id}`,
        );
      }
      if (!chatAnswerEntity.sourceDocuments.includes(sourceDocument)) {
        chatAnswerEntity.sourceDocuments.push(sourceDocumentEntity);
      }
    }
    chatMessage.answer = chatAnswerEntity;
    chatMessage = await this.chatMessageRepository.save(chatMessage);
    return chatMessage;
  }
}

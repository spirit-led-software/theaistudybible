import { getVectorStore } from '@configs/milvus.config';
import { getModel } from '@configs/openai.config';
import { ChatService } from '@modules/chat/chat.service';
import { Chat } from '@modules/chat/entities/chat.entity';
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
import { CreateQueryDto } from './dto/create-query.dto';
import { QueryResult } from './entities/query-result.entity';
import { Query } from './entities/query.entity';
import { SourceDocument } from './entities/source-document.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(QueryResult)
    private readonly queryResultRepository: Repository<QueryResult>,
    @InjectRepository(SourceDocument)
    private readonly sourceDocumentRepository: Repository<SourceDocument>,
    private readonly chatService: ChatService,
  ) {}

  async getAllQueries() {
    return await this.queryRepository.find();
  }

  async getQuery(id: number) {
    return await this.queryRepository.findOneBy({
      id,
    });
  }

  async query(query: CreateQueryDto) {
    Logger.log(`Query: ${JSON.stringify(query)}`);
    let chat: Chat;
    if (!query.chatId) {
      chat = new Chat();
      chat.subject = query.query;
      chat.queries = [];
      query.chatId = chat.id;
    } else {
      chat = await this.chatService.findOne(query.chatId);
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }
    }
    Logger.log(`Using chat: '${JSON.stringify(chat)}' as history`);
    const vectorStore = await getVectorStore();
    const history: BaseChatMessage[] =
      chat.queries
        .map((q) => {
          return [
            new HumanChatMessage(q.query),
            new AIChatMessage(q.result.text),
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
      getModel(),
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
        verbose: true,
        memory,
      },
    );
    const result = await chain.call({
      question: query.query,
    });
    Logger.log(`Result for query: ${JSON.stringify(result)}`);
    const queryEntity = await this.saveQuery(query, result, chat);
    chat.queries.push(queryEntity);
    await this.chatService.internalUpdate(chat);
    return queryEntity;
  }

  async saveQuery(query: CreateQueryDto, result: ChainValues, chat: Chat) {
    let queryEntity = new Query();
    queryEntity.query = query.query;
    queryEntity.result = result.text;
    queryEntity.chat = chat;
    let queryResultEntity = new QueryResult();
    queryResultEntity.text = result.text;
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
    queryResultEntity.sourceDocuments = sourceDocuments;
    queryResultEntity = await this.queryResultRepository.save(
      queryResultEntity,
    );
    queryEntity.result = queryResultEntity;
    queryEntity = await this.queryRepository.save(queryEntity);
    return queryEntity;
  }
}

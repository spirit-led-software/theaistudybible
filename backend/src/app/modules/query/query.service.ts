import { createEmbeddings, createModel } from '@configs/openai.config';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RetrievalQAChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { Milvus } from 'langchain/vectorstores/milvus';
import { Repository } from 'typeorm';
import { config as milvusConfig } from '../../configs/milvus.config';
import { CreateQueryDto } from './dto/create-query.dto';
import { QueryResult } from './entities/query-result.entity';
import { Query } from './entities/query.entity';
import { SourceDocument } from './entities/source-document.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(SourceDocument)
    private readonly sourceDocumentRepository: Repository<SourceDocument>,
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
    const vectorStore = await Milvus.fromExistingCollection(
      createEmbeddings(),
      {
        url: milvusConfig.url,
        collectionName: milvusConfig.collectionName,
        username: milvusConfig.user,
        password: milvusConfig.password,
      },
    );

    const chain = RetrievalQAChain.fromLLM(
      createModel(),
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
      },
    );
    const result = await chain.call({
      query: query.query,
      history: query.history,
    });
    Logger.log(`Result for query: ${JSON.stringify(result)}`);
    return await this.saveQuery(query, result);
  }

  async saveQuery(query: CreateQueryDto, result: ChainValues) {
    const queryEntity = new Query();
    queryEntity.query = query.query;
    queryEntity.result = result.text;
    queryEntity.history = query.history;
    const queryResultEntity = new QueryResult();
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
        sourceDocuments.push(sourceDocumentEntity);
      }
    }
    queryResultEntity.sourceDocuments = sourceDocuments;
    queryEntity.result = queryResultEntity;
    return await this.queryRepository.save(queryEntity);
  }
}

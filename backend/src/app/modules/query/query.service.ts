import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VectorDBQAChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { Milvus } from 'langchain/vectorstores/milvus';
import { Repository } from 'typeorm';
import { config as milvusConfig } from '../../configs/milvus.config';
import { createEmbeddings, createModel } from '../../utils/openai';
import { QueryRequest } from './dto/query-request.dto';
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

  async query(query: QueryRequest) {
    const embeddings = createEmbeddings();
    const store = await Milvus.fromExistingCollection(embeddings, {
      url: milvusConfig.url,
      collectionName: milvusConfig.collectionName,
      username: milvusConfig.user,
      password: milvusConfig.password,
    });
    const model = createModel();
    const chain = VectorDBQAChain.fromLLM(model, store, {
      returnSourceDocuments: true,
    });
    const result = await chain.call({
      query: query.query,
      history: query.history,
    });
    Logger.log(`Result for query: ${JSON.stringify(result)}`);
    return await this.saveQuery(query, result);
  }

  async saveQuery(query: QueryRequest, result: ChainValues) {
    const queryEntity = new Query();
    queryEntity.query = query.query;
    queryEntity.result = result.text;
    queryEntity.history = query.history;
    const queryResultEntity = new QueryResult();
    queryResultEntity.text = result.text;
    const sourceDocuments = [];
    await result.sourceDocuments.forEach(async (sourceDocument) => {
      let sourceDocumentEntity = await this.sourceDocumentRepository.findOne({
        where: { pageContent: sourceDocument.pageContent },
      });
      if (!sourceDocumentEntity) {
        sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.pageContent = sourceDocument.pageContent;
        sourceDocumentEntity.source = sourceDocument.metadata.source;
        sourceDocuments.push(sourceDocumentEntity);
      }
    });
    queryResultEntity.sourceDocuments = sourceDocuments;
    queryEntity.result = queryResultEntity;
    return await this.queryRepository.save(queryEntity);
  }
}

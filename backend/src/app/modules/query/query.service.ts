import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VectorDBQAChain } from 'langchain/chains';
import { ChainValues } from 'langchain/dist/schema';
import { Milvus } from 'langchain/vectorstores/milvus';
import { Repository } from 'typeorm';
import { config as milvusConfig } from '../../config/milvus.config';
import { createModel } from '../../utils/openai';
import { createEmbeddings } from '../../utils/tensorflow';
import { QueryRequest } from './dto/query-request.dto';
import { QueryResult } from './entities/query-result.entity';
import { Query } from './entities/query.entity';
import { SourceDocumentMetadata } from './entities/source-document-metadata.entity';
import { SourceDocument } from './entities/source-document.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
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
    return await this.saveQuery(query, result);
  }

  async saveQuery(query: QueryRequest, result: ChainValues) {
    let queryEntity = new Query();
    queryEntity.query = query.query;
    queryEntity.result = result.text;
    queryEntity.history = query.history;
    const queryResultEntity = new QueryResult();
    queryResultEntity.text = result.text;
    queryResultEntity.sourceDocuments = result.sourceDocuments.map(
      (sourceDocument) => {
        const sourceDocumentEntity = new SourceDocument();
        sourceDocumentEntity.pageContent = sourceDocument.pageContent;
        const metadata = new SourceDocumentMetadata();
        metadata.source = sourceDocument.metadata.source;
        sourceDocumentEntity.metadata = metadata;
        return sourceDocumentEntity;
      },
    );
    queryEntity.result = queryResultEntity;
    queryEntity = await this.queryRepository.save(queryEntity);
    return queryEntity;
  }
}

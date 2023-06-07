import { Injectable } from '@nestjs/common';
import { VectorDBQAChain } from 'langchain/chains';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import { createModel } from '../../utils/openai';
import { createEmbeddings } from '../../utils/tensorflow';
import { createClient } from '../../utils/weaviate';
import { QueryRequest } from './dto/query-request.dto';

@Injectable()
export class QueryService {
  async query(query: QueryRequest) {
    const embeddings = createEmbeddings();
    const client = createClient();
    const store = await WeaviateStore.fromExistingIndex(embeddings, {
      client,
      indexName: 'Docs',
    });

    const model = createModel();

    const chain = VectorDBQAChain.fromLLM(model, store, {
      returnSourceDocuments: true,
    });

    const result = await chain.call({
      query: query.query,
    });

    return { answer: result, sources: result.sourceDocuments };
  }
}

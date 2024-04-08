import envConfig from '@revelationsai/core/configs/environment';
import config from '@revelationsai/core/configs/revelationsai';
import { UpstashVectorStore } from '@revelationsai/core/langchain/vectorstores/upstash';
import { Index } from '@upstash/vector';
import { Config } from 'sst/node/config';
import { getEmbeddingsModel } from './llm';

export async function getDocumentVectorStore(options?: {
  verbose?: boolean;
  filter?: string;
  write?: boolean;
}) {
  const { verbose, filter, write = false } = options ?? {};
  const vectorStore = await UpstashVectorStore.fromExistingIndex(
    getEmbeddingsModel({
      model: config.llm.embeddings.model,
      inputType: write ? 'search_document' : 'search_query',
      verbose: envConfig.isLocal ? true : verbose
    }),
    {
      index: new Index({
        url: Config.UPSTASH_VECTOR_REST_URL,
        token: Config.UPSTASH_VECTOR_REST_TOKEN
      }),
      filter
    }
  );
  return vectorStore;
}

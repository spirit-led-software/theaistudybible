import { UpstashVectorStore } from '@revelationsai/langchain/vectorstores/upstash';
import { Index } from '@upstash/vector';
import { getEmbeddingsModel } from './llm';

export async function getDocumentVectorStore(options?: {
  verbose?: boolean;
  filter?: string;
  write?: boolean;
}) {
  const { verbose, filter, write = false } = options ?? {};
  const vectorStore = await UpstashVectorStore.fromExistingIndex(
    getEmbeddingsModel({
      inputType: write ? 'search_document' : 'search_query',
      verbose: process.env.IS_LOCAL === 'true' ? true : verbose
    }),
    {
      index: new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN
      }),
      filter
    }
  );
  return vectorStore;
}

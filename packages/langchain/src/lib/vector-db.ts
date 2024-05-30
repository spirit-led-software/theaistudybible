import { UpstashVectorStore } from '@theaistudybible/langchain/vectorstores/upstash';
import { Index } from '@upstash/vector';
import { Resource } from 'sst';
import { getEmbeddingsModel } from './llm';

export const vectorIndex = new Index({
  url: Resource.UpstashVector.restUrl,
  token: Resource.UpstashVector.restToken
});

export async function getDocumentVectorStore(options?: {
  verbose?: boolean;
  filter?: string;
  write?: boolean;
}) {
  const { verbose, filter, write = false } = options ?? {};
  return await UpstashVectorStore.fromExistingIndex(
    getEmbeddingsModel({
      inputType: write ? 'search_document' : 'search_query',
      verbose: process.env.SST_LIVE === 'true' ? true : verbose
    }),
    {
      index: vectorIndex,
      filter
    }
  );
}

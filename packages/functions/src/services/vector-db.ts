import { envConfig, vectorDBConfig } from '@core/configs';
import { NeonVectorStore } from '@core/langchain/vectorstores/neon';
import type { Metadata } from '@core/types/metadata';
import { getEmbeddingsModel } from './llm';

export async function getDocumentVectorStore(options?: {
  verbose?: boolean;
  filters?: (Metadata | string)[];
  write?: boolean;
}) {
  const { verbose, filters /* write = false */ } = options ?? {};
  const vectorStore = await NeonVectorStore.fromConnectionString(
    getEmbeddingsModel({
      model: 'amazon.titan-embed-text-v1',
      // inputType: write ? 'search_document' : 'search_query',
      verbose: envConfig.isLocal ? true : verbose
    }),
    {
      tableName: `documents_${getEmbeddingsModel().model.replaceAll(/[^a-zA-Z0-9]/g, '_')}`,
      connectionOptions: {
        readWriteUrl: vectorDBConfig.writeUrl,
        readOnlyUrl: vectorDBConfig.readUrl
      },
      dimensions: 1536, //! Must match embedding model (above) output size.
      distance: 'cosine',
      hnswIdxM: 16,
      hnswIdxEfConstruction: 64,
      hnswIdxEfSearch: 100,
      verbose: envConfig.isLocal ? true : verbose,
      filters
    }
  );
  return vectorStore;
}

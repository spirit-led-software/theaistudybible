import envConfig from '@revelationsai/core/configs/env';
import { users } from '@revelationsai/core/database/schema';
import { NeonVectorStore } from '@revelationsai/core/langchain/vectorstores/neon';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { Config } from 'sst/node/config';
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
        readWriteUrl: Config.VECTOR_DB_READWRITE_URL,
        readOnlyUrl: Config.VECTOR_DB_READONLY_URL
      },
      dimensions: 1536, //! Must match embedding model (above) output size.
      distance: 'cosine',
      hnswIdxM: 16,
      hnswIdxEfConstruction: 64,
      hnswIdxEfSearch: 40,
      verbose: envConfig.isLocal ? true : verbose,
      filters
    }
  );
  return vectorStore;
}

export const getPartialHnswIndexInfos = () => {
  const infos: {
    name: string;
    filters: (Metadata | string)[];
  }[] = [];

  for (const translation of users.translation.enumValues) {
    infos.push(
      {
        name: `${translation.toLowerCase()}_bible`,
        filters: [
          {
            category: 'bible',
            translation
          }
        ]
      },
      {
        name: `${translation.toLowerCase()}_bible_qa`,
        filters: [
          {
            category: 'bible',
            translation
          },
          {
            category: 'commentary'
          }
        ]
      }
    );
  }

  infos.push(
    {
      name: 'theology_qa',
      filters: [
        {
          category: 'theology'
        },
        {
          category: 'commentary'
        }
      ]
    },
    {
      name: 'sermon_qa',
      filters: [
        {
          category: 'sermons'
        }
      ]
    }
  );

  return infos;
};

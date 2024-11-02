import type { Prettify } from '@/core/types/util';
import { Index } from '@upstash/vector';
import { Resource } from 'sst';
import type { Embeddings } from './embeddings';
import { embeddings } from './embeddings';
import type { Document, DocumentWithScore } from './types/document';

export type AddDocumentsOptions = {
  namespace?: string;
  overwrite?: boolean;
};
const addDocumentsDefaults = {
  namespace: undefined,
  overwrite: false,
} as const satisfies AddDocumentsOptions;

export type SearchDocumentsOptions = {
  filter?: Prettify<VectorStore['FilterType']>;
  scoreThreshold?: number;
  withEmbedding?: boolean;
  withMetadata?: boolean;
  limit?: number;
  namespace?: string;
};
const searchDocumentsDefaults = {
  withEmbedding: false,
  withMetadata: true,
  filter: undefined,
  limit: 10,
} as const satisfies SearchDocumentsOptions;

export type GetDocumentsOptions = {
  withEmbedding?: boolean;
  withMetadata?: boolean;
};
const getDocumentsDefaults: GetDocumentsOptions = {
  withEmbedding: false,
  withMetadata: true,
};

export class VectorStore {
  declare FilterType: string;
  private readonly embeddings: Embeddings;
  private readonly client: Index;

  public static MAX_UPSERT_BATCH_SIZE = 1000;
  public static MAX_DELETE_BATCH_SIZE = 1000;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
    this.client = new Index({
      url: Resource.UpstashVectorIndex.restUrl,
      token: Resource.UpstashVectorIndex.restToken,
    });
  }

  async addDocuments(
    docs: Document[],
    options: AddDocumentsOptions = addDocumentsDefaults,
  ): Promise<string[]> {
    const docsWithEmbeddings = await this.embeddings.embedDocuments(docs);
    const batches = Math.ceil(docsWithEmbeddings.length / VectorStore.MAX_UPSERT_BATCH_SIZE);
    for (let i = 0; i < batches; i++) {
      let batch = docsWithEmbeddings.slice(
        i * VectorStore.MAX_UPSERT_BATCH_SIZE,
        (i + 1) * VectorStore.MAX_UPSERT_BATCH_SIZE,
      );

      let existingDocs: Document[] = [];
      if (options.overwrite === false) {
        existingDocs = await this.client
          .fetch(
            batch.map((d) => d.id),
            {
              includeMetadata: false,
              includeVectors: false,
              namespace: options.namespace,
            },
          )
          .then((r) => r.filter((d) => d !== null) as Document[]);
        batch = batch.filter((d) => !existingDocs.some((e) => e.id === d.id));
      }

      await this.client.upsert(
        batch.map((d) => ({
          id: d.id,
          vector: d.embedding,
          metadata: {
            content: d.content,
            ...d.metadata,
          },
        })),
        { namespace: options.namespace },
      );
    }
    return docsWithEmbeddings.map((d) => d.id);
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    const batches = Math.ceil(ids.length / VectorStore.MAX_DELETE_BATCH_SIZE);
    for (let i = 0; i < batches; i++) {
      const batch = ids.slice(
        i * VectorStore.MAX_DELETE_BATCH_SIZE,
        (i + 1) * VectorStore.MAX_DELETE_BATCH_SIZE,
      );
      await this.client.delete(batch);
    }
  }

  async searchDocuments(
    query: string,
    options: SearchDocumentsOptions = searchDocumentsDefaults,
  ): Promise<DocumentWithScore[]> {
    const result = await this.client.query(
      {
        vector: await this.embeddings.embedQuery(query),
        topK: options.limit ?? searchDocumentsDefaults.limit ?? 20,
        filter: options.filter ?? searchDocumentsDefaults.filter,
        includeMetadata: options.withMetadata ?? searchDocumentsDefaults.withMetadata,
        includeVectors: options.withEmbedding ?? searchDocumentsDefaults.withEmbedding,
      },
      { namespace: options.namespace },
    );

    return result.map((r) => {
      const { content, ...metadata } = r.metadata ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.vector,
        metadata,
        score: r.score,
      };
    });
  }

  async getDocuments(
    ids: string[],
    options: GetDocumentsOptions = getDocumentsDefaults,
  ): Promise<Document[]> {
    const result = await this.client.fetch(ids, {
      includeMetadata: options.withMetadata ?? getDocumentsDefaults.withMetadata,
      includeVectors: options.withEmbedding ?? getDocumentsDefaults.withEmbedding,
    });
    return result
      .filter((r) => r !== null)
      .map((r) => {
        const { content, ...metadata } = r.metadata ?? {};
        return {
          id: r.id.toString(),
          content: content as string,
          embedding: r.vector as number[],
          metadata,
        };
      });
  }
}

export const vectorStore = new VectorStore(embeddings);

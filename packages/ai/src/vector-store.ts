import { db } from '@/core/database';
import { sourceDocuments } from '@/core/database/schema';
import type { Prettify } from '@/core/types/util';
import { Index } from '@upstash/vector';
import { inArray } from 'drizzle-orm';
import { Resource } from 'sst';
import type { Embeddings } from './embeddings';
import { embeddings } from './embeddings';
import { Reranker } from './reranker';
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
  rerank?: boolean;
};
const searchDocumentsDefaults = {
  withEmbedding: false,
  withMetadata: true,
  filter: undefined,
  limit: 10,
  rerank: true,
} as const satisfies SearchDocumentsOptions;

export type GetDocumentsOptions = {
  withEmbedding?: boolean;
  withMetadata?: boolean;
};
const getDocumentsDefaults = {
  withEmbedding: false,
  withMetadata: true,
} as const satisfies GetDocumentsOptions;

export class VectorStore {
  declare FilterType: string;
  private readonly client: Index;
  private readonly reranker: Reranker;

  public static MAX_UPSERT_BATCH_SIZE = 1000;
  public static MAX_DELETE_BATCH_SIZE = 1000;

  constructor(private readonly embeddings: Embeddings) {
    this.client = new Index({
      url: Resource.UpstashVectorIndex.restUrl,
      token: Resource.UpstashVectorIndex.restToken,
    });
    this.reranker = new Reranker();
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

      await Promise.all([
        this.client.upsert(
          batch.map((d) => ({
            id: d.id,
            vector: d.embedding,
            metadata: {
              content: d.content,
              ...d.metadata,
            },
          })),
          { namespace: options.namespace },
        ),
        db.insert(sourceDocuments).values(
          batch.map(
            (d) =>
              ({
                id: d.id,
              }) satisfies typeof sourceDocuments.$inferInsert,
          ),
        ),
      ]);
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
      await Promise.all([
        this.client.delete(batch),
        db.delete(sourceDocuments).where(inArray(sourceDocuments.id, batch)),
      ]);
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

    const docs = result.map((r) => {
      const { content, ...metadata } = r.metadata ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.vector,
        metadata,
        score: r.score,
      };
    });

    if (options.rerank) {
      return await this.reranker.rerankDocuments(query, docs);
    }

    return docs;
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

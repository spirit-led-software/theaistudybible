import { db } from '@/core/database';
import { sourceDocuments } from '@/core/database/schema';
import type { SourceDocument } from '@/schemas/source-documents/types';
import { type SQL, inArray, sql } from 'drizzle-orm';
import type { Embeddings } from './embeddings';
import { embeddings } from './embeddings';
import type { Document, DocumentWithScore } from './types/document';

export type AddDocumentsOptions = {
  overwrite?: boolean;
};
const addDocumentsDefaults = {
  overwrite: false,
} as const satisfies AddDocumentsOptions;

export type SearchDocumentsOptions = {
  filter?: SQL<unknown>;
  scoreThreshold?: number;
  withEmbedding?: boolean;
  withMetadata?: boolean;
  limit?: number;
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
const getDocumentsDefaults = {
  withEmbedding: false,
  withMetadata: true,
} as const satisfies GetDocumentsOptions;

export class VectorStore {
  public static MAX_UPSERT_BATCH_SIZE = 100;
  public static MAX_DELETE_BATCH_SIZE = 100;

  constructor(
    private readonly client: typeof db,
    private readonly embeddings: Embeddings,
  ) {}

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

      let existingDocs: SourceDocument[] = [];
      if (options.overwrite === false) {
        existingDocs = await this.client.query.sourceDocuments.findMany({
          where: (sourceDocuments, { inArray }) =>
            inArray(
              sourceDocuments.id,
              batch.map((d) => d.id),
            ),
        });
        batch = batch.filter((d) => !existingDocs.some((e) => e.id === d.id));
      }

      await this.client.insert(sourceDocuments).values(
        batch.map(
          (d) =>
            ({
              id: d.id,
              embedding: d.embedding,
              metadata: {
                content: d.content,
                ...d.metadata,
              },
            }) satisfies typeof sourceDocuments.$inferInsert,
        ),
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
      await this.client.delete(sourceDocuments).where(inArray(sourceDocuments.id, batch));
    }
  }

  async searchDocuments(
    query: string,
    options: SearchDocumentsOptions = searchDocumentsDefaults,
  ): Promise<DocumentWithScore[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const vectorQuery = sql<number>`vector_distance_cos(${sourceDocuments.embedding}, vector32(${JSON.stringify(queryEmbedding)}))`;
    const result = (await this.client.query.sourceDocuments.findMany({
      columns: {
        id: true,
        createdAt: true,
        updatedAt: true,
        embedding: options.withEmbedding ?? searchDocumentsDefaults.withEmbedding,
        metadata: options.withMetadata ?? searchDocumentsDefaults.withMetadata,
      },
      where: options.filter,
      orderBy: vectorQuery,
      limit: options.limit ?? searchDocumentsDefaults.limit,
      extras: {
        score: vectorQuery.as('score'),
      },
    })) as (Pick<SourceDocument, 'id' | 'createdAt' | 'updatedAt'> &
      Partial<SourceDocument> & {
        score: number;
      })[];

    return result.map((r) => {
      const { content, ...metadata } = r.metadata ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.embedding,
        metadata,
        score: r.score,
      };
    });
  }

  async getDocuments(
    ids: string[],
    options: GetDocumentsOptions = getDocumentsDefaults,
  ): Promise<Document[]> {
    const result = (await this.client.query.sourceDocuments.findMany({
      where: inArray(sourceDocuments.id, ids),
      columns: {
        id: true,
        createdAt: true,
        updatedAt: true,
        embedding: options.withEmbedding ?? getDocumentsDefaults.withEmbedding,
        metadata: options.withMetadata ?? getDocumentsDefaults.withMetadata,
      },
    })) as (Pick<SourceDocument, 'id' | 'createdAt' | 'updatedAt'> & Partial<SourceDocument>)[];
    return result
      .filter((r) => r !== null)
      .map((r) => {
        const { content, ...metadata } = r.metadata ?? {};
        return {
          id: r.id.toString(),
          content: content as string,
          embedding: r.embedding ?? undefined,
          metadata,
        };
      });
  }
}

export const vectorStore = new VectorStore(db, embeddings);

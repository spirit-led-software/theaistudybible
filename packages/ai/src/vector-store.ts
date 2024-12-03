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
  filter?: VectorStore['FilterType'];
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
const getDocumentsDefaults: GetDocumentsOptions = {
  withEmbedding: false,
  withMetadata: true,
};

export class VectorStore {
  declare FilterType: SQL<unknown>;
  private readonly embeddings: Embeddings;

  public static MAX_UPSERT_BATCH_SIZE = 1000;
  public static MAX_DELETE_BATCH_SIZE = 1000;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
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

      let existingDocs: SourceDocument[] = [];
      if (options.overwrite === false) {
        existingDocs = await db.query.sourceDocuments.findMany({
          where: (sourceDocuments, { inArray }) =>
            inArray(
              sourceDocuments.id,
              batch.map((d) => d.id),
            ),
        });
        batch = batch.filter((d) => !existingDocs.some((e) => e.id === d.id));
      }

      await db.insert(sourceDocuments).values(
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
      await db.delete(sourceDocuments).where(inArray(sourceDocuments.id, batch));
    }
  }

  async searchDocuments(
    query: string,
    options: SearchDocumentsOptions = searchDocumentsDefaults,
  ): Promise<DocumentWithScore[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const vectorQuery = sql<number>`vector_distance_cosine(${sourceDocuments.embedding}, vector32(${JSON.stringify(queryEmbedding)}))`;
    const result = (await db.query.sourceDocuments.findMany({
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
    const result = (await db.query.sourceDocuments.findMany({
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

export const vectorStore = new VectorStore(embeddings);

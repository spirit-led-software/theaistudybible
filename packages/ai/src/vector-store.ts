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
    for (let i = 0; i < docsWithEmbeddings.length; i += VectorStore.MAX_UPSERT_BATCH_SIZE) {
      let batch = docsWithEmbeddings.slice(i, i + VectorStore.MAX_UPSERT_BATCH_SIZE);

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
    for (let i = 0; i < ids.length; i += VectorStore.MAX_DELETE_BATCH_SIZE) {
      const batch = ids.slice(i, i + VectorStore.MAX_DELETE_BATCH_SIZE);
      await this.client.delete(sourceDocuments).where(inArray(sourceDocuments.id, batch));
    }
  }

  async searchDocuments(
    query: string,
    options: SearchDocumentsOptions = searchDocumentsDefaults,
  ): Promise<DocumentWithScore[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // ! Must use embedding index name from schema
    const from = sql`vector_top_k('source_documents_embedding_idx',${JSON.stringify(queryEmbedding)},${options.limit})`;
    const result = await db
      .select({
        ...{
          id: sourceDocuments.id,
          createdAt: sourceDocuments.createdAt,
          updatedAt: sourceDocuments.updatedAt,
          score: sql<number>`vector_distance_cos(${sourceDocuments.embedding}, vector32(${JSON.stringify(queryEmbedding)}))`,
        },
        ...(options.withEmbedding ? { embedding: sourceDocuments.embedding } : {}),
        ...(options.withMetadata ? { metadata: sourceDocuments.metadata } : {}),
      })
      .from(from)
      .innerJoin(sourceDocuments, sql`${sourceDocuments.id} = id`)
      .orderBy(sql`score`);

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

import { db } from '@/core/database';
import { sourceDocuments } from '@/core/database/schema';
import { vectorDistance, vectorTopK } from '@/core/database/utils/vector';
import type { SourceDocument } from '@/schemas/source-documents/types';
import { type SQL, asc, getTableColumns, inArray, sql } from 'drizzle-orm';
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
    const limit = options.limit ?? searchDocumentsDefaults.limit;
    const queryEmbedding = await this.embeddings.embedQuery(query);
    const result = await db
      .select({
        ...getTableColumns(sourceDocuments),
        ...(options.withEmbedding && { embedding: sourceDocuments.embedding }),
        ...(options.withMetadata && { metadata: sourceDocuments.metadata }),
        distance: vectorDistance(sourceDocuments.embedding, queryEmbedding).as('distance'),
      })
      .from(sql`${vectorTopK(queryEmbedding, limit)} as top_k`)
      .innerJoin(sourceDocuments, sql`${sourceDocuments.id} = top_k.id`)
      .where(options.filter)
      .orderBy(asc(sql`distance`))
      .limit(limit);

    return result.map((r) => {
      const { content, ...metadata } = r.metadata ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.embedding ?? undefined,
        metadata,
        score: r.distance,
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
        ...Object.keys(getTableColumns(sourceDocuments)).reduce(
          (acc, key) => {
            acc[key] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
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

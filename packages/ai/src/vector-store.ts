import { QdrantClient } from '@qdrant/js-client-rest';
import { Prettify } from '@theaistudybible/core/src/types/util';
import { Embeddings, embeddings, embeddingsModelInfo } from './embeddings';
import { Document, DocumentWithScore } from './types/document';

export type SearchDocumentsOptions = {
  filter?: Prettify<VectorStore['FilterType']>;
  scoreThreshold?: number;
  withEmbedding?: boolean;
  withMetadata?: boolean;
  limit?: number;
  offset?: number;
};
const searchDocumentsDefaults: SearchDocumentsOptions = {
  withEmbedding: false,
  withMetadata: true,
  limit: 10,
  offset: 0
};

export type GetDocumentsOptions = {
  withEmbedding?: boolean;
  withMetadata?: boolean;
};
const getDocumentsDefaults: GetDocumentsOptions = {
  withEmbedding: false,
  withMetadata: true
};

export type FilterDocumentsOptions = {
  withEmbedding?: boolean;
  withMetadata?: boolean;
  limit?: number;
  offset?: number;
};
const filterDocumentsDefaults: FilterDocumentsOptions = {
  withEmbedding: false,
  withMetadata: true,
  limit: 10,
  offset: 0
};

export class VectorStore {
  declare FilterType: Parameters<QdrantClient['search']>[1]['filter'];
  public static readonly DOCUMENTS_COLLECTION = 'documents';
  private readonly embeddings: Embeddings;
  private readonly client: QdrantClient;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
  }

  async initialize(): Promise<void> {
    const getCollectionsResult = await this.client.getCollections();
    if (
      !getCollectionsResult.collections.some((c) => c.name === VectorStore.DOCUMENTS_COLLECTION)
    ) {
      await this.client.createCollection(VectorStore.DOCUMENTS_COLLECTION, {
        vectors: {
          distance: 'Cosine',
          size: embeddingsModelInfo.dimensions
        }
      });
    }
  }

  async addDocuments(docs: Document[]): Promise<string[]> {
    const docsWithEmbeddings = await this.embeddings.embedDocuments(docs);
    try {
      await this.client.upsert(VectorStore.DOCUMENTS_COLLECTION, {
        wait: true,
        batch: {
          ids: docsWithEmbeddings.map((d) => d.id),
          vectors: docsWithEmbeddings.map((d) => d.embedding),
          payloads: docsWithEmbeddings.map((d) => ({
            content: d.content,
            ...d.metadata
          }))
        }
      });
      return docsWithEmbeddings.map((d) => d.id);
    } catch (e) {
      console.error(JSON.stringify(e));
      throw e;
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.client.delete(VectorStore.DOCUMENTS_COLLECTION, {
        wait: true,
        points: ids
      });
    } catch (e) {
      console.error(JSON.stringify(e));
      throw e;
    }
  }

  async searchDocuments(
    query: string,
    options: SearchDocumentsOptions = searchDocumentsDefaults
  ): Promise<DocumentWithScore[]> {
    const result = await this.client.search(VectorStore.DOCUMENTS_COLLECTION, {
      vector: await this.embeddings.embedQuery(query),
      filter: options.filter ?? searchDocumentsDefaults.filter,
      score_threshold: options.scoreThreshold ?? searchDocumentsDefaults.scoreThreshold,
      limit: options.limit ?? searchDocumentsDefaults.limit,
      offset: options.offset ?? searchDocumentsDefaults.offset,
      with_payload: options.withMetadata ?? searchDocumentsDefaults.withMetadata,
      with_vector: options.withEmbedding ?? searchDocumentsDefaults.withEmbedding
    });

    return result.map((r) => {
      const { content, ...metadata } = r.payload ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.vector as number[] | undefined,
        metadata,
        score: r.score
      };
    });
  }

  async getDocuments(
    ids: string[],
    options: GetDocumentsOptions = getDocumentsDefaults
  ): Promise<Document[]> {
    const result = await this.client.api('points').getPoints({
      collection_name: VectorStore.DOCUMENTS_COLLECTION,
      ids,
      with_payload: options.withMetadata ?? getDocumentsDefaults.withMetadata,
      with_vector: options.withEmbedding ?? getDocumentsDefaults.withEmbedding
    });
    if (result.status !== 200) {
      throw new Error(`Failed to get documents. ${result.status}: ${result.statusText}`);
    }
    return result.data.result!.map((r) => {
      const { content, ...metadata } = r.payload ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.vector as number[],
        metadata
      };
    });
  }

  async filterDocuments(
    filter: VectorStore['FilterType'],
    options: FilterDocumentsOptions = filterDocumentsDefaults
  ): Promise<Document[]> {
    const result = await this.client.discoverPoints(VectorStore.DOCUMENTS_COLLECTION, {
      limit: options.limit ?? filterDocumentsDefaults.limit!,
      filter,
      offset: options.offset ?? filterDocumentsDefaults.offset,
      with_payload: options.withMetadata ?? filterDocumentsDefaults.withMetadata,
      with_vector: options.withEmbedding ?? filterDocumentsDefaults.withEmbedding
    });

    return result.map((r) => {
      const { content, ...metadata } = r.payload ?? {};
      return {
        id: r.id.toString(),
        content: content as string,
        embedding: r.vector as number[],
        metadata
      };
    });
  }
}

export const vectorStore = new VectorStore(embeddings);

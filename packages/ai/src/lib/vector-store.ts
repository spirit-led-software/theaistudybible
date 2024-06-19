import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from '../types/document';
import { Embeddings, embeddings, embeddingsModelInfo } from './embeddings';

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

  async initialize() {
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

  async addDocuments(docs: Document[]) {
    const docsWithEmbeddings = await this.embeddings.embedDocuments(docs);
    await this.client.upsert(VectorStore.DOCUMENTS_COLLECTION, {
      wait: true,
      points: docsWithEmbeddings.map((d) => ({
        id: d.id,
        vector: d.embedding,
        payload: d.metadata
      }))
    });
  }

  async deleteDocuments(ids: string[]) {
    await this.client.delete(VectorStore.DOCUMENTS_COLLECTION, {
      wait: true,
      points: ids
    });
  }

  async searchDocuments(
    query: string,
    {
      filter,
      limit = 10,
      offset = 0
    }: {
      filter?: VectorStore['FilterType'];
      limit?: number;
      offset?: number;
    } = {
      limit: 10,
      offset: 0
    }
  ) {
    return await this.client.search(VectorStore.DOCUMENTS_COLLECTION, {
      vector: await this.embeddings.embedQuery(query),
      limit,
      filter,
      offset
    });
  }

  async getDocuments(ids: string[]) {
    const result = await this.client.api('points').getPoints({
      collection_name: VectorStore.DOCUMENTS_COLLECTION,
      ids
    });
    if (result.status !== 200) {
      throw new Error(`Failed to get documents. ${result.status}: ${result.statusText}`);
    }
    return result.data.result;
  }

  async filterDocuments(
    filter: VectorStore['FilterType'],
    { limit = 10, offset = 0 }: { limit?: number; offset?: number } = { limit: 10, offset: 0 }
  ) {
    return await this.client.discoverPoints(VectorStore.DOCUMENTS_COLLECTION, {
      limit,
      filter,
      offset
    });
  }
}

export const vectorDatabase = new VectorStore(embeddings);

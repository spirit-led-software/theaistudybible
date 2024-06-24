import { EmbeddingModel } from 'ai';
import { registry } from './provider-registry';
import { Document, DocumentWithEmbedding } from './types/document';

export type EmbeddingModelInfo = {
  id: string;
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
};

export const embeddingsModelInfo: EmbeddingModelInfo =
  process.env.NODE_ENV === 'production'
    ? {
        id: 'openai:text-embedding-3-large',
        dimensions: 3072,
        chunkSize: 1024,
        chunkOverlap: 256
      }
    : {
        id: 'openai:text-embedding-ada-002',
        dimensions: 1536,
        chunkSize: 1024,
        chunkOverlap: 256
      };

export class Embeddings {
  private readonly embeddings: EmbeddingModel<string>;

  constructor() {
    this.embeddings = registry.textEmbeddingModel(embeddingsModelInfo.id);
  }

  async embedQuery(query: string) {
    const response = await this.embeddings.doEmbed({
      values: [query]
    });

    return response.embeddings[0];
  }

  async embedDocuments(docs: Document[]) {
    let result: DocumentWithEmbedding[] = [];

    const chunkSize = 25;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const embeddingResponse = await this.embeddings.doEmbed({
        values: chunk.map((d) => d.content)
      });

      result = result.concat(
        embeddingResponse.embeddings.map((d, index) => ({
          ...chunk[index],
          embedding: d
        }))
      );
    }
    return result;
  }
}

export const embeddings = new Embeddings();

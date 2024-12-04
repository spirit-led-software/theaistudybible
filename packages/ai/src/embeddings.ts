import type { EmbeddingModel } from 'ai';
import { embeddingModel } from './models';
import { registry } from './provider-registry';
import type { Document, DocumentWithEmbedding } from './types/document';

export class Embeddings {
  private readonly embeddings: EmbeddingModel<string>;

  constructor() {
    this.embeddings = registry.textEmbeddingModel(`${embeddingModel.host}:${embeddingModel.id}`);
  }

  async embedQuery(query: string) {
    const response = await this.embeddings.doEmbed({
      values: [query],
    });

    return response.embeddings[0];
  }

  async embedDocuments(docs: Document[]) {
    let result: DocumentWithEmbedding[] = [];

    const chunkSize = 20;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const { embeddings } = await this.embeddings.doEmbed({
        values: chunk.map((d) => d.content),
      });

      result = result.concat(
        embeddings.map((d, index) => ({
          ...chunk[index],
          embedding: d,
        })),
      );
    }
    return result;
  }
}

export const embeddings = new Embeddings();

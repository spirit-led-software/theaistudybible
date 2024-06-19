import OpenAI from 'openai';
import { Document, DocumentWithEmbeddings } from '../types/document';
import { openai } from './openai';

export type EmbeddingModelInfo = {
  id: string;
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
};

export const embeddingsModelInfo: EmbeddingModelInfo =
  process.env.NODE_ENV === 'production'
    ? {
        id: 'text-embedding-3-large',
        dimensions: 3072,
        chunkSize: 1024,
        chunkOverlap: 256
      }
    : {
        id: 'text-embedding-ada-002',
        dimensions: 1536,
        chunkSize: 1024,
        chunkOverlap: 256
      };

export class Embeddings {
  private readonly embeddings: OpenAI.Embeddings;

  constructor() {
    this.embeddings = new OpenAI.Embeddings(openai);
  }

  async embedQuery(query: string) {
    const response = await this.embeddings.create({
      model: embeddingsModelInfo.id,
      input: query
    });

    return response.data[0].embedding;
  }

  async embedDocuments(docs: Document[]) {
    let result: DocumentWithEmbeddings[] = [];

    const chunkSize = 25;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const embeddingResponse = await this.embeddings.create({
        model: embeddingsModelInfo.id,
        input: chunk.map((d) => d.content)
      });

      result = result.concat(
        embeddingResponse.data.map((d, index) => ({
          ...chunk[index],
          embedding: d.embedding
        }))
      );
    }
    return result;
  }
}

export const embeddings = new Embeddings();

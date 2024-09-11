import type { Prettify } from '@/core/types/util';
import type { Metadata } from '@/schemas/utils/metadata';

export type Document = {
  id: string;
  content: string;
  metadata?: Metadata;
  embedding?: number[];
};

export type DocumentWithMetadata = Prettify<
  Document & {
    metadata: Metadata;
  }
>;

export type DocumentWithEmbedding = Prettify<
  Document & {
    embedding: number[];
  }
>;

export type DocumentWithEmbeddingAndMetadata = Prettify<
  Document & {
    embedding: number[];
    metadata: Metadata;
  }
>;

export type DocumentWithScore = Prettify<Document & { score: number }>;

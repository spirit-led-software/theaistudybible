import type { Metadata } from '@theaistudybible/core/types/metadata';
import type { Prettify } from '@theaistudybible/core/types/util';

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

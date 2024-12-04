import type { Prettify } from '@/core/types/util';
import type { Metadata } from '@/schemas/utils/types';

export type Document<T = Metadata> = {
  id: string;
  content: string;
  metadata?: T;
  embedding?: number[];
};

export type DocumentWithMetadata<T = Metadata> = Prettify<
  Document<T> & {
    metadata: T;
  }
>;

export type DocumentWithEmbedding<T = Metadata> = Prettify<
  Document<T> & {
    embedding: number[];
  }
>;

export type DocumentWithEmbeddingAndMetadata<T = Metadata> = Prettify<
  Document<T> & {
    embedding: number[];
    metadata: T;
  }
>;

export type DocumentWithScore<T = Metadata> = Prettify<Document<T> & { score: number }>;

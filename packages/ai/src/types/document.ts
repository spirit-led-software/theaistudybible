import type { Metadata } from '@theaistudybible/core/types/metadata';

export type Document = {
  id: string;
  content: string;
  metadata: Metadata;
};

export type DocumentWithEmbeddings = Document & {
  embedding: number[];
};

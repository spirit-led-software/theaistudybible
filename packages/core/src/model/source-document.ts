import type { Metadata } from '../types/metadata';

export const similarityFunctionMapping = {
  COSINE: 'cosine',
  EUCLIDEAN: 'l2',
  DOT_PRODUCT: 'innerProduct'
} as const;

export const distanceMetricMapping = {
  cosine: 'COSINE',
  l2: 'EUCLIDEAN',
  innerProduct: 'DOT_PRODUCT'
} as const;

export type SourceDocument = {
  id: string;
  metadata: Metadata;
  embedding: number[];
  pageContent: string;
  distance?: number;
  distanceMetric?: keyof typeof distanceMetricMapping;
};

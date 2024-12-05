import { type Column, type SQL, type Table, sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/sqlite-core';
import { sourceDocumentsEmbeddingIdxName } from '../schema';

export type VectorMetric = 'cosine' | 'l2';
export type VectorCompression =
  | 'float1bit'
  | 'float8'
  | 'float16'
  | 'floatb16'
  | 'float32'
  | 'float64';

/**
 * Documentation:
 * https://docs.turso.tech/features/ai-and-embeddings#functions
 */
export type VectorIndexOptions = {
  /**
   * Which distance function to use for building index.
   * @default 'cosine'
   */
  metric?: VectorMetric;

  /**
   * How many neighbors to store for every node in the DiskANN graph.
   * The lower the setting — the less storage index will use in exchange to search precision.
   * @default 3√D where D is dimensionality of vector column
   */
  maxNeighbors?: number;

  /**
   * Which vector type must be used to store neighbors for every node in the DiskANN graph.
   * The more compact vector type is used for neighbors — the less storage index will use in exchange to search precision.
   * @default no compression (neighbors has same type as base table)
   */
  compressNeighbors?: VectorCompression;

  /**
   * "Density" parameter of general sparse neighborhood graph build during DiskANN algorithm.
   * The lower parameter — the more sparse is DiskANN graph which can speed up query speed in exchange to lower search precision.
   * @default 1.2
   */
  alpha?: number;

  /**
   * Setting which limits amount of neighbors visited during vector search.
   * The lower the setting — the faster will be search query in exchange to search precision.
   * @default 200
   */
  searchL?: number;

  /**
   * Setting which limits amount of neighbors visited during vector insert.
   * The lower the setting — the faster will be insert query in exchange to DiskANN graph navigability properties.
   * @default 70
   */
  insertL?: number;
};

export const libsqlVectorIdx = (column: Column | SQL, options?: VectorIndexOptions) => {
  if (!options) return sql`libsql_vector_idx(${column})`;

  const settings: string[] = [];

  if (options.metric) settings.push(`metric=${options.metric}`);
  if (options.maxNeighbors) settings.push(`max_neighbors=${options.maxNeighbors}`);
  if (options.compressNeighbors) settings.push(`compress_neighbors=${options.compressNeighbors}`);
  if (options.alpha) settings.push(`alpha=${options.alpha}`);
  if (options.searchL) settings.push(`search_l=${options.searchL}`);
  if (options.insertL) settings.push(`insert_l=${options.insertL}`);

  const settingsStr = settings.length ? `,${settings.map((s) => `'${s}'`).join(',')}` : '';

  return sql`libsql_vector_idx(${column}${sql.raw(settingsStr)})`;
};

export const vector1bit = (embedding: number[]) => sql`vector1bit(${JSON.stringify(embedding)})`;
export const vector8 = (embedding: number[]) => sql`vector8(${JSON.stringify(embedding)})`;
export const vector16 = (embedding: number[]) => sql`vector16(${JSON.stringify(embedding)})`;
export const vectorb16 = (embedding: number[]) => sql`vectorb16(${JSON.stringify(embedding)})`;
export const vector32 = (embedding: number[]) => sql`vector32(${JSON.stringify(embedding)})`;
export const vector64 = (embedding: number[]) => sql`vector64(${JSON.stringify(embedding)})`;

/**
 * Alias for our default vector type (float32)
 */
export const vector = (embedding: number[]) => vector32(embedding);

export const vectorExtract = (embedding: Column | SQL) => sql<string>`vector_extract(${embedding})`;

export const vectorTopK = (queryEmbedding: number[], limit: number) =>
  sql<Table>`vector_top_k(${sourceDocumentsEmbeddingIdxName},${vector(queryEmbedding)},${limit})`;

export const vectorDistanceL2 = (column: Column | SQL, embedding: number[]) =>
  sql<number>`vector_distance_l2(${column},${vector(embedding)})`;

export const vectorDistanceCos = (column: Column | SQL, embedding: number[]) =>
  sql<number>`vector_distance_cos(${column},${vector(embedding)})`;

/**
 * Alias for our default distance function (cosine)
 */
export const vectorDistance = (column: Column | SQL, embedding: number[]) =>
  vectorDistanceCos(column, embedding);

export const float1BitArray = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `F1BIT_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Uint8Array(value.buffer)),
  toDriver: (value) => vector1bit(value),
});

export const float8Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `F8_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Float32Array(value.buffer)),
  toDriver: (value) => vector8(value),
});

export const float16Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `F16_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Float32Array(value.buffer)),
  toDriver: (value) => vector16(value),
});

export const floatb16Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `FB16_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Float32Array(value.buffer)),
  toDriver: (value) => vectorb16(value),
});

export const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `F32_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Float32Array(value.buffer)),
  toDriver: (value) => vector32(value),
});

export const float64Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType: (config) => `F64_BLOB(${config.dimensions})`,
  fromDriver: (value) => Array.from(new Float64Array(value.buffer)),
  toDriver: (value) => vector64(value),
});

/**
 * Alias for our default vector type (float32)
 */
export const vectorType = float32Array;

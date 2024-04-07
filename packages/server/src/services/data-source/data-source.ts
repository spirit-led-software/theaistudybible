import { db } from '@lib/database';
import { dataSources } from '@revelationsai/core/database/schema';
import type {
  CreateDataSourceData,
  DataSource,
  UpdateDataSourceData
} from '@revelationsai/core/model/data-source';
import { desc, eq, type SQL } from 'drizzle-orm';
import { getDocumentVectorStore } from '../../lib/vector-db';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';
import { getSourceDocumentsByDataSourceId } from '../source-document';

export const DATA_SOURCE_CACHE_COLLECTION = 'dataSources';
export const defaultCacheKeysFn: CacheKeysInput<DataSource> = (dataSource) => [
  { name: 'id', value: dataSource.id }
];
export const DATA_SOURCES_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function getDataSources(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(dataSources.createdAt) } = options;

  return await db
    .select()
    .from(dataSources)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getDataSource(id: string) {
  return await cacheGet({
    collection: DATA_SOURCE_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(dataSources).where(eq(dataSources.id, id))).at(0),
    expireSeconds: DATA_SOURCES_CACHE_TTL_SECONDS
  });
}

export async function getDataSourceOrThrow(id: string) {
  const indexOperation = await getDataSource(id);
  if (!indexOperation) {
    throw new Error(`DataSource with id ${id} not found`);
  }
  return indexOperation;
}

export async function createDataSource(data: CreateDataSourceData) {
  return await cacheUpsert({
    collection: DATA_SOURCE_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(dataSources)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0],
    expireSeconds: DATA_SOURCES_CACHE_TTL_SECONDS
  });
}

export async function updateDataSource(id: string, data: UpdateDataSourceData) {
  return await cacheUpsert({
    collection: DATA_SOURCE_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(dataSources)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(dataSources.id, id))
          .returning()
      )[0],
    expireSeconds: DATA_SOURCES_CACHE_TTL_SECONDS,
    invalidateIterables: true
  });
}

export async function updateDataSourceRelatedDocuments(
  dataSourceId: string,
  dataSource: DataSource
) {
  const sourceDocuments = await getSourceDocumentsByDataSourceId(dataSourceId);
  const vectorDb = await getDocumentVectorStore();
  await vectorDb.index.upsert(
    sourceDocuments
      .filter((d) => d)
      .map((d) => ({
        id: d!.id,
        vector: d!.vector,
        metadata: {
          ...d!.metadata,
          ...dataSource.metadata,
          dataSourceId: dataSource.id
        }
      }))
  );
}

export async function deleteDataSource(id: string) {
  return await cacheDelete({
    collection: DATA_SOURCE_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => (await db.delete(dataSources).where(eq(dataSources.id, id)).returning())[0]
  });
}

export async function deleteDataSourceRelatedDocuments(dataSourceId: string) {
  const sourceDocuments = await getSourceDocumentsByDataSourceId(dataSourceId);
  const vectorDb = await getDocumentVectorStore();
  await vectorDb.delete(sourceDocuments.filter((d) => d).map((d) => d!.id));
}

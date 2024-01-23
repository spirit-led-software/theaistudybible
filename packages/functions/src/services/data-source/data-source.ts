import type {
  CreateDataSourceData,
  DataSource,
  UpdateDataSourceData
} from '@core/model/data-source';
import { dataSources } from '@core/schema';
import { db } from '@lib/database/database';
import { getDocumentVectorStore } from '@services/vector-db';
import { SQL, desc, eq } from 'drizzle-orm';

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
  return (await db.select().from(dataSources).where(eq(dataSources.id, id))).at(0);
}

export async function getDataSourceOrThrow(id: string) {
  const indexOperation = await getDataSource(id);
  if (!indexOperation) {
    throw new Error(`DataSource with id ${id} not found`);
  }
  return indexOperation;
}

export async function createDataSource(data: CreateDataSourceData) {
  return (
    await db
      .insert(dataSources)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateDataSource(id: string, data: UpdateDataSourceData) {
  return (
    await db
      .update(dataSources)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(dataSources.id, id))
      .returning()
  )[0];
}

export async function updateDataSourceRelatedDocuments(
  dataSourceId: string,
  dataSource: DataSource
) {
  const vectorDb = await getDocumentVectorStore();
  await vectorDb.transaction(async (client) => {
    return await client.query(
      `UPDATE ${vectorDb.tableName} 
      SET metadata = metadata || $1::jsonb
      WHERE (
        metadata->>'dataSourceId' = $2
      );`,
      [
        JSON.stringify({
          ...dataSource.metadata,
          dataSourceId: dataSource.id
        }),
        dataSourceId
      ]
    );
  });
}

export async function deleteDataSource(id: string) {
  return (await db.delete(dataSources).where(eq(dataSources.id, id)).returning())[0];
}

export async function deleteDataSourceRelatedDocuments(dataSourceId: string) {
  const vectorDb = await getDocumentVectorStore();
  await vectorDb.transaction(async (client) => {
    return await client.query(
      `DELETE FROM ${vectorDb.tableName} 
      WHERE (
        metadata->>'dataSourceId' = $1
      );`,
      [dataSourceId]
    );
  });
}

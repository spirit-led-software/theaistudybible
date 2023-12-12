import type { CreateDataSourceData, DataSource, UpdateDataSourceData } from '@core/model';
import { dataSources, indexOperations } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { getDocumentVectorStore } from '@services/vector-db';
import { SQL, and, desc, eq } from 'drizzle-orm';
import {
  getIndexOperations,
  indexRemoteFile,
  indexWebCrawl,
  indexWebPage,
  indexYoutubeVideo
} from './index-op';

export async function getDataSources(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(dataSources.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(dataSources)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getDataSource(id: string) {
  return (await readOnlyDatabase.select().from(dataSources).where(eq(dataSources.id, id))).at(0);
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
    await readWriteDatabase
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
    await readWriteDatabase
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
  return (await readWriteDatabase.delete(dataSources).where(eq(dataSources.id, id)).returning())[0];
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

export async function syncDataSource(id: string, manual: boolean = false): Promise<DataSource> {
  let dataSource = await getDataSourceOrThrow(id);

  const runningIndexOps = await getIndexOperations({
    where: and(
      eq(indexOperations.dataSourceId, dataSource.id),
      eq(indexOperations.status, 'RUNNING')
    ),
    limit: 1
  });
  if (runningIndexOps.length > 0) {
    throw new Error(`Cannot sync data source ${dataSource.id} because it is already being indexed`);
  }

  dataSource = await updateDataSource(dataSource.id, {
    numberOfDocuments: 0
  });

  const syncDate = new Date();

  switch (dataSource.type) {
    case 'FILE':
      throw new Error('You must upload a file to the data source to index it');
    case 'REMOTE_FILE':
      await indexRemoteFile({
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    case 'WEBPAGE':
      await indexWebPage({
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    case 'WEB_CRAWL':
      await indexWebCrawl({
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        pathRegex: dataSource.metadata.pathRegex,
        metadata: dataSource.metadata
      });
      break;
    case 'YOUTUBE':
      await indexYoutubeVideo({
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    default:
      throw new Error(`Unsupported data source type ${dataSource.type}`);
  }

  dataSource = await updateDataSource(dataSource.id, {
    lastManualSync: manual ? syncDate : undefined,
    lastAutomaticSync: !manual ? syncDate : undefined
  });

  // Delete old vectors
  const vectorDb = await getDocumentVectorStore();
  await vectorDb.transaction(async (client) => {
    return await client.query(
      `DELETE FROM ${vectorDb.tableName} 
      WHERE (
        metadata->>'dataSourceId' = $1
        AND
        metadata->>'indexDate' < $2
      );`,
      [dataSource.id, syncDate]
    );
  });

  return dataSource;
}

import {
  dataSources,
  dataSourcesToSourceDocuments,
  indexOperations
} from '@revelationsai/core/database/schema';
import type { DataSource } from '@revelationsai/core/model/data-source';
import { getDocumentVectorStore } from '@revelationsai/langchain/lib/vector-db';
import { and, eq } from 'drizzle-orm';
import { db } from './database';
import { indexRemoteFile } from './scraper/file';
import { indexWebCrawl } from './scraper/web-crawl';
import { indexWebPage } from './scraper/webpage';
import { indexYoutubeVideo } from './scraper/youtube';

export async function syncDataSource(id: string, manual: boolean = false): Promise<DataSource> {
  let dataSource = await db.query.dataSources.findFirst({
    where: eq(dataSources.id, id)
  });
  if (!dataSource) {
    throw new Error(`Data source ${id} not found`);
  }

  const runningIndexOp = await db.query.indexOperations.findFirst({
    where: and(
      eq(indexOperations.dataSourceId, dataSource.id),
      eq(indexOperations.status, 'RUNNING')
    )
  });
  if (runningIndexOp) {
    throw new Error(`Cannot sync data source ${dataSource.id} because it is already being indexed`);
  }

  // Delete old vectors
  const vectorDb = await getDocumentVectorStore();
  const sourceDocumentIds = await db.query.dataSourcesToSourceDocuments
    .findMany({
      where: eq(dataSourcesToSourceDocuments.dataSourceId, dataSource.id)
    })
    .then((docs) => docs.map((doc) => doc.sourceDocumentId));
  await vectorDb.delete(sourceDocumentIds);

  // Reset the number of documents
  [dataSource] = await db
    .update(dataSources)
    .set({
      numberOfDocuments: 0
    })
    .where(eq(dataSources.id, dataSource.id))
    .returning();

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

  [dataSource] = await db
    .update(dataSources)
    .set({
      lastManualSync: manual ? syncDate : undefined,
      lastAutomaticSync: !manual ? syncDate : undefined
    })
    .where(eq(dataSources.id, dataSource.id))
    .returning();

  return dataSource;
}

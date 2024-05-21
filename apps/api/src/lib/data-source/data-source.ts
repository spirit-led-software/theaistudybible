import type { Bindings, Variables } from '@api/types';
import { dataSources, indexOperations } from '@core/database/schema';
import type { DataSource } from '@core/model/data-source';
import { getDocumentVectorStore } from '@langchain/lib/vector-db';
import { and, eq } from 'drizzle-orm';
import { indexRemoteFile } from './index-operation/file';
import { indexWebCrawl } from './index-operation/web-crawl';
import { indexWebPage } from './index-operation/webpage';
import { indexYoutubeVideo } from './index-operation/youtube';

export async function syncDataSource(
  id: string,
  {
    env,
    vars,
    manual = false
  }: {
    env: Bindings;
    vars: Variables;
    manual?: boolean;
  }
): Promise<DataSource> {
  let dataSource = await vars.db.query.dataSources.findFirst({
    where: (dataSources, { eq }) => eq(dataSources.id, id)
  });
  if (!dataSource) {
    throw new Error(`Data source ${id} not found`);
  }

  const runningIndexOp = await vars.db.query.indexOperations.findFirst({
    where: and(
      eq(indexOperations.dataSourceId, dataSource.id),
      eq(indexOperations.status, 'RUNNING')
    )
  });

  if (runningIndexOp) {
    throw new Error(`Cannot sync data source ${dataSource.id} because it is already being indexed`);
  }

  // Delete old vectors
  const vectorDb = await getDocumentVectorStore({
    env
  });
  const sourceDocumentIds = await vars.db.query.dataSourcesToSourceDocuments
    .findMany({
      where: (dataSourcesToSourceDocuments, { eq }) =>
        eq(dataSourcesToSourceDocuments.dataSourceId, dataSource!.id)
    })
    .then((d) => d.map((d) => d.sourceDocumentId));
  await vectorDb.delete(sourceDocumentIds);

  // Reset the number of documents
  [dataSource] = await vars.db
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
        env,
        vars,
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    case 'WEBPAGE':
      await indexWebPage({
        env,
        vars,
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    case 'WEB_CRAWL':
      await indexWebCrawl({
        env,
        vars,
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        pathRegex: dataSource.metadata.pathRegex,
        metadata: dataSource.metadata
      });
      break;
    case 'YOUTUBE':
      await indexYoutubeVideo({
        env,
        vars,
        dataSourceId: dataSource.id,
        name: dataSource.name,
        url: dataSource.url,
        metadata: dataSource.metadata
      });
      break;
    default:
      throw new Error(`Unsupported data source type ${dataSource.type}`);
  }

  [dataSource] = await vars.db
    .update(dataSources)
    .set({
      lastManualSync: manual ? syncDate : undefined,
      lastAutomaticSync: !manual ? syncDate : undefined
    })
    .where(eq(dataSources.id, dataSource.id))
    .returning();

  return dataSource;
}

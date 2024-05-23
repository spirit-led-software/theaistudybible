import {
  dataSources,
  dataSourcesToSourceDocuments,
  indexOperations
} from '@theaistudybible/core/database/schema';
import type { IndexOperation } from '@theaistudybible/core/model/data-source/index-op';
import type { Metadata } from '@theaistudybible/core/types/metadata';
import { scrapeWebpage } from '@theaistudybible/langchain/lib/scraper/webpage';
import { eq, sql } from 'drizzle-orm';
import { db } from '../database';

export async function indexWebPage({
  dataSourceId,
  name,
  url,
  metadata = {}
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: Metadata;
}): Promise<IndexOperation> {
  let indexOp: IndexOperation | undefined;
  try {
    [indexOp] = await db
      .insert(indexOperations)
      .values({
        status: 'RUNNING',
        metadata: {
          ...metadata,
          name,
          url
        },
        dataSourceId
      })
      .returning();

    console.log(`Started indexing url '${url}'.`);
    const { docs, ids } = await scrapeWebpage(name, url, dataSourceId, metadata);
    await Promise.all([
      db
        .update(dataSources)
        .set({
          numberOfDocuments: sql`${dataSources.numberOfDocuments} + ${docs.length}`
        })
        .where(eq(dataSources.id, indexOp.dataSourceId))
        .returning(),
      ...ids.map((sourceDocumentId) =>
        db.insert(dataSourcesToSourceDocuments).values({
          dataSourceId: indexOp!.dataSourceId,
          sourceDocumentId
        })
      )
    ]);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    [indexOp] = await db
      .update(indexOperations)
      .set({
        status: 'SUCCEEDED'
      })
      .where(eq(indexOperations.id, indexOp!.id))
      .returning();

    return indexOp!;
  } catch (err) {
    console.error(`Error indexing url '${url}':`, err);
    if (indexOp) {
      [indexOp] = await db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
    }
    throw err;
  }
}

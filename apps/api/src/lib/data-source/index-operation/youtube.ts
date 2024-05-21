import { db } from '@api/lib/database';
import { dataSources, dataSourcesToSourceDocuments, indexOperations } from '@core/database/schema';
import type { DataSource } from '@core/model/data-source';
import type { IndexOperation } from '@core/model/data-source/index-op';
import type { Metadata } from '@core/types/metadata';
import { scrapeYoutubeVideo } from '@langchain/lib/scraper/youtube';
import { getDocumentVectorStore } from '@langchain/lib/vector-db';
import { eq, sql } from 'drizzle-orm';

export async function indexYoutubeVideo({
  dataSourceId,
  name,
  url,
  metadata = {}
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: Metadata;
}) {
  let indexOp: IndexOperation | undefined;
  try {
    let dataSource: DataSource | undefined;

    [[indexOp], dataSource] = await Promise.all([
      db
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
        .returning(),
      db.query.dataSources.findFirst({
        where: (dataSources, { eq }) => eq(dataSources.id, dataSourceId)
      })
    ]);
    if (!dataSource) {
      throw new Error(`DataSource with id '${dataSourceId}' not found`);
    }

    let docs = await scrapeYoutubeVideo({ url, language: dataSource.metadata.language });
    docs = docs.map((doc) => {
      doc.metadata = {
        ...metadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: 'youtube',
        dataSourceId,
        name,
        url
      };

      let newPageContent = `TITLE: ${doc.metadata.name}\n---\n${doc.pageContent}`;
      if (doc.metadata.title && doc.metadata.author) {
        newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n---\n${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;

      return doc;
    });

    console.log('Adding documents to vector store');
    const vectorStore = await getDocumentVectorStore();
    const ids = await vectorStore.addDocuments(docs);
    console.log(`Successfully indexed youtube video '${url}'.`);
    [[indexOp], [dataSource]] = await Promise.all([
      db
        .update(indexOperations)
        .set({
          status: 'SUCCEEDED'
        })
        .where(eq(indexOperations.id, indexOp!.id))
        .returning(),
      db
        .update(dataSources)
        .set({
          numberOfDocuments: docs.length
        })
        .where(eq(dataSources.id, dataSourceId))
        .returning(),
      ...ids.map((sourceDocumentId: string) =>
        db.insert(dataSourcesToSourceDocuments).values({
          dataSourceId,
          sourceDocumentId
        })
      )
    ]);

    return indexOp;
  } catch (err) {
    console.error(`Error indexing youtube video '${url}':`, err);
    if (indexOp) {
      [indexOp] = await db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: sql`${indexOp.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
    }
    throw err;
  }
}

import { db } from '@api/lib/database';
import { dataSources, dataSourcesToSourceDocuments, indexOperations } from '@core/database/schema';
import type { IndexOperation } from '@core/model/data-source/index-op';
import type { Metadata } from '@core/types/metadata';
import { scrapeWebpage } from '@langchain/lib/scraper/webpage';
import { getDocumentVectorStore } from '@langchain/lib/vector-db';
import { eq, sql } from 'drizzle-orm';

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
    await generatePageContentEmbeddings({
      name,
      url,
      dataSourceId,
      metadata
    });

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    [indexOp] = await db
      .update(indexOperations)
      .set({
        status: 'SUCCEEDED'
      })
      .where(eq(indexOperations.id, indexOp.id))
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

export async function generatePageContentEmbeddings({
  name,
  url,
  dataSourceId,
  metadata
}: {
  name: string;
  url: string;
  dataSourceId: string;
  metadata: object;
}): Promise<void> {
  console.log(`Generating page content embeddings for url '${url}'`);
  let docs = await scrapeWebpage(url);
  docs = docs.map((doc) => {
    doc.metadata = {
      ...metadata,
      ...doc.metadata,
      indexDate: new Date().toISOString(),
      type: 'webpage',
      dataSourceId,
      name,
      url
    };
    let newPageContent = `TITLE: ${name}\n-----\nCONTENT: ${doc.pageContent}`;
    if (doc.metadata.title) {
      newPageContent = `TITLE: ${doc.metadata.title}\n-----\nCONTENT: ${doc.pageContent}`;
    }
    doc.pageContent = newPageContent;
    return doc;
  });

  console.log('Docs ready. Adding them to the vector store.');
  const vectorStore = await getDocumentVectorStore();
  const ids = await vectorStore.addDocuments(docs);
  await Promise.all([
    db
      .update(dataSources)
      .set({
        numberOfDocuments: sql`${dataSources.numberOfDocuments} + ${docs.length}`
      })
      .where(eq(dataSources.id, dataSourceId)),
    ...ids.map((sourceDocumentId: string) =>
      db.insert(dataSourcesToSourceDocuments).values({
        dataSourceId,
        sourceDocumentId
      })
    )
  ]);
}

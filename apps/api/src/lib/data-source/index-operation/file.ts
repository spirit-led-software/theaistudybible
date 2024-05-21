import type { Bindings, Variables } from '@api/types';
import { dataSources, dataSourcesToSourceDocuments, indexOperations } from '@core/database/schema';
import type { IndexOperation } from '@core/model/data-source/index-op';
import type { Metadata } from '@core/types/metadata';
import { scrapeFile } from '@langchain/lib/scraper/file';
import { getDocumentVectorStore } from '@langchain/lib/vector-db';
import { eq, sql } from 'drizzle-orm';

export async function indexRemoteFile({
  env,
  vars,
  dataSourceId,
  name,
  url,
  metadata = {}
}: {
  env: Bindings;
  vars: Variables;
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: Metadata;
}) {
  const downloadResponse = await fetch(url, {
    method: 'GET'
  });
  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file from ${url}`);
  }

  const filename = getFileNameFromUrl(url);
  const contentType = downloadResponse.headers.get('content-type') ?? 'application/octet-stream';
  const blob = await downloadResponse.blob();

  let indexOp: IndexOperation | undefined;
  try {
    if (!dataSourceId || !name || !url) {
      throw new Error('Missing required metadata');
    }

    let [[indexOp], dataSource] = await Promise.all([
      vars.db
        .insert(indexOperations)
        .values({
          status: 'RUNNING',
          metadata: {
            ...metadata,
            name,
            url,
            filename,
            size: blob.size,
            contentType
          },
          dataSourceId
        })
        .returning(),
      vars.db.query.dataSources.findFirst({
        where: eq(dataSources.id, dataSourceId)
      })
    ]);
    if (!dataSource) {
      throw new Error(`Data source with ID ${dataSourceId} not found`);
    }

    let docs = await scrapeFile({
      blob,
      contentType
    });
    docs = docs.map((doc) => {
      doc.metadata = {
        ...dataSource!.metadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: 'file',
        dataSourceId
      };
      let newPageContent = `TITLE: ${doc.metadata.name}\n-----\nCONTENT: ${doc.pageContent}`;
      if (doc.metadata.title && doc.metadata.author) {
        newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n-----\nCONTENT: ${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;
      return doc;
    });

    console.log('Adding documents to vector store');
    const vectorStore = await getDocumentVectorStore({
      env
    });
    const ids = await vectorStore.addDocuments(docs);
    [[indexOp], [dataSource]] = await Promise.all([
      vars.db
        .update(indexOperations)
        .set({
          status: 'SUCCEEDED'
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning(),
      vars.db
        .update(dataSources)
        .set({
          numberOfDocuments: docs.length
        })
        .where(eq(dataSources.id, dataSourceId))
        .returning(),
      ...ids.map((sourceDocumentId) =>
        vars.db.insert(dataSourcesToSourceDocuments).values({
          dataSourceId,
          sourceDocumentId
        })
      )
    ]);
    console.log('Finished adding documents to vector store');
  } catch (error) {
    console.error('Error indexing file:', error);
    if (indexOp) {
      [indexOp] = await vars.db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            error instanceof Error
              ? `${error.message}: ${error.stack}`
              : `Error: ${JSON.stringify(error)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
    }

    throw error;
  }
}

export function getFileNameFromUrl(url: string) {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename;
}

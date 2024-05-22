import { db } from '@lib/database';
import {
  dataSources,
  dataSourcesToSourceDocuments,
  indexOperations
} from '@revelationsai/core/database/schema';
import type { IndexOperation } from '@revelationsai/core/model/data-source/index-op';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { PuppeteerCoreWebBaseLoader } from '@revelationsai/langchain/document_loaders/puppeteer-core';
import { getEmbeddingsModelInfo } from '@revelationsai/langchain/lib/llm';
import { getDocumentVectorStore } from '@revelationsai/langchain/lib/vector-db';
import { eq, sql } from 'drizzle-orm';
import type { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

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
    await generatePageContentEmbeddings(name, url, dataSourceId, metadata);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    [indexOp] = await db
      .update(indexOperations)
      .set({
        status: 'SUCCEEDED'
      })
      .where(eq(indexOperations.id, indexOp.id))
      .returning();

    return indexOp;
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

export async function generatePageContentEmbeddings(
  name: string,
  url: string,
  dataSourceId: string,
  metadata: object
): Promise<void> {
  console.log(`Generating page content embeddings for url '${url}'`);
  let error: unknown | undefined = undefined;
  let docs: Document<Record<string, unknown>>[] | undefined = undefined;
  for (let retries = 0; retries < 5; retries++) {
    console.log(`Attempt ${retries + 1} of 5`);
    try {
      if (!docs) {
        const loader = new PuppeteerCoreWebBaseLoader(url, {
          evaluate: async (page) => {
            await page.waitForNetworkIdle();
            await page.waitForSelector('body');
            return await page.evaluate(() => {
              return document.querySelector('main')?.innerText ?? document.body.innerText;
            });
          }
        });
        console.log(`Loading documents from url '${url}'`);
        docs = await loader.load();
        console.log(`Loaded ${docs.length} documents from url '${url}'.`);

        const embeddingsModelInfo = getEmbeddingsModelInfo();
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: embeddingsModelInfo.chunkSize,
          chunkOverlap: embeddingsModelInfo.chunkOverlap
        });
        console.log('Splitting documents.');
        docs = await splitter.invoke(docs, {});
        console.log(`Split into ${docs.length} documents from url '${url}'.`);

        console.log('Adding metadata to documents.');
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
      } else {
        console.log('Docs already loaded. Adding them to the vector store.');
      }
      const vectorStore = await getDocumentVectorStore({ write: true });
      const ids = await vectorStore.addDocuments(docs);
      await Promise.all([
        db
          .update(dataSources)
          .set({
            numberOfDocuments: sql`${dataSources.numberOfDocuments} + ${docs.length}`
          })
          .where(eq(dataSources.id, dataSourceId))
          .returning(),
        ...ids.map((sourceDocumentId) =>
          db.insert(dataSourcesToSourceDocuments).values({
            dataSourceId,
            sourceDocumentId
          })
        )
      ]);

      error = undefined;
      break;
    } catch (err: unknown) {
      console.error('Failed attempt:', err);
      error = err;
    }
  }
  if (error) {
    throw new Error(
      `Failed to generate page content embeddings for url '${url}'\n${(error as Error).stack}`
    );
  }
}

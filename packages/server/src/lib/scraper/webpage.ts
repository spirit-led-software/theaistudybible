import { db } from '@lib/database';
import config from '@revelationsai/core/configs/revelationsai';
import {
  dataSources,
  dataSourcesToSourceDocuments,
  indexOperations
} from '@revelationsai/core/database/schema';
import type { IndexOperation } from '@revelationsai/core/model/data-source/index-op';
import type { Metadata } from '@revelationsai/core/types/metadata';
import { PuppeteerCoreWebBaseLoader } from '@revelationsai/langchain/document_loaders/puppeteer-core';
import { sql } from 'drizzle-orm';
import type { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { updateDataSource } from '../../services/data-source';
import { createIndexOperation, updateIndexOperation } from '../../services/data-source/index-op';
import { getDocumentVectorStore } from '../vector-db';

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
    indexOp = await createIndexOperation({
      status: 'RUNNING',
      metadata: {
        ...metadata,
        name,
        url
      },
      dataSourceId
    });

    console.log(`Started indexing url '${url}'.`);
    await generatePageContentEmbeddings(name, url, dataSourceId, metadata);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    indexOp = await updateIndexOperation(indexOp!.id, {
      status: 'SUCCEEDED'
    });

    return indexOp;
  } catch (err) {
    console.error(`Error indexing url '${url}':`, err);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: 'FAILED',
        errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
          err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
        )}')`
      });
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

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: config.llm.embeddings.chunkSize,
          chunkOverlap: config.llm.embeddings.chunkOverlap
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
        updateDataSource(dataSourceId, {
          numberOfDocuments: sql`${dataSources.numberOfDocuments} + ${docs.length}`
        }),
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

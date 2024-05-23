import type { Document } from '@langchain/core/documents';
import { PuppeteerCoreWebBaseLoader } from '@theaistudybible/langchain/document_loaders/puppeteer-core';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddingsModelInfo } from '../llm';
import { getDocumentVectorStore } from '../vector-db';

export async function scrapeWebpage(
  name: string,
  url: string,
  dataSourceId: string,
  metadata: object
) {
  console.log(`Generating page content embeddings for url '${url}'`);
  let error: unknown | undefined = undefined;
  let ids: string[] | undefined = undefined;
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
      ids = await vectorStore.addDocuments(docs);
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
  } else {
    return {
      docs: docs!,
      ids: ids!
    };
  }
}

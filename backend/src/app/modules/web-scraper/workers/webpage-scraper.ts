import { VectorStore } from 'langchain/dist/vectorstores/base';
import {
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { parentPort, workerData } from 'worker_threads';

const generatePageContentEmbeddings = async (
  url: string,
  vectorStore: VectorStore,
): Promise<void> => {
  let retries = 5;
  while (retries > 0) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          args: ['--no-sandbox'],
        },
        evaluate: async (page: Page) => {
          await page.waitForNetworkIdle();
          await page.waitForSelector('body');
          return await page.evaluate(() => {
            const text = document.querySelector('body').innerText;
            return text.replace(/\n/g, ' ').trim();
          });
        },
      });
      let docs = await loader.loadAndSplit(
        new TokenTextSplitter({
          chunkSize: 400,
          chunkOverlap: 50,
          encodingName: 'cl100k_base',
        }),
      );
      docs = docs.map((doc) => {
        doc.metadata = {
          source: `URL: ${url}`,
        };
        return doc;
      });
      parentPort.postMessage(
        `Obtained ${docs.length} documents from url '${url}'`,
      );
      await vectorStore.addDocuments(docs);
      return;
    } catch (err) {
      parentPort.postMessage(`${err.name}: ${err.message}`);
      parentPort.postMessage(`${err.stack}`);
      retries--;
    }
  }
  throw new Error('Failed to generate page content embeddings');
};

parentPort.postMessage('Page Scraper Worker Started!');
generatePageContentEmbeddings(workerData.url, workerData.vectorStore)
  .then(() => {
    parentPort.postMessage('Page Scraper Worker Finished!');
  })
  .catch(async (err) => {
    parentPort.postMessage(`Page Scraper Worker Error: ${err}`);
    await Promise.reject(err);
  });

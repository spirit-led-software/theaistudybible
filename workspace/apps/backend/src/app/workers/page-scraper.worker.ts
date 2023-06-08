import '@tensorflow/tfjs-node';
import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import { parentPort, workerData } from 'worker_threads';
import { createEmbeddings } from '../utils/tensorflow';
import { createClient } from '../utils/weaviate';

const generatePageContentEmbeddings = async (url: string) => {
  let retries = 5;
  while (retries > 0) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
        },
        evaluate: async (page: Page, browser: Browser) => {
          await page.waitForNetworkIdle();
          await page.waitForSelector('body');
          return await page.evaluate(() => {
            const text = document.querySelector('body').innerText;
            return text.replace(/\n/g, ' ').trim();
          });
        },
      });
      const docs = await loader.loadAndSplit();
      parentPort.postMessage(`Loaded ${docs.length} documents`);

      const embeddings = createEmbeddings();
      const client = createClient();
      await WeaviateStore.fromDocuments(docs, embeddings, {
        client,
        indexName: 'Docs',
      });
      retries = 0;
    } catch (err) {
      parentPort.postMessage(`Error: ${err}`);
      retries--;
    }
  }
};

parentPort.postMessage('Page Scraper Worker Started!');
generatePageContentEmbeddings(workerData.url)
  .then(() => {
    parentPort.postMessage('Page Scraper Worker Finished!');
  })
  .catch(async (err) => {
    parentPort.postMessage(`Page Scraper Worker Error: ${err}`);
    await Promise.reject(err);
  });

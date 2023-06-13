import { config as milvusConfig } from '@/configs/milvus.config';
import { createEmbeddings } from '@configs/openai.config';
import {
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { Milvus } from 'langchain/vectorstores/milvus';
import { parentPort, workerData } from 'worker_threads';

const generatePageContentEmbeddings = async (url: string) => {
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
      const docs = await loader.loadAndSplit();
      parentPort.postMessage(`Loaded ${docs.length} documents`);

      await Milvus.fromDocuments(docs, createEmbeddings(), {
        url: milvusConfig.url,
        collectionName: milvusConfig.collectionName,
        username: milvusConfig.user,
        password: milvusConfig.password,
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

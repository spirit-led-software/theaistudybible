import { getVectorStore } from '@/configs/milvus.config';
import {
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { parentPort, workerData } from 'worker_threads';

const generatePageContentEmbeddings = async (url: string): Promise<void> => {
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
      let docs = await loader.loadAndSplit();
      docs = docs.map((doc) => {
        doc.pageContent = doc.pageContent.replace(/\n/g, ' ').trim();
        doc.metadata = {
          ...doc.metadata,
          filetype: 'webpage',
          page_number: 'N/A',
          filename: 'N/A',
          category: 'webpage',
          // TODO: May need to add metadata for milvus client not to complain
        };
        return doc;
      });
      parentPort.postMessage(
        `Obtained ${docs.length} documents from url '${url}'`,
      );
      const vectorStore = await getVectorStore();
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
generatePageContentEmbeddings(workerData.url)
  .then(() => {
    parentPort.postMessage('Page Scraper Worker Finished!');
  })
  .catch(async (err) => {
    parentPort.postMessage(`Page Scraper Worker Error: ${err}`);
    await Promise.reject(err);
  });

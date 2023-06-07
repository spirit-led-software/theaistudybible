import '@tensorflow/tfjs-node';
import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from 'langchain/document_loaders/web/puppeteer';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import { expose } from 'threads';
import { createEmbeddings } from '../tensorflow';
import { createClient } from '../weaviate';

expose({
  /**
   * This function generates embeddings for the content of a web page using Puppeteer and TensorFlow, and
   * stores them in a Weaviate database.
   * @param {string} url - The URL of the webpage that will be loaded and processed for generating page
   * content embeddings.
   */
  async generatePageContentEmbeddings(url: string) {
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
        console.debug(docs);

        const embeddings = createEmbeddings();
        const client = createClient();
        await WeaviateStore.fromDocuments(docs, embeddings, {
          client,
          indexName: 'Docs',
        });
        retries = 0;
      } catch (err) {
        console.log(err);
        retries--;
      }
    }
  },
});

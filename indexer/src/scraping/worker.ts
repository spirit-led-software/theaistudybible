import "@tensorflow/tfjs-node";
import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from "langchain/document_loaders/web/puppeteer";
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { expose } from "threads";
import weaviate from "weaviate-ts-client";

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
            await page.waitForSelector("body");
            return await page.evaluate(() => {
              const text = document.querySelector("body").innerText;
              return text.replace(/\n/g, " ").trim();
            });
          },
        });
        const docs = await loader.loadAndSplit();
        console.debug(docs);

        const embeddings = new TensorFlowEmbeddings();

        const client = weaviate.client({
          scheme: process.env.WEAVIATE_SCHEME,
          host: process.env.WEAVIATE_HOST,
          apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
        });

        await WeaviateStore.fromDocuments(docs, embeddings, {
          client,
          indexName: "Docs",
          textKey: "text",
        });
        retries = 0;
      } catch (err) {
        console.log(err);
        retries--;
      }
    }
  },
});

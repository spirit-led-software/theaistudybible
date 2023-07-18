import { addDocumentsToVectorStore } from "@core/services/vector-db";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { TokenTextSplitter } from "langchain/text_splitter";

export async function generatePageContentEmbeddings(
  name: string,
  url: string
): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      let pageTitle = `${url}`;
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          args: ["--no-sandbox"],
        },
        evaluate: async (page) => {
          await page.waitForNetworkIdle();
          await page.waitForSelector("body");
          return await page.evaluate(() => {
            let foundTitle = document.querySelector("title")?.innerText;
            if (!foundTitle) {
              foundTitle = document.querySelector("h1")?.innerText;
            }
            if (foundTitle) {
              pageTitle = foundTitle;
            }
            const text = document.querySelector("body")!.innerText;
            return text.replace(/\n/g, " ").trim();
          });
        },
      });
      let docs = await loader.loadAndSplit(
        new TokenTextSplitter({
          chunkSize: 400,
          chunkOverlap: 50,
          encodingName: "cl100k_base",
        })
      );
      docs = docs.map((doc) => {
        doc.metadata = {
          ...doc.metadata,
          indexDate: new Date().toISOString(),
          name: `${name} - ${pageTitle}`,
          url,
          type: "Webpage",
        };
        return doc;
      });
      console.log(`Obtained ${docs.length} documents from url '${url}'`);
      await addDocumentsToVectorStore(docs);
      return;
    } catch (err: any) {
      console.error(`${err.stack}`);
      retries--;
    }
  }
  throw new Error("Failed to generate page content embeddings");
}

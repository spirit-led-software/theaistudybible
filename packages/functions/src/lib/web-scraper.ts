import { getDocumentVectorStore } from "@services/vector-db";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PuppeteerCoreWebBaseLoader } from "./puppeteer";

export async function generatePageContentEmbeddings(
  name: string,
  url: string
): Promise<void> {
  console.log(`Generating page content embeddings for url '${url}'`);
  let success = false;
  for (let retries = 0; retries < 5; retries++) {
    console.log(`Attempt ${retries + 1} of 5`);
    try {
      let pageTitle = `${url}`;
      const loader = new PuppeteerCoreWebBaseLoader(url, {
        evaluate: async (page) => {
          await page.waitForNetworkIdle();
          await page.waitForSelector("body");
          return await page.evaluate(() => {
            let foundTitle =
              document.querySelector("title")?.innerText ??
              document.querySelector("h1")?.innerText;
            if (foundTitle) {
              pageTitle = foundTitle;
            }
            return (
              document.querySelector("main")?.innerText ??
              document.body.innerText
            );
          });
        },
      });
      console.log(`Loading and splitting documents from url '${url}'`);
      let docs = await loader.loadAndSplit(
        new RecursiveCharacterTextSplitter({
          chunkSize: 512,
          chunkOverlap: 128,
        })
      );
      console.log(
        `Loaded ${docs.length} documents from url '${url}'. Manipulating metadata...`
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
      console.log("Docs ready. Adding them to the vector store.");
      const vectorStore = await getDocumentVectorStore();
      await vectorStore.addDocuments(docs);
      success = true;
      break;
    } catch (err) {
      console.error("Failed attempt:", err);
    }
  }
  if (!success) {
    throw new Error(
      `Failed to generate page content embeddings for url '${url}'`
    );
  }
}

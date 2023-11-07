import { getDocumentVectorStore } from "@services/vector-db";
import type { Document } from "langchain/document";
import { PuppeteerCoreWebBaseLoader } from "./puppeteer";
import { textSplitter } from "./text-splitter";

export async function generatePageContentEmbeddings(
  name: string,
  url: string
): Promise<void> {
  console.log(`Generating page content embeddings for url '${url}'`);
  let success = false;
  let docs: Document<Record<string, any>>[] | undefined = undefined;
  for (let retries = 0; retries < 5; retries++) {
    console.log(`Attempt ${retries + 1} of 5`);
    try {
      if (!docs) {
        const loader = new PuppeteerCoreWebBaseLoader(url, {
          evaluate: async (page) => {
            await page.waitForNetworkIdle();
            await page.waitForSelector("body");
            return await page.evaluate(() => {
              return (
                document.querySelector("main")?.innerText ??
                document.body.innerText
              );
            });
          },
        });
        console.log(`Loading and splitting documents from url '${url}'`);
        docs = await loader.loadAndSplit(textSplitter);
        console.log(`Loaded ${docs.length} documents from url '${url}'.`);
      }

      console.log("Adding metadata to documents.");
      docs = docs.map((doc) => {
        doc.metadata = {
          ...doc.metadata,
          indexDate: new Date().toISOString(),
          name,
          url,
          type: "webpage",
        };
        let newPageContent = `TITLE: ${name}\n---\n${doc.pageContent}`;
        if (doc.metadata.title) {
          newPageContent = `TITLE: ${doc.metadata.title}\n---\n${doc.pageContent}`;
        }
        doc.pageContent = newPageContent;
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

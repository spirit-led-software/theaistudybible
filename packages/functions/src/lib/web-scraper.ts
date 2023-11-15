import { vectorDBConfig } from "@core/configs";
import { getDocumentVectorStore } from "@services/vector-db";
import type { Document } from "langchain/document";
import { HtmlToTextTransformer } from "langchain/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PuppeteerCoreWebBaseLoader } from "./puppeteer";

export async function generatePageContentEmbeddings(
  name: string,
  url: string,
  metadata: any
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
                document.querySelector("main")?.innerHTML ??
                document.body.innerHTML
              );
            });
          },
        });
        console.log(`Loading documents from url '${url}'`);
        docs = await loader.load();

        const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
          chunkSize: vectorDBConfig.docEmbeddingContentLength,
          chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
        });
        const transformer = new HtmlToTextTransformer();
        const sequence = splitter.pipe(transformer);
        console.log("Splitting and transforming documents.");
        docs = await sequence.invoke(docs);
        console.log(`Loaded ${docs.length} documents from url '${url}'.`);
      }

      console.log("Adding metadata to documents.");
      docs = docs.map((doc) => {
        doc.metadata = {
          ...doc.metadata,
          ...metadata,
          indexDate: new Date().toISOString(),
          type: "webpage",
          name,
          url,
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

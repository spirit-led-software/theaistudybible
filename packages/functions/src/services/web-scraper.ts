import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { axios, vectorDBConfig } from "@core/configs";
import { PuppeteerCoreWebBaseLoader } from "@core/langchain/document_loaders/puppeteer-core";
import { dataSources } from "@core/schema";
import { getDocumentVectorStore } from "@services/vector-db";
import { sql } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import type { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Queue } from "sst/node/queue";
import { v4 as uuidV4 } from "uuid";
import { updateDataSource } from "./data-source";

export async function generatePageContentEmbeddings(
  name: string,
  url: string,
  dataSourceId: string,
  metadata: object
): Promise<void> {
  console.log(`Generating page content embeddings for url '${url}'`);
  let error: any | undefined = undefined;
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
        console.log(`Loading documents from url '${url}'`);
        docs = await loader.load();
        console.log(`Loaded ${docs.length} documents from url '${url}'.`);

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: vectorDBConfig.docEmbeddingContentLength,
          chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
        });
        console.log("Splitting documents.");
        docs = await splitter.invoke(docs, {});
        console.log(`Split into ${docs.length} documents from url '${url}'.`);
      }

      console.log("Adding metadata to documents.");
      docs = docs.map((doc) => {
        doc.metadata = {
          ...metadata,
          ...doc.metadata,
          indexDate: new Date().toISOString(),
          type: "webpage",
          dataSourceId,
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

      await updateDataSource(dataSourceId, {
        numberOfDocuments: sql`${dataSources.numberOfDocuments} + ${docs.length}`,
      });

      error = undefined;
      break;
    } catch (err: any) {
      console.error("Failed attempt:", err);
      error = err;
    }
  }
  if (error) {
    throw new Error(
      `Failed to generate page content embeddings for url '${url}'\n${error.stack}`
    );
  }
}

export async function getSitemaps(url: string): Promise<string[]> {
  const response = await axios.get(`${url}/robots.txt`, {});
  if (response.status === 200) {
    const text: string = response.data;
    const lines = text.split("\n");
    const sitemapLines = lines.filter((line) =>
      line.toLowerCase().includes("sitemap")
    );
    const sitemapUrls: Set<string> = new Set<string>(
      sitemapLines.map((line) => {
        const url = line.split(": ")[1].trim();
        return url;
      })
    );
    return Array.from(sitemapUrls);
  }
  return [];
}

export async function navigateSitemap(
  url: string,
  urlRegex: RegExp,
  name: string,
  indexOpId: string
): Promise<number> {
  let urlCount = 0;
  try {
    // Fetch the sitemap XML content
    const { data: sitemapXml } = await axios.get(url!);

    // Parse the XML string to an XML Object
    const parser = new XMLParser({});
    const sitemapXmlObj = parser.parse(sitemapXml) as any;

    let sitemapUrls: any[] = [];
    if (sitemapXmlObj.urlset) {
      sitemapUrls = sitemapXmlObj.urlset.url;
    } else if (sitemapXmlObj.sitemapindex) {
      sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
    } else {
      console.debug(`sitemapXmlObj: ${JSON.stringify(sitemapXmlObj)}`);
    }

    let siteMapUrlsArray = [];
    if (Array.isArray(sitemapUrls)) {
      siteMapUrlsArray = sitemapUrls;
    } else {
      siteMapUrlsArray = [sitemapUrls];
    }

    const failed: string[][] = [];
    const foundUrls: string[] = siteMapUrlsArray.map(
      (sitemapObj) => sitemapObj.loc
    );

    const indexableUrls = foundUrls.filter((url) => urlRegex.test(url));
    if (indexableUrls.length > 0) {
      console.log(
        `Found ${
          indexableUrls.length
        } indexable urls from sitemap: ${JSON.stringify(indexableUrls)}`
      );

      const sliceSize = 10;
      for (let i = 0; i < indexableUrls.length; i += sliceSize) {
        const indexableUrlsSlice = indexableUrls.slice(i, i + sliceSize);
        try {
          await sendUrlsToQueue(name, indexableUrlsSlice, indexOpId);
          urlCount += indexableUrlsSlice.length;
        } catch (err: any) {
          console.error(
            `Error sending index url message to queue: ${err.stack}`
          );
          failed.push(indexableUrlsSlice);
        }
      }
    }

    const additionalSitemaps = foundUrls.filter((url) => url.endsWith(".xml"));
    try {
      for (const additionalSitemap of additionalSitemaps) {
        console.log(`Found additional sitemap: ${additionalSitemap}`);
        urlCount += await navigateSitemap(
          additionalSitemap,
          urlRegex,
          name,
          indexOpId
        );
      }
    } catch (err: any) {
      console.error(`Error navigating additional sitemaps: ${err.stack}`);
      failed.push(additionalSitemaps);
    }

    if (failed.length > 0) {
      console.error(
        `Failed to navigate ${
          failed.length
        } urls from sitemap\n${JSON.stringify(failed)}`
      );
      throw new Error(
        `Failed to navigate ${
          failed.length
        } urls from sitemap\n${JSON.stringify(failed)}`
      );
    }
  } catch (err: any) {
    console.error(`Error navigating sitemap: ${err.stack}`);
    throw err;
  }
  return urlCount;
}

async function sendUrlsToQueue(
  name: string,
  urls: string[],
  indexOpId: string
) {
  const sqsClient = new SQSClient({});
  const sendMessageCommand = new SendMessageBatchCommand({
    QueueUrl: Queue.webpageIndexQueue.queueUrl,
    Entries: urls.map((url) => ({
      Id: uuidV4(),
      MessageBody: JSON.stringify({
        name,
        url,
        indexOpId,
      }),
    })),
  });
  const sendMessageResponse = await sqsClient.send(sendMessageCommand);
  if (sendMessageResponse.$metadata.httpStatusCode !== 200) {
    console.error(
      "Failed to send message to SQS:",
      JSON.stringify(sendMessageResponse)
    );
    throw new Error(
      `Failed to send message to SQS: ${JSON.stringify(sendMessageResponse)}`
    );
  }
}

export function getFileNameFromUrl(url: string) {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return filename;
}

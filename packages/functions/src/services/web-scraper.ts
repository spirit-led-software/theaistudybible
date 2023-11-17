import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { axios, vectorDBConfig } from "@core/configs";
import { PuppeteerCoreWebBaseLoader } from "@core/langchain/document_loaders/puppeteer-core";
import {
  getDataSourceOrThrow,
  getIndexOperation,
  updateDataSource,
  updateIndexOperation,
} from "@services/data-source";
import { getDocumentVectorStore } from "@services/vector-db";
import { XMLParser } from "fast-xml-parser";
import type { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Queue } from "sst/node/queue";

export async function generatePageContentEmbeddings(
  name: string,
  url: string,
  dataSourceId: string,
  metadata: object
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
        console.log(`Loading documents from url '${url}'`);
        docs = await loader.load();
        console.log(`Loaded ${docs.length} documents from url '${url}'.`);

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: vectorDBConfig.docEmbeddingContentLength,
          chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
        });
        console.log("Splitting documents.");
        docs = await splitter.invoke(docs);
        console.log(`Split into ${docs.length} documents from url '${url}'.`);
      }

      console.log("Adding metadata to documents.");
      docs = docs.map((doc) => {
        doc.metadata = {
          ...metadata,
          ...doc.metadata,
          dataSourceId,
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

      let dataSource = await getDataSourceOrThrow(dataSourceId);
      dataSource = await updateDataSource(dataSourceId, {
        numberOfDocuments: dataSource.numberOfDocuments + docs.length,
      });

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

    let sitemapUrls = [];
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

    for (let i = 0; i < siteMapUrlsArray.length; i++) {
      const foundUrl: string = sitemapUrls[i].loc;
      if (foundUrl) {
        if (foundUrl.endsWith(".xml")) {
          urlCount += await navigateSitemap(
            foundUrl,
            urlRegex,
            name,
            indexOpId
          );
        } else if (urlRegex.test(foundUrl)) {
          await sendUrlToQueue(name, foundUrl, indexOpId);
          urlCount++;
        }
      }
    }
  } catch (err: any) {
    console.error(`Error navigating sitemap: ${err.stack}`);
    throw err;
  }
  return urlCount;
}

async function sendUrlToQueue(name: string, url: string, indexOpId: string) {
  const sendMessageCommand = new SendMessageCommand({
    QueueUrl: Queue.webpageIndexQueue.queueUrl,
    MessageBody: JSON.stringify({
      name,
      url,
      indexOpId,
    }),
  });
  const sqsClient = new SQSClient({});
  const sendMessageResponse = await sqsClient.send(sendMessageCommand);
  if (sendMessageResponse.$metadata.httpStatusCode !== 200) {
    console.error(
      "Failed to send message to SQS:",
      JSON.stringify(sendMessageResponse)
    );
    let indexOp = await getIndexOperation(indexOpId);
    await updateIndexOperation(indexOp!.id, {
      status: "FAILED",
      errorMessages: [
        ...(indexOp!.errorMessages ?? []),
        `Error sending url to SQS: ${JSON.stringify(sendMessageResponse)}`
      ]
    });
  }
}

export function getFileNameFromUrl(url: string) {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return filename;
}

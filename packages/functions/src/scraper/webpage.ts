import { IndexOperation } from "@chatesv/core/database/model";
import {
  createIndexOperation,
  getIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { addDocumentsToVectorStore } from "@core/services/vector-db";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { TokenTextSplitter } from "langchain/text_splitter";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  console.log("Event received:", event);
  console.log(process.env);

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing body",
      }),
    };
  }

  const { name, url, indexOpId } = JSON.parse(event.body);
  if (!url || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields",
      }),
    };
  }

  let indexOp: IndexOperation | undefined;
  let indexOpMetadata: any = undefined;
  try {
    if (indexOpId) {
      indexOp = await getIndexOperation(indexOpId);
    } else {
      indexOp = await createIndexOperation({
        status: "IN_PROGRESS",
        type: "WEBPAGE",
        metadata: {
          name,
          url,
        },
      });
    }

    if (!indexOp) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Index operation with id ${indexOpId} not found`,
        }),
      };
    }

    indexOpMetadata = (indexOp!.metadata as any) ?? {};

    generatePageContentEmbeddings(name, url)
      .then(() => {
        updateIndexOperation(indexOpId, {
          metadata: {
            ...indexOpMetadata,
            completed: [
              ...(indexOpMetadata.completed ?? []),
              {
                name,
                url,
              },
            ],
          },
        });
      })
      .catch((err) => {
        updateIndexOperation(indexOpId, {
          status: "FAILED",
          metadata: {
            ...indexOpMetadata,

            errors: [
              ...(indexOpMetadata.errors ?? []),
              {
                message: err.message,
                stack: err.stack,
              },
            ],
            failed: [
              ...(indexOpMetadata.failed ?? []),
              {
                name,
                url,
              },
            ],
          },
        });
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Started indexing url",
        url,
      }),
    };
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOpMetadata,
          errors: [
            ...(indexOpMetadata.errors ?? []),
            {
              message: err.message,
              stack: err.stack,
            },
          ],
          failed: [
            ...(indexOpMetadata.failed ?? []),
            {
              name,
              url,
            },
          ],
        },
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.stack,
      }),
    };
  }
});

async function generatePageContentEmbeddings(
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

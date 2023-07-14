import { websiteConfig } from "@configs/index";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { IndexOperationStatus, IndexOpertationType } from "@prisma/client";
import {
  createIndexOperation,
  getIndexOperations,
  updateIndexOperation,
} from "@services//index-op";
import { isAdmin, validServerSession } from "@services//user";
import { addDocumentsToVectorStore } from "@services//vector-db";
import {
  Page,
  PuppeteerWebBaseLoader,
} from "langchain/document_loaders/web/puppeteer";
import { TokenTextSplitter } from "langchain/text_splitter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  const { name, url, pathRegex } = data;

  if (!name || !url) {
    return BadRequestResponse("Must supply name and url");
  }

  let urlRegex: RegExp;
  if (pathRegex) {
    urlRegex = new RegExp(`${url}${pathRegex}`);
  } else {
    urlRegex = new RegExp(`${url}/.*`);
  }

  try {
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    const runningOps = await getIndexOperations({
      query: {
        status: IndexOperationStatus.IN_PROGRESS,
      },
      limit: 1,
    });
    if (runningOps.length > 0) {
      return BadRequestResponse(
        "There is already an index operation running, try again later."
      );
    }

    const indexOp = await createIndexOperation({
      type: IndexOpertationType.WEBSITE,
      status: IndexOperationStatus.IN_PROGRESS,
      metadata: {
        name,
        url,
        pathRegex,
      },
    });

    const sitemapUrls = await getSitemaps(url);
    console.debug(`sitemapUrls: ${sitemapUrls}`);
    Promise.all(
      sitemapUrls.map(async (sitemapUrl) => {
        const foundUrls = await navigateSitemap(sitemapUrl, urlRegex);
        console.debug(`foundUrls: ${foundUrls}`);
        await scrapePages(name, foundUrls);
      })
    )
      .then(async () => {
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.COMPLETED,
          metadata: {
            ...(indexOp.metadata as any),
          },
        });
      })
      .catch(async (err) => {
        console.error(err);
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.FAILED,
          metadata: {
            ...(indexOp.metadata as any),
            error: `${err.stack}`,
          },
        });
      });

    return OkResponse({
      message: "Started website index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

async function scrapePages(name: string, urls: string[]): Promise<void> {
  const maxConcurrentWorkers = 2;
  let runningWorkers = 0;
  const workers: Promise<void>[] = [];
  while (urls.length > 0) {
    const url = urls.pop();
    if (runningWorkers >= maxConcurrentWorkers) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    runningWorkers++;
    const worker = generatePageContentEmbeddings(name, url!)
      .then(() => {
        runningWorkers--;
      })
      .catch((err) => {
        console.error(`${err.stack}`);
        runningWorkers--;
      });
    workers.push(worker);
  }
  await Promise.all(workers);
}

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
        evaluate: async (page: Page) => {
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

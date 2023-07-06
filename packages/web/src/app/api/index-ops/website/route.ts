import axios from "@client/axios";
import { websiteConfig } from "@configs/index";
import { prisma } from "@server/database";
import { getVectorStore } from "@server/vector-db";
import { XMLParser } from "fast-xml-parser";
import {
  Page,
  PuppeteerWebBaseLoader,
} from "langchain/document_loaders/web/puppeteer";
import { TokenTextSplitter } from "langchain/text_splitter";
import { VectorStore } from "langchain/vectorstores/base";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  const { url, pathRegex } = data;
  let urlRegex: RegExp;
  if (pathRegex) {
    urlRegex = new RegExp(`${url}${pathRegex}`);
  } else {
    urlRegex = new RegExp(`${url}/.*`);
  }

  const indexOp = await prisma.indexOperation.create({
    data: {
      type: "website",
      status: "running",
      metadata: {
        url,
        pathRegex,
      },
    },
  });

  const vectorStore = await getVectorStore();
  const sitemapUrls = await getSitemaps(url);
  console.debug(`sitemapUrls: ${sitemapUrls}`);
  Promise.all(
    sitemapUrls.map(async (sitemapUrl) => {
      const foundUrls = await navigateSitemap(sitemapUrl, urlRegex);
      console.debug(`foundUrls: ${foundUrls}`);
      await scrapePages(foundUrls, vectorStore);
    })
  )
    .then(async () => {
      await prisma.indexOperation.update({
        where: {
          id: indexOp.id,
        },
        data: {
          status: "completed",
        },
      });
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.indexOperation.update({
        where: {
          id: indexOp.id,
        },
        data: {
          status: "failed",
        },
      });
    });

  return new NextResponse(
    JSON.stringify({
      message: "Started website index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    }),
    {
      status: 200,
    }
  );
}

async function getSitemaps(url: string): Promise<string[]> {
  const response = await axios.get(`${url}/robots.txt`, {});
  if (response.status === 200) {
    const text: string = response.data;
    const lines = text.split("\n");
    const sitemapLines = lines.filter((line) =>
      line.toLowerCase().includes("sitemap")
    );
    const sitemapUrls = sitemapLines.map((line) => {
      const url = line.split(": ")[1].trim();
      return url;
    });
    return sitemapUrls.filter(
      (url, index) => sitemapUrls.indexOf(url) === index
    );
  }
  return [];
}

async function navigateSitemap(
  initialUrl: string,
  urlRegex: RegExp
): Promise<string[]> {
  const urls: string[] = [];
  const stack = [initialUrl];
  while (stack.length > 0) {
    const url = stack.pop();
    try {
      // Fetch the sitemap XML content
      const { data: sitemapXml } = await axios.get(url!);

      // Parse the XML string to an XML Object
      const parser = new XMLParser();
      const sitemapXmlObj = parser.parse(sitemapXml);

      const urlMapper = async (foundUrlObj: any) => {
        const foundUrl = foundUrlObj.loc;
        if (foundUrl) {
          if (foundUrl.endsWith(".xml")) {
            stack.push(foundUrl);
          } else if (foundUrl.match(urlRegex)) {
            urls.push(foundUrl);
          } else {
            console.debug(`Skipping URL: ${foundUrl}`);
          }
        }
      };

      let sitemapUrls = [];
      if (sitemapXmlObj.urlset) {
        sitemapUrls = sitemapXmlObj.urlset.url;
      } else if (sitemapXmlObj.sitemapindex) {
        sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
      } else {
        console.debug(`sitemapXmlObj: ${JSON.stringify(sitemapXmlObj)}`);
      }

      if (Array.isArray(sitemapUrls)) {
        await Promise.all(sitemapUrls.map(urlMapper));
      } else {
        await urlMapper(sitemapUrls);
      }
    } catch (err: any) {
      console.error(`${err.stack}`);
    }
  }
  return urls.filter((url, index) => urls.indexOf(url) === index);
}

async function scrapePages(
  urls: string[],
  vectorStore: VectorStore
): Promise<void> {
  const maxWorkers = 4;
  let runningWorkers = 0;
  const workers: Promise<void>[] = [];
  while (urls.length > 0) {
    const url = urls.pop();
    if (runningWorkers >= maxWorkers) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }
    runningWorkers++;
    const worker = generatePageContentEmbeddings(url!, vectorStore)
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
  url: string,
  vectorStore: VectorStore
): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          args: ["--no-sandbox"],
        },
        evaluate: async (page: Page) => {
          await page.waitForNetworkIdle();
          await page.waitForSelector("body");
          return await page.evaluate(() => {
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
          indexDate: new Date().toISOString(),
          source: url,
          type: "Webpage",
        };
        return doc;
      });
      console.log(`Obtained ${docs.length} documents from url '${url}'`);
      await vectorStore.addDocuments(docs);
      return;
    } catch (err: any) {
      console.error(`${err.stack}`);
      retries--;
    }
  }
  throw new Error("Failed to generate page content embeddings");
}

import { addDocumentsToVectorStore } from "@core/services/vector-db";
import { Document } from "langchain/document";
import {
  BaseDocumentLoader,
  DocumentLoader,
} from "langchain/document_loaders/base";
import { TokenTextSplitter } from "langchain/text_splitter";
import type {
  Browser,
  Page,
  PuppeteerLaunchOptions,
  WaitForOptions,
} from "puppeteer-core";

type PuppeteerGotoOptions = WaitForOptions & {
  referer?: string;
  referrerPolicy?: string;
};

type PuppeteerEvaluate = (page: Page, browser: Browser) => Promise<string>;

type PuppeteerWebBaseLoaderOptions = {
  launchOptions?: PuppeteerLaunchOptions;
  gotoOptions?: PuppeteerGotoOptions;
  evaluate?: PuppeteerEvaluate;
};

class CustomPuppeteerWebBaseLoader
  extends BaseDocumentLoader
  implements DocumentLoader
{
  options: PuppeteerWebBaseLoaderOptions | undefined;

  constructor(public webPath: string, options?: PuppeteerWebBaseLoaderOptions) {
    super();
    this.options = options;
  }

  async _scrape(
    url: string,
    options?: PuppeteerWebBaseLoaderOptions
  ): Promise<string> {
    const { launch, chromium } = await this.imports();

    const browser = await launch({
      headless: chromium.headless,
      args: [...chromium.args, "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.IS_LOCAL
        ? undefined
        : await chromium.executablePath(),
      ...options?.launchOptions,
    });
    const page = await browser.newPage();

    await page.goto(url, {
      timeout: 180000,
      waitUntil: "domcontentloaded",
      ...options?.gotoOptions,
    });
    const bodyHTML = options?.evaluate
      ? await options?.evaluate(page, browser)
      : await page.evaluate(() => document.body.innerHTML);

    await browser.close();

    return bodyHTML;
  }

  scrape(): Promise<string> {
    return this._scrape(this.webPath, this.options);
  }

  async load(): Promise<Document[]> {
    const text = await this.scrape();

    const metadata = { source: this.webPath };
    return [new Document({ pageContent: text, metadata })];
  }

  async imports() {
    try {
      const { launch } = await import("puppeteer-core");
      const chromiumImport = await import("@sparticuz/chromium");
      const chromium = chromiumImport.default;

      return { launch, chromium };
    } catch (err) {
      console.error(err);
      throw new Error(
        "Make sure puppeteer-core and @sparticuz/chromium are installed"
      );
    }
  }
}

export async function generatePageContentEmbeddings(
  name: string,
  url: string
): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      let pageTitle = `${url}`;
      const loader = new CustomPuppeteerWebBaseLoader(url, {
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

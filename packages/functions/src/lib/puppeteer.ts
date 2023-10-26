import chromium from "@sparticuz/chromium";
import { Document } from "langchain/document";
import {
  BaseDocumentLoader,
  type DocumentLoader,
} from "langchain/document_loaders/base";
import {
  Browser,
  Page,
  launch,
  type PuppeteerLaunchOptions,
  type WaitForOptions,
} from "puppeteer-core";

export type PuppeteerCoreGoToOptions = WaitForOptions & {
  referer?: string;
  referrerPolicy?: string;
};

export type PuppeteerCoreEvaluate = (
  page: Page,
  browser: Browser
) => Promise<string>;

export type PuppeteerCoreWebBaseLoaderOptions = {
  launchOptions?: PuppeteerLaunchOptions;
  gotoOptions?: PuppeteerCoreGoToOptions;
  evaluate?: PuppeteerCoreEvaluate;
};

export class PuppeteerCoreWebBaseLoader
  extends BaseDocumentLoader
  implements DocumentLoader
{
  options: PuppeteerCoreWebBaseLoaderOptions | undefined;

  constructor(
    public webPath: string,
    options?: PuppeteerCoreWebBaseLoaderOptions
  ) {
    super();
    this.options = options;
  }

  static async _scrape(
    url: string,
    options?: PuppeteerCoreWebBaseLoaderOptions
  ): Promise<{ title: string; content: string }> {
    console.log(`Launching puppeteer for url '${url}'`);
    const browser = await launch({
      headless: chromium.headless,
      args: [...chromium.args, "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      ...options?.launchOptions,
    });

    console.log(`Puppeteer launched for url '${url}'. Loading page...`);
    const page = await browser.newPage();
    await page.goto(url, {
      timeout: 180000,
      waitUntil: "domcontentloaded",
      ...options?.gotoOptions,
    });

    console.log(`Page loaded for url '${url}'. Scraping...`);
    const bodyHTML = options?.evaluate
      ? await options?.evaluate(page, browser)
      : await page.evaluate(() => document.body.innerHTML);

    console.log(`Scraped url '${url}'. Closing all pages...`);
    const pages = await browser.pages();
    await Promise.all(pages.map(async (page) => await page.close()));

    console.log(`Pages closed for '${url}'. Closing browser...`);
    await browser.close();

    return {
      title: await page.title(),
      content: bodyHTML,
    };
  }

  async scrape() {
    return await PuppeteerCoreWebBaseLoader._scrape(this.webPath, this.options);
  }

  async load() {
    const { title, content } = await this.scrape();

    const metadata = { source: this.webPath, title };
    return [new Document({ pageContent: content, metadata })];
  }
}

import { VectorDBService } from '@modules/vector-db/vector-db.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { VectorStore } from 'langchain/vectorstores';
import { Worker } from 'worker_threads';

@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorDbService: VectorDBService,
  ) {}

  /**
   * This function retrieves sitemap URLs from a given website's robots.txt file.
   * @param {string} url - A string representing the base URL of a website. The function uses this URL to
   * fetch the website's robots.txt file and extract any sitemap URLs listed in it.
   * @returns The function `getSitemaps` returns a promise that resolves to an array of strings. The
   * array contains URLs of sitemaps that are found in the `robots.txt` file of the provided `url`. If
   * the `robots.txt` file is not found or the response status is not 200, an empty array is returned.
   */
  async getSitemaps(url: string): Promise<string[]> {
    const response = await axios
      .create(this.configService.get('axios'))
      .get(`${url}/robots.txt`, {});
    if (response.status === 200) {
      const text: string = response.data;
      const lines = text.split('\n');
      const sitemapLines = lines.filter((line) =>
        line.toLowerCase().includes('sitemap'),
      );
      const sitemapUrls = sitemapLines.map((line) => {
        const url = line.split(': ')[1].trim();
        return url;
      });
      return sitemapUrls.filter(
        (url, index) => sitemapUrls.indexOf(url) === index,
      );
    }
    return [];
  }

  /**
   * The function `navigateSitemap` fetches and parses sitemap XML content to extract URLs that match a
   * given regular expression.
   * @param {string} initialUrl - The starting URL from where the sitemap navigation should begin.
   * @param {string} urlRegex - The `urlRegex` parameter is a regular expression string that is used to
   * match against URLs found in the sitemap. Only URLs that match this regular expression will be added
   * to the `urls` array.
   * @returns The function `navigateSitemap` is returning a Promise that resolves to an array of strings,
   * which are URLs that match the provided `urlRegex` pattern.
   */
  async navigateSitemap(
    initialUrl: string,
    urlRegex: RegExp,
  ): Promise<string[]> {
    const urls = [];
    const stack = [initialUrl];
    while (stack.length > 0) {
      const url = stack.pop();
      try {
        // Fetch the sitemap XML content
        const { data: sitemapXml } = await axios.get(url);

        // Parse the XML string to an XML Object
        const parser = new XMLParser();
        const sitemapXmlObj = parser.parse(sitemapXml);

        const urlMapper = async (foundUrlObj) => {
          const foundUrl = foundUrlObj.loc;
          if (foundUrl) {
            if (foundUrl.endsWith('.xml')) {
              stack.push(foundUrl);
            } else if (foundUrl.match(urlRegex)) {
              urls.push(foundUrl);
            } else {
              this.logger.debug(`Skipping URL: ${foundUrl}`);
            }
          }
        };

        let sitemapUrls = [];
        if (sitemapXmlObj.urlset) {
          sitemapUrls = sitemapXmlObj.urlset.url;
        } else if (sitemapXmlObj.sitemapindex) {
          sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
        } else {
          this.logger.debug(`sitemapXmlObj: ${JSON.stringify(sitemapXmlObj)}`);
        }

        if (Array.isArray(sitemapUrls)) {
          await Promise.all(sitemapUrls.map(urlMapper));
        } else {
          await urlMapper(sitemapUrls);
        }
      } catch (err) {
        this.logger.error(`${err.stack}`);
      }
    }
    return urls.filter((url, index) => urls.indexOf(url) === index);
  }

  /**
   * This function creates a worker that scrapes a webpage and returns a promise that resolves with the
   * scraped data.
   * @param {string} url - The URL of the webpage that the worker will scrape.
   * @returns A promise that resolves with the result of the page scraping operation performed by a
   * worker.
   */
  createPageScraperWorker(url: string, vectorStore: VectorStore) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`${__dirname}/workers/webpage-scraper.js`, {
        workerData: {
          url,
          vectorStore,
        },
      });
      worker.on('message', (message) => {
        this.logger.debug(`Message from worker: ${message}`);
      });
      worker.on('exit', (code) => {
        if (code !== 0) {
          this.logger.error(`Worker stopped with exit code ${code}`);
          reject(code);
        }
        resolve(code);
      });
    });
  }

  /**
   * This function scrapes multiple web pages concurrently using worker threads.
   * @param {string[]} urls - An array of strings representing the URLs to be scraped.
   * @returns The function `scrapePages` is returning a Promise that resolves to an array of results from
   * each worker that was created to scrape the pages in the `urls` array.
   */
  async scrapePages(urls: string[], vectorStore: VectorStore): Promise<void> {
    const config = this.configService.get('webScraper');
    const maxWorkers = config.threads;
    let runningWorkers = 0;
    const workers = [];
    while (urls.length > 0) {
      const url = urls.pop();
      if (runningWorkers >= maxWorkers) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      runningWorkers++;
      const worker = this.createPageScraperWorker(url, vectorStore)
        .then((result) => {
          this.logger.log(
            `Webpage scraper worker finished with result: ${result}`,
          );
          runningWorkers--;
        })
        .catch((err) => {
          this.logger.error(`${err.stack}`);
          runningWorkers--;
        });
      workers.push(worker);
    }
    await Promise.all(workers);
  }

  /**
   * This function scrapes a website by getting sitemap URLs, navigating them with a path regex, and
   * generating page content embeddings.
   * @param {string} url - The URL of the website to be scraped.
   * @param {string} pathRegex - The `pathRegex` parameter is a regular expression used to match the URLs
   * in the sitemap that we want to scrape. Only URLs that match this regular expression will be
   * processed further.
   */
  async scrapeSite(url: string, pathRegex?: string) {
    let urlRegex: RegExp;
    if (pathRegex) {
      urlRegex = new RegExp(`${url}${pathRegex}`);
    } else {
      urlRegex = new RegExp(`${url}/.*`);
    }
    const vectorStore = await this.vectorDbService.getVectorStore();
    const sitemapUrls = await this.getSitemaps(url);
    this.logger.debug(`sitemapUrls: ${sitemapUrls}`);
    await Promise.all(
      sitemapUrls.map(async (sitemapUrl) => {
        const foundUrls = await this.navigateSitemap(sitemapUrl, urlRegex);
        this.logger.debug(`foundUrls: ${foundUrls}`);
        await this.scrapePages(foundUrls, vectorStore);
      }),
    );
  }
}

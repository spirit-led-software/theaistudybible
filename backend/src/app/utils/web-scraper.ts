import { Logger } from '@nestjs/common';
import '@tensorflow/tfjs-node';
import { XMLParser } from 'fast-xml-parser';
import { Worker } from 'worker_threads';
import { axios } from '../config/axios.config';
import { config } from '../config/web-scraper.config';
/**
 * This function retrieves sitemap URLs from a given website's robots.txt file.
 * @param {string} url - A string representing the base URL of a website. The function uses this URL to
 * fetch the website's robots.txt file and extract any sitemap URLs listed in it.
 * @returns The function `getSitemaps` returns a promise that resolves to an array of strings. The
 * array contains URLs of sitemaps that are found in the `robots.txt` file of the provided `url`. If
 * the `robots.txt` file is not found or the response status is not 200, an empty array is returned.
 */
export const getSitemaps = async (url: string): Promise<string[]> => {
  const response = await axios.get(`${url}/robots.txt`, {});
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
    return sitemapUrls;
  }
  return [];
};

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
export const navigateSitemap = async (
  initialUrl: string,
  urlRegex: RegExp,
): Promise<string[]> => {
  const urls: string[] = [];
  const stack: string[] = [initialUrl];
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
            Logger.debug(`Skipping URL: ${foundUrl}`);
          }
        }
      };

      let sitemapUrls = [];
      if (sitemapXmlObj.urlset) {
        sitemapUrls = sitemapXmlObj.urlset.url;
      } else if (sitemapXmlObj.sitemapindex) {
        sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
      } else {
        Logger.debug(`sitemapXmlObj: ${sitemapXmlObj}`);
      }

      if (Array.isArray(sitemapUrls)) {
        await Promise.all(sitemapUrls.map(urlMapper));
      } else {
        await urlMapper(sitemapUrls);
      }
    } catch (err) {
      Logger.error(err);
    }
  }
  return urls;
};

/**
 * This function creates a worker that scrapes a webpage and returns a promise that resolves with the
 * scraped data.
 * @param {string} url - The URL of the webpage that the worker will scrape.
 * @returns A promise that resolves with the result of the page scraping operation performed by a
 * worker.
 */
const createPageScraperWorker = (url: string) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      __dirname + '/../workers/page-scraper.worker.js',
      {
        workerData: {
          url,
        },
      },
    );
    worker.on('message', (message) => {
      Logger.log(`Message from worker: ${message}`);
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        Logger.error(`Worker stopped with exit code ${code}`);
        reject(code);
      }
      resolve(code);
    });
  });
};

/**
 * This function scrapes multiple web pages concurrently using worker threads.
 * @param {string[]} urls - An array of strings representing the URLs to be scraped.
 * @returns The function `scrapePages` is returning a Promise that resolves to an array of results from
 * each worker that was created to scrape the pages in the `urls` array.
 */
const scrapePages = async (urls: string[]) => {
  const maxWorkers = config.threads;
  let finishedUrls = 0;
  let runningWorkers = 0;
  const workers = [];
  while (finishedUrls < urls.length) {
    if (runningWorkers >= maxWorkers) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }
    runningWorkers++;
    const worker = createPageScraperWorker(urls[finishedUrls])
      .then((result) => {
        Logger.log(`Worker finished with result: ${result}`);
        runningWorkers--;
        finishedUrls++;
      })
      .catch((err) => {
        Logger.error(err);
        runningWorkers--;
        finishedUrls++;
      });
    workers.push(worker);
  }
  const results = await Promise.all(workers);
  Logger.log(`results: ${results}`);
  return results;
};

/**
 * This function scrapes a website by getting sitemap URLs, navigating them with a path regex, and
 * generating page content embeddings.
 * @param {string} url - The URL of the website to be scraped.
 * @param {string} pathRegex - The `pathRegex` parameter is a regular expression used to match the URLs
 * in the sitemap that we want to scrape. Only URLs that match this regular expression will be
 * processed further.
 */
export const scrapeSite = async (url: string, pathRegex: string) => {
  const urlRegex = new RegExp(`${url}${pathRegex}`);
  const sitemapUrls = await getSitemaps(url);
  Logger.log(`sitemapUrls: ${sitemapUrls}`);
  await Promise.all(
    sitemapUrls.map(async (sitemapUrl) => {
      const foundUrls = await navigateSitemap(sitemapUrl, urlRegex);
      Logger.log(`foundUrls: ${foundUrls}`);
      const results = await scrapePages(foundUrls);
      Logger.log(`scrapePages results: ${results}`);
    }),
  );
};

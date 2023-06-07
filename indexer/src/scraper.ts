import "@tensorflow/tfjs-node";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import {
  Browser,
  Page,
  PuppeteerWebBaseLoader,
} from "langchain/document_loaders/web/puppeteer";
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import weaviate from "weaviate-ts-client";

/**
 * This function retrieves sitemap URLs from a given website's robots.txt file.
 * @param {string} url - A string representing the base URL of a website. The function uses this URL to
 * fetch the website's robots.txt file and extract any sitemap URLs listed in it.
 * @returns The function `getSitemaps` returns a promise that resolves to an array of strings. The
 * array contains URLs of sitemaps that are found in the `robots.txt` file of the provided `url`. If
 * the `robots.txt` file is not found or the response status is not 200, an empty array is returned.
 */
export const getSitemaps = async (url: string): Promise<string[]> => {
  const response = await axios.get(`${url}/robots.txt`);
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
  urlRegex: RegExp
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
          if (foundUrl.endsWith(".xml")) {
            stack.push(foundUrl);
          } else if (foundUrl.match(urlRegex)) {
            urls.push(foundUrl);
          } else {
            console.debug("Skipping", foundUrl);
          }
        }
      };

      let sitemapUrls = [];
      if (sitemapXmlObj.urlset) {
        sitemapUrls = sitemapXmlObj.urlset.url;
      } else if (sitemapXmlObj.sitemapindex) {
        sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
      } else {
        console.log("sitemapXmlObj", sitemapXmlObj);
      }

      if (Array.isArray(sitemapUrls)) {
        await Promise.all(sitemapUrls.map(urlMapper));
      } else {
        await urlMapper(sitemapUrls);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return urls;
};

/**
 * This function generates embeddings for the content of a web page using Puppeteer and TensorFlow, and
 * stores them in a Weaviate database.
 * @param {string} url - The URL of the webpage that will be loaded and processed for generating page
 * content embeddings.
 */
const generatePageContentEmbeddings = async (url: string) => {
  let retry = 5;
  while (retry > 0) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          waitForInitialPage: true,
          timeout: 0,
          protocolTimeout: 0,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 0,
        },
        evaluate: async (page: Page, browser: Browser) => {
          let retries = 5;
          while (retries > 0) {
            return await page.evaluate(() => {
              let text = "";
              document.querySelectorAll("p").forEach((el) => {
                text += el.innerText;
              });
              return text;
            });
          }
        },
      });
      const docs = await loader.loadAndSplit();
      console.debug(docs);

      const embeddings = new TensorFlowEmbeddings();

      const client = weaviate.client({
        scheme: process.env.WEAVIATE_SCHEME,
        host: process.env.WEAVIATE_HOST,
        apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
      });

      await WeaviateStore.fromDocuments(docs, embeddings, {
        client,
        indexName: "Docs",
        textKey: "text",
      });
    } catch (err) {
      console.log(err);
      retry--;
    }
  }
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
  console.debug(sitemapUrls);
  for (const url of sitemapUrls) {
    await navigateSitemap(url, urlRegex).then(async (sitemapUrls) => {
      console.debug(sitemapUrls);
      for (const url of sitemapUrls) {
        await generatePageContentEmbeddings(url);
      }
    });
  }
};

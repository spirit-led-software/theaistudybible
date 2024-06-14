import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { db } from '@lib/server/database';
import { indexOperations } from '@theaistudybible/core/database/schema';
import axios from '@theaistudybible/core/lib/axios';
import type { IndexOperation } from '@theaistudybible/core/model/data-source/index-op';
import { createId } from '@theaistudybible/core/util/id';
import { eq, sql } from 'drizzle-orm';
import escapeStringRegexp from 'escape-string-regexp';
import { XMLParser } from 'fast-xml-parser';
import { Resource } from 'sst';
import { gunzipSync } from 'zlib';

export async function indexWebCrawl({
  dataSourceId,
  url,
  pathRegex: pathRegexString,
  name,
  metadata = {}
}: {
  dataSourceId: string;
  url: string;
  pathRegex?: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}): Promise<IndexOperation> {
  let indexOp: IndexOperation | undefined;
  let urlCount = 0;
  try {
    let baseUrl = url;
    let urlRegex: RegExp | undefined = undefined;
    let sitemapUrls: string[] | undefined = undefined;

    // if sitemap was provided, use that
    if (url.endsWith('.xml')) {
      sitemapUrls = [url];

      const urlObject = new URL(baseUrl);
      baseUrl = urlObject.origin;
    }
    // remove trailing slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    const baseUrlRegex = escapeStringRegexp(baseUrl);
    let regexString: string = `${baseUrlRegex}\\/.*`;
    if (pathRegexString) {
      regexString = `${baseUrlRegex}\\/${pathRegexString}`;
    }
    urlRegex = new RegExp(regexString);

    [indexOp] = await db
      .insert(indexOperations)
      .values({
        status: 'RUNNING',
        metadata: {
          ...metadata,
          succeededUrls: [],
          failedUrls: [],
          totalUrls: 0,
          name,
          baseUrl,
          urlRegex: urlRegex.source
        },
        dataSourceId
      })
      .returning();

    if (!sitemapUrls) {
      sitemapUrls = await getSitemaps(baseUrl);
    }
    console.debug(`sitemapUrls: ${sitemapUrls}`);

    for (const sitemapUrl of sitemapUrls) {
      const { data: sitemapXml } = await axios.get(sitemapUrl);
      urlCount += await navigateSitemap(sitemapXml, urlRegex, name, indexOp!.id);
    }

    console.log(`Successfully crawled ${urlCount} urls. Updating index op status.`);
    [indexOp] = await db
      .update(indexOperations)
      .set({
        metadata: sql`${indexOperations.metadata} || ${JSON.stringify({
          totalUrls: urlCount
        })}`
      })
      .where(eq(indexOperations.id, indexOp.id))
      .returning();

    return indexOp;
  } catch (err) {
    console.error(`Error crawling url '${url}':`, err);
    if (indexOp) {
      [indexOp] = await db
        .update(indexOperations)
        .set({
          status: 'FAILED',
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
      if (urlCount > 0) {
        [indexOp] = await db
          .update(indexOperations)
          .set({
            metadata: sql`${indexOperations.metadata} || ${JSON.stringify({
              totalUrls: urlCount
            })}`
          })
          .where(eq(indexOperations.id, indexOp.id))
          .returning();
      }
    }
    throw err;
  }
}

export async function getSitemaps(url: string): Promise<string[]> {
  const response = await axios.get(`${url}/robots.txt`, {});
  if (response.status === 200) {
    const text: string = response.data;
    const lines = text.split('\n');
    const sitemapLines = lines.filter((line) => line.toLowerCase().includes('sitemap'));
    const sitemapUrls: Set<string> = new Set<string>(
      sitemapLines.map((line) => {
        return line.split(': ')[1].trim();
      })
    );
    return Array.from(sitemapUrls);
  }
  return [];
}

export async function navigateSitemap(
  sitemapXml: string,
  urlRegex: RegExp,
  name: string,
  indexOpId: string
): Promise<number> {
  let urlCount = 0;
  try {
    // Parse the XML string to an XML Object
    const parser = new XMLParser({});
    const sitemapXmlObj = parser.parse(sitemapXml);

    let sitemapUrls: { loc: string }[] = [];
    if (sitemapXmlObj.urlset) {
      sitemapUrls = sitemapXmlObj.urlset.url;
    } else if (sitemapXmlObj.sitemapindex) {
      sitemapUrls = sitemapXmlObj.sitemapindex.sitemap;
    } else {
      console.debug(`sitemapXmlObj: ${JSON.stringify(sitemapXmlObj)}`);
    }

    let siteMapUrlsArray: { loc: string }[] = [];
    if (Array.isArray(sitemapUrls)) {
      siteMapUrlsArray = sitemapUrls;
    } else {
      siteMapUrlsArray = [sitemapUrls];
    }

    const failed: string[][] = [];
    const foundUrls: string[] = siteMapUrlsArray.map((sitemapObj) => sitemapObj.loc);

    const indexableUrls = foundUrls.filter((url) => urlRegex.test(url));
    if (indexableUrls.length > 0) {
      console.log(
        `Found ${indexableUrls.length} indexable urls from sitemap: ${JSON.stringify(
          indexableUrls
        )}`
      );

      const sliceSize = 10;
      for (let i = 0; i < indexableUrls.length; i += sliceSize) {
        const indexableUrlsSlice = indexableUrls.slice(i, i + sliceSize);
        try {
          await sendUrlsToQueue(name, indexableUrlsSlice, indexOpId);
          urlCount += indexableUrlsSlice.length;
        } catch (err: unknown) {
          console.error(
            `Error sending urls to queue: ${
              err instanceof Error ? `${err.message}\n${err.stack}` : JSON.stringify(err)
            }`
          );
          failed.push(indexableUrlsSlice);
        }
      }
    }

    const additionalSitemaps = foundUrls.filter((url) => url.endsWith('.xml'));
    try {
      for (const additionalSitemap of additionalSitemaps) {
        console.log(`Found additional sitemap: ${additionalSitemap}`);
        const { data: sitemapXml } = await axios.get(additionalSitemap);
        urlCount += await navigateSitemap(sitemapXml, urlRegex, name, indexOpId);
      }
    } catch (err: unknown) {
      console.error(
        `Error navigating additional sitemaps: ${
          err instanceof Error ? `${err.message}\n${err.stack}` : JSON.stringify(err)
        }`
      );
      failed.push(additionalSitemaps);
    }

    const gZippedSitemaps = foundUrls.filter((url) => url.endsWith('.xml.gz'));
    try {
      for (const gZippedSitemap of gZippedSitemaps) {
        console.log(`Found gzipped sitemap: ${gZippedSitemap}`);
        const { data: gZippedSitmapData } = await axios.get(gZippedSitemap, {
          responseType: 'arraybuffer'
        });
        const unZippedSitemapData = gunzipSync(Buffer.from(gZippedSitmapData));
        const sitemapXml = unZippedSitemapData.toString();
        urlCount += await navigateSitemap(sitemapXml, urlRegex, name, indexOpId);
      }
    } catch (err: unknown) {
      console.error(
        `Error navigating gzipped sitemaps: ${
          err instanceof Error ? `${err.message}\n${err.stack}` : JSON.stringify(err)
        }`
      );
      failed.push(gZippedSitemaps);
    }

    if (failed.length > 0) {
      console.error(
        `Failed to navigate ${failed.length} urls from sitemap\n${JSON.stringify(failed)}`
      );
      throw new Error(
        `Failed to navigate ${failed.length} urls from sitemap\n${JSON.stringify(failed)}`
      );
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error navigating sitemap: ${err.stack}`);
    } else {
      console.error(`Error navigating sitemap: ${JSON.stringify(err)}`);
    }
    throw err;
  }
  return urlCount;
}

async function sendUrlsToQueue(name: string, urls: string[], indexOpId: string) {
  const sqsClient = new SQSClient({});
  const sendMessageCommand = new SendMessageBatchCommand({
    QueueUrl: Resource.WebpageScraperQueue.url,
    Entries: urls.map((url) => ({
      Id: createId(),
      MessageBody: JSON.stringify({
        name,
        url,
        indexOpId
      })
    }))
  });
  const sendMessageResponse = await sqsClient.send(sendMessageCommand);
  if (sendMessageResponse.$metadata.httpStatusCode !== 200) {
    console.error('Failed to send message to SQS:', JSON.stringify(sendMessageResponse));
    throw new Error(`Failed to send message to SQS: ${JSON.stringify(sendMessageResponse)}`);
  }
}

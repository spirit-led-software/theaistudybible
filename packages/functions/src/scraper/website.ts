import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { axios } from "@core/configs/axios";
import {
  createIndexOperation,
  getIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { validApiSession } from "@core/services/session";
import { isAdmin } from "@core/services/user";
import { IndexOperation } from "@revelationsai/core/database/model";
import { XMLParser } from "fast-xml-parser";
import { ApiHandler } from "sst/node/api";
import { Queue } from "sst/node/queue";

type RequestBody = {
  url: string;
  pathRegex: string;
  name: string;
};

const sqsClient = new SQSClient({});

export const handler = ApiHandler(async (event) => {
  const { isValid, userInfo } = await validApiSession();
  if (!isValid) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Unauthorized",
      }),
    };
  }

  if (!(await isAdmin(userInfo.id))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "Forbidden",
      }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing body",
      }),
    };
  }

  const { url, pathRegex, name }: RequestBody = JSON.parse(event.body);
  if (!url || !pathRegex || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields",
      }),
    };
  }

  let indexOp: IndexOperation | undefined;
  try {
    indexOp = await createIndexOperation({
      type: "WEBSITE",
      status: "RUNNING",
      metadata: {
        name,
        url,
        pathRegex,
      },
    });

    let urlRegex: RegExp;
    let sitemapUrls: string[];
    if (url.endsWith(".xml")) {
      const baseUrl = `${url.substring(0, url.lastIndexOf("/"))}/.*`;
      if (pathRegex) {
        urlRegex = new RegExp(`${baseUrl}/${pathRegex}`);
      } else {
        urlRegex = new RegExp(`${baseUrl}/.*`);
      }
      sitemapUrls = [url];
    } else {
      if (pathRegex) {
        urlRegex = new RegExp(`${url}/${pathRegex}`);
      } else {
        urlRegex = new RegExp(`${url}/.*`);
      }
      sitemapUrls = await getSitemaps(url);
    }

    console.debug(`sitemapUrls: ${sitemapUrls}`);
    for (const sitemapUrl of sitemapUrls) {
      await navigateSitemap(sitemapUrl, urlRegex, name, indexOp.id);
    }
    indexOp = await getIndexOperation(indexOp.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Started indexing urls",
        indexOp,
      }),
    };
  } catch (err: any) {
    console.error(`${err.stack}`);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...(indexOp.metadata as any),
          error: err.stack,
        },
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: err.stack,
          indexOp,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.stack,
      }),
    };
  }
});

async function getSitemaps(url: string): Promise<string[]> {
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

async function navigateSitemap(
  url: string,
  urlRegex: RegExp,
  name: string,
  indexOpId: string
): Promise<void> {
  try {
    // Fetch the sitemap XML content
    const { data: sitemapXml } = await axios.get(url!);

    // Parse the XML string to an XML Object
    const parser = new XMLParser();
    const sitemapXmlObj = parser.parse(sitemapXml);

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
          await navigateSitemap(foundUrl, urlRegex, name, indexOpId);
        } else if (foundUrl.match(urlRegex)) {
          await sendUrlToQueue(name, foundUrl, indexOpId);
        } else {
          console.log(`Skipping url: ${foundUrl}`);
        }
      }
    }
  } catch (err: any) {
    console.error(`Error navigating sitemap: ${err.stack}`);
    throw err;
  }
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

  const sendMessageResponse = await sqsClient.send(sendMessageCommand);
  if (sendMessageResponse.$metadata.httpStatusCode !== 200) {
    console.error(
      "Failed to send message to SQS:",
      JSON.stringify(sendMessageResponse)
    );
    let indexOp = await getIndexOperation(indexOpId);
    await updateIndexOperation(indexOp!.id, {
      status: "FAILED",
      metadata: {
        ...(indexOp!.metadata as any),
        errors: [
          ...((indexOp!.metadata as any).errors ?? []),
          {
            url,
            error: `Failed to send message to SQS: ${sendMessageResponse.$metadata.httpStatusCode}`,
          },
        ],
      },
    });
  }
}

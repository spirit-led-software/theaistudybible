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

  const {
    url,
    pathRegex: pathRegexString,
    name,
  }: RequestBody = JSON.parse(event.body);
  if (!name || !url) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields name and url",
      }),
    };
  }

  let indexOp: IndexOperation | undefined;
  try {
    let baseUrl = url;
    let urlRegex: RegExp | undefined = undefined;
    let sitemapUrls: string[] | undefined = undefined;
    if (url.endsWith(".xml")) {
      sitemapUrls = [url];
      baseUrl = `${url.substring(0, url.lastIndexOf("/"))}`;
    }

    let regexString: string = `${baseUrl}/.*`;
    if (pathRegexString) {
      regexString = `${baseUrl}/${
        pathRegexString.startsWith("/")
          ? pathRegexString.substring(1)
          : pathRegexString
      }`;
    }
    const flags = regexString.replace(/.*\/([gimy]*)$/, "$1");
    const pattern = regexString.replace(
      new RegExp("^/(.*?)/" + flags + "$"),
      "$1"
    );
    urlRegex = new RegExp(pattern, flags);

    indexOp = await createIndexOperation({
      type: "WEBSITE",
      status: "RUNNING",
      metadata: {
        name,
        baseUrl,
        urlRegex: urlRegex.source,
      },
    });

    if (!sitemapUrls) {
      sitemapUrls = await getSitemaps(baseUrl);
    }
    console.debug(`sitemapUrls: ${sitemapUrls}`);

    let urlCount = 0;
    for (const sitemapUrl of sitemapUrls) {
      urlCount += await navigateSitemap(sitemapUrl, urlRegex, name, indexOp.id);
    }
    indexOp = await getIndexOperation(indexOp.id);
    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...(indexOp!.metadata as any),
        urlCount,
      },
    });

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
): Promise<number> {
  let urlCount = 0;
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
          urlCount += await navigateSitemap(
            foundUrl,
            urlRegex,
            name,
            indexOpId
          );
        } else if (RegExp(urlRegex).exec(foundUrl)) {
          await sendUrlToQueue(name, foundUrl, indexOpId);
          urlCount++;
        } else {
          console.log(`Skipping url: ${foundUrl}`);
        }
      }
    }
  } catch (err: any) {
    console.error(`Error navigating sitemap: ${err.stack}`);
    throw err;
  }
  return urlCount;
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

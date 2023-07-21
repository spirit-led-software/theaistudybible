import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { axios } from "@core/configs/axios";
import {
  createIndexOperation,
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
    if (pathRegex) {
      urlRegex = new RegExp(`${url}${pathRegex}`);
    } else {
      urlRegex = new RegExp(`${url}/.*`);
    }

    const sitemapUrls = await getSitemaps(url);
    console.debug(`sitemapUrls: ${sitemapUrls}`);
    const foundUrls: string[] = [];
    for (let i = 0; i < sitemapUrls.length; i++) {
      const urls = await navigateSitemap(sitemapUrls[i], urlRegex);
      foundUrls.push(...urls);
    }

    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...(indexOp!.metadata as any),
        numberOfUrls: foundUrls.length,
      },
    });

    for (let i = 0; i < foundUrls.length; i++) {
      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: Queue.webpageIndexQueue.queueUrl,
        MessageBody: JSON.stringify({
          name,
          url: foundUrls[i],
          indexOpId: indexOp.id,
        }),
      });

      const sendMessageResponse = await sqsClient.send(sendMessageCommand);
      if (sendMessageResponse.$metadata.httpStatusCode !== 200) {
        console.error(
          "Failed to send message to SQS:",
          JSON.stringify(sendMessageResponse)
        );
        indexOp = await updateIndexOperation(indexOp.id, {
          status: "FAILED",
          metadata: {
            ...(indexOp.metadata as any),
            errors: [
              ...((indexOp.metadata as any).errors ?? []),
              {
                url: foundUrls[i],
                error: `Failed to send message to SQS: ${sendMessageResponse.$metadata.httpStatusCode}`,
              },
            ],
          },
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Started indexing urls",
        urls: foundUrls,
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
  initialUrl: string,
  urlRegex: RegExp
): Promise<string[]> {
  const urls: Set<string> = new Set();
  const stack = [initialUrl];
  while (stack.length > 0) {
    const url = stack.pop();
    try {
      // Fetch the sitemap XML content
      const { data: sitemapXml } = await axios.get(url!);

      // Parse the XML string to an XML Object
      const parser = new XMLParser();
      const sitemapXmlObj = parser.parse(sitemapXml);

      const urlMapper = (foundUrlObj: any) => {
        const foundUrl = foundUrlObj.loc;
        if (foundUrl) {
          if (foundUrl.endsWith(".xml")) {
            stack.push(foundUrl);
          } else if (foundUrl.match(urlRegex)) {
            urls.add(foundUrl);
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

      let siteMapUrlsArray = [];
      if (Array.isArray(sitemapUrls)) {
        siteMapUrlsArray = sitemapUrls;
      } else {
        siteMapUrlsArray = [sitemapUrls];
      }

      for (let i = 0; i < siteMapUrlsArray.length; i++) {
        urlMapper(sitemapUrls[i]);
      }
    } catch (err: any) {
      console.error(`${err.stack}`);
    }
  }
  return Array.from(urls);
}

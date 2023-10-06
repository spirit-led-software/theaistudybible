import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { axios } from "@core/configs/axios";
import type { IndexOperation } from "@core/model";
import {
  BadRequestResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import {
  createIndexOperation,
  getIndexOperation,
  updateIndexOperation,
} from "@services/index-op";
import { validApiHandlerSession } from "@services/session";
import { isAdmin } from "@services/user";
import escapeStringRegexp from "escape-string-regexp";
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
  const { isValid, userWithRoles } = await validApiHandlerSession();
  if (!isValid) {
    return UnauthorizedResponse("You must be logged in to perform this action");
  }

  if (!(await isAdmin(userWithRoles.id))) {
    return ForbiddenResponse("You must be an admin to perform this action");
  }

  if (!event.body) {
    return BadRequestResponse("Missing request body");
  }

  const {
    url,
    pathRegex: pathRegexString,
    name,
  }: RequestBody = JSON.parse(event.body);
  if (!name || !url) {
    return BadRequestResponse("Name and url are required");
  }

  if (
    pathRegexString &&
    (pathRegexString.startsWith("/") ||
      pathRegexString.startsWith("\\/") ||
      pathRegexString.endsWith("/") ||
      pathRegexString.endsWith("\\/"))
  ) {
    return BadRequestResponse(
      "Path regex cannot start or end with a forward slash"
    );
  }

  let indexOp: IndexOperation | undefined;
  try {
    let baseUrl = url;
    let urlRegex: RegExp | undefined = undefined;
    let sitemapUrls: string[] | undefined = undefined;

    // if sitemap was provided, use that
    if (url.endsWith(".xml")) {
      sitemapUrls = [url];

      const urlObject = new URL(baseUrl);
      baseUrl = urlObject.origin;
    }
    // remove trailing slash
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    const baseUrlRegex = escapeStringRegexp(baseUrl);
    let regexString: string = `${baseUrlRegex}\\/.*`;
    if (pathRegexString) {
      regexString = `${baseUrlRegex}\\/${pathRegexString}`;
    }
    urlRegex = new RegExp(regexString);

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
      urlCount += await navigateSitemap(
        sitemapUrl,
        urlRegex,
        name,
        indexOp!.id
      );
    }
    indexOp = await getIndexOperation(indexOp!.id);
    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...indexOp!.metadata,
        urlCount,
      },
    });

    return OkResponse({
      message: "Website index operation started",
      indexOp,
    });
  } catch (err: any) {
    console.error(`${err.stack}`);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOp.metadata,
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

    return InternalServerErrorResponse(err.stack);
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
    const parser = new XMLParser({});
    const sitemapXmlObj = parser.parse(sitemapXml) as any;

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
        } else if (urlRegex.test(foundUrl)) {
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
        ...indexOp!.metadata,
        errors: [
          ...(indexOp!.metadata.errors ?? []),
          {
            url,
            error: `Failed to send message to SQS: ${sendMessageResponse.$metadata.httpStatusCode}`,
          },
        ],
      },
    });
  }
}

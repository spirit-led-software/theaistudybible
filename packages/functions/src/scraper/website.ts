import { IndexOperation } from "@chatesv/core/database/model";
import { axios } from "@core/configs/axios";
import {
  createIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { isAdmin, validApiSession } from "@core/services/user";
import AWS from "aws-sdk";
import { XMLParser } from "fast-xml-parser";
import { ApiHandler } from "sst/node/api";
import { Queue } from "sst/node/queue";

type RequestBody = {
  url: string;
  pathRegex: string;
  name: string;
};

export const handler = ApiHandler(async (event) => {
  const { isValid, userInfo, sessionToken } = await validApiSession();
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
    for (const sitemapUrl of sitemapUrls) {
      const urls = await navigateSitemap(sitemapUrl, urlRegex);
      foundUrls.push(...urls);
    }

    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...(indexOp!.metadata as any),
        numberOfUrls: foundUrls.length,
      },
    });

    foundUrls.forEach((url) => {
      new AWS.SQS()
        .sendMessage({
          QueueUrl: Queue.WebpageIndexQueue.queueUrl,
          MessageBody: JSON.stringify({
            url,
            name,
            indexOpId: indexOp!.id,
          }),
        })
        .promise()
        .catch(async (err) => {
          console.error(`${err.stack}`);
          indexOp = await updateIndexOperation(indexOp!.id, {
            status: "FAILED",
            metadata: {
              ...(indexOp!.metadata as any),
              errors: [...((indexOp!.metadata as any).errors ?? []), err.stack],
              failed: [...((indexOp!.metadata as any).failed ?? []), url],
            },
          });
        });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Started indexing urls",
        urls: foundUrls,
      }),
    };
  } catch (err: any) {
    console.error(`${err.stack}`);

    if (indexOp) {
      await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...(indexOp.metadata as any),
          error: err.message,
        },
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
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
    const sitemapUrls = sitemapLines.map((line) => {
      const url = line.split(": ")[1].trim();
      return url;
    });
    return sitemapUrls.filter(
      (url, index) => sitemapUrls.indexOf(url) === index
    );
  }
  return [];
}

async function navigateSitemap(
  initialUrl: string,
  urlRegex: RegExp
): Promise<string[]> {
  const urls: string[] = [];
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
            urls.push(foundUrl);
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

      if (Array.isArray(sitemapUrls)) {
        sitemapUrls.forEach(urlMapper);
      } else {
        urlMapper(sitemapUrls);
      }
    } catch (err: any) {
      console.error(`${err.stack}`);
    }
  }
  return urls.filter((url, index) => urls.indexOf(url) === index);
}

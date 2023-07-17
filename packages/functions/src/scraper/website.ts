import { IndexOperation } from "@chatesv/core/database/model";
import { axios } from "@core/configs/axios";
import {
  createIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { XMLParser } from "fast-xml-parser";
import { Api, ApiHandler } from "sst/node/api";

type RequestBody = {
  url: string;
  pathRegex: string;
  name: string;
};

export const handler = ApiHandler(async (event) => {
  console.log("Event received:", event);

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
      status: "IN_PROGRESS",
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

    foundUrls.forEach((url) => {
      axios
        .post(`${Api.api.url}/scraper/webpage`, {
          method: "POST",
          body: JSON.stringify({
            url,
            name,
            indexOpId: indexOp?.id,
          }),
        })
        .catch((err) => {
          console.error(`${err.stack}`);
          updateIndexOperation(indexOp!.id, {
            status: "FAILED",
            metadata: {
              ...(indexOp!.metadata as any),
              errors: [
                ...((indexOp!.metadata as any).errors ?? []),
                {
                  message: err.message,
                  stack: err.stack,
                },
              ],
              failed: [
                ...((indexOp!.metadata as any).failed ?? []),
                {
                  name,
                  url,
                },
              ],
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
          } else {
            console.debug(`Skipping URL: ${foundUrl}`);
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

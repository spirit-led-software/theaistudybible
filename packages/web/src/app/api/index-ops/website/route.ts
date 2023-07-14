import { websiteConfig } from "@configs/index";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { IndexOperationStatus, IndexOpertationType } from "@prisma/client";
import {
  createIndexOperation,
  getIndexOperations,
  updateIndexOperation,
} from "@services//index-op";
import { isAdmin, validServerSession } from "@services//user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();
  const { name, url, pathRegex } = data;

  if (!name || !url) {
    return BadRequestResponse("Must supply name and url");
  }

  let urlRegex: RegExp;
  if (pathRegex) {
    urlRegex = new RegExp(`${url}${pathRegex}`);
  } else {
    urlRegex = new RegExp(`${url}/.*`);
  }

  try {
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return UnauthorizedResponse();
    }

    const runningOps = await getIndexOperations({
      query: {
        status: IndexOperationStatus.IN_PROGRESS,
      },
      limit: 1,
    });
    if (runningOps.length > 0) {
      return BadRequestResponse(
        "There is already an index operation running, try again later."
      );
    }

    const indexOp = await createIndexOperation({
      type: IndexOpertationType.WEBSITE,
      status: IndexOperationStatus.IN_PROGRESS,
      metadata: {
        name,
        url,
        pathRegex,
      },
    });

    const sitemapUrls = await getSitemaps(url);
    console.debug(`sitemapUrls: ${sitemapUrls}`);
    Promise.all(
      sitemapUrls.map(async (sitemapUrl) => {
        const foundUrls = await navigateSitemap(sitemapUrl, urlRegex);
        console.debug(`foundUrls: ${foundUrls}`);
        await scrapePages(name, foundUrls);
      })
    )
      .then(async () => {
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.COMPLETED,
          metadata: {
            ...(indexOp.metadata as any),
          },
        });
      })
      .catch(async (err) => {
        console.error(err);
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.FAILED,
          metadata: {
            ...(indexOp.metadata as any),
            error: `${err.stack}`,
          },
        });
      });

    return OkResponse({
      message: "Started website index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

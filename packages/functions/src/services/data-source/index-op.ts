import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { axios, s3Config } from "@core/configs";
import type {
  CreateIndexOperationData,
  IndexOperation,
  UpdateIndexOperationData,
} from "@core/model";
import { indexOperations } from "@core/schema";
import { InternalServerErrorResponse } from "@lib/api-responses";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import {
  generatePageContentEmbeddings,
  getFileNameFromUrl,
  getSitemaps,
  navigateSitemap,
} from "@services/web-scraper";
import { SQL, desc, eq } from "drizzle-orm";
import escapeStringRegexp from "escape-string-regexp";

export async function getIndexOperations(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(indexOperations.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(indexOperations)
    .limit(limit)
    .offset(offset)
    .where(where)
    .orderBy(orderBy);
}

export async function getIndexOperation(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(indexOperations)
      .where(eq(indexOperations.id, id))
  ).at(0);
}

export async function getIndexOperationOrThrow(id: string) {
  const indexOperation = await getIndexOperation(id);
  if (!indexOperation) {
    throw new Error(`IndexOperation with id ${id} not found`);
  }
  return indexOperation;
}

export async function createIndexOperation(data: CreateIndexOperationData) {
  return (
    await readWriteDatabase.insert(indexOperations).values(data).returning()
  )[0];
}

export async function updateIndexOperation(
  id: string,
  data: UpdateIndexOperationData
) {
  return (
    await readWriteDatabase
      .update(indexOperations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}

export async function deleteIndexOperation(id: string) {
  return (
    await readWriteDatabase
      .delete(indexOperations)
      .where(eq(indexOperations.id, id))
      .returning()
  )[0];
}

export async function indexWebPage({
  dataSourceId,
  name,
  url,
  metadata = {},
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: object;
}): Promise<IndexOperation> {
  let indexOp: IndexOperation | undefined;
  try {
    indexOp = await createIndexOperation({
      status: "RUNNING",
      metadata: {
        ...metadata,
        name,
        url,
      },
      dataSourceId,
    });

    console.log(`Started indexing url '${url}'.`);
    await generatePageContentEmbeddings(name, url, dataSourceId, metadata);

    console.log(`Successfully indexed url '${url}'. Updating index op status.`);
    indexOp = await updateIndexOperation(indexOp?.id!, {
      status: "SUCCEEDED",
    });

    return indexOp;
  } catch (err: any) {
    console.error(err.stack);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: [
          ...(indexOp?.errorMessages ?? []),
          err.stack ?? err.message,
        ],
      });
    }
    throw err;
  }
}

export async function indexWebCrawl({
  dataSourceId,
  url,
  pathRegex: pathRegexString,
  name,
  metadata = {},
}: {
  dataSourceId: string;
  url: string;
  pathRegex?: string;
  name: string;
  metadata?: object;
}): Promise<IndexOperation> {
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
      status: "RUNNING",
      metadata: {
        ...metadata,
        name,
        baseUrl,
        urlRegex: urlRegex.source,
      },
      dataSourceId,
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
    return indexOp;
  } catch (err: any) {
    console.error(`${err.stack}`);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: [indexOp!.errorMessages, err.stack ?? err.message],
      });
    }
    throw err;
  }
}

export async function indexRemoteFile({
  dataSourceId,
  name,
  url,
  metadata = {},
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: object;
}) {
  const downloadResponse = await axios.get(url, {
    decompress: false,
    responseType: "arraybuffer",
  });

  const filename = getFileNameFromUrl(url);
  const contentType = downloadResponse.headers["content-type"];

  const s3Client = new S3Client({});
  const putCommandResponse = await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Config.indexFileBucket,
      Key: filename,
      ContentType: contentType,
      Body: downloadResponse.data,
      Metadata: {
        ...metadata,
        dataSourceId,
        name,
        url,
      },
    })
  );

  if (
    !putCommandResponse.$metadata?.httpStatusCode ||
    putCommandResponse.$metadata?.httpStatusCode !== 200
  ) {
    return InternalServerErrorResponse(
      `Failed to upload file to S3 ${putCommandResponse.$metadata?.httpStatusCode}`
    );
  }
}

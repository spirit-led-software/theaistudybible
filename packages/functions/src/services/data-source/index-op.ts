import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { axios, s3Config, vectorDBConfig } from "@core/configs";
import type {
  CreateIndexOperationData,
  DataSource,
  IndexOperation,
  UpdateIndexOperationData,
} from "@core/model";
import { indexOperations } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { getDocumentVectorStore } from "@services/vector-db";
import {
  generatePageContentEmbeddings,
  getFileNameFromUrl,
  getSitemaps,
  navigateSitemap,
} from "@services/web-scraper";
import { SQL, desc, eq, sql } from "drizzle-orm";
import escapeStringRegexp from "escape-string-regexp";
import { YoutubeLoader } from "langchain/document_loaders/web/youtube";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getDataSourceOrThrow, updateDataSource } from "./data-source";

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
  metadata?: any;
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
        errorMessages: sql`${
          indexOperations.errorMessages
        } || jsonb_build_array('${sql.raw(err.stack ?? err.message)}')`,
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
  metadata?: any;
}): Promise<IndexOperation> {
  let indexOp: IndexOperation | undefined;
  let urlCount = 0;
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
        succeededUrls: [],
        failedUrls: [],
        totalUrls: 0,
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

    for (const sitemapUrl of sitemapUrls) {
      urlCount += await navigateSitemap(
        sitemapUrl,
        urlRegex,
        name,
        indexOp!.id
      );
    }

    console.log(
      `Successfully crawled ${urlCount} urls. Updating index op status.`
    );
    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: sql`${indexOperations.metadata} || ${JSON.stringify({
        totalUrls: urlCount,
      })}`,
    });

    return indexOp;
  } catch (err: any) {
    console.error(`${err.stack}`);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: sql`${
          indexOperations.errorMessages
        } || jsonb_build_array('${sql.raw(err.stack ?? err.message)}')`,
      });
      if (urlCount > 0) {
        indexOp = await updateIndexOperation(indexOp.id, {
          metadata: sql`${indexOperations.metadata} || ${JSON.stringify({
            totalUrls: urlCount,
          })}`,
        });
      }
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
  metadata?: any;
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
    throw new Error(
      `Failed to upload file to S3 ${putCommandResponse.$metadata?.httpStatusCode}`
    );
  }
}

export async function indexYoutubeVideo({
  dataSourceId,
  name,
  url,
  metadata = {},
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: any;
}) {
  let indexOp: IndexOperation | undefined;
  try {
    let dataSource: DataSource | undefined;

    [indexOp, dataSource] = await Promise.all([
      createIndexOperation({
        status: "RUNNING",
        metadata: {
          ...metadata,
          name,
          url,
        },
        dataSourceId,
      }),
      getDataSourceOrThrow(dataSourceId),
    ]);

    const loader = YoutubeLoader.createFromUrl(url, {
      language: metadata.language ?? "en",
      addVideoInfo: true,
    });
    let docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: vectorDBConfig.docEmbeddingContentLength,
      chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
    });
    docs = await splitter.invoke(docs, {});

    console.log(`Successfully loaded ${docs.length} docs from youtube video.`);
    docs = docs.map((doc) => {
      doc.metadata = {
        ...metadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: "youtube",
        dataSourceId,
        name,
        url,
      };

      let newPageContent = `TITLE: ${doc.metadata.name}\n---\n${doc.pageContent}`;
      if (doc.metadata.title && doc.metadata.author) {
        newPageContent = `TITLE: "${doc.metadata.title}" by ${doc.metadata.author}\n---\n${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;

      return doc;
    });

    console.log("Adding documents to vector store");
    const vectorStore = await getDocumentVectorStore();
    await vectorStore.addDocuments(docs);

    console.log(`Successfully indexed youtube video '${url}'.`);
    indexOp = await updateIndexOperation(indexOp!.id, {
      status: "SUCCEEDED",
    });

    dataSource = await updateDataSource(dataSource.id, {
      numberOfDocuments: docs.length,
    });

    return indexOp;
  } catch (err: any) {
    console.error(err.stack);
    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: sql`${
          indexOperations.errorMessages
        } || jsonb_build_array('${sql.raw(err.stack ?? err.message)}')`,
      });
    }
    throw err;
  }
}

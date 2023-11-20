import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unstructuredConfig, vectorDBConfig } from "@core/configs";
import type { IndexOperation } from "@core/model";
import { indexOperations } from "@core/schema";
import { getDataSourceOrThrow, updateDataSource } from "@services/data-source";
import {
  createIndexOperation,
  updateIndexOperation,
} from "@services/data-source/index-op";
import { getDocumentVectorStore } from "@services/vector-db";
import type { S3Handler } from "aws-lambda";
import { sql } from "drizzle-orm";
import { mkdtempSync, writeFileSync } from "fs";
import type { BaseDocumentLoader } from "langchain/dist/document_loaders/base";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { tmpdir } from "os";
import { join } from "path";

const s3Client = new S3Client({});

export const handler: S3Handler = async (event) => {
  const records = event.Records;
  const { bucket, object } = records[0].s3;

  if (!bucket || !object) {
    throw new Error("Invalid S3 event");
  }

  const { key, size } = object;

  let indexOp: IndexOperation | undefined;
  try {
    const sanitizedKey = decodeURIComponent(key).replace(/\+/g, " ");
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket.name,
      Key: sanitizedKey,
    });

    const getRequest = await s3Client.send(getObjectCommand);
    if (!getRequest.Body) {
      throw new Error("Failed to get file from S3");
    }

    const byteArray = await getRequest.Body.transformToByteArray();
    if (!byteArray) {
      throw new Error("Failed to get file from S3");
    }

    const fileName = sanitizedKey;
    const fileType = getRequest.ContentType;
    const blob = new Blob([byteArray]);
    const metadata = getRequest.Metadata ?? {};
    const { datasourceid: dataSourceId, name, url } = metadata;

    if (!dataSourceId || !name || !url) {
      throw new Error("Missing required metadata");
    }

    let indexOpMetadata: any = {
      ...metadata,
      name,
      url,
      fileName,
      size,
      fileType,
    };

    let loader: BaseDocumentLoader;
    if (fileType === "application/pdf") {
      loader = new PDFLoader(blob);
    } else if (fileType === "text/plain") {
      loader = new TextLoader(blob);
    } else if (fileType === "application/json" || fileType === "text/json") {
      loader = new JSONLoader(blob);
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      loader = new DocxLoader(blob);
    } else {
      const tmpDir = mkdtempSync(join(tmpdir(), "langchain-"));
      const filePath = join(tmpDir, fileName);
      writeFileSync(filePath, Buffer.from(await blob.arrayBuffer()));
      loader = new UnstructuredLoader(filePath, {
        apiKey: unstructuredConfig.apiKey,
      });
      indexOpMetadata = {
        ...indexOpMetadata,
        tempFilePath: filePath,
      };
    }

    let [indexOp, dataSource] = await Promise.all([
      createIndexOperation({
        status: "RUNNING",
        metadata: indexOpMetadata,
        dataSourceId,
      }),
      getDataSourceOrThrow(dataSourceId),
    ]);

    console.log("Starting load documents");
    let docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: vectorDBConfig.docEmbeddingContentLength,
      chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
    });
    console.log("Starting split documents");
    docs = await splitter.invoke(docs);

    console.log("Finished load and split documents");
    console.log(`Loaded ${docs.length} documents`);
    docs = docs.map((doc) => {
      doc.metadata = {
        ...dataSource.metadata,
        ...indexOpMetadata,
        ...doc.metadata,
        indexDate: new Date().toISOString(),
        type: "file",
        dataSourceId,
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
    [indexOp, dataSource] = await Promise.all([
      updateIndexOperation(indexOp!.id, {
        status: "SUCCEEDED",
      }),
      updateDataSource(dataSourceId, {
        numberOfDocuments: docs.length,
      }),
    ]);
    console.log("Finished adding documents to vector store");
  } catch (error: any) {
    console.error(error);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: sql`${
          indexOperations.errorMessages
        } || jsonb_build_array('${sql.raw(error.stack ?? error.message)}')`,
      });
    }

    throw error;
  }
};

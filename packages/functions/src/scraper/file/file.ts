import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unstructuredConfig, vectorDBConfig } from "@core/configs";
import type { IndexOperation } from "@core/model";
import { updateDataSource } from "@services/data-source";
import {
  createIndexOperation,
  updateIndexOperation,
} from "@services/data-source/index-op";
import { getDocumentVectorStore } from "@services/vector-db";
import type { S3Handler } from "aws-lambda";
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

    const file = {
      dataSourceId: getRequest.Metadata?.datasourceid,
      name: getRequest.Metadata?.name,
      url: getRequest.Metadata?.url,
      metadata: getRequest.Metadata,
      fileName: sanitizedKey,
      type: getRequest.ContentType,
      size,
      blob: new Blob([byteArray]),
    };

    if (!file.dataSourceId || !file.name || !file.url) {
      throw new Error("Missing required metadata");
    }

    let indexOpMetadata: any = {
      ...file.metadata,
      dataSourceId: file.dataSourceId,
      name: file.name,
      url: file.url,
      filename: file.fileName,
      size: file.size,
      type: file.type,
    };

    let loader: BaseDocumentLoader;
    if (file.type === "application/pdf") {
      loader = new PDFLoader(file.blob);
    } else if (file.type === "text/plain") {
      loader = new TextLoader(file.blob);
    } else if (file.type === "application/json" || file.type === "text/json") {
      loader = new JSONLoader(file.blob);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      loader = new DocxLoader(file.blob);
    } else {
      const tmpDir = mkdtempSync(join(tmpdir(), "langchain-"));
      const filePath = join(tmpDir, file.fileName);
      writeFileSync(filePath, Buffer.from(await file.blob.arrayBuffer()));

      loader = new UnstructuredLoader(filePath, {
        apiKey: unstructuredConfig.apiKey,
      });
      indexOpMetadata = {
        ...indexOpMetadata,
        tempFilePath: filePath,
      };
    }

    indexOp = await createIndexOperation({
      status: "RUNNING",
      metadata: indexOpMetadata,
      dataSourceId: file.dataSourceId,
    });

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
        ...doc.metadata,
        ...indexOpMetadata,
        indexDate: new Date().toISOString(),
        type: "file",
      };
      let newPageContent = `TITLE: ${doc.metadata.name}\n---\n${doc.pageContent}`;
      if (doc.metadata.title) {
        newPageContent = `TITLE: ${doc.metadata.title}\n---\n${doc.pageContent}`;
      }
      doc.pageContent = newPageContent;
      return doc;
    });
    console.log("Adding documents to vector store");
    const vectorStore = await getDocumentVectorStore();
    await vectorStore.addDocuments(docs);
    indexOp = await updateIndexOperation(indexOp!.id, {
      status: "SUCCEEDED",
      metadata: {
        ...indexOp!.metadata,
        numDocuments: docs.length,
      },
    });
    console.log("Finished adding documents to vector store");

    await updateDataSource(file.dataSourceId, {
      numberOfDocuments: docs.length,
    });
  } catch (error: any) {
    console.error(error);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: [
          ...(indexOp?.errorMessages ?? []),
          error.stack ?? error.message,
        ],
      });
    }

    throw error;
  }
};
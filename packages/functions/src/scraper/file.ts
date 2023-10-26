import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unstructuredConfig, vectorDBConfig } from "@core/configs";
import type { IndexOperation } from "@core/model";
import { createIndexOperation, updateIndexOperation } from "@services/index-op";
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
      name: getRequest.Metadata?.name,
      url: getRequest.Metadata?.url,
      fileName: sanitizedKey,
      type: getRequest.ContentType,
      size,
      blob: new Blob([byteArray]),
    };

    let indexOpMetadata: any = {
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
      type: "FILE",
      metadata: indexOpMetadata,
    });

    console.log("Starting load and split");
    let docs = await loader.loadAndSplit(
      new RecursiveCharacterTextSplitter({
        chunkSize: vectorDBConfig.docEmbeddingContentLength,
        chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
      })
    );

    console.log("Finished load and split");
    console.log(`Loaded ${docs.length} documents`);
    docs = docs.map((doc) => {
      doc.metadata = {
        ...doc.metadata,
        ...indexOpMetadata,
        type: "file",
        indexDate: new Date().toISOString(),
      };
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
  } catch (error: any) {
    console.error(error);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOp.metadata,
          errors: [
            ...(indexOp.metadata.errors ?? []),
            {
              error: error.stack,
            },
          ],
        },
      });
    }

    throw error;
  }
};

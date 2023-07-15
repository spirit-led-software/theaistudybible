import { unstructuredConfig } from "@configs/index";
import { IndexOperationStatus, IndexOperationType } from "@prisma/client";
import {
  createIndexOperation,
  getIndexOperations,
  updateIndexOperation,
} from "@services/index-op";
import { isAdmin, validServerSession } from "@services/user";
import { addDocumentsToVectorStore } from "@services/vector-db";
import * as busboy from "busboy";
import { mkdtempSync, writeFileSync } from "fs";
import { BaseDocumentLoader } from "langchain/dist/document_loaders/base";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { TokenTextSplitter } from "langchain/text_splitter";
import { tmpdir } from "os";
import { join } from "path";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing body",
      }),
    };
  }

  let file: File | null = null;
  let url: string | null = null;
  let name: string | null = null;

  const bb = busboy({
    headers: event.headers,
  });

  bb.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
    file = fileStream;
  });

  bb.on("field", (fieldname, val) => {
    if (fieldname === "url") {
      url = val;
    } else if (fieldname === "name") {
      name = val;
    }
  });

  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", reject);
    bb.write(event.body, event.isBase64Encoded ? "base64" : "binary");
    bb.end();
  });

  if (!file || !url || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields",
      }),
    };
  }

  try {
    const { isValid, user } = await validServerSession();
    if (!isValid || !(await isAdmin(user.id))) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized",
        }),
      };
    }

    const runningOps = await getIndexOperations({
      query: {
        status: IndexOperationStatus.IN_PROGRESS,
      },
      limit: 1,
    });
    if (runningOps.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Index operation already in progress",
        }),
      };
    }

    if (file.size > 50 * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "File too large",
        }),
      };
    }

    let indexOpMetadata: any = {
      name,
      url,
      filename: file.name,
    };
    let loader: BaseDocumentLoader;
    if (file.type === "application/pdf") {
      loader = new PDFLoader(file);
    } else if (file.type === "text/plain") {
      loader = new TextLoader(file);
    } else if (file.type === "application/json" || file.type === "text/json") {
      loader = new JSONLoader(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      loader = new DocxLoader(file);
    } else {
      const tmpDir = mkdtempSync(join(tmpdir(), "langchain-"));
      const filePath = join(tmpDir, file.name);
      writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

      loader = new UnstructuredLoader(filePath, {
        apiKey: unstructuredConfig.apiKey,
      });
      indexOpMetadata = {
        ...indexOpMetadata,
        tempFilePath: filePath,
      };
    }

    const indexOp = await createIndexOperation({
      status: IndexOperationStatus.IN_PROGRESS,
      type: IndexOperationType.FILE,
      metadata: indexOpMetadata,
    });

    console.log("Starting load and split");
    loader
      .loadAndSplit(
        new TokenTextSplitter({
          chunkSize: 400,
          chunkOverlap: 50,
          encodingName: "cl100k_base",
        })
      )
      .then(async (docs) => {
        console.log("Finished load and split");
        console.log(`Loaded ${docs.length} documents`);
        docs = docs.map((doc) => {
          doc.metadata = {
            ...doc.metadata,
            ...indexOpMetadata,
            type: "File",
            indexDate: new Date().toISOString(),
          };
          return doc;
        });
        console.log("Adding documents to vector store");
        await addDocumentsToVectorStore(docs);
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.COMPLETED,
          metadata: {
            ...(indexOp.metadata as any),
          },
        });
        console.log("Finished adding documents to vector store");
      })
      .catch(async (err) => {
        console.error("Error loading documents", err);
        await updateIndexOperation(indexOp.id, {
          status: IndexOperationStatus.FAILED,
          metadata: {
            ...(indexOp.metadata as any),
            error: `${err.stack}`,
          },
        });
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Index operation started",
      }),
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `${error.stack}`,
      }),
    };
  }
});

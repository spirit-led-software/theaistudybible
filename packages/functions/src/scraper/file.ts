import { unstructuredConfig } from "@core/configs";
import {
  createIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { isAdmin, validApiSession } from "@core/services/user";
import { addDocumentsToVectorStore } from "@core/services/vector-db";
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
  const { isValid, userInfo } = await validApiSession();
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

  const { file, url, name } = JSON.parse(event.body);

  if (!file || !url || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required fields",
      }),
    };
  }

  try {
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
      status: "PENDING",
      type: "FILE",
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
          status: "PENDING",
          metadata: {
            ...(indexOp.metadata as any),
          },
        });
        console.log("Finished adding documents to vector store");
      })
      .catch(async (err) => {
        console.error("Error loading documents", err);
        await updateIndexOperation(indexOp.id, {
          status: "FAILED",
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

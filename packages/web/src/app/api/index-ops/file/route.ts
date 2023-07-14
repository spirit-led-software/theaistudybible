import { unstructuredConfig, websiteConfig } from "@configs/index";
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
} from "@services/index-op";
import { isAdmin, validServerSession } from "@services/user";
import { addDocumentsToVectorStore } from "@services/vector-db";
import { mkdtempSync, writeFileSync } from "fs";
import { BaseDocumentLoader } from "langchain/dist/document_loaders/base";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { TokenTextSplitter } from "langchain/text_splitter";
import { NextRequest } from "next/server";
import { tmpdir } from "os";
import { join } from "path";

export async function POST(request: NextRequest): Promise<Response> {
  const data = await request.formData();
  const file = data.get("file") as File | undefined;
  const url = data.get("url") as string | undefined;
  const name = data.get("name") as string | undefined;

  if (!file || !url || !name) {
    return BadRequestResponse("Must supply file, url, and name");
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

    if (file.size > 50 * 1024 * 1024) {
      return BadRequestResponse("File size must be less than 50MB");
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
      type: IndexOpertationType.FILE,
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

    return OkResponse({
      message: "Started file index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

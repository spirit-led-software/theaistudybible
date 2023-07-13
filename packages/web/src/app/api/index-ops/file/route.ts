import { unstructuredConfig, websiteConfig } from "@configs/index";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { IndexOperationStatus, IndexOpertationType } from "@prisma/client";
import { createIndexOperation, updateIndexOperation } from "@services/index-op";
import { isAdmin, validServerSession } from "@services/user";
import { getVectorStore } from "@services/vector-db";
import { mkdtempSync, writeFileSync } from "fs";
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

    const tmpDir = mkdtempSync(join(tmpdir(), "langchain-"));
    const filePath = join(tmpDir, file.name);
    writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

    const loader = new UnstructuredLoader(filePath, {
      apiKey: unstructuredConfig.apiKey,
    });

    const indexOp = await createIndexOperation({
      status: IndexOperationStatus.IN_PROGRESS,
      type: IndexOpertationType.FILE,
      metadata: {
        name,
        url,
        filename: file.name,
        tempFilePath: filePath,
      },
    });

    loader
      .loadAndSplit(
        new TokenTextSplitter({
          chunkSize: 400,
          chunkOverlap: 50,
          encodingName: "cl100k_base",
        })
      )
      .then(async (docs) => {
        docs = docs.map((doc) => {
          doc.metadata = {
            ...doc.metadata,
            indexDate: new Date().toISOString(),
            url,
            name,
            type: "File",
          };
          return doc;
        });
        const vectorStore = await getVectorStore();
        await vectorStore.addDocuments(docs);
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
      message: "Started file index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}

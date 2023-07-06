import { unstructuredConfig, websiteConfig } from "@configs/index";
import { prisma } from "@server/database";
import { getVectorStore } from "@server/vector-db";
import { mkdtempSync, writeFileSync } from "fs";
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { TokenTextSplitter } from "langchain/text_splitter";
import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
import { join } from "path";

export async function POST(request: NextRequest): Promise<Response> {
  const data = await request.formData();
  const file: File = data.get("file") as File;

  const tmpDir = mkdtempSync(join(tmpdir(), "langchain-"));
  const filePath = join(tmpDir, file.name);
  writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

  const loader = new UnstructuredLoader(filePath, {
    apiKey: unstructuredConfig.apiKey,
  });

  const indexOp = await prisma.indexOperation.create({
    data: {
      status: "running",
      type: "file",
      metadata: {
        filename: file.name,
        tempFilePath: filePath,
      },
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
      const vectorStore = await getVectorStore();
      await vectorStore.addDocuments(docs);
      await prisma.indexOperation.update({
        where: {
          id: indexOp.id,
        },
        data: {
          status: "completed",
        },
      });
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.indexOperation.update({
        where: {
          id: indexOp.id,
        },
        data: {
          status: "failed",
          metadata: JSON.stringify({
            error: `${err.stack}`,
          }),
        },
      });
    });

  return new NextResponse(
    JSON.stringify({
      message: "Started file index",
      indexOp,
      link: `${websiteConfig.url}/api/index-ops/${indexOp.id}`,
    }),
    {
      status: 200,
    }
  );
}

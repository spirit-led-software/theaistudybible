import {
  getIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { IndexOperation } from "@revelationsai/core/database/model";
import { SQSHandler } from "aws-lambda";
import { generatePageContentEmbeddings } from "../lib/web-scraper";

export const consumer: SQSHandler = async (event) => {
  console.log("Received event: ", JSON.stringify(event));
  const records = event.Records;
  console.log("Processing event: ", JSON.stringify(records[0]));
  const { body } = records[0];

  const { url, name, indexOpId } = JSON.parse(body);
  if (!url || !name || !indexOpId) {
    throw new Error("Missing required fields");
  }

  let indexOp: IndexOperation | undefined;
  try {
    if (!indexOpId) {
      throw new Error("Missing index op id");
    }

    indexOp = await getIndexOperation(indexOpId);
    if (!indexOp) {
      throw new Error("Index op not found");
    }

    await generatePageContentEmbeddings(name, url);

    console.log(`Successfully indexed url '${url}'. Updating index op.`);
    indexOp = await getIndexOperation(indexOp.id);
    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...(indexOp?.metadata as any),
        succeeded: [...((indexOp?.metadata as any)?.succeeded ?? []), url],
      },
    });
    indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await getIndexOperation(indexOp.id);
      indexOp = await updateIndexOperation(indexOp!.id, {
        status: "FAILED",
        metadata: {
          ...(indexOp?.metadata as any),
          failed: [
            ...((indexOp?.metadata as any)?.failed ?? []),
            {
              url,
              error: err.stack,
            },
          ],
        },
      });

      indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
    }
  }
};

const checkIfIndexOpIsCompletedAndUpdate = async (indexOp: IndexOperation) => {
  const indexOpMetadata = indexOp.metadata as any;
  if (
    indexOpMetadata.succeeded &&
    indexOpMetadata.failed &&
    indexOpMetadata.numberOfUrls &&
    indexOpMetadata.succeeded.length + indexOpMetadata.failed.length ===
      indexOpMetadata.numberOfUrls
  ) {
    await updateIndexOperation(indexOp.id, {
      status: "COMPLETED",
    });
  }

  return indexOp;
};

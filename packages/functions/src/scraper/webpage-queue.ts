import {
  getIndexOperation,
  updateIndexOperation,
} from "@core/services/index-op";
import { IndexOperation } from "@revelationsai/core/database/model";
import { SQSHandler } from "aws-lambda";
import { generatePageContentEmbeddings } from "../lib/web-scraper";

export const consumer: SQSHandler = async (event) => {
  const records = event.Records;
  const { body } = records[0];
  console.log("Received event: ", JSON.stringify(body));

  const { url, name, indexOpId } = JSON.parse(body);
  if (!url || !name || !indexOpId) {
    throw new Error("Missing required fields");
  }

  let indexOp: IndexOperation | undefined;
  let indexOpMetadata: any = undefined;
  try {
    if (!indexOpId) {
      throw new Error("Missing index op id");
    }

    indexOp = await getIndexOperation(indexOpId);
    if (!indexOp) {
      throw new Error("Index op not found");
    }

    indexOpMetadata = indexOp.metadata ?? {};
    generatePageContentEmbeddings(name, url)
      .then(async () => {
        console.log(`Successfully indexed url '${url}'. Updating index op.`);
        indexOp = await updateIndexOperation(indexOp!.id, {
          metadata: {
            ...indexOpMetadata,
            succeeded: [...(indexOpMetadata.succeeded ?? []), url],
          },
        });
        indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
      })
      .catch(async (err) => {
        console.error(err.stack);
        indexOp = await updateIndexOperation(indexOp!.id, {
          status: "FAILED",
          metadata: {
            ...indexOpMetadata,
            failed: [
              ...(indexOpMetadata.failed ?? []),
              {
                url,
                error: err.stack,
              },
            ],
          },
        });
        indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
      });
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        metadata: {
          ...indexOpMetadata,
          failed: [
            ...(indexOpMetadata.failed ?? []),
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
    indexOpMetadata.succeeded.length + indexOpMetadata.failed.length ===
    indexOpMetadata.numberOfUrls
  ) {
    await updateIndexOperation(indexOp.id, {
      status: "COMPLETED",
    });
  }

  return indexOp;
};

import type { IndexOperation } from "@core/model";
import { getIndexOperation, updateIndexOperation } from "@services/index-op";
import type { SQSHandler } from "aws-lambda";
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

    await generatePageContentEmbeddings(name, url, indexOp.metadata);

    console.log(`Successfully indexed url '${url}'. Updating index op.`);
    indexOp = await getIndexOperation(indexOp.id);
    indexOp = await updateIndexOperation(indexOp!.id, {
      metadata: {
        ...indexOp?.metadata,
        succeeded: [...(indexOp?.metadata.succeeded ?? []), url],
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
          ...indexOp?.metadata,
          failed: [
            ...(indexOp?.metadata?.failed ?? []),
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

const checkIfIndexOpIsCompletedAndUpdate = async (
  indexOp: IndexOperation | undefined
) => {
  if (indexOp) {
    indexOp = await getIndexOperation(indexOp.id);
    if (
      indexOp?.metadata.succeeded &&
      indexOp.metadata.failed &&
      indexOp.metadata.urlCount &&
      indexOp.metadata.succeeded.length + indexOp.metadata.failed.length ===
        indexOp.metadata.urlCount
    ) {
      await updateIndexOperation(indexOp!.id, {
        status: "COMPLETED",
      });
    }
  }

  return indexOp;
};

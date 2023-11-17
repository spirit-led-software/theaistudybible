import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { IndexOperation } from "@core/model";
import { indexOperations } from "@core/schema";
import { readWriteDbTxn } from "@lib/database";
import { getDataSourceOrThrow } from "@services/data-source";
import { getIndexOperationOrThrow } from "@services/data-source/index-op";
import type { SQSHandler } from "aws-lambda";
import { eq } from "drizzle-orm";
import { Queue } from "sst/node/queue";
import { generatePageContentEmbeddings } from "../../services/web-scraper";

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

    indexOp = await getIndexOperationOrThrow(indexOpId);
    const dataSource = await getDataSourceOrThrow(indexOp.dataSourceId);

    await generatePageContentEmbeddings(
      name,
      url,
      indexOp.dataSourceId,
      dataSource.metadata
    );

    console.log(`Successfully indexed url '${url}'. Updating index op.`);
    indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await readWriteDbTxn(async (db) => {
        const found = await db
          .select()
          .from(indexOperations)
          .where(eq(indexOperations.id, indexOp!.id))
          .for("update");
        return (
          await db
            .update(indexOperations)
            .set({
              errorMessages: [
                ...found[0].errorMessages,
                err.stack ?? err.message,
              ],
            })
            .where(eq(indexOperations.id, indexOp!.id))
            .returning()
        )[0];
      });
      indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
    }
  }
};

const checkIfIndexOpIsCompletedAndUpdate = async (indexOp: IndexOperation) => {
  try {
    const client = new SQSClient({});
    const response = await client.send(
      new GetQueueAttributesCommand({
        QueueUrl: Queue.webpageIndexQueue.queueUrl,
        AttributeNames: ["ApproximateNumberOfMessagesNotVisible"], // ApproximateNumberOfMessagesNotVisible is the number of messages that are in flight. This is a good approximation of the number of messages that are being processed.
      })
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to get queue attributes: ${response.$metadata.httpStatusCode}`
      );
    }

    const messageCount = parseInt(
      response.Attributes?.ApproximateNumberOfMessagesNotVisible ?? "0"
    );
    console.log(`In-flight message count: ${messageCount}`);

    return await readWriteDbTxn(async (db) => {
      await db
        .select()
        .from(indexOperations)
        .where(eq(indexOperations.id, indexOp!.id))
        .for("update");
      return (
        await db
          .update(indexOperations)
          .set({
            status:
              messageCount === 0
                ? indexOp.errorMessages.length > 0
                  ? "FAILED"
                  : "SUCCEEDED"
                : "RUNNING",
          })
          .where(eq(indexOperations.id, indexOp!.id))
          .returning()
      )[0];
    });
  } catch (err: any) {
    console.error(err.stack);
  }
  return indexOp;
};

import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { IndexOperation } from "@core/model";
import { getDataSourceOrThrow } from "@services/data-source";
import {
  getIndexOperationOrThrow,
  updateIndexOperation,
} from "@services/data-source/index-op";
import type { SQSHandler } from "aws-lambda";
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
    indexOp = await getIndexOperationOrThrow(indexOp.id);
    indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await getIndexOperationOrThrow(indexOp.id);
      indexOp = await updateIndexOperation(indexOp.id, {
        status: "FAILED",
        errorMessages: [...indexOp.errorMessages, err.stack ?? err.message],
      });
      indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
    }
  }
};

const checkIfIndexOpIsCompletedAndUpdate = async (
  indexOp: IndexOperation | undefined
) => {
  if (indexOp) {
    const client = new SQSClient({});
    const response = await client.send(
      new GetQueueAttributesCommand({
        QueueUrl: Queue.webpageIndexQueue.queueUrl,
        AttributeNames: ["ApproximateNumberOfMessages"],
      })
    );

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to get queue attributes: ${response.$metadata.httpStatusCode}`
      );
    }

    const messageCount = parseInt(
      response.Attributes?.ApproximateNumberOfMessages ?? "0"
    );
    console.log(`Message count: ${messageCount}`);

    if (messageCount === 0) {
      indexOp = await getIndexOperationOrThrow(indexOp.id);
      indexOp = await updateIndexOperation(indexOp.id, {
        status: indexOp.errorMessages.length ? "FAILED" : "SUCCEEDED",
      });
    }
  }

  return indexOp;
};

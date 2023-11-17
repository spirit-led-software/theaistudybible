import type { IndexOperation } from "@core/model";
import { indexOperations } from "@core/schema";
import { getDataSourceOrThrow } from "@services/data-source";
import {
  getIndexOperationOrThrow,
  updateIndexOperation,
} from "@services/data-source/index-op";
import type { SQSHandler } from "aws-lambda";
import { sql } from "drizzle-orm";
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
    indexOp = await updateIndexOperation(indexOp.id, {
      metadata: sql`CASE WHEN ${
        indexOperations.metadata
      }->>'succeededUrls' IS NULL
        THEN jsonb_set(${
          indexOperations.metadata
        }, '{succeededUrls}', '["${sql.raw(url)}"]', true)
        ELSE jsonb_insert(${
          indexOperations.metadata
        }, '{succeededUrls, -1}', '"${sql.raw(url)}"', true)
      END`,
    });
    indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
  } catch (err: any) {
    console.error(err.stack);

    if (indexOp) {
      indexOp = await updateIndexOperation(indexOp.id, {
        errorMessages: sql`${indexOperations.errorMessages} || ${
          err.stack ?? err.message
        }`,
      });
      indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
    }
  }
};

const checkIfIndexOpIsCompletedAndUpdate = async (indexOp: IndexOperation) => {
  try {
    console.log(`Checking if index op is completed: ${indexOp.id}`);
    return await updateIndexOperation(indexOp.id, {
      status: sql`CASE
        WHEN
          ${indexOperations.metadata}->>'totalUrls' IS NOT NULL AND 
          ${indexOperations.metadata}->>'succeededUrls' IS NOT NULL AND
          (${indexOperations.metadata}->>'totalUrls')::int <= (jsonb_array_length(${indexOperations.metadata}->>'succeededUrls') + jsonb_array_length(${indexOperations.errorMessages}))
        THEN
          CASE
            WHEN jsonb_array_length(${indexOperations.errorMessages}) > 0
            THEN 'FAILED'
            ELSE 'SUCCEEDED'
          END
        ELSE 'RUNNING'
      END`,
    });
  } catch (err: any) {
    console.error("Failed to check if index op is complete:", err.stack);
  }
  return indexOp;
};

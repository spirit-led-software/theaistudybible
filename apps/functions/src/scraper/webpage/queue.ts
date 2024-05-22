import { indexOperations } from '@theaistudybible/core/database/schema';
import type { IndexOperation } from '@theaistudybible/core/model/data-source/index-op';
import { db } from '@theaistudybible/server/lib/database';
import { generatePageContentEmbeddings } from '@theaistudybible/server/lib/scraper/webpage';
import type { SQSHandler } from 'aws-lambda';
import { eq, sql } from 'drizzle-orm';

export const consumer: SQSHandler = async (event) => {
  console.log('Received event: ', JSON.stringify(event));
  const records = event.Records;
  console.log('Processing event: ', JSON.stringify(records[0]));
  const { body } = records[0];

  const { url, name, indexOpId } = JSON.parse(body);
  if (!url || !name || !indexOpId) {
    throw new Error('Missing required fields');
  }

  let indexOp: IndexOperation | undefined;
  try {
    if (!indexOpId) {
      throw new Error('Missing index op id');
    }

    indexOp = await db.query.indexOperations.findFirst({
      where: (indexOps, { eq }) => eq(indexOps.id, indexOpId)
    });
    if (!indexOp) {
      throw new Error(`Index op not found: ${indexOpId}`);
    }

    const dataSource = await db.query.dataSources.findFirst({
      where: (dataSources, { eq }) => eq(dataSources.id, indexOp!.dataSourceId)
    });
    if (!dataSource) {
      throw new Error(`Data source not found: ${indexOp.dataSourceId}`);
    }

    await generatePageContentEmbeddings(
      name,
      url,
      indexOp.dataSourceId,
      dataSource.metadata as object
    );

    console.log(`Successfully indexed url '${url}'. Updating index op.`);
    [indexOp] = await db
      .update(indexOperations)
      .set({
        // Remove the url from the failedUrls array if it exists
        // Add the url to the succeededUrls array
        metadata: sql`jsonb_set(
        jsonb_set(
          ${indexOperations.metadata},
          '{failedUrls}',
          COALESCE(
            ${indexOperations.metadata}->'failedUrls',
            '[]'::jsonb
          ) - '${sql.raw(url)}',
          true
        ),
        '{succeededUrls}',
        COALESCE(
          ${indexOperations.metadata}->'succeededUrls',
          '[]'::jsonb
        ) || jsonb_build_array('${sql.raw(url)}'),
        true
      )`
      })
      .where(eq(indexOperations.id, indexOp.id))
      .returning();
    indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
  } catch (err) {
    console.error(`Error indexing url '${url}':`, err);
    if (indexOp) {
      [indexOp] = await db
        .update(indexOperations)
        .set({
          metadata: sql`jsonb_set(${indexOperations.metadata}, 
          '{failedUrls}',
          COALESCE(
            ${indexOperations.metadata}->'failedUrls', 
            '[]'::jsonb
          ) || jsonb_build_array('${sql.raw(url)}'),
          true
        )`,
          errorMessages: sql`${indexOperations.errorMessages} || jsonb_build_array('${sql.raw(
            err instanceof Error ? `${err.message}: ${err.stack}` : `Error: ${JSON.stringify(err)}`
          )}')`
        })
        .where(eq(indexOperations.id, indexOp.id))
        .returning();
      indexOp = await checkIfIndexOpIsCompletedAndUpdate(indexOp);
    }
    throw err;
  }
};

const checkIfIndexOpIsCompletedAndUpdate = async (indexOp: IndexOperation) => {
  try {
    console.log(`Checking if index op is completed: ${indexOp.id}`);
    return await db
      .update(indexOperations)
      .set({
        status: sql`CASE
        WHEN COALESCE(${indexOperations.metadata}->>'totalUrls', '0')::int <=
          (
            COALESCE(jsonb_array_length(${indexOperations.metadata}->'succeededUrls'), 0) +
            COALESCE(jsonb_array_length(${indexOperations.metadata}->'failedUrls'), 0)
          )
        THEN
          CASE
            WHEN COALESCE(jsonb_array_length(${indexOperations.metadata}->'failedUrls'), 0) > 0
            THEN 'FAILED'
            ELSE 'SUCCEEDED'
          END
        ELSE 'RUNNING'
      END`
      })
      .where(eq(indexOperations.id, indexOp.id))
      .returning()
      .then((result) => result[0]);
  } catch (err) {
    console.error('Failed to check if index op is complete:', err);
  }
  return indexOp;
};

import { db } from '@/core/database';
import { dataSources } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { wrapHandler } from '@sentry/aws-serverless';
import type { SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';

export const handler: SQSHandler = wrapHandler(async (event) => {
  console.log('Processing data-sources event:', JSON.stringify(event, null, 2));
  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const r of event.Records) {
    try {
      const { id, manual } = JSON.parse(r.body);
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid data-source id');
      }
      const dataSource = await db.query.dataSources.findFirst({
        where: (dataSources, { eq }) => eq(dataSources.id, id),
      });
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      if (dataSource.type === 'REMOTE_FILE') {
        const response = await fetch(dataSource.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch remote file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const s3Response = await s3.send(
          new PutObjectCommand({
            Bucket: Resource.DataSourceFilesBucket.name,
            Key: `${dataSource.id}.${blob.type}`,
            Body: blob,
          }),
        );
        if (s3Response.$metadata.httpStatusCode !== 200) {
          throw new Error('Failed to upload file to S3');
        }
      } else if (dataSource.type === 'FILE') {
        throw new Error('Sync unsupported for file data sources');
      } else {
        throw new Error(`Unimplemented data source type: ${dataSource.type}`);
      }
      await db
        .update(dataSources)
        .set(manual ? { lastManualSync: new Date() } : { lastAutomaticSync: new Date() })
        .where(eq(dataSources.id, dataSource.id));
    } catch (error) {
      console.error('Error processing data-sources event:', error);
      batchItemFailures.push({ itemIdentifier: r.messageId });
    }
  }
});

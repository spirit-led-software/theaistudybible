import { vectorStore } from '@/ai/vector-store';
import { db } from '@/core/database';
import { dataSources, sourceDocuments } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { transformKeys } from '@/core/utils/object';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { wrapHandler } from '@sentry/aws-serverless';
import type { SQSBatchItemFailure, SQSHandler } from 'aws-lambda';
import { eq, inArray } from 'drizzle-orm';
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
        with: { dataSourcesToSourceDocuments: true },
      });
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      console.log('Deleting old data source documents:', dataSource.id);
      await Promise.all([
        db.delete(sourceDocuments).where(
          inArray(
            sourceDocuments.id,
            dataSource.dataSourcesToSourceDocuments.map((d) => d.sourceDocumentId),
          ),
        ),
        vectorStore.deleteDocuments(
          dataSource.dataSourcesToSourceDocuments.map((d) => d.sourceDocumentId),
        ),
      ]);

      await db
        .update(dataSources)
        .set({ numberOfDocuments: 0 })
        .where(eq(dataSources.id, dataSource.id));

      console.log('Syncing data source:', dataSource.id);
      if (dataSource.type === 'REMOTE_FILE') {
        const response = await fetch(dataSource.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch remote file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Uploading file to S3:', `${dataSource.id}`);
        const s3Response = await s3.send(
          new PutObjectCommand({
            Bucket: Resource.DataSourceFilesBucket.name,
            Key: `${dataSource.id}`,
            Body: buffer,
            ContentType: blob.type,
            Metadata: transformKeys(
              {
                ...dataSource.metadata,
                type: dataSource.type,
                name: dataSource.name,
                url: dataSource.url,
                dataSourceId: dataSource.id,
              },
              'toKebab',
            ),
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
  return { batchItemFailures };
});

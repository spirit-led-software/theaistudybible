import { s3 } from '@/core/storage';
import { createBibleFromDblZip } from '@/core/utils/bibles/create-from-dbl-zip';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as Sentry from '@sentry/aws-serverless';
import type { S3EventRecord, SQSBatchItemFailure, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = Sentry.wrapHandler(async (event) => {
  console.log('Processing index bible event:', JSON.stringify(event, null, 2));

  const batchItemFailures: SQSBatchItemFailure[] = [];
  for (const record of event.Records) {
    try {
      const s3Event = JSON.parse(record.body);
      if (s3Event.Event === 's3:TestEvent') {
        continue;
      }
      if (!('Records' in s3Event) || !Array.isArray(s3Event.Records)) {
        throw new Error('Invalid S3 event');
      }

      for (const s3EventRecord of s3Event.Records as S3EventRecord[]) {
        const bucket = s3EventRecord.s3.bucket.name;
        const key = decodeURIComponent(s3EventRecord.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing file: ${key} from bucket: ${bucket}`);
        const { Body, Metadata } = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
        if (!Body) throw new Error('Empty file body');

        const buffer = await Body.transformToByteArray();

        // Extract parameters from metadata
        const publicationId = Metadata?.['publication-id'];
        const generateEmbeddings = Metadata?.['generate-embeddings'] === 'true';

        await createBibleFromDblZip({
          zipBuffer: buffer,
          overwrite: true,
          publicationId,
          generateEmbeddings,
        });

        console.log(`Successfully processed ${key}`);
      }
    } catch (error) {
      console.error('Error processing index bible:', error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
});

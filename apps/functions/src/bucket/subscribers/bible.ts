import { createBibleFromDblZip } from '@/core/utils/bibles/create-from-dbl-zip';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { S3Handler } from 'aws-lambda';

const s3 = new S3Client({});

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    try {
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

      await createBibleFromDblZip({
        zipBuffer: buffer,
        publicationId,
        overwrite: true,
        generateEmbeddings: true,
      });

      console.log(`Successfully processed ${key}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
    }
  }
};

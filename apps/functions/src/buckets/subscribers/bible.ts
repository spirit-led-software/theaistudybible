import { s3 } from '@/core/storage';
import { createBibleFromDblZip } from '@/core/utils/bibles/create-from-dbl-zip';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3Handler } from 'aws-lambda';

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

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
};

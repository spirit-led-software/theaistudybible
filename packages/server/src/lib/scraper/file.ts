import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from '@theaistudybible/core/lib/axios';
import type { Metadata } from '@theaistudybible/core/types/metadata';
import { Bucket } from 'sst/node/bucket';

export async function indexRemoteFile({
  dataSourceId,
  name,
  url,
  metadata = {}
}: {
  dataSourceId: string;
  name: string;
  url: string;
  metadata?: Metadata;
}) {
  const downloadResponse = await axios.get(url, {
    decompress: false,
    responseType: 'arraybuffer'
  });

  const filename = getFileNameFromUrl(url);
  const contentType = downloadResponse.headers['content-type'];

  const s3Client = new S3Client({});
  const putCommandResponse = await s3Client.send(
    new PutObjectCommand({
      Bucket: Bucket.indexFileBucket.bucketName,
      Key: filename,
      ContentType: contentType,
      Body: downloadResponse.data,
      Metadata: {
        ...metadata,
        dataSourceId,
        name,
        url
      }
    })
  );

  if (
    !putCommandResponse.$metadata?.httpStatusCode ||
    putCommandResponse.$metadata?.httpStatusCode !== 200
  ) {
    throw new Error(`Failed to upload file to S3 ${putCommandResponse.$metadata?.httpStatusCode}`);
  }
}

export function getFileNameFromUrl(url: string) {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename;
}

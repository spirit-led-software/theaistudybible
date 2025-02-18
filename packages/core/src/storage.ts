import { S3Client } from '@aws-sdk/client-s3';

let currentS3: S3Client | undefined;
export const s3 = () => {
  if (!currentS3) {
    currentS3 = new S3Client({});
  }
  return currentS3;
};

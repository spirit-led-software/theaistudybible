import { S3Client } from '@aws-sdk/client-s3';

type s3Config = {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export const config: s3Config = {
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
};

export const client: S3Client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

export default config;

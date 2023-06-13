type AwsS3Config = {
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export const config: AwsS3Config = {
  bucketName: process.env.AWS_S3_BUCKET_NAME,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
};

export default config;

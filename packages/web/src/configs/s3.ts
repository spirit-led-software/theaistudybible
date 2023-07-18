export type S3Config = {
  indexFileBucket: string;
};

export const s3Config: S3Config = {
  indexFileBucket: process.env.INDEX_FILE_BUCKET!,
};

export default s3Config;

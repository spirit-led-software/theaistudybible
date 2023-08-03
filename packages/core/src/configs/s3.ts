export type S3Config = {
  indexFileBucket: string;
  devotionImageBucket: string;
};

export const config: S3Config = {
  indexFileBucket: process.env.INDEX_FILE_BUCKET!,
  devotionImageBucket: process.env.DEVOTION_IMAGE_BUCKET!,
};

export default config;

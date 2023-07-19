export type S3Config = {
  indexFileBucket: string;
};

export const config: S3Config = {
  indexFileBucket: process.env.INDEX_FILE_BUCKET!,
};

export default config;

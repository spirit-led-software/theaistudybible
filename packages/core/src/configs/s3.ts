export type S3Config = {
  indexFileBucket: string;
  devotionImageBucket: string;
  userProfilePictureBucket: string;
};

export const config: S3Config = {
  indexFileBucket: process.env.INDEX_FILE_BUCKET!,
  devotionImageBucket: process.env.DEVOTION_IMAGE_BUCKET!,
  userProfilePictureBucket: process.env.USER_PROFILE_PICTURE_BUCKET!,
};

export default config;

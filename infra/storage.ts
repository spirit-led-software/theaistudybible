import { indexBibleChapterQueue, indexBibleQueue, profileImagesQueue } from './queues';

export const bibleBucket = new sst.aws.Bucket('BibleBucket');
bibleBucket.subscribeQueue(indexBibleQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const chapterMessageBucket = new sst.aws.Bucket('ChapterMessageBucket');
chapterMessageBucket.subscribeQueue(indexBibleChapterQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const profileImagesBucket = new sst.aws.Bucket('ProfileImagesBucket', {
  access: 'cloudfront',
});
profileImagesBucket.subscribeQueue(profileImagesQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const generatedImagesBucket = new sst.aws.Bucket('GeneratedImagesBucket', {
  access: 'cloudfront',
});

export const devotionImagesBucket = new sst.aws.Bucket('DevotionImagesBucket', {
  access: 'cloudfront',
});

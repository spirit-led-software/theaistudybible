import { DOMAIN } from './constants';
import { indexBibleChapterQueue, indexBibleQueue, profileImagesQueue } from './queues';
import { isProd } from './utils/constants';

export const bibleBucket = new sst.aws.Bucket('BibleBucket', {}, { retainOnDelete: false });
bibleBucket.subscribeQueue(indexBibleQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const chapterMessageBucket = new sst.aws.Bucket(
  'ChapterMessageBucket',
  {},
  { retainOnDelete: false },
);
chapterMessageBucket.subscribeQueue(indexBibleChapterQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const profileImagesBucket = new sst.aws.Bucket(
  'ProfileImagesBucket',
  { access: 'cloudfront' },
  { retainOnDelete: isProd },
);
profileImagesBucket.subscribeQueue(profileImagesQueue.arn, {
  events: ['s3:ObjectCreated:*'],
});

export const generatedImagesBucket = new sst.aws.Bucket(
  'GeneratedImagesBucket',
  { access: 'cloudfront' },
  { retainOnDelete: isProd },
);

export const devotionImagesBucket = new sst.aws.Bucket(
  'DevotionImagesBucket',
  { access: 'cloudfront' },
  { retainOnDelete: isProd },
);

export const cdn = new sst.aws.Router('Cdn', {
  routes: {
    '/profile-images/*': {
      bucket: profileImagesBucket,
      rewrite: {
        regex: '^/profile-images/(.*)$',
        to: '/$1',
      },
    },
    '/generated-images/*': {
      bucket: generatedImagesBucket,
      rewrite: {
        regex: '^/generated-images/(.*)$',
        to: '/$1',
      },
    },
    '/devotion-images/*': {
      bucket: devotionImagesBucket,
      rewrite: {
        regex: '^/devotion-images/(.*)$',
        to: '/$1',
      },
    },
  },
  domain: { name: $interpolate`cdn.${DOMAIN.value}`, dns: sst.aws.dns({ override: true }) },
});

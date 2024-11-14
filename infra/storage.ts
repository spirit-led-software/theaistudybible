import { DOMAIN } from './constants';
import { indexBibleChapterQueue, indexBibleQueue, profileImagesQueue } from './queues';
import { Constant } from './resources';

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

export const CDN_DOMAIN = new Constant('CdnDomain', $interpolate`cdn.${DOMAIN.value}`);

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
  domain: { name: CDN_DOMAIN.value, dns: sst.aws.dns() },
});

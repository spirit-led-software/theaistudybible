import { DOMAIN } from './constants';

export const bibleBucket = new sst.aws.Bucket('BibleBucket');
bibleBucket.subscribe(
  {
    handler: 'apps/functions/src/buckets/subscribers/bible.handler',
    nodejs: {
      install: ['jsdom'],
    },
    memory: '4 GB',
    timeout: '15 minutes',
  },
  {
    events: ['s3:ObjectCreated:*'],
  },
);

export const profileImagesBucket = new sst.aws.Bucket('ProfileImagesBucket', {
  access: 'cloudfront',
});
profileImagesBucket.subscribe(
  {
    handler: 'apps/functions/src/buckets/subscribers/profile-images.handler',
  },
  {
    events: ['s3:ObjectCreated:*'],
  },
);

export const generatedImagesBucket = new sst.aws.Bucket('GeneratedImagesBucket', {
  access: 'cloudfront',
});

export const devotionImagesBucket = new sst.aws.Bucket('DevotionImagesBucket', {
  access: 'cloudfront',
});

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
  domain: {
    name: `cdn.${DOMAIN.properties.value}`,
    dns: sst.cloudflare.dns(),
  },
});

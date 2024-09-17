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
  public: true,
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
  public: true,
});

export const devotionImagesBucket = new sst.aws.Bucket('DevotionImagesBucket', {
  public: true,
});

export const cdn = new sst.aws.Router('Cdn', {
  routes: {
    '/profile-images/*': $interpolate`https://${profileImagesBucket.nodes.bucket.bucketDomainName}`,
    '/generated-images/*': $interpolate`https://${generatedImagesBucket.nodes.bucket.bucketDomainName}`,
    '/devotion-images/*': $interpolate`https://${devotionImagesBucket.nodes.bucket.bucketDomainName}`,
  },
  domain: {
    name: `cdn.${DOMAIN.properties.value}`,
    dns: sst.cloudflare.dns(),
  },
});

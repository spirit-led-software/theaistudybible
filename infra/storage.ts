import { DOMAIN } from './constants';

export const bibleBucket = new sst.aws.Bucket('BibleBucket');
bibleBucket.subscribe(
  {
    handler: 'apps/functions/src/bucket/subscribers/bible.handler',
    nodejs: {
      install: ['jsdom'],
      esbuild: {
        external: ['jsdom'],
      },
    },
    timeout: '15 minutes',
  },
  {
    events: ['s3:ObjectCreated:*'],
  },
);

export const generatedImagesBucket = new sst.aws.Bucket('GeneratedImagesBucket', {
  public: true,
});

export const cdn = new sst.aws.Router('Cdn', {
  routes: {
    '/generated-images/*': $interpolate`https://${generatedImagesBucket.nodes.bucket.bucketRegionalDomainName}`,
  },
  domain: {
    name: $interpolate`cdn.${DOMAIN.properties.value}`,
    dns: sst.cloudflare.dns(),
  },
});

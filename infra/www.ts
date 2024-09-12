import { upstashRedis } from './cache';
import constants, { CLERK_PUBLISHABLE_KEY, DOMAIN, STRIPE_PUBLISHABLE_KEY } from './constants';
import { database, upstashVectorIndex } from './database';
import secrets from './secrets';
import { bibleBucket, cdn, devotionImagesBucket, generatedImagesBucket } from './storage';

export const webapp = new sst.aws.SolidStart('WebApp', {
  path: 'apps/www',
  link: [
    ...constants,
    ...secrets,
    bibleBucket,
    generatedImagesBucket,
    devotionImagesBucket,
    database,
    upstashRedis,
    upstashVectorIndex,
    cdn,
  ],
  environment: {
    PUBLIC_WEBSITE_URL: $dev ? 'https://localhost:3000' : `https://${DOMAIN.properties.value}`,
    PUBLIC_CDN_URL: cdn.url,
    PUBLIC_CLERK_PUBLISHABLE_KEY: CLERK_PUBLISHABLE_KEY.properties.value,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.properties.value,
  },
  domain: {
    name: DOMAIN.properties.value,
    redirects: [`www.${DOMAIN.properties.value}`],
    dns: sst.cloudflare.dns(),
  },
});

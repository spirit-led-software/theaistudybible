import { upstashRedis } from './cache';
import constants, { CLERK_PUBLISHABLE_KEY, DOMAIN, STRIPE_PUBLISHABLE_KEY } from './constants';
import { database, upstashVectorIndex } from './database';
import secrets from './secrets';
import { bibleBucket, cdn, generatedImagesBucket } from './storage';

export const webapp = new sst.aws.SolidStart('WebApp', {
  path: 'apps/www',
  link: [
    bibleBucket,
    generatedImagesBucket,
    database,
    upstashRedis,
    upstashVectorIndex,
    ...constants,
    ...secrets,
    cdn,
  ],
  environment: {
    PUBLIC_CDN_URL: cdn.url,
    PUBLIC_CLERK_PUBLISHABLE_KEY: CLERK_PUBLISHABLE_KEY.properties.value,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.properties.value,
  },
  warm: $app.stage === 'production' ? 2 : 0,
  domain: {
    name: DOMAIN.properties.value,
    dns: sst.cloudflare.dns(),
  },
});

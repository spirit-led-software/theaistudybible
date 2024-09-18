import { upstashRedis } from './cache';
import constants, { DOMAIN, STRIPE_PUBLISHABLE_KEY } from './constants';
import { database, upstashVectorIndex } from './database';
import { email, emailQueue } from './email';
import secrets from './secrets';
import {
  bibleBucket,
  cdn,
  devotionImagesBucket,
  generatedImagesBucket,
  profileImagesBucket,
} from './storage';

export const webapp = new sst.aws.SolidStart('WebApp', {
  path: 'apps/www',
  link: [
    ...constants,
    ...secrets,
    email,
    emailQueue,
    bibleBucket,
    profileImagesBucket,
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
    PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.properties.value,
    PUBLIC_STAGE: $app.stage,
    ...($app.stage === 'production' ? { NODE_OPTIONS: '--import ./instrument.sentry.mjs' } : {}),
  },
  domain: {
    name: DOMAIN.properties.value,
    redirects: [`www.${DOMAIN.properties.value}`],
    dns: sst.cloudflare.dns(),
  },
  transform: {
    server: {
      copyFiles: [
        {
          from: 'apps/www/instrument.sentry.mjs',
          to: './instrument.sentry.mjs',
        },
      ],
    },
  },
});

import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import * as constants from './constants';
import * as databases from './database';
import { email } from './email';
import { webAppSentryKey } from './monitoring';
import * as queues from './queues';
import { Constant } from './resources';
import * as secrets from './secrets';
import * as storage from './storage';
import { WEBHOOKS_URL } from './webhooks';

export const link = [
  ...Object.values(constants).filter((l) => l instanceof Constant),
  ANALYTICS_URL,
  WEBHOOKS_URL,
  ...Object.values(secrets),
  ...Object.values(storage),
  cdn,
  ...Object.values(databases),
  ...Object.values(queues),
  email,
];

export const install = ['@libsql/client', '@sentry/aws-serverless', 'posthog-node'];

export const external = ['@libsql/client', '@sentry/aws-serverless', 'posthog-node'];

export const runtime = 'nodejs20.x';

export const memory = '512 MB';

export const timeout = '2 minutes';

export const copyFiles = [{ from: 'apps/functions/instrument.mjs', to: 'instrument.mjs' }];

export const environment = $util
  .all([
    constants.POSTHOG_API_KEY.value,
    constants.POSTHOG_API_HOST.value,
    webAppSentryKey.dsnPublic,
  ])
  .apply(([posthogApiKey, posthogApiHost, sentryDsnPublic]) => ({
    STAGE: $app.stage,
    NODE_OPTIONS: '--import instrument.mjs',
    POSTHOG_API_KEY: posthogApiKey,
    POSTHOG_API_HOST: posthogApiHost,
    SENTRY_DSN: sentryDsnPublic,
    SENTRY_TRACES_SAMPLE_RATE: ($dev ? 0 : constants.isProd ? 1.0 : 0.5).toString(),
  }));

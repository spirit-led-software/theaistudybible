import * as constants from './constants';
import { webAppSentryKey } from './monitoring';

export const copyFiles = [{ from: 'apps/functions/instrument.mjs', to: 'instrument.mjs' }];

export const runtime = 'nodejs20.x';

export const install = ['@libsql/client', '@sentry/aws-serverless', 'posthog-node'];

export const external = ['@libsql/client', '@sentry/aws-serverless', 'posthog-node'];

export const nodejs = { install, external };

export const memory = '512 MB';

export const timeout = '2 minutes';

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

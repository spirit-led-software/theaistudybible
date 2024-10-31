import * as Sentry from '@sentry/solidstart';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.DEV;

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
});

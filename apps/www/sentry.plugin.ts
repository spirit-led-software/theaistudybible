import * as Sentry from '@sentry/solidstart';

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
  environment: process.env.PUBLIC_STAGE,
});

// @ts-check
import * as Sentry from '@sentry/node';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.PUBLIC_DEV === 'true';

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
  registerEsmLoaderHooks: false,
});

process.on('beforeExit', async () => {
  await Sentry.flush();
  await Sentry.close();
});

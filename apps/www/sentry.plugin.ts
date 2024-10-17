import * as Sentry from '@sentry/bun';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { H3Error } from 'vinxi/http';

export default defineNitroPlugin((nitroApp) => {
  Sentry.init({
    dsn: process.env.PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
    environment: process.env.PUBLIC_STAGE,
  });

  nitroApp.hooks.hook('error', (error) => {
    if (error instanceof H3Error) {
      if (error.statusCode >= 500 && error.statusCode < 600) {
        Sentry.captureException(error);
      }
      return;
    }
    Sentry.captureException(error);
  });

  nitroApp.hooks.hookOnce('close', async () => {
    await Sentry.flush();
    await Sentry.close();
  });
});

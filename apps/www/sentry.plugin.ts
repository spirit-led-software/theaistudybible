// @ts-check
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/solidstart';
import { H3Error } from 'h3';
import { defineNitroPlugin } from 'nitropack/runtime';

export default defineNitroPlugin((nitro) => {
  Sentry.init({
    dsn: 'https://d05be7f6d9044060ebd25396600d21cf@o4507103632359424.ingest.us.sentry.io/4507974022266880',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
    profilesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
    environment: process.env.PUBLIC_STAGE,
  });

  nitro.hooks.hook('error', (error) => {
    if (error instanceof H3Error) {
      if (error.statusCode >= 500 && error.statusCode < 600) {
        Sentry.captureException(error);
        return;
      }
      return;
    }
    Sentry.captureException(error);
  });

  nitro.hooks.hookOnce('close', async () => {
    await Sentry.flush(2000);
    await Sentry.close(2000);
  });
});

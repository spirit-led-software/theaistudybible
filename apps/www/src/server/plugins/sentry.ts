import { H3Error, type H3Event, readRawBody, toWebRequest } from 'h3';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { Toucan } from 'toucan-js';

export default defineNitroPlugin((nitroApp) => {
  const setupSentry = async (event?: H3Event) => {
    const isProd = process.env.PUBLIC_STAGE === 'production';
    const sentry = new Toucan({
      enabled: !import.meta.dev,
      dsn: process.env.PUBLIC_SENTRY_DSN,
      environment: process.env.PUBLIC_STAGE,
      context: event,
      request: event ? toWebRequest(event) : undefined,
      requestDataOptions: { allowedSearchParams: true, allowedHeaders: true },
      tracesSampleRate: import.meta.dev ? 0 : isProd ? 1.0 : 0.5,
    });

    if (event && ['POST', 'PUT', 'PATCH'].includes(event.method)) {
      const rawBody = await readRawBody(event);
      sentry.setRequestBody(rawBody);
    }

    sentry.setTag('server', true);

    return sentry;
  };

  nitroApp.hooks.hook('error', async (error, { event }) => {
    if (error instanceof H3Error) {
      if (error.statusCode >= 200 && error.statusCode < 500) return;
    }

    const sentry = await setupSentry(event);
    sentry.captureException(error);
  });

  nitroApp.hooks.hook('request', async (event) => {
    event.context.$sentry = await setupSentry(event);
  });
});

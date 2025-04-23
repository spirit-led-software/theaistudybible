import * as Sentry from '@sentry/tanstackstart-react';
import { getRouterManifest } from '@tanstack/react-start/router-manifest';
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { createRouter } from './router';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: import.meta.env.DEV
    ? 0.0
    : import.meta.env.PUBLIC_STAGE === 'production'
      ? 1.0
      : 0.75,
});

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(Sentry.wrapStreamHandlerWithSentry(defaultStreamHandler));

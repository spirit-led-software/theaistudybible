import * as Sentry from '@sentry/tanstackstart-react';
import { StartClient } from '@tanstack/react-start';
import { hydrateRoot } from 'react-dom/client';
import { createRouter } from './router';

const router = createRouter();

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
  tracesSampleRate: import.meta.env.DEV
    ? 0.0
    : import.meta.env.PUBLIC_STAGE === 'production'
      ? 1.0
      : 0.75,
});

hydrateRoot(document, <StartClient router={router} />);

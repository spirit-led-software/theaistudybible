// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [
    solidRouterBrowserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  tracesSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 1.0 : 0,
  replaysOnErrorSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 0.25 : 0,
  profilesSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 1.0 : 0,
  environment: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

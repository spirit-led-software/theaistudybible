// @refresh reload
import * as Sentry from '@sentry/solid';
import { solidRouterBrowserTracingIntegration } from '@sentry/solid/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [solidRouterBrowserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
  replaysOnErrorSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 0.5 : 0,
  environment: import.meta.env.PUBLIC_STAGE,
  release: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

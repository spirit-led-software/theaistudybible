// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

const isProduction = import.meta.env.PUBLIC_STAGE === 'production';
const isDev = import.meta.env.DEV;

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [
    solidRouterBrowserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  tracesSampleRate: isDev ? 0 : isProduction ? 1.0 : 0.5,
  replaysOnErrorSampleRate: isProduction ? 0.25 : 0,
  profilesSampleRate: isDev ? 0 : isProduction ? 0.75 : 0.5,
  environment: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

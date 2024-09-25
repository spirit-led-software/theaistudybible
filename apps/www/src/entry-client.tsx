// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

Sentry.init({
  dsn: 'https://d05be7f6d9044060ebd25396600d21cf@o4507103632359424.ingest.us.sentry.io/4507974022266880',
  integrations: [solidRouterBrowserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
  replaysOnErrorSampleRate: import.meta.env.PUBLIC_STAGE === 'production' ? 0.5 : 0,
  environment: import.meta.env.PUBLIC_STAGE,
  release: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

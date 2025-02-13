/** @refresh reload */
import * as Sentry from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

import 'solid-devtools';

const isProd = import.meta.env.PUBLIC_STAGE === 'production';
const isDev = import.meta.env.PUBLIC_DEV === 'true';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [solidRouterBrowserTracingIntegration()],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

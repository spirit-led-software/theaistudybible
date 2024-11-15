// @refresh reload
import {
  BrowserClient,
  defaultStackParser,
  getCurrentScope,
  getDefaultIntegrations,
  makeFetchTransport,
} from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';

const isProd = import.meta.env.PUBLIC_STAGE === 'production';
const isDev = import.meta.env.PUBLIC_DEV === 'true';

const client = new BrowserClient({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  stackParser: defaultStackParser,
  transport: makeFetchTransport,
  integrations: [...getDefaultIntegrations({}), solidRouterBrowserTracingIntegration()],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: import.meta.env.PUBLIC_STAGE,
});
getCurrentScope().setClient(client);
client.init();

mount(() => <StartClient />, document.getElementById('app')!);

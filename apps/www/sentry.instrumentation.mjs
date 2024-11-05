// TODO: Issue with standard instrumentation:
// https://github.com/getsentry/sentry-javascript/issues/12891
// https://github.com/oven-sh/bun/issues/13165
import {
  BunClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  setCurrentClient,
} from '@sentry/bun';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.DEV;

const integrations = getDefaultIntegrations().filter((i) => i.name !== 'Http');

const client = new BunClient({
  dsn: process.env.SENTRY_DSN,
  stackParser: defaultStackParser,
  transport: makeFetchTransport,
  integrations,
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
});

setCurrentClient(client);
client.init();

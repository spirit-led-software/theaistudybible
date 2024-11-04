// TODO: issue with standard instrumentation:
// https://github.com/getsentry/sentry-javascript/issues/12891
import {
  BunClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  setCurrentClient
} from '@sentry/bun'

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.DEV;

const integrations = getDefaultIntegrations({}).filter((integration) => integration.name !== 'Http');

const client = new BunClient({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  stackParser: defaultStackParser,
  transport: makeFetchTransport,
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  integrations,
  environment: process.env.PUBLIC_STAGE,
});

setCurrentClient(client);
client.init();

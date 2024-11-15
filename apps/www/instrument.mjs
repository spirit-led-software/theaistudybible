// @ts-check
import {
  BunClient,
  addEventProcessor,
  defaultStackParser,
  getCurrentHub,
  getCurrentScope,
  getDefaultIntegrations,
  makeFetchTransport,
} from '@sentry/bun';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.PUBLIC_DEV === 'true';

const posthog = new PostHog(process.env.PUBLIC_POSTHOG_API_KEY, {
  host: process.env.PUBLIC_POSTHOG_API_HOST,
});
const posthogSentry = new PostHogSentryIntegration(posthog);
globalThis.posthog = posthog;
if (!isProd) {
  posthog.optOut();
}

const client = new BunClient({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  stackParser: defaultStackParser,
  transport: makeFetchTransport,
  integrations: [
    // TODO: Issue with standard instrumentation:
    // https://github.com/getsentry/sentry-javascript/issues/12891
    // https://github.com/oven-sh/bun/issues/13165
    ...getDefaultIntegrations({}).filter((i) => i.name !== 'Http'),
    {
      ...posthogSentry,
      setupOnce: () => posthogSentry.setupOnce(addEventProcessor, getCurrentHub),
    },
  ],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
});
getCurrentScope().setClient(client);
client.init();

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await client.close();
});

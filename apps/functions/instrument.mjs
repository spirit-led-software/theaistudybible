// @ts-check
import {
  NodeClient,
  addEventProcessor,
  defaultStackParser,
  getCurrentScope,
  getDefaultIntegrations,
  makeNodeTransport,
} from '@sentry/aws-serverless';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';

const isProd = process.env.STAGE === 'production';

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_API_HOST,
  flushAt: 1,
  flushInterval: 0,
});
const posthogSentry = new PostHogSentryIntegration(posthog);
globalThis.posthog = posthog;
if (!isProd) {
  posthog.optOut();
}

const sentry = new NodeClient({
  dsn: process.env.SENTRY_DSN,
  stackParser: defaultStackParser,
  transport: makeNodeTransport,
  integrations: [
    ...getDefaultIntegrations({}),
    {
      ...posthogSentry,
      setupOnce: () => posthogSentry.setupOnce(addEventProcessor, getCurrentScope),
    },
  ],
  tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE),
  clientReportFlushInterval: 0,
});
getCurrentScope().setClient(sentry);
sentry.init();

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await sentry.close();
});

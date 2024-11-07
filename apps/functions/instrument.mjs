// @ts-check
import * as Sentry from '@sentry/aws-serverless';
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

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    {
      ...posthogSentry,
      setupOnce: () => posthogSentry.setupOnce(Sentry.addEventProcessor, Sentry.getCurrentHub),
    },
  ],
  tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE),
});

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await Sentry.close();
});

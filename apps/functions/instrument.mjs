import * as Sentry from '@sentry/aws-serverless';
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_API_HOST,
});
globalThis.posthog = posthog;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE),
});

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await Sentry.close();
});

import * as Sentry from '@sentry/bun';
import { PostHog } from 'posthog-node';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.DEV;

const posthog = new PostHog(process.env.PUBLIC_POSTHOG_API_KEY, {
  host: process.env.PUBLIC_POSTHOG_API_HOST,
});
globalThis.posthog = posthog;

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  // TODO: Issue with standard instrumentation:
  // https://github.com/getsentry/sentry-javascript/issues/12891
  // https://github.com/oven-sh/bun/issues/13165
  defaultIntegrations: Sentry.getDefaultIntegrations({}).filter((i) => i.name !== 'Http'),
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
});

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await Sentry.close();
});

// @ts-check
import * as Sentry from '@sentry/solidstart';
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

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  integrations: [
    {
      ...posthogSentry,
      setupOnce: () => posthogSentry.setupOnce(Sentry.addEventProcessor, Sentry.getCurrentScope),
    },
  ],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
  registerEsmLoaderHooks: { onlyIncludeInstrumentedModules: true },
});

process.on('beforeExit', async () => {
  await posthog.shutdown();
  await Sentry.close();
});

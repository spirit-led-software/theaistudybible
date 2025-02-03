// @ts-check
import { setPosthog } from '@/core/utils/posthog';
import * as Sentry from '@sentry/aws-serverless';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';

const isProd = process.env.STAGE === 'production';

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_API_HOST,
  flushAt: 1,
  flushInterval: 0,
});
const posthogSentry = new PostHogSentryIntegration(posthog);
setPosthog(posthog);
if (!isProd) {
  posthog.optOut();
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    Sentry.awsIntegration(),
    {
      ...posthogSentry,
      setupOnce: () => posthogSentry.setupOnce(Sentry.addEventProcessor, Sentry.getCurrentScope),
    },
  ],
  tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE),
  clientReportFlushInterval: 0,
});

process.on('beforeExit', async () => {
  await posthog.flush().then(() => posthog.shutdown());
  await Sentry.flush().then(() => Sentry.close());
});

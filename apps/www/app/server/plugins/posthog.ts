import { setPosthog } from '@/core/utils/posthog';
import {
  addEventProcessor as addSentryEventProcessor,
  addIntegration as addSentryIntegration,
  getCurrentScope as getSentryScope,
} from '@sentry/node';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';

const isProd = process.env.PUBLIC_STAGE === 'production';

export default defineNitroPlugin((nitroApp) => {
  const posthog = new PostHog(process.env.PUBLIC_POSTHOG_API_KEY, {
    host: process.env.PUBLIC_POSTHOG_API_HOST,
  });
  const posthogSentry = new PostHogSentryIntegration(posthog);
  setPosthog(posthog);
  if (!isProd) {
    posthog.optOut();
  }

  addSentryIntegration({
    ...posthogSentry,
    setupOnce: () => posthogSentry.setupOnce(addSentryEventProcessor, getSentryScope),
  });

  nitroApp.hooks.hookOnce('close', async () => {
    await posthog.flush();
    await posthog.shutdown();
  });
});

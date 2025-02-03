import { addEventProcessor, addIntegration, getCurrentScope } from '@sentry/solidstart';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';

const isProd = process.env.PUBLIC_STAGE === 'production';

export default defineNitroPlugin((nitroApp) => {
  const posthog = new PostHog(process.env.PUBLIC_POSTHOG_API_KEY, {
    host: process.env.PUBLIC_POSTHOG_API_HOST,
  });
  const posthogSentry = new PostHogSentryIntegration(posthog);
  globalThis.posthog = posthog;
  if (!isProd) {
    posthog.optOut();
  }

  addIntegration({
    ...posthogSentry,
    setupOnce: () => posthogSentry.setupOnce(addEventProcessor, getCurrentScope),
  });

  nitroApp.hooks.hookOnce('close', async () => {
    await posthog.flush();
    await posthog.shutdown();
  });
});

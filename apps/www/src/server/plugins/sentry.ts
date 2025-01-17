import { nodeProfilingIntegration } from '@sentry/profiling-node';
// @ts-check
import {
  NodeClient,
  addEventProcessor,
  defaultStackParser,
  getCurrentScope,
  getDefaultIntegrations,
  makeNodeTransport,
} from '@sentry/solidstart';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { PostHog, PostHogSentryIntegration } from 'posthog-node';
import { H3Error } from 'vinxi/http';

export default defineNitroPlugin((nitro) => {
  const isProd = process.env.PUBLIC_STAGE === 'production';
  const isDev = process.env.PUBLIC_DEV === 'true';

  const posthog = new PostHog(process.env.PUBLIC_POSTHOG_API_KEY, {
    host: process.env.PUBLIC_POSTHOG_API_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  const posthogSentry = new PostHogSentryIntegration(posthog);
  globalThis.posthog = posthog;
  if (!isProd) {
    posthog.optOut();
  }

  const sentry = new NodeClient({
    dsn: process.env.PUBLIC_SENTRY_DSN,
    stackParser: defaultStackParser,
    transport: makeNodeTransport,
    integrations: [
      // TODO: Issue with standard instrumentation:
      // https://github.com/getsentry/sentry-javascript/issues/12891
      // https://github.com/oven-sh/bun/issues/13165
      ...getDefaultIntegrations({}).filter((i) => i.name !== 'Http'),
      nodeProfilingIntegration(),
      {
        ...posthogSentry,
        setupOnce: () => posthogSentry.setupOnce(addEventProcessor, getCurrentScope),
      },
    ],
    tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
    profilesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
    environment: process.env.PUBLIC_STAGE,
    registerEsmLoaderHooks: { onlyIncludeInstrumentedModules: true },
  });
  getCurrentScope().setClient(sentry);
  sentry.init();

  nitro.hooks.hook('error', (error) => {
    if (error instanceof H3Error) {
      if (error.statusCode >= 500) {
        sentry.captureException(error);
      }
      return;
    }
    sentry.captureException(error);
  });

  nitro.hooks.hookOnce('close', async () => {
    await posthog.shutdown();
    await sentry.close();
  });
});

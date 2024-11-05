// @refresh reload
import * as Sentry from '@sentry/solidstart';
import { solidRouterBrowserTracingIntegration } from '@sentry/solidstart/solidrouter';
import { StartClient, mount } from '@solidjs/start/client';
import posthog from 'posthog-js';

const isProd = import.meta.env.PUBLIC_STAGE === 'production';
const isDev = import.meta.env.DEV;

posthog.init(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
  api_host: import.meta.env.PUBLIC_POSTHOG_API_HOST,
  person_profiles: 'always',
  loaded: () => {
    if (!isProd) {
      posthog.opt_out_capturing();
      posthog.set_config({ disable_session_recording: true });
    }
  },
});

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  integrations: [
    solidRouterBrowserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.browserProfilingIntegration(),
    posthog.sentryIntegration({
      organization: import.meta.env.PUBLIC_SENTRY_ORG,
      projectId: Number.parseInt(import.meta.env.PUBLIC_SENTRY_PROJECT_ID),
      severityAllowList: ['fatal', 'warning', 'error', 'info'],
    }),
  ],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  replaysOnErrorSampleRate: isProd ? 0.25 : 0,
  profilesSampleRate: isDev ? 0 : isProd ? 0.5 : 0.25,
  environment: import.meta.env.PUBLIC_STAGE,
});

mount(() => <StartClient />, document.getElementById('app')!);

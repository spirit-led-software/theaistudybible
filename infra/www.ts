import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import { POSTHOG_API_KEY, STRIPE_PUBLISHABLE_KEY, WEBAPP_URL } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';

export const webAppEnv = $util
  .all([
    WEBAPP_URL.value,
    cdn.url,
    ANALYTICS_URL.value,
    POSTHOG_API_KEY.value,
    STRIPE_PUBLISHABLE_KEY.value,
    webAppSentryKey.dsnPublic,
    webAppSentryProject.organization,
    webAppSentryProject.projectId.apply((id) => id.toString()),
    webAppSentryProject.name,
  ])
  .apply(
    ([
      webAppUrl,
      cdnUrl,
      posthogApiHost,
      posthogApiKey,
      stripePublishableKey,
      sentryDsnPublic,
      sentryOrg,
      sentryProjectId,
      sentryProjectName,
    ]) => ({
      PUBLIC_WEBAPP_URL: webAppUrl,
      PUBLIC_CDN_URL: cdnUrl,
      PUBLIC_POSTHOG_API_HOST: posthogApiHost,
      PUBLIC_POSTHOG_API_KEY: posthogApiKey,
      PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
      PUBLIC_STAGE: $app.stage,
      PUBLIC_SENTRY_DSN: sentryDsnPublic,
      PUBLIC_SENTRY_ORG: sentryOrg,
      PUBLIC_SENTRY_PROJECT_ID: sentryProjectId,
      PUBLIC_SENTRY_PROJECT_NAME: sentryProjectName,
    }),
  );

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: {
    autostart: true,
    directory: 'apps/www',
    command: 'bun run --preload ./instrument.mjs dev',
  },
  link: allLinks,
  environment: webAppEnv,
});

import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import { STRIPE_PUBLISHABLE_KEY, WEBAPP_URL } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';

export const webAppEnv = $util
  .all([
    WEBAPP_URL.value,
    cdn.url,
    ANALYTICS_URL.value,
    STRIPE_PUBLISHABLE_KEY.value,
    webAppSentryKey?.dsnPublic,
    webAppSentryKey?.organization,
    webAppSentryKey?.projectId,
    webAppSentryProject?.name,
  ])
  .apply(
    ([
      webAppUrl,
      cdnUrl,
      analyticsUrl,
      stripePublishableKey,
      webAppSentryKeyDsnPublic,
      sentryOrg,
      sentryProjectId,
      sentryProjectName,
    ]) => ({
      PUBLIC_WEBAPP_URL: webAppUrl,
      PUBLIC_CDN_URL: cdnUrl,
      PUBLIC_ANALYTICS_URL: analyticsUrl,
      PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
      PUBLIC_STAGE: $app.stage,
      PUBLIC_SENTRY_DSN: webAppSentryKeyDsnPublic ?? '',
      PUBLIC_SENTRY_ORG: sentryOrg ?? '',
      PUBLIC_SENTRY_PROJECT_ID: sentryProjectId?.toString() ?? '',
      PUBLIC_SENTRY_PROJECT_NAME: sentryProjectName ?? '',
    }),
  );

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: {
    autostart: true,
    directory: 'apps/www',
    command: 'bun run --preload ./sentry.instrumentation.mjs dev',
  },
  link: allLinks,
  environment: webAppEnv,
});

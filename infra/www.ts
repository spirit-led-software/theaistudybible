import { cdn } from './cdn';
import { STRIPE_PUBLISHABLE_KEY, WEBAPP_URL } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey } from './monitoring';

export const webAppEnv = $util
  .all([WEBAPP_URL.value, cdn.url, STRIPE_PUBLISHABLE_KEY.value, webAppSentryKey?.dsnPublic])
  .apply(([webAppUrl, cdnUrl, stripePublishableKey, webAppSentryKeyDsnPublic]) => ({
    PUBLIC_WEBAPP_URL: webAppUrl,
    PUBLIC_CDN_URL: cdnUrl,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
    PUBLIC_STAGE: $app.stage,
    PUBLIC_SENTRY_DSN: webAppSentryKeyDsnPublic ?? '',
  }));

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: {
    autostart: true,
    directory: 'apps/www',
    command: 'bun run --preload ./sentry.instrumentation.mjs dev',
  },
  link: allLinks,
  environment: webAppEnv,
});

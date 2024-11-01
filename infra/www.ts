import { cdn } from './cdn';
import { STRIPE_PUBLISHABLE_KEY, WEBAPP_URL } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey } from './monitoring';

export const webAppEnv = {
  PUBLIC_WEBAPP_URL: WEBAPP_URL.value,
  PUBLIC_CDN_URL: cdn.url,
  PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.value,
  PUBLIC_STAGE: $app.stage,
  PUBLIC_SENTRY_DSN: webAppSentryKey?.dsnPublic ?? '',
};

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: {
    autostart: true,
    directory: 'apps/www',
    command: 'bun run --preload ./sentry.plugin.ts dev',
  },
  link: allLinks,
  environment: webAppEnv,
});

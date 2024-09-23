import { DOMAIN, STRIPE_PUBLISHABLE_KEY } from './constants';
import { allLinks } from './defaults';
import { cdn } from './storage';

export const webapp = new sst.aws.SolidStart('WebApp', {
  path: 'apps/www',
  link: allLinks,
  environment: {
    PUBLIC_WEBSITE_URL: $dev ? 'https://localhost:3000' : `https://${DOMAIN.properties.value}`,
    PUBLIC_CDN_URL: cdn.url,
    PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.properties.value,
    PUBLIC_STAGE: $app.stage,
    NODE_OPTIONS: '--import ./sentry.server.mjs',
  },
  server: {
    install: ['@sentry/profiling-node'],
    memory: '2 GB',
  },
  domain: {
    name: DOMAIN.properties.value,
    redirects: [`www.${DOMAIN.properties.value}`],
    dns: sst.cloudflare.dns(),
  },
  transform: {
    server: {
      copyFiles: [
        {
          from: 'apps/www/sentry.server.mjs',
          to: 'sentry.server.mjs',
        },
      ],
    },
  },
});

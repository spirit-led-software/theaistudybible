import { Constant } from './resources';

export const isProd = $app.stage === 'production';

export const BASE_DOMAIN = 'theaistudybible.com';

export const DEV = new Constant('Dev', $dev.toString());

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant('Domain', isProd ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`);

export const WEBAPP_URL = new Constant(
  'WebAppUrl',
  $dev ? 'http://localhost:3000' : $interpolate`https://${DOMAIN.value}`,
);

export const CLOUDFLARE_ZONE = cloudflare.getZoneOutput({ name: BASE_DOMAIN });
export const CLOUDFLARE_IP_RANGES = cloudflare.getIpRangesOutput();

export const STRIPE_PUBLISHABLE_KEY = new Constant(
  'StripePublishableKey',
  isProd
    ? 'pk_live_51PxV2IGnwuYH30oDXjADngpbZOgTX5ihzw8xSs8nQk3WOhgpZd83RU3XkyHBVsMO8cncSsUT3FM7DeLH9hFcOp3O00ypOJLC5f'
    : 'pk_test_51PxV2IGnwuYH30oD52AJgMZKmfA5qA63XUtEzELia4z7rvxidEqQa7yDy0qNsB4B3j5wMUJExN4LvB10sEwBi9V000nFzrntmv',
);

export const POSTHOG_UI_HOST = new Constant('PostHogUiHost', 'https://us.posthog.com');
export const POSTHOG_ASSETS_HOST = new Constant(
  'PostHogAssetsHost',
  'https://us-assets.i.posthog.com',
);
export const POSTHOG_API_HOST = new Constant(
  'PostHogApiHost',
  'https://us-proxy-direct.i.posthog.com',
);
export const POSTHOG_API_KEY = new Constant(
  'PostHogApiKey',
  'phc_z3PcZTeDMCT53dKzb0aqDXkrM1o3LpNcC9QlJDdG9sO',
);

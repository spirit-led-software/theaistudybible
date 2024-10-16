import { Constant } from './resources';

export const BASE_DOMAIN = 'theaistudybible.com';

export const DEV = new Constant('Dev', $dev.toString());

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant(
  'Domain',
  $app.stage === 'production' ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`,
);

export const WEBAPP_URL = new Constant(
  'WebAppUrl',
  $dev ? 'http://localhost:3000' : `https://${DOMAIN.value}`,
);

export const CLOUDFLARE_ZONE = cloudflare.getZoneOutput({ name: BASE_DOMAIN });
export const CLOUDFLARE_IP_RANGES = cloudflare.getIpRangesOutput();

export const STRIPE_PUBLISHABLE_KEY = new Constant(
  'StripePublishableKey',
  $app.stage === 'production'
    ? 'pk_live_51PxV2IGnwuYH30oDXjADngpbZOgTX5ihzw8xSs8nQk3WOhgpZd83RU3XkyHBVsMO8cncSsUT3FM7DeLH9hFcOp3O00ypOJLC5f'
    : 'pk_test_51PxV2IGnwuYH30oD52AJgMZKmfA5qA63XUtEzELia4z7rvxidEqQa7yDy0qNsB4B3j5wMUJExN4LvB10sEwBi9V000nFzrntmv',
);

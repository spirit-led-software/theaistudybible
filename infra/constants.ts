import { Constant } from './resources';

export const BASE_DOMAIN = 'theaistudybible.com';

export const CLOUDFLARE_ZONE_ID = 'ffdc64398613209ecf5174f548f71e3f';
// https://www.cloudflare.com/ips/
export const CLOUDFLARE_IPV4_RANGES = [
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '108.162.192.0/18',
  '131.0.72.0/22',
  '141.101.64.0/18',
  '162.158.0.0/15',
  '172.64.0.0/13',
  '173.245.48.0/20',
  '188.114.96.0/20',
  '190.93.240.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
];
export const CLOUDFLARE_IPV6_RANGES = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

export const DEV = new Constant('Dev', $dev.toString());

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant(
  'Domain',
  $app.stage === 'production' ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`,
);

export const STRIPE_PUBLISHABLE_KEY = new Constant(
  'StripePublishableKey',
  $app.stage === 'production'
    ? 'pk_live_51PxV2IGnwuYH30oDXjADngpbZOgTX5ihzw8xSs8nQk3WOhgpZd83RU3XkyHBVsMO8cncSsUT3FM7DeLH9hFcOp3O00ypOJLC5f'
    : 'pk_test_51PxV2IGnwuYH30oD52AJgMZKmfA5qA63XUtEzELia4z7rvxidEqQa7yDy0qNsB4B3j5wMUJExN4LvB10sEwBi9V000nFzrntmv',
);

export const SENTRY_ORG = new Constant('SentryOrg', 'the-ai-study-bible');
export const SENTRY_PROJECT = new Constant('SentryProject', 'javascript-solidstart');

export default [STAGE, DEV, DOMAIN, STRIPE_PUBLISHABLE_KEY, SENTRY_ORG, SENTRY_PROJECT];

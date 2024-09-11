import { Constant } from './resources';

const BASE_DOMAIN = 'theaistudybible.com';

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant(
  'Domain',
  $app.stage === 'production' ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`,
);

export const CLERK_PUBLISHABLE_KEY = new Constant(
  'ClerkPublishableKey',
  $app.stage === 'production'
    ? 'pk_live_Y2xlcmsudGhlYWlzdHVkeWJpYmxlLmNvbSQ'
    : 'pk_test_cHJvYmFibGUtYmlzb24tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA',
);

export const STRIPE_PUBLISHABLE_KEY = new Constant(
  'StripePublishableKey',
  $app.stage === 'production'
    ? 'pk_live_51PxV2IGnwuYH30oDXjADngpbZOgTX5ihzw8xSs8nQk3WOhgpZd83RU3XkyHBVsMO8cncSsUT3FM7DeLH9hFcOp3O00ypOJLC5f'
    : 'pk_test_51PxV2IGnwuYH30oD52AJgMZKmfA5qA63XUtEzELia4z7rvxidEqQa7yDy0qNsB4B3j5wMUJExN4LvB10sEwBi9V000nFzrntmv',
);

export default [STAGE, DOMAIN, CLERK_PUBLISHABLE_KEY, STRIPE_PUBLISHABLE_KEY];

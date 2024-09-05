import { Constant } from './resources';

const BASE_DOMAIN = 'theaistudybible.com';

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant(
  'Domain',
  $app.stage === 'production' ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`,
);

export const CLERK_PUBLISHABLE_KEY = new Constant(
  'ClerkPublishableKey',
  $app.stage === 'production' ? '' : 'pk_test_cHJvYmFibGUtYmlzb24tNDkuY2xlcmsuYWNjb3VudHMuZGV2JA',
);

export const STRIPE_PUBLISHABLE_KEY = new Constant(
  'StripePublishableKey',
  $app.stage === 'production'
    ? 'pk_live_51P9EQkIXCNnPG1Pb86cM4XPe0WcgBj0VkMlSqRVgG8g8c6YKutrV7Bv5M7l9wi2Hb3fHYBtBUxj6ITQljZQHjrmj00f2GuQ3kb'
    : 'pk_test_51P9EQkIXCNnPG1Pbzux4FJnxJI4k8qvznWaYpw7La39583X51QcZUmFDsuHgHv2fxHxea7YrVRFzNxYktsKFJ6VH00Rj3zWj90',
);

export default [STAGE, DOMAIN, CLERK_PUBLISHABLE_KEY, STRIPE_PUBLISHABLE_KEY];

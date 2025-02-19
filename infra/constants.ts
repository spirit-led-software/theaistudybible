import { Constant } from './resources';
import { BASE_DOMAIN, isProd } from './utils/constants';

export const DEV = new Constant('Dev', $dev.toString());

export const STAGE = new Constant('Stage', $app.stage);

export const DOMAIN = new Constant('Domain', isProd ? BASE_DOMAIN : `${$app.stage}.${BASE_DOMAIN}`);

export const WEBAPP_URL = new Constant(
  'WebAppUrl',
  $dev ? 'http://localhost:3000' : $interpolate`https://${DOMAIN.value}`,
);

export const WEBHOOKS_URL = new Constant(
  'WebhooksUrl',
  $interpolate`https://webhooks.${DOMAIN.value}`,
);

export const AWS_HOSTED_ZONE = aws.route53.getZoneOutput({ name: BASE_DOMAIN });

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

export const VAPID_PUBLIC_KEY = new Constant(
  'VapidPublicKey',
  'BGmZN6BAKavVbsy9Q8h3YKqcD4ucyGjPFdElfzCrlodH8jVacq0K5n3QbAF1LBHS49rL5KyjEHIcOf-8VDuiWKA',
);

export const BRAIN_TRUST_PROJECT_NAME = new Constant('BrainTrustProjectName', 'The AI Study Bible');

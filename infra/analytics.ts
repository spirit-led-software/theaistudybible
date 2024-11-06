import { DOMAIN, POSTHOG_API_HOST, POSTHOG_ASSET_HOST } from './constants';
import { Constant } from './resources';

export const ANALYTICS_DOMAIN = new Constant('AnalyticsDomain', $interpolate`a.${DOMAIN.value}`);

export const analyticsProxy = new sst.cloudflare.Worker('AnalyticsProxy', {
  handler: 'apps/workers/src/proxy/analytics.ts',
  environment: {
    API_HOST: POSTHOG_API_HOST.value,
    ASSET_HOST: POSTHOG_ASSET_HOST.value,
  },
  domain: ANALYTICS_DOMAIN.value,
});

export const ANALYTICS_URL = new Constant(
  'AnalyticsUrl',
  $interpolate`https://${ANALYTICS_DOMAIN.value}`,
);

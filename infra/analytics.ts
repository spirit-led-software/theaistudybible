import { DOMAIN } from './constants';
import { Constant } from './resources';

export const ANALYTICS_DOMAIN = new Constant('AnalyticsDomain', `a.${DOMAIN.value}`);

export const analyticsProxy = new sst.cloudflare.Worker('AnalyticsProxy', {
  handler: 'apps/workers/src/proxy/analytics.ts',
  environment: {
    API_HOST: 'us.i.posthog.com',
    ASSET_HOST: 'us-assets.i.posthog.com',
  },
  domain: ANALYTICS_DOMAIN.value,
});

export const ANALYTICS_URL = new Constant('AnalyticsUrl', `https://${ANALYTICS_DOMAIN.value}`);

import { DOMAIN, POSTHOG_API_HOST, POSTHOG_ASSETS_HOST } from './constants';
import { Constant } from './resources';

export const ANALYTICS_DOMAIN = new Constant(
  'AnalyticsDomain',
  $interpolate`piggy.${DOMAIN.value}`,
);

export const analyticsRouter = new sst.aws.Router('AnalyticsRouter', {
  routes: { '/*': POSTHOG_API_HOST.value, '/static/*': POSTHOG_ASSETS_HOST.value },
  domain: { name: ANALYTICS_DOMAIN.value, dns: sst.cloudflare.dns() },
});

export const ANALYTICS_URL = new Constant('AnalyticsUrl', analyticsRouter.url);

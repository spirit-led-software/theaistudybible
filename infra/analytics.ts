import { DOMAIN, POSTHOG_API_HOST, POSTHOG_ASSETS_HOST } from './constants';

const ANALYTICS_DOMAIN = $interpolate`piggy.${DOMAIN.value}`;

export const analyticsApi = new sst.aws.Router('AnalyticsApi', {
  routes: { '/*': POSTHOG_API_HOST.value, '/static/*': POSTHOG_ASSETS_HOST.value },
  domain: { name: ANALYTICS_DOMAIN, dns: sst.aws.dns({ override: true }) },
});

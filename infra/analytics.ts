import { DOMAIN, POSTHOG_API_HOST, POSTHOG_ASSETS_HOST } from './constants';
import { isProd } from './utils/constants';

const analyticsApiRouter = isProd
  ? new sst.aws.Router('AnalyticsApiRouter', {
      routes: { '/*': POSTHOG_API_HOST.value, '/static/*': POSTHOG_ASSETS_HOST.value },
      domain: {
        name: $interpolate`piggy.${DOMAIN.value}`,
        dns: sst.cloudflare.dns({ override: true }),
      },
    })
  : undefined;

export const analyticsApi = new sst.Linkable('AnalyticsApi', {
  properties: {
    url: analyticsApiRouter?.url ?? POSTHOG_API_HOST.value,
  },
});

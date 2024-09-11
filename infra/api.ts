import { DOMAIN } from './constants';

export const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  url: true,
});

export const webhooksApiRouter = !$dev
  ? new sst.aws.Router('WebhooksApiRouter', {
      routes: {
        '/*': webhooksApiFn.url,
      },
      domain: {
        name: `webhooks.${DOMAIN.properties.value}`,
        dns: sst.cloudflare.dns(),
      },
    })
  : undefined;

export const webhooksApi = new sst.Linkable('WebhooksApi', {
  properties: {
    url: webhooksApiRouter?.url ?? webhooksApiFn.url,
  },
});

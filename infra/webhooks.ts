import { WEBHOOKS_URL } from './constants';
import { allLinks } from './defaults';
import { stripeWebhookEndpoint } from './stripe';

const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  url: true,
  link: $output(allLinks).apply((links) => [...links, stripeWebhookEndpoint]),
});

export const webhooksApi = new sst.aws.Router('WebhooksApi', {
  routes: { '/*': webhooksApiFn.url },
  domain: {
    name: WEBHOOKS_URL.value.apply((url) => new URL(url).hostname),
    dns: sst.aws.dns({ override: true }),
  },
  transform: {
    cdn: (args) => {
      args.wait = !$dev;
    },
  },
});

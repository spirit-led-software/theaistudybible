import { allowedStripeEvents } from '@/core/stripe/constants';
import { DOMAIN } from './constants';
import { allLinks } from './defaults';

const WEBHOOKS_DOMAIN = $interpolate`webhooks.${DOMAIN.value}`;

sst.Linkable.wrap(stripe.WebhookEndpoint, (resource) => ({
  properties: { secret: $util.secret(resource.secret) },
}));
export const stripeWebhookEndpoint = new stripe.WebhookEndpoint('StripeWebhookEndpoint', {
  url: $interpolate`https://${WEBHOOKS_DOMAIN}/stripe`,
  enabledEvents: allowedStripeEvents,
});

const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  url: true,
  link: $output(allLinks).apply((links) => [...links, stripeWebhookEndpoint]),
});

export const webhooksApi = new sst.aws.Router('WebhooksApi', {
  routes: { '/*': webhooksApiFn.url },
  domain: { name: WEBHOOKS_DOMAIN, dns: sst.aws.dns({ override: true }) },
  transform: {
    cdn: (args) => {
      args.wait = !$dev;
    },
  },
});

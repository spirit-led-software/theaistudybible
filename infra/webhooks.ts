import { DOMAIN } from './constants';

const WEBHOOKS_DOMAIN = $interpolate`wh.${DOMAIN.value}`;

sst.Linkable.wrap(stripe.WebhookEndpoint, (resource) => ({
  properties: { secret: $util.secret(resource.secret) },
}));
export const stripeWebhookEndpoint = new stripe.WebhookEndpoint('StripeWebhookEndpoint', {
  url: $interpolate`https://${WEBHOOKS_DOMAIN}/stripe`,
  enabledEvents: ['checkout.session.completed'],
});

const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  url: true,
  link: [stripeWebhookEndpoint],
});

export const webhooksApi = new sst.aws.Router('WebhooksApi', {
  routes: { '/*': webhooksApiFn.url },
  domain: { name: WEBHOOKS_DOMAIN, dns: sst.aws.dns({ override: true }) },
});

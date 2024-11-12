import { DOMAIN } from './constants';
import { Constant } from './resources';

export const WEBHOOKS_DOMAIN = new Constant(
  'WebhooksDomain',
  $interpolate`webhooks.${DOMAIN.value}`,
);
export const WEBHOOKS_URL = new Constant(
  'WebhooksUrl',
  $interpolate`https://${WEBHOOKS_DOMAIN.value}`,
);

sst.Linkable.wrap(stripe.WebhookEndpoint, (resource) => ({
  properties: { secret: $util.secret(resource.secret) },
}));
const stripeWebhookEndpoint = new stripe.WebhookEndpoint('StripeWebhookEndpoint', {
  url: $interpolate`${WEBHOOKS_URL.value}/stripe`,
  enabledEvents: ['checkout.session.completed'],
});

const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  link: [stripeWebhookEndpoint],
  url: true,
});

export const webhookApiRouter = new sst.aws.Router('WebhooksApiRouter', {
  routes: { '/*': webhooksApiFn.url },
  domain: { name: WEBHOOKS_DOMAIN.value, dns: sst.aws.dns() },
});

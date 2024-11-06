import { CLOUDFLARE_ZONE, DOMAIN } from './constants';
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
  url: true,
  link: [stripeWebhookEndpoint],
});

new cloudflare.Record('WebhooksApiRecord', {
  zoneId: CLOUDFLARE_ZONE.zoneId,
  type: 'CNAME',
  name: WEBHOOKS_DOMAIN.value,
  value: webhooksApiFn.url.apply((url) => new URL(url).hostname),
  proxied: true,
});

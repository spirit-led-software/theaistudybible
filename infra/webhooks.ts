import { CLOUDFLARE_ZONE_ID, DOMAIN } from './constants';
import { Constant } from './resources';

export const WEBHOOKS_DOMAIN = new Constant('WebhooksDomain', `webhooks.${DOMAIN.value}`);

sst.Linkable.wrap(stripe.WebhookEndpoint, (resource) => ({
  properties: { secret: $util.secret(resource.secret) },
}));
const stripeWebhookEndpoint = new stripe.WebhookEndpoint('StripeWebhookEndpoint', {
  url: `https://${WEBHOOKS_DOMAIN.value}/stripe`,
  enabledEvents: ['checkout.session.completed'],
});

const webhooksApiFn = new sst.aws.Function('WebhooksApiFunction', {
  handler: 'apps/functions/src/webhooks/index.handler',
  url: true,
  link: [stripeWebhookEndpoint],
});

new cloudflare.Record('WebhooksApiRecord', {
  zoneId: CLOUDFLARE_ZONE_ID,
  type: 'CNAME',
  name: WEBHOOKS_DOMAIN.value,
  value: webhooksApiFn.url.apply((url) => new URL(url).hostname),
  proxied: true,
});

export const webhooksApi = new sst.Linkable('WebhooksApi', {
  properties: { url: `https://${WEBHOOKS_DOMAIN.value}` },
});

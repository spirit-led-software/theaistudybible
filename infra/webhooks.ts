import { DOMAIN } from './constants';
import * as defaults from './defaults';
import { allLinks } from './helpers/link';
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
  copyFiles: defaults.copyFiles,
  runtime: defaults.runtime,
  nodejs: defaults.nodejs,
  memory: defaults.memory,
  timeout: defaults.timeout,
  url: true,
  environment: defaults.environment,
  link: [...allLinks, stripeWebhookEndpoint],
});

export const webhookApiRouter = new sst.aws.Router('WebhooksApiRouter', {
  routes: { '/*': webhooksApiFn.url },
  domain: { name: WEBHOOKS_DOMAIN.value, dns: sst.aws.dns() },
});

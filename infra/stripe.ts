import { allowedStripeEvents } from '@/core/stripe/constants';
import { WEBHOOKS_URL } from './constants';
import { Constant } from './resources';
import { isProd } from './utils/constants';

export const donationLink = new Constant(
  'DonationLink',
  isProd
    ? 'https://donate.stripe.com/eVa7vs7L32dkaLC4gh'
    : 'https://donate.stripe.com/test_9AQcNK8gB4Fjaw8aEE',
);

sst.Linkable.wrap(stripe.Product, (product) => ({
  properties: {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    features: product.features,
    default_price: proSubMonthlyPrice.id,
  },
}));
sst.Linkable.wrap(stripe.Price, (price) => ({
  properties: {
    id: price.id,
    active: price.active,
    product: price.product,
    currency: price.currency,
    recurring: price.recurring,
    unitAmount: price.unitAmount,
  },
}));

export const proSubProduct = new stripe.Product('ProSubProduct', {
  active: true,
  name: 'Pro Subscription',
  description: 'Subscription for Pro users',
  features: ['Advanced AI Models', 'Higher Daily AI Limits', 'More features coming soon...'],
});
export const proSubMonthlyPrice = new stripe.Price('ProSubMonthlyPrice', {
  product: proSubProduct.id,
  active: true,
  currency: 'usd',
  recurring: { intervalCount: 1, interval: 'month' },
  unitAmount: 100 * 9.99,
});
export const proSubYearlyPrice = new stripe.Price('ProSubYearlyPrice', {
  product: proSubProduct.id,
  active: true,
  currency: 'usd',
  recurring: { intervalCount: 1, interval: 'year' },
  unitAmount: 100 * 99.99,
});

sst.Linkable.wrap(stripe.WebhookEndpoint, (resource) => ({
  properties: { secret: $util.secret(resource.secret) },
}));
export const stripeWebhookEndpoint = new stripe.WebhookEndpoint('StripeWebhookEndpoint', {
  url: $interpolate`${WEBHOOKS_URL.value}/stripe`,
  enabledEvents: allowedStripeEvents,
});

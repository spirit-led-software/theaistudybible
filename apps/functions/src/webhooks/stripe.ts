import { stripe } from '@/core/stripe';
import { allowedStripeEvents } from '@/core/stripe/constants';
import { syncStripeData } from '@/core/stripe/utils';
import { Hono } from 'hono/quick';
import { Resource } from 'sst';
import type Stripe from 'stripe';

async function processEvent(event: Stripe.Event) {
  // Skip processing if the event isn't one I'm tracking (list of all events below)
  if (!allowedStripeEvents.includes(event.type)) return;

  // All the events I track have a customerId
  const { customer: customerId } = event?.data?.object as {
    customer: string; // Sadly TypeScript does not know this
  };

  // This helps make it typesafe and also lets me know if my assumption is wrong
  if (typeof customerId !== 'string') {
    throw new Error(`[STRIPE HOOK][CANCER] ID isn't string.\nEvent type: ${event.type}`);
  }

  return await syncStripeData(customerId);
}

const app = new Hono().post('/', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig!, Resource.StripeWebhookEndpoint.secret);
  } catch (err) {
    return c.json({ message: `Webhook Error: ${JSON.stringify(err)}` }, 400);
  }

  try {
    c.executionCtx.waitUntil(processEvent(stripeEvent));
  } catch (e) {
    console.error('Stripe webhook error:', e);
  }

  return c.json({ message: 'Webhook received' });
});

export default app;

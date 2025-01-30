import {} from '@/core/database/schema';
import { stripe } from '@/core/stripe';
import { syncStripeData } from '@/core/stripe/utils';
import {} from 'drizzle-orm';
import { Hono } from 'hono/quick';
import { Resource } from 'sst';
import type Stripe from 'stripe';

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
];

async function processEvent(event: Stripe.Event) {
  // Skip processing if the event isn't one I'm tracking (list of all events below)
  if (!allowedEvents.includes(event.type)) return;

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

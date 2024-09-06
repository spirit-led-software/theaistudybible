import { clerkClient } from '@/core/user';
import { Hono } from 'hono';
import { Resource } from 'sst';
import Stripe from 'stripe';
import type { Bindings, Variables } from '../../types';

const stripe = new Stripe(Resource.StripeSecretKey.value);

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>().post('/', async (c) => {
  const body = await c.req.text();
  const sig = c.req.header('stripe-signature');
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig!, Resource.StripeWebhookSecret.value);
  } catch (err) {
    return c.json({ message: `Webhook Error: ${JSON.stringify(err)}` }, 400);
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object;
      console.log('Checkout session completed: ', session);

      const clientReferenceId = session.client_reference_id;
      if (!clientReferenceId) {
        return c.json({ message: 'Client reference ID not found' }, 400);
      }

      const user = await clerkClient.users.getUser(clientReferenceId);
      if (!user) {
        console.error(`User not found for client reference ID: ${clientReferenceId}`);
        return c.json({ message: 'User not found' }, 404);
      }

      const stripeCustomerId = session.customer;
      if (
        stripeCustomerId &&
        typeof stripeCustomerId === 'string' &&
        user.publicMetadata.stripeCustomerId !== stripeCustomerId
      ) {
        await clerkClient.users.updateUser(user.id, {
          publicMetadata: {
            ...user.publicMetadata,
            stripeCustomerId,
          },
        });
      }

      return c.json({ message: 'Checkout session completed' });
    }
    case 'customer.subscription.created': {
      const subscription = stripeEvent.data.object;
      console.log('Subscription created: ', subscription);

      const sr = await stripe.customers.retrieve(subscription.customer as string);
      if (sr.deleted) {
        console.log('Customer is deleted');
        return c.json({ message: 'Customer is deleted' });
      }

      const user = await clerkClient.users.getUser(sr.metadata.clerkId);
      if (!user) {
        console.error(`User not found for Stripe customer ID: ${subscription.customer as string}`);
        return c.json({ message: 'User not found' }, 404);
      }

      // TODO: Add role to user

      return c.json({ message: 'Subscription created' });
    }
    default: {
      console.warn(`Unhandled event type: ${stripeEvent.type}`);
    }
  }
  return c.json({ message: 'Unhandled event type' });
});

export default app;
